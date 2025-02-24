import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // อ่าน userId จาก query parameter (ต้องมีการส่ง userId มาด้วย)
      const userIdParam = req.query.userId;
      if (!userIdParam) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      const userId = parseInt(userIdParam as string, 10);

      // ดึงเฉพาะรายการการยืมที่ได้รับการอนุมัติจากแอดมิน (borrow_equipment_status = 2)
      // และเฉพาะรายการของผู้ใช้ที่ล็อกอิน (borrow_user_id = userId)
      const borrowedItems = await prisma.borrowequipment.findMany({
        where: {
          borrow_equipment_status: 2, // 2 = อนุมัติแล้ว
          borrow_user_id: userId,
        },
        include: {
          borrowequipment_list: {
            include: {
              equipment: true, // ดึงข้อมูลอุปกรณ์ที่เกี่ยวข้อง
            },
          },
        },
        orderBy: { borrow_create_date: 'desc' }, // เรียงจากรายการล่าสุด
      });

      // กรองเฉพาะรายการที่ยังมีอุปกรณ์ที่ยังไม่คืน (equipment_status = 0)
      const filteredItems = borrowedItems
        .map(item => {
          const remainingEquipment = item.borrowequipment_list.filter(
            eq => eq.equipment?.equipment_status === 0
          );
          return { ...item, borrowequipment_list: remainingEquipment };
        })
        .filter(item => item.borrowequipment_list.length > 0);

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
