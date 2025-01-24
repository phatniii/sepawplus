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
                const message = `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname} \nออกนอก Safezone ชั้นที่ 1 แล้ว`;

                const replyToken = user.users_line_id || '';

                await replyNotification({ replyToken, message });

                return res.status(200).json({ 
                    message: 'success', 
                    data: { 
                        user, 
                        takecareperson, 
                        distance, 
                        latitude, 
                        longitude, 
                        battery, 
                        status 
                    } 
                });
            } else {
                return res.status(400).json({ message: 'error', data: 'ไม่พบข้อมูล' });
            }
        } catch (error) {
            console.error("Error:", error);
            return res.status(500).json({ message: 'error', data: 'เกิดข้อผิดพลาดในการประมวลผล' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).json({ message: `วิธี ${req.method} ไม่อนุญาต` });
    }
}
