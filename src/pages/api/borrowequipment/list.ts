import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            // ✅ ดึงเฉพาะอุปกรณ์ที่ได้รับการอนุมัติจากแอดมิน และยังถูกยืมอยู่ (equipment_status = 0)
            const borrowedItems = await prisma.borrowequipment.findMany({
                where: {
                    borrow_equipment_status: 2, // ✅ อนุมัติจากแอดมินแล้ว
                },
                include: {
                    borrowequipment_list: {
                        include: {
                            equipment: true // ✅ ดึงข้อมูลอุปกรณ์ที่เกี่ยวข้อง
                        }
                    }
                },
                orderBy: { borrow_create_date: 'desc' } // เรียงจากรายการล่าสุด
            });

            // ✅ กรองเฉพาะอุปกรณ์ที่ยังถูกยืมอยู่ (equipment_status = 0)
            const filteredItems = borrowedItems.map(item => ({
                ...item,
                borrowequipment_list: item.borrowequipment_list.filter(eq => eq.equipment?.equipment_status === 0)
            })).filter(item => item.borrowequipment_list.length > 0); // ✅ กรองเฉพาะที่มีอุปกรณ์เหลืออยู่

            return res.status(200).json({ message: 'success', data: filteredItems });

        } catch (error) {
            console.error("🚀 ~ GET /api/borrowequipment/list ~ error:", error);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล', data: error });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).json({ message: `Method ${req.method} not allowed` });
    }
}
