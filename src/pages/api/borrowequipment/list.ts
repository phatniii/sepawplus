import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // อ่าน userId จาก query parameter (ถ้ามีส่งมาด้วย)
      const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : null;

      // ดึงรายการการยืมที่ผ่านการอนุมัติจากแอดมิน (borrow_equipment_status = 2)
      // ถ้ามี userId ให้กรองด้วย borrow_user_id
      const borrowedItems = await prisma.borrowequipment.findMany({
        where: {
          borrow_equipment_status: 2, // ผ่านการอนุมัติจากแอดมินแล้ว
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

      return res.status(200).json({ message: 'success', data: borrowedItems });
    } catch (error) {
      console.error("🚀 ~ GET /api/borrowequipment/list ~ error:", error);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล', data: error });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
