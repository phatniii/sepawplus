import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // รับ borrow_id และ userId จาก query parameter
      const { borrow_id, userId } = req.query;

      if (!borrow_id) {
        return res.status(400).json({ message: 'กรุณาระบุ borrow_id' });
      }

      // ดึงข้อมูลรายการยืมอุปกรณ์ที่ตรงกับ borrow_id
      const borrowRecord = await prisma.borrowequipment.findUnique({
        where: {
          borrow_id: Number(borrow_id),
        },
        include: {
          borrowequipment_list: {
            include: {
              equipment: true, // ดึงข้อมูลอุปกรณ์ที่เกี่ยวข้อง
            },
          },
        },
      });

      if (!borrowRecord) {
        return res.status(404).json({ message: 'ไม่พบข้อมูลการยืมอุปกรณ์' });
      }

      // ตรวจสอบว่า record นี้เป็นของผู้ใช้ที่ล็อกอินอยู่หรือไม่ (ถ้ามีการส่ง userId เข้ามา)
      if (userId && Number(userId) !== borrowRecord.borrow_user_id) {
        return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้' });
      }

      // กรองเฉพาะรายการอุปกรณ์ที่ยังถูกยืมอยู่ (equipment_status = 0)
      const filteredEquipmentList = borrowRecord.borrowequipment_list.filter(item => 
        item.equipment && item.equipment.equipment_status === 0
      );

      // สร้างผลลัพธ์ที่ส่งกลับ โดยแทนที่รายการอุปกรณ์ด้วยรายการที่ผ่านการกรองแล้ว
      const result = {
        ...borrowRecord,
        borrowequipment_list: filteredEquipmentList,
      };

      return res.status(200).json({ message: 'success', data: result });
    } catch (error) {
      console.error("🚀 ~ GET /api/borrowequipment/list ~ error:", error);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล', data: error });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
