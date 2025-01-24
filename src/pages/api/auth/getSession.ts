import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import authMiddleware from '@/lib/authMiddleware';

const handler = (req: NextApiRequest, res: NextApiResponse ) => {
    if (req.method === 'GET') {
        const data = {
            user: {
                userName  : (req as any).user.userName,
                userId    : (req as any).user.userId,
                permission: (req as any).user.permission,
            },
            accessToken: (req as any).userAccessToken || null,
        };
        return res.status(200).json({ message: 'Success', ...data });
    }

    if (req.method === 'PUT') {
        const { userId, userName, permission } = req.body;

        // ตัวอย่าง logic ในการอัปเดตข้อมูล (ปรับตามความต้องการของคุณ)
        if (!userId || !userName || !permission) {
            return res.status(400).json({ message: 'Invalid request body' });
        }

        // สมมติว่าเราทำการอัปเดตในฐานข้อมูลสำเร็จ
        return res.status(200).json({
            message: 'User updated successfully',
            updatedUser: { userId, userName, permission },
        });
    }

    // หาก method ไม่รองรับ
    return res.status(405).json({ message: 'Method not allowed' });
};

export default authMiddleware(handler);
