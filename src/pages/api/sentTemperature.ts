import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { replyNotificationPostback } from '@/utils/apiLineReply';
import moment from 'moment';

type Data = {
  message: string;
  data?: any;
};

export default async function handle(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'PUT' && req.method !== 'POST') {
    res.setHeader('Allow', ['PUT', 'POST']);
    return res.status(405).json({ message: 'error', data: `วิธี ${req.method} ไม่อนุญาต` });
  }

  try {
    const { uId, takecare_id, temperature_value, status } = req.body;

    // ตรวจสอบพารามิเตอร์
    if (
      uId === undefined ||
      takecare_id === undefined ||
      temperature_value === undefined ||
      status === undefined
    ) {
      return res.status(400).json({
        message: 'error',
        data: 'พารามิเตอร์ uId, takecare_id, temperature_value, status จำเป็นต้องส่งมา',
      });
    }

    const userId = Number(uId);
    const takecareId = Number(takecare_id);
    const tempValue = parseFloat(temperature_value);
    const tempStatus = Number(status);

    if (isNaN(userId) || isNaN(takecareId) || isNaN(tempValue) || isNaN(tempStatus)) {
      return res.status(400).json({
        message: 'error',
        data: 'พารามิเตอร์ต้องเป็นตัวเลข',
      });
    }

    // ดึงข้อมูลผู้ใช้และผู้ดูแล
    const user = await prisma.users.findFirst({
      where: { users_id: userId },
    });

    const takecareperson = await prisma.takecareperson.findFirst({
      where: {
        takecare_id: takecareId,
        takecare_status: 1,
      },
    });

    if (!user || !takecareperson) {
      return res.status(404).json({
        message: 'error',
        data: 'ไม่พบข้อมูล user หรือ takecareperson',
      });
    }

    // ดึงข้อมูลบันทึกอุณหภูมิเดิม
    const latestTemp = await prisma.temperature_records.findFirst({
      where: {
        users_id: userId,
        takecare_id: takecareId,
      },
      orderBy: {
        noti_time: 'desc',
      },
    });

    let noti_time: Date | null = null;
    let noti_status: number | null = null;

    // ตรวจสอบสถานะการแจ้งเตือน
    if (
      tempStatus === 1 &&
      (!latestTemp || latestTemp.noti_status !== 1 || moment().diff(moment(latestTemp.noti_time), 'minutes') >= 5)
    ) {
      const message = `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname} \nอุณหภูมิร่างกายสูง`;

      const replyToken = user.users_line_id || '';
      if (replyToken) {
        await replyNotificationPostback({
          replyToken,
          userId: userId,
          takecarepersonId: takecareId,
          type: 'temperature',
          message,
        });
      }

      noti_status = 1;
      noti_time = new Date();
    } else if (tempStatus === 0) {
      noti_status = 0;
      noti_time = null;
      console.log('อุณหภูมิอยู่ในระดับปกติ');
    }

    // อัปเดตหรือสร้าง temperature record
    if (latestTemp) {
      await prisma.temperature_records.update({
        where: {
          temperature_id: latestTemp.temperature_id,
        },
        data: {
          temperature_value: tempValue,
          record_date: new Date(),
          status: tempStatus,
          noti_time,
          noti_status,
        },
      });
    } else {
      await prisma.temperature_records.create({
        data: {
          users_id: userId,
          takecare_id: takecareId,
          temperature_value: tempValue,
          record_date: new Date(),
          status: tempStatus,
          noti_time,
          noti_status,
        },
      });
    }

    return res.status(200).json({
      message: 'success',
      data: 'บันทึกข้อมูลเรียบร้อย',
    });
  } catch (error) {
    console.error('🚀 ~ API /temperature error:', error);
    return res.status(500).json({
      message: 'error',
      data: 'เกิดข้อผิดพลาดในการประมวลผล',
    });
  }
}
