import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import otpMap from './_otpMap';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { uuid, code } = req.body;

  const user = await prisma.users.findFirst({
    where: {
      users_line_id: uuid,
      users_status_onweb: 1,
      users_status_active: 1,
    },
  });

  if (!user) {
    return res.status(401).json({ success: false, message: 'UUID ไม่ถูกต้อง' });
  }

  const otpEntry = otpMap.get(uuid);
  if (!otpEntry) {
    return res.status(401).json({ success: false, message: 'ยังไม่ได้ขอ OTP หรือ OTP หมดอายุ' });
  }

  if (Date.now() > otpEntry.expiresAt) {
    otpMap.delete(uuid);
    return res.status(401).json({ success: false, message: 'OTP หมดอายุแล้ว' });
  }

  if (otpEntry.otp !== code) {
    return res.status(401).json({ success: false, message: 'OTP ไม่ถูกต้อง' });
  }

  otpMap.delete(uuid); // ใช้แล้วลบทิ้ง

  return res.status(200).json({ success: true });
}
