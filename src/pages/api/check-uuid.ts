import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import axios from 'axios';
import otpMap from './_otpMap';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { uuid } = req.body;

  const user = await prisma.users.findFirst({
    where: {
      users_user: uuid,
      users_status_onweb: 1,
      users_status_active: 1,
    },
  });

  if (!user || !user.users_token) {
    return res.status(404).json({ success: false, message: 'ไม่พบ UUID หรือไม่มี Line Token' });
  }

  const otp = generateOTP();
  const expiry = Date.now() + 5 * 60 * 1000; // หมดอายุใน 5 นาที

  otpMap.set(uuid, { otp, expiresAt: expiry });

  // ส่ง OTP ผ่าน Line Notify
  await axios.post('https://notify-api.line.me/api/notify',
    new URLSearchParams({ message: `รหัส OTP สำหรับเข้าสู่ระบบคือ: ${otp}` }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${user.users_token}`,
      },
    });

  return res.status(200).json({ success: true });
}
