import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { replyNotification } from '@/utils/apiLineReply';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'PUT') {
        try {
            const { uId, takecare_id, distance, latitude, longitude, battery, status } = req.body;

            console.log("Received Data:", req.body);

            if (!uId || !takecare_id || !distance || !latitude || !longitude || !battery || status === undefined) {
                return res.status(400).json({ message: 'error', data: 'พารามิเตอร์ไม่ครบถ้วน' });
            }

            // บันทึกข้อมูลในฐานข้อมูล
            const updatedLocation = await prisma.location.create({
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

            // ค้นหาข้อมูลผู้ใช้และผู้ดูแล
            const user = await prisma.users.findFirst({
                where: { users_id: Number(uId) },
            });

            const takecareperson = await prisma.takecareperson.findFirst({
                where: {
                    users_id: Number(uId),
                    takecare_id: Number(takecare_id),
                    takecare_status: 1,
                },
            });

            // ส่งการแจ้งเตือนเฉพาะกรณี status === 1
            if (user && takecareperson && status === 1) {
                const message = `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname} \nกำลังออกนอก Safezone ชั้นที่ 1`;

                // ตรวจสอบว่า users_line_id มีค่า
                const replyToken = user.users_line_id || '';

                if (replyToken) {
                    await replyNotification({ replyToken, message });
                } else {
                    console.warn("User does not have a Line ID for notification");
                }
            }

            // ตอบกลับเมื่อสำเร็จ
            return res.status(200).json({
                message: 'success',
                data: updatedLocation,
            });
        } catch (error) {
            console.error("Error:", error);
            return res.status(500).json({ message: 'error', data: 'เกิดข้อผิดพลาดในการประมวลผล' });
        }
    } else {
        res.setHeader('Allow', ['PUT']);
        res.status(405).json({ message: `วิธี ${req.method} ไม่อนุญาต` });
    }
}
