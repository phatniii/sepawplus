import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // อ่าน userId จาก query parameter
      const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : undefined;

      // ตรวจสอบว่า userId ถูกต้อง
      if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
      }

      // ค้นหาผู้ใช้จาก userId
      const user = await prisma.users.findUnique({
        where: { users_id: userId },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // ดึงรายการการยืมที่ได้รับการอนุมัติจากแอดมิน (borrow_equipment_status = 2)
      const borrowedItems = await prisma.borrowequipment.findMany({
        where: {
          borrow_equipment_status: 2,
          borrow_user_id: userId, // กรองด้วย userId
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

      // กรองเฉพาะอุปกรณ์ที่ยังถูกยืมอยู่
      const filteredItems = borrowedItems
        .map(item => ({
          ...item,
          borrowequipment_list: item.borrowequipment_list.filter(
            eq => eq.equipment?.equipment_status === 0 // equipment_status = 0 หมายถึงอุปกรณ์ที่ยังยืมอยู่
          ),
        }))
        .filter(item => item.borrowequipment_list.length > 0);

      return res.status(200).json({ message: 'success', data: filteredItems });
    } catch (error) {
      console.error('Error fetching borrowed equipment:', error);
      return res.status(500).json({ message: 'Internal server error', data: error });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
