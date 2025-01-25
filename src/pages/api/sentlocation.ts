import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { replyNotification } from '@/utils/apiLineReply';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            const { uId, takecare_id, distance, latitude, longitude, battery, status } = req.body;

            // ตรวจสอบว่าพารามิเตอร์ครบถ้วน
            if (!uId || !takecare_id || !distance || !latitude || !longitude || !battery || !status) {
                return res.status(400).json({ message: 'error', data: 'พารามิเตอร์ไม่ครบถ้วน' });
            }

            // ค้นหาผู้ใช้และผู้ดูแล
            const user = await prisma.users.findFirst({
                where: { users_id: Number(uId) }
            });

            const takecareperson = await prisma.takecareperson.findFirst({
                where: {
                    users_id: Number(uId),
                    takecare_id: Number(takecare_id),
                    takecare_status: 1
                }
            });

            if (user && takecareperson) {
                // สร้างข้อความแจ้งเตือนตามสถานะ
                let message = '';
                if (Number(status) === 0) {
                    message = `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname} \nอยู่ใน Safezone ชั้นที่ 1`;
                } else if (Number(status) === 1) {
                    message = `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname} \nกำลังออกนอก Safezone ชั้นที่ 2`;
                } else if (Number(status) === 2) {
                    message = `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname} \nออกนอกเขตปลอดภัย`;
                }

                // ส่งการแจ้งเตือนไปยัง Line
                const replyToken = user.users_line_id || '';
                await replyNotification({ replyToken, message });

                // บันทึกข้อมูลลงในฐานข้อมูล location
                const newLocation = await prisma.location.create({
                    data: {
                        users_id: Number(uId),
                        takecare_id: Number(takecare_id),
                        locat_timestamp: new Date(),
                        locat_latitude: latitude.toString(),
                        locat_longitude: longitude.toString(),
                        locat_status: Number(status),
                        locat_distance: Number(distance),
                        locat_battery: Number(battery),
                        locat_noti_time: new Date(),
                        locat_noti_status: 1,
                    },
                });

                // ส่งการตอบกลับ
                return res.status(200).json({
                    message: 'success',
                    data: {
                        user,
                        takecareperson,
                        location: newLocation,
                    },
                });
            } else {
                return res.status(400).json({ message: 'error', data: 'ไม่พบข้อมูล' });
            }
        } catch (error) {
            console.error('Error:', error);
            return res.status(500).json({ message: 'error', data: 'เกิดข้อผิดพลาดในการประมวลผล' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).json({ message: `วิธี ${req.method} ไม่อนุญาต` });
    }
}
