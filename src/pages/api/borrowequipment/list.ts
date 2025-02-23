import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { borrow_user_id } = req.query;

      if (!borrow_user_id || isNaN(Number(borrow_user_id))) {
        return res.status(400).json({ message: 'error', data: 'พารามิเตอร์ borrow_user_id ไม่ถูกต้อง' });
      }

      // ดึงเฉพาะรายการการยืมที่ได้รับการอนุมัติจากแอดมิน
      // และเป็นของผู้ใช้ที่ระบุใน borrow_user_id
      const borrowedItems = await prisma.borrowequipment.findMany({
        where: {
          borrow_equipment_status: 2,  // เฉพาะรายการที่แอดมินอนุมัติแล้ว
          borrow_user_id: Number(borrow_user_id),
        },
        include: {
          borrowequipment_list: {
            include: {
              equipment: true, // ดึงข้อมูลอุปกรณ์ที่เกี่ยวข้อง
            },
          },
        },
        orderBy: { borrow_create_date: 'desc' },
      });

      // กรองเฉพาะอุปกรณ์ที่ยังถูกยืมอยู่ (equipment_status = 0)
      const filteredItems = borrowedItems
        .map(item => ({
          ...item,
          borrowequipment_list: item.borrowequipment_list.filter(
            eq => eq.equipment?.equipment_status === 0
          ),
        }))
        .filter(item => item.borrowequipment_list.length > 0);

      return res.status(200).json({ message: 'success', data: filteredItems });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล', data: error });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
