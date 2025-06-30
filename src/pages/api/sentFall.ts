import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import _ from 'lodash';
import { replyNotificationPostback, replyNotificationPostbackTemp } from '@/utils/apiLineReply';
import moment from 'moment';

type Data = {
    message: string;
    data?: any;
};

export default async function handle(req: NextApiRequest, res: NextApiResponse<Data>) {
    if (req.method === 'PUT' || req.method === 'POST') {
        try {
            const body = req.body;

            // 1. ตรวจสอบพารามิเตอร์
            if (!body.users_id || !body.takecare_id || !body.x_axis || !body.y_axis || !body.z_axis || !body.fall_status || !body.latitude || !body.longitude) {
                return res.status(400).json({ message: 'error', data: 'ไม่พบพารามิเตอร์ users_id, takecare_id, x_axis, y_axis, z_axis, fall_status, latitude, longitude' });
            }

            // 2. ตรวจสอบว่าเป็นตัวเลข
            if (isNaN(Number(body.users_id)) || isNaN(Number(body.takecare_id)) || isNaN(Number(body.fall_status))) {
                return res.status(400).json({ message: 'error', data: 'users_id, takecare_id, fall_status ต้องเป็นตัวเลข' });
            }

            // 3. หา user กับ takecareperson
            const user = await prisma.users.findUnique({
                where: { users_id: Number(body.users_id) }
            });

            const takecareperson = await prisma.takecareperson.findUnique({
                where: { takecare_id: Number(body.takecare_id) }
            });

            if (!user || !takecareperson) {
                return res.status(200).json({ message: 'error', data: 'ไม่พบข้อมูล user หรือ takecareperson' });
            }

            // 4. สร้าง fall_records (insert ใหม่ทุกครั้ง)
            await prisma.fall_records.create({
                data: {
                    users_id: user.users_id,
                    takecare_id: takecareperson.takecare_id,
                    x_axis: Number(body.x_axis),
                    y_axis: Number(body.y_axis),
                    z_axis: Number(body.z_axis),
                    fall_latitude: body.latitude,
                    fall_longitude: body.longitude,
                    fall_status: Number(body.fall_status)
                }
            });

            return res.status(200).json({ message: 'success', data: 'บันทึกข้อมูลการล้มเรียบร้อย' });

        } catch (error) {
            console.error("🚀 ~ API /fall error:", error);
            return res.status(400).json({ message: 'error', data: error });
        }
    } else {
        res.setHeader('Allow', ['PUT', 'POST']);
        return res.status(405).json({ message: 'error', data: `วิธี ${req.method} ไม่อนุญาต` });
    }
}