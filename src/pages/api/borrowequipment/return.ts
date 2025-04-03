import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { returnList } = req.body; // returnList คือ array ของ borrow_equipment_id ที่ต้องการคืน
      if (!Array.isArray(returnList) || returnList.length === 0) {
        return res.status(400).json({ message: 'ไม่มีรายการที่จะคืน' });
      }

      // ค้นหา equipment_id จากตาราง borrowequipment_list ตาม borrow_equipment_id ที่ส่งมา
      const borrowListItems = await prisma.borrowequipment_list.findMany({
        where: {
          borrow_equipment_id: { in: returnList },
        },
        select: {
          equipment_id: true,
        },
      });

      const equipmentIds = borrowListItems.map(item => item.equipment_id);

      // อัปเดตสถานะของอุปกรณ์ในตาราง equipment ให้เป็น 0 (ว่าง)
      await prisma.equipment.updateMany({
        where: {
          equipment_id: { in: equipmentIds },
        },
        data: {
          equipment_status: 0,
        },
      });

      // (ถ้าต้องการสามารถอัปเดตสถานะของรายการยืมในตาราง borrowequipment หรือ borrowequipment_list ด้วย)
      
      return res.status(200).json({ message: 'คืนอุปกรณ์สำเร็จแล้ว' });
    } catch (error) {
      console.error("🚀 ~ POST /api/borrowequipment/return ~ error:", error);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการคืนอุปกรณ์', data: error });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
