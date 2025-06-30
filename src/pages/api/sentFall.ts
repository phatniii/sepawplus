import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import _ from 'lodash';
import { replyNotificationPostback, replyNotificationPostbackTemp } from '@/utils/apiLineReply';
import moment from 'moment';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }
  try {
    const {
      users_id,
      takecare_id,
      x_axis,
      y_axis,
      z_axis,
      fall_status,
      latitude,
      longitude
    } = req.body

    if (!users_id || !takecare_id || !latitude || !longitude) {
      return res.status(400).json({ message: 'พารามิเตอร์ไม่ครบ' })
    }

    const user = await prisma.users.findUnique({ where: { users_id: Number(users_id) } })
    const takecareperson = await prisma.takecareperson.findUnique({ where: { takecare_id: Number(takecare_id) } })
    if (!user || !takecareperson) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้งานหรือผู้ดูแล' })
    }

    // ✅ บันทึกทุกครั้งที่ส่งเข้ามา (log)
    const fallRecord = await prisma.fall_records.create({
      data: {
        users_id: Number(users_id),
        takecare_id: Number(takecare_id),
        x_axis: Number(x_axis),
        y_axis: Number(y_axis),
        z_axis: Number(z_axis),
        fall_latitude: latitude,
        fall_longitude: longitude,
        fall_status: Number(fall_status),
        noti_status: 0,
      }
    })

    return res.status(200).json({ message: 'success', data: fallRecord })
  } catch (error) {
    console.error('Fall API Error:', error)
    return res.status(500).json({ message: 'error', error })
  }
}