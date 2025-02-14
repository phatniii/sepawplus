import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { replyNotificationSOS } from '@/utils/apiLineReply';
import axios from 'axios';

const LINE_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN_LINE || '';

const LINE_HEADER = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
};

// ✅ ฟังก์ชันดึงค่าจำนวนข้อความสูงสุดที่ส่งได้
async function getQuota() {
    try {
        const response = await axios.get('https://api.line.me/v2/bot/message/quota', {
            headers: LINE_HEADER
        });
        return response.data?.value ?? -1; // ถ้าไม่มีค่า ให้ส่ง -1
    } catch (error) {
        console.error("❌ Failed to fetch quota:", error);
        return -1;
    }
}

// ✅ ฟังก์ชันดึงค่าจำนวนข้อความที่ใช้ไปแล้ว
async function getUsedQuota() {
    try {
        const response = await axios.get('https://api.line.me/v2/bot/message/quota/consumption', {
            headers: LINE_HEADER
        });
        return response.data?.totalUsage ?? -1; // ถ้าไม่มีค่า ให้ส่ง -1
    } catch (error) {
        console.error("❌ Failed to fetch used quota:", error);
        return -1;
    }
}

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: `วิธี ${req.method} ไม่อนุญาต` });
    }

    if (req.headers['content-type'] !== 'application/json') {
        return res.status(400).json({ message: 'error', error: "Content-Type must be application/json" });
    }

    const body = req.body;
    const { uid } = req.body;

    console.log("📥 Received Request Body:", req.body);
    console.log("🔍 Checking UID:", uid);

    if (!uid) {
        return res.status(400).json({ message: 'error', data: 'ไม่พบพารามิเตอร์ uid' });
    }

    if (isNaN(Number(uid))) {
        return res.status(400).json({ message: 'error', data: 'พารามิเตอร์ uid ไม่ใช่ตัวเลข' });
    }

    try {
        const user = await prisma.users.findFirst({
            where: { users_id: Number(uid) }
        });

        const takecareperson = await prisma.takecareperson.findFirst({
            where: { users_id: user?.users_id, takecare_status: 1 }
        });

        if (!user || !takecareperson) {
            return res.status(400).json({ message: 'error', data: 'ไม่พบข้อมูล' });
        }

        const message = `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname} \nขอความช่วยเหลือ ฉุกเฉิน`;

        // ✅ ตรวจสอบ Quota ก่อนส่งข้อความ
        const quota = await getQuota();
        const usedQuota = await getUsedQuota();
        console.log(`📊 Total Quota: ${quota}`);
        console.log(`📊 Used Quota: ${usedQuota}`);

        if (quota !== -1 && usedQuota !== -1 && usedQuota >= quota) {
            return res.status(429).json({
                message: 'error',
                data: `Rate Limit Exceeded. Usage: ${usedQuota}/${quota}`
            });
        }

        // ✅ ถ้ายังส่งข้อความได้ ให้เรียก LINE API
        const replyToken = user.users_line_id || '';
        await replyNotificationSOS({ replyToken, message });

        return res.status(200).json({ message: 'success', data: user });

    } catch (error) {
        console.error("❌ Error:", error);
        return res.status(500).json({ message: 'error', data: 'เกิดข้อผิดพลาดในการประมวลผล' });
    }
}
