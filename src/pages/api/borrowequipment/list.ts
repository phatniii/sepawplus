import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            // ✅ ดึงเฉพาะรายการที่ถูกอนุมัติจากแอดมิน (borrow_equipment_status = 2) และยังไม่ได้คืน (borrow_status = 1)
            const borrowedItems = await prisma.borrowequipment.findMany({
                where: {
                    borrow_equipment_status: 2, // ✅ เฉพาะรายการที่ได้รับการอนุมัติจากแอดมิน
                    borrow_status: 1, // ✅ เฉพาะรายการที่ยังไม่ได้คืน
                },
                include: {
                    borrowequipment_list: {
                        include: {
                            equipment: true, // ✅ ดึงข้อมูลอุปกรณ์ที่เกี่ยวข้อง
                        }
                    }
                },
                orderBy: { borrow_create_date: 'desc' } // เรียงจากรายการล่าสุด
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
