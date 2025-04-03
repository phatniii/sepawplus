import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            const { returnList } = req.body; // รับรายการอุปกรณ์ที่ต้องการคืน (เป็น array ของ borrow_equipment_id)

            if (!returnList || returnList.length === 0) {
                return res.status(400).json({ message: 'ไม่มีรายการอุปกรณ์ที่ต้องคืน' });
            }

            // ดึงรายการ equipment_id ที่เกี่ยวข้องกับ borrow_equipment_id ที่คืน
            const returnedEquipments = await prisma.borrowequipment_list.findMany({
                where: { borrow_equipment_id: { in: returnList } },
                select: { equipment_id: true }
            });

            const equipmentIds = returnedEquipments.map(item => item.equipment_id);

            // ✅ อัปเดตสถานะเฉพาะอุปกรณ์ให้พร้อมให้ยืม (`equipment_status = 1`)
            await prisma.equipment.updateMany({
                where: { equipment_id: { in: equipmentIds } },
                data: { equipment_status: 1 }
            });

            return res.status(200).json({ message: 'คืนอุปกรณ์สำเร็จ' });
        } catch (error) {
            console.error('Error updating return status:', error);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการคืนอุปกรณ์' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }
}
