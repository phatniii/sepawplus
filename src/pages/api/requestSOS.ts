import { NextApiRequest, NextApiResponse } from 'next' 
import prisma from '@/lib/prisma'
import { replyNotificationSOS } from '@/utils/apiLineReply'

let lastSentSOS: { [key: string]: number } = {}; // บันทึกเวลาส่ง SOS ล่าสุดของแต่ละ UID

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: `❌ วิธี ${req.method} ไม่อนุญาต` });
    }

    if (req.headers['content-type'] !== 'application/json') {
        return res.status(400).json({ message: '❌ error', data: "Content-Type ต้องเป็น application/json" });
    }

    const { uid, device_id } = req.body;
    console.log("📥 Received SOS Request:", req.body);

    if (!uid || !device_id) {
        console.log("❌ ไม่มีพารามิเตอร์ uid หรือ device_id");
        return res.status(400).json({ message: '❌ error', data: 'ไม่พบพารามิเตอร์ uid หรือ device_id' });
    }

    if (isNaN(Number(uid))) {
        console.log("❌ uid ไม่ใช่ตัวเลข:", uid);
        return res.status(400).json({ message: '❌ error', data: 'uid ไม่ใช่ตัวเลข' });
    }

    // ป้องกันการส่ง SOS ซ้ำภายใน 1 นาที
    const sosKey = `${uid}_${device_id}`;
    if (lastSentSOS[sosKey] && Date.now() - lastSentSOS[sosKey] < 60000) {
        console.log(`⏳ SOS ถูกส่งไปแล้วสำหรับ UID: ${uid} (Device: ${device_id}), รอ ${60 - Math.floor((Date.now() - lastSentSOS[sosKey]) / 1000)} วินาที`);
        return res.status(200).json({ message: '✅ success', data: 'ข้อความ SOS ถูกส่งไปแล้ว' });
    }

    lastSentSOS[sosKey] = Date.now(); // อัปเดตเวลาส่งล่าสุด

    try {
        const user = await prisma.users.findFirst({ where: { users_id: Number(uid) } });

        if (!user) {
            console.log("❌ ไม่พบข้อมูลผู้ใช้");
            return res.status(400).json({ message: '❌ error', data: 'ไม่พบข้อมูลผู้ใช้' });
        }

        const takecareperson = await prisma.takecareperson.findFirst({
            where: {
                users_id: user.users_id,
                takecare_status: 1
            }
        });

        if (!takecareperson) {
            console.log("❌ ไม่พบข้อมูลผู้ดูแล");
            return res.status(400).json({ message: '❌ error', data: 'ไม่พบข้อมูลผู้ดูแล' });
        }

        const message = `🚨 คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname} \nขอความช่วยเหลือฉุกเฉินจากอุปกรณ์หมายเลข ${device_id}!`;
        console.log("📤 กำลังส่งข้อความแจ้งเตือนไปยัง LINE ID:", user.users_line_id);

        // ตรวจสอบว่า users_line_id ไม่เป็น null
        const replyToken = user.users_line_id || '';
        if (!replyToken) {
            console.log("❌ users_line_id เป็นค่าว่าง");
            return res.status(400).json({ message: '❌ error', data: 'users_line_id ไม่ถูกต้อง' });
        }

        await replyNotificationSOS({ replyToken, message });

        console.log("✅ ส่งข้อความแจ้งเตือนสำเร็จ");
        return res.status(200).json({ message: '✅ success', data: user });
    } catch (error) {
        console.error("❌ Error:", error);
        return res.status(500).json({ message: '❌ error', data: 'เกิดข้อผิดพลาดในการประมวลผล' });
    }
}
