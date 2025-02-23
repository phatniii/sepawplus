import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  try {
    // รับ userId จาก query parameter
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'Missing userId' });
    }

    // ดึงข้อมูลชุดอุปกรณ์ที่ได้รับการอนุมัติจากแอดมิน (borrow_equipment_status: 2)
    // และกรองให้เป็นของผู้ใช้ที่ระบุ (borrow_user_id เท่ากับ userId ที่ส่งมา)
    const approvedBorrowEquipment = await prisma.borrowequipment.findMany({
      where: {
        borrow_equipment_status: 2, // เฉพาะชุดที่ได้รับการอนุมัติจากแอดมิน
        borrow_user_id: Number(userId), // กรองเฉพาะของผู้ใช้ที่ส่งมา
      },
      select: {
        borrow_id: true,
        borrow_date: true,
        borrow_return: true,
        borrowequipment_list: {
          select: {
            borrow_equipment_id: true,
            equipment_id: true,
            equipment: {
              select: {
                equipment_name: true,
                equipment_code: true,
              },
            },
          },
        },
      },
      orderBy: {
        borrow_id: 'desc',
      },
    });

    return res.status(200).json({ message: 'success', data: approvedBorrowEquipment });
  } catch (error) {
    console.error("🚀 ~ GET /api/borrowequipment/list ~ error:", error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล', data: error });
  }
}
