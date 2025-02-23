import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : null;

      if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
      }

      // ดึงเฉพาะรายการที่แอดมินอนุมัติแล้ว และเป็นของ userId ที่ล็อกอิน
      const borrowedItems = await prisma.borrowequipment.findMany({
        where: {
          borrow_equipment_status: 2, // ✅ ต้องเป็นรายการที่แอดมินอนุมัติแล้ว
          borrow_user_id: userId, // ✅ ต้องเป็นของผู้ใช้ที่ล็อกอิน
        },
        include: {
          borrowequipment_list: {
            include: {
              equipment: true, // ✅ ดึงข้อมูลอุปกรณ์
            },
          },
        },
        orderBy: { borrow_create_date: 'desc' },
      });

      // ✅ กรองเฉพาะอุปกรณ์ที่ยังถูกยืมอยู่ (`equipment_status = 0`)
      const filteredItems = borrowedItems
        .map(item => ({
          ...item,
          borrowequipment_list: item.borrowequipment_list.filter(
            eq => eq.equipment?.equipment_status === 0
          ),
        }))
        .filter(item => item.borrowequipment_list.length > 0); // ✅ กรองเฉพาะที่มีอุปกรณ์เหลืออยู่

      return res.status(200).json({ message: 'success', data: filteredItems });
    } catch (error) {
      console.error("🚀 ~ GET /api/borrowequipment/list ~ error:", error);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล', data: error });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
