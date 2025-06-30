import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import _ from 'lodash';
import { replyNotificationPostback, replyNotificationPostbackTemp } from '@/utils/apiLineReply';
import moment from 'moment';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    // แก้จุดนี้
    if (req.method !== 'POST' && req.method !== 'PUT') {
        res.setHeader('Allow', ['POST', 'PUT'])
        return res.status(405).json({ message: `วิธี ${req.method} ไม่อนุญาต` });
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
        } = req.body;
        if (!users_id || !takecare_id || !latitude || !longitude) {
            return res.status(400).json({ message: 'พารามิเตอร์ไม่ครบ' });
        }

        const user = await prisma.users.findUnique({
            where: {
                users_id: Number(users_id)
            }
        });

        const takecareperson = await prisma.takecareperson.findUnique({
            where: {
                takecare_id: Number(takecare_id)
            }
        });

        if (!user || !takecareperson) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้งานหรือผู้ดูแล' });
        }

        let fallRecord;

        if (req.method === 'POST') {
            fallRecord = await prisma.fall_records.create({
                data: {
                    users_id: Number(users_id),
                    takecare_id: Number(takecare_id),
                    x_axis: Number(x_axis),
                    y_axis: Number(y_axis),
                    z_axis: Number(z_axis),
                    fall_latitude: latitude,
                    fall_longitude: longitude,
                    fall_status: Number(fall_status),
                    noti_status: 0
                }
            });

        } else {
            fallRecord = await prisma.fall_records.findFirst({
                where:{
                    users_id:Number(users_id),
                    takecare_id:Number(takecare_id)
                },
                orderBy:{ fall_id:'desc'}
            });
            if(!fallRecord){
                return res.status(404).json({message:'ไม่พบข้อมูลการล้มเพื่ออัปเดต'});
            }

            fallRecord = await prisma.fall_records.update({
                where:{
                    fall_id: fallRecord.fall_id
                },
                data:{
                    x_axis:Number(x_axis),
                    y_axis:Number(y_axis),
                    z_axis:Number(z_axis),
                    fall_latitude:latitude,
                    fall_longitude:longitude,
                    fall_status:Number(fall_status)
                }
            });
        }

        if(Number(fall_status)===2 || Number(fall_status)===3){
            const message = `แจ้งเตือนการล้ม\nผู้สูงอายุ: ${takecareperson.takecare_fname} ${takecareperson.takecare_sname}\nสถานะ: ${Number(fall_status)===2 ?'ไม่โอเค':'ไม่ตอบกลับ'}\nพิกัด: ${latitude}, ${longitude}`;

            const replyToken = user.users_line_id || '';
            if(replyToken){
                await replyNotificationPostback({
                    replyToken,
                    userId:Number(users_id),
                    takecarepersonId:Number(takecare_id),
                    type:'fall',
                    message
                });
            }
            await prisma.fall_records.update({
                where:{
                    fall_id: fallRecord.fall_id
                },
                data:{
                    noti_status: 1
                }
            });
        }
        return res.status(200).json({message:'success',data:fallRecord});
    } catch (error) {
        console.error('Fall API Error:',error);
        return res.status(500).json({message:'error',error});
    }
}
