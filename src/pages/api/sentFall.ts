import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import _ from 'lodash';
import { replyNotificationPostback, replyLocation } from '@/utils/apiLineReply';
import moment from 'moment';

type Data = {
    message: string;
    data?: any;
};

export default async function handle(req: NextApiRequest, res: NextApiResponse<Data>) {
    if (req.method === 'PUT' || req.method === 'POST') {
        try {
            const body = req.body;

        
            if (
                body.users_id === undefined || body.users_id === null ||
                body.takecare_id === undefined || body.takecare_id === null ||
                body.x_axis === undefined ||
                body.y_axis === undefined ||
                body.z_axis === undefined ||
                body.fall_status === undefined ||
                body.latitude === undefined ||
                body.longitude === undefined
            ) {
                return res.status(400).json({ message: 'error', data: 'Missing parameter: users_id, takecare_id, x_axis, y_axis, z_axis, fall_status, latitude, longitude' });
            }

         
            if (
                _.isNaN(Number(body.users_id)) ||
                _.isNaN(Number(body.takecare_id)) ||
                _.isNaN(Number(body.fall_status))
            ) {
                return res.status(400).json({ message: 'error', data: 'users_id, takecare_id, fall_status ต้องเป็นตัวเลข' });
            }

            const user = await prisma.users.findFirst({
                where: { users_id: Number(body.users_id) },
                include: { users_status_id: true }
            });
            const takecareperson = await prisma.takecareperson.findFirst({
                where: { takecare_id: Number(body.takecare_id), takecare_status: 1 }
            });
            const safezone = await prisma.safezone.findFirst({
                where: {
                    takecare_id: Number(body.takecare_id),
                    users_id: Number(body.users_id)
                }
            });

            const location = await prisma.location.findFirst({
                where: {
                    takecare_id: Number(body.takecare_id),
                    users_id: Number(body.users_id)
                },
                orderBy: { locat_timestamp: 'desc' }
            });

            if (!user || !takecareperson) {
                return res.status(200).json({ message: 'error', data: 'ไม่พบข้อมูล user หรือ takecareperson' });
            }

         
            const lastFall = await prisma.fall_records.findFirst({
                where: {
                    users_id: user.users_id,
                    takecare_id: takecareperson.takecare_id
                },
                orderBy: { noti_time: 'desc' }
            });

            const fallStatus = Number(body.fall_status);
            let noti_time: Date | null = null;
            let noti_status: number | null = null;

      
            if ((fallStatus === 2 || fallStatus === 3) && (
                !lastFall || lastFall.noti_status !== 1 || !lastFall.noti_time || moment().diff(moment(lastFall.noti_time), 'minutes') >= 5
            )) {
                const message = fallStatus === 2
                    ? `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname} กด "ไม่โอเค" ขอความช่วยเหลือ`
                    : `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname} ไม่มีการตอบสนองภายใน 30 วินาที`;

                const replyToken = user.users_line_id || '';
                if (replyToken) {
                
                    await replyNotificationPostback({
                        replyToken,
                        userId: user.users_id,
                        takecarepersonId: takecareperson.takecare_id,
                        type: 'fall',
                        message
                    });

                  
                    await replyLocation({
                        replyToken,
                        userData: {
                            users_id: String(user.users_id),
                            users_line_id: user.users_line_id || '',
                            users_fname: user.users_fname || '',
                            users_sname: user.users_sname || '',
                            users_pin: user.users_pin ? user.users_pin.toString() : '',
                            users_number: user.users_number ? user.users_number.toString() : '',
                            users_moo: user.users_moo ? user.users_moo.toString() : '',
                            users_road: user.users_road || '',
                            users_tubon: user.users_tubon || '',
                            users_amphur: user.users_amphur || '',
                            users_province: user.users_province || '',
                            users_postcode: user.users_postcode ? user.users_postcode.toString() : '',
                            users_tel1: user.users_tel1 ? user.users_tel1.toString() : '',
                            users_status_id: {
                                status_name: user.users_status_id?.status_name || ""
                            }
                        },
                        userTakecarepersonData: takecareperson,
                        safezoneData: safezone,
                        locationData: location
                    });
                }

                noti_status = 1;
                noti_time = new Date();
            } else {
                noti_status = 0;
                noti_time = null;
                console.log("ล้มแต่ยังไม่เข้าเงื่อนไขแจ้งเตือน LINE หรือแจ้งไปแล้วใน 5 นาที");
            }

            await prisma.fall_records.create({
                data: {
                    users_id: user.users_id,
                    takecare_id: takecareperson.takecare_id,
                    x_axis: Number(body.x_axis),
                    y_axis: Number(body.y_axis),
                    z_axis: Number(body.z_axis),
                    fall_latitude: body.latitude,
                    fall_longitude: body.longitude,
                    fall_status: fallStatus,
                    noti_time: noti_time,
                    noti_status: noti_status
                }
            });

            return res.status(200).json({ message: 'success', data: 'บันทึกข้อมูลเรียบร้อย' });

        } catch (error) {
            console.error("API /sentFall error:", error);
            return res.status(400).json({ message: 'error', data: error });
        }
    } else {
        res.setHeader('Allow', ['PUT', 'POST']);
        return res.status(405).json({ message: 'error', data: `วิธี ${req.method} ไม่อนุญาต` });
    }
}
