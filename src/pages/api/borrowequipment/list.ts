// /pages/api/borrowequipment/list.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // รับ user_id จาก query parameter (หรือปรับให้รับจาก session/ token ตามระบบของคุณ)
      const { user_id } = req.query;
      if (!user_id) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      // ดึงข้อมูลการยืมที่ได้รับการอนุมัติ (borrow_equipment_status = 2)
      // พร้อมทั้งดึงรายการอุปกรณ์ใน borrowequipment_list และข้อมูลของ equipment
      const approvedBorrows = await prisma.borrowequipment.findMany({
        where: {
          borrow_user_id: Number(user_id),
          borrow_equipment_status: 2, // 2 = อนุมัติแล้ว
        },
        include: {
          borrowequipment_list: {
            include: {
              equipment: true,
            },
          },
        },
      });

      return res.status(200).json({ data: approvedBorrows });
    } catch (error) {
      console.error('Error fetching approved borrow data:', error);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
