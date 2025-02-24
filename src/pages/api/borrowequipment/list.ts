import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // อ่าน userId จาก query parameter (ถ้ามีส่งมาด้วย)
      const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : null;

      // ดึงเฉพาะรายการการยืมที่ได้รับการอนุมัติจากแอดมิน (borrow_equipment_status = 2)
      // ถ้ามี userId จะเพิ่มเงื่อนไขกรองด้วย borrow_user_id: userId
      const borrowedItems = await prisma.borrowequipment.findMany({
        where: {
          borrow_equipment_status: 2, // อนุมัติจากแอดมินแล้ว
          ...(userId && { borrow_user_id: userId }), // กรองตาม userId ถ้ามี
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

      // กรองเฉพาะอุปกรณ์ที่ยังถูกยืมอยู่ (equipment_status = 0)
      const filteredItems = borrowedItems
        .map(item => ({
          ...item,
          borrowequipment_list: item.borrowequipment_list.filter(
            eq => eq.equipment?.equipment_status === 0 // กรองเฉพาะที่ยังถูกยืมอยู่
          ),
        }))
        .filter(item => item.borrowequipment_list.length > 0); // กรองเฉพาะที่มีอุปกรณ์เหลืออยู่

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
