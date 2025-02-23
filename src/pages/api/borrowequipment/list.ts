import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { users_id } = req.query;

      // ตรวจสอบว่า users_id ถูกต้อง
      if (!users_id || isNaN(Number(users_id))) {
        return res.status(400).json({ message: 'error', data: 'พารามิเตอร์ไม่ถูกต้อง' });
      }

      // ค้นหาผู้ใช้จาก users_id
      const user = await prisma.users.findUnique({
        where: { users_id: Number(users_id) },
      });

      if (!user) {
        return res.status(404).json({ message: 'error', data: 'ไม่พบผู้ใช้' });
      }

      // ดึงรายการการยืมที่ได้รับการอนุมัติจากแอดมิน (borrow_equipment_status = 2)
      const borrowedItems = await prisma.borrowequipment.findMany({
        where: {
          borrow_user_id: Number(users_id), // กรองด้วย borrow_user_id ที่ตรงกับผู้ใช้ที่ล็อกอิน
          borrow_equipment_status: 2, // สถานะการยืมต้องเป็น 2 (อนุมัติแล้ว)
        },
        include: {
          borrowequipment_list: {
            include: {
              equipment: true,
            },
          },
        },
        orderBy: { borrow_create_date: 'desc' },
      });

      // กรองเฉพาะอุปกรณ์ที่ยังถูกยืมอยู่ (เช่น equipment_status = 0 หมายถึงอุปกรณ์ที่ยังอยู่ในการยืม)
      const filteredItems = borrowedItems
        .map(item => ({
          ...item,
          borrowequipment_list: item.borrowequipment_list.filter(
            eq => eq.equipment?.equipment_status === 0 // เช็คว่าอุปกรณ์ยังถูกยืมอยู่
          ),
        }))
        .filter(item => item.borrowequipment_list.length > 0); // เอาเฉพาะอุปกรณ์ที่ยังยืมอยู่

      return res.status(200).json({
        message: 'success',
        data: filteredItems,
      });
    } catch (error) {
      console.error('Error fetching borrowed equipment:', error);
      return res.status(500).json({ message: 'Internal server error', data: error });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
