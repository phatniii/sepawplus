import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            // ดึงข้อมูลการยืมทั้งหมด และรวมข้อมูลจาก borrowequipment_list และ equipment
            const borrowedItems = await prisma.borrowequipment.findMany({
                include: {
                    borrowequipment_list: {
                        include: {
                            equipment: true, // ✅ ดึงข้อมูลอุปกรณ์ที่เกี่ยวข้อง
                        }
                    }
                },
                orderBy: { borrow_create_date: 'desc' } // เรียงจากล่าสุด
            });

            return res.status(200).json({ message: 'success', data: borrowedItems });

        } catch (error) {
            console.error("🚀 ~ GET /api/borrowequipment/list ~ error:", error);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล', data: error });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).json({ message: `Method ${req.method} not allowed` });
    }
}
