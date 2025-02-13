import { NextApiRequest, NextApiResponse } from 'next' 
import prisma from '@/lib/prisma'
import { replyNotificationSOS } from '@/utils/apiLineReply'

type Data = {
	message: string;
	data?: any;
}

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
	if (req.method === 'POST') {
        if (req.headers['content-type'] !== 'application/json') {
            return res.status(400).json({ message: 'error', error: "Content-Type must be application/json" });
        }

        const body = req.body;
        console.log("📥 Received Request:", body); // ✅ Log เช็คค่าที่ได้รับ

        if (!body.uid) {
            console.log("❌ ไม่มีพารามิเตอร์ uid ในคำขอ");
            return res.status(400).json({ message: 'error', data: 'ไม่พบพารามิเตอร์ uid' });
        }
        
        if (isNaN(Number(body.uid))) {
            console.log("❌ พารามิเตอร์ uid ไม่ใช่ตัวเลข:", body.uid);
            return res.status(400).json({ message: 'error', data: 'พารามิเตอร์ uid ไม่ใช่ตัวเลข' });
        }
        
        try {
            const user = await prisma.users.findFirst({
                where: { users_id: Number(body.uid) }
            });

            console.log("🔍 พบผู้ใช้:", user);

            if (!user) {
                console.log("❌ ไม่พบข้อมูลผู้ใช้ในระบบ");
                return res.status(400).json({ message: 'error', data: 'ไม่พบข้อมูลผู้ใช้' });
            }

            const takecareperson = await prisma.takecareperson.findFirst({
                where: {
                    users_id: user.users_id,
                    takecare_status: 1
                }
            });

            console.log("🔍 พบข้อมูลผู้ดูแล:", takecareperson);

            if (user && takecareperson) {
                const message = `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname}  \nขอความช่วยเหลือ ฉุกเฉิน`;

                // ตรวจสอบว่า users_line_id ไม่เป็น null หรือว่าง
                const replyToken = user.users_line_id || '';
                if (!replyToken) {
                    console.log("❌ users_line_id เป็นค่าว่าง");
                    return res.status(400).json({ message: 'error', data: 'users_line_id ไม่ถูกต้อง' });
                }

                console.log("📤 ส่งข้อความแจ้งเตือนไปยัง LINE ID:", replyToken);

                await replyNotificationSOS({ replyToken, message });

                console.log("✅ ส่งข้อความแจ้งเตือนสำเร็จ");

                return res.status(200).json({ message: 'success', data: user });
            } else {
                console.log("❌ ไม่พบข้อมูล takecareperson");
                return res.status(400).json({ message: 'error', data: 'ไม่พบข้อมูล' });
            }
        } catch (error) {
            console.error("❌ Error:", error);
            return res.status(500).json({ message: 'error', data: 'เกิดข้อผิดพลาดในการประมวลผล' });
        }
	} else {
		res.setHeader('Allow', ['POST']);
		res.status(405).json({ message: `วิธี ${req.method} ไม่อนุญาต` });
	}
}
