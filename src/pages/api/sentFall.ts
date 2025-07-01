import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { replyNotificationPostbackfall } from '@/utils/apiLineReply';
import moment from 'moment';

type Data = {
    message: string;
    data?: any;
};

export default async function handle(req: NextApiRequest, res: NextApiResponse<Data>) {
    if (req.method === 'PUT' || req.method === 'POST') {
        try {
            const body = req.body;
            const fallStatus = Number(body.fall_status);

            // --- เช็คว่าข้อมูลครบหรือไม่ ---
             if (
                !body.users_id ||
                !body.takecare_id ||
                body.x_axis === undefined ||
                body.y_axis === undefined ||
                body.z_axis === undefined ||
                body.fall_status === undefined ||
                body.latitude === undefined ||
                body.longitude === undefined
            ) {
                return res.status(400).json({ message: 'error', data: 'ไม่พบพารามิเตอร์ users_id, takecare_id, x_axis, y_axis, z_axis, fall_status, latitude, longitude' });
            }

            if (
                isNaN(Number(body.users_id)) ||
                isNaN(Number(body.takecare_id)) ||
                isNaN(fallStatus)
            ) {
                return res.status(400).json({ message: 'error', data: 'users_id, takecare_id, fall_status ต้องเป็นตัวเลข' });
            }

            const user = await prisma.users.findUnique({
                where: { users_id: Number(body.users_id) }
            });

            const takecareperson = await prisma.takecareperson.findUnique({
                where: { takecare_id: Number(body.takecare_id) }
            });

            if (!user || !takecareperson) {
                return res.status(200).json({ message: 'error', data: 'ไม่พบข้อมูล user หรือ takecareperson' });
            }

            // --- หาเหตุการณ์ล้มล่าสุดของผู้ใช้/ผู้ดูแลนี้ ---
            let lastFall = await prisma.fall_records.findFirst({
                where: {
                    users_id: user.users_id,
                    takecare_id: takecareperson.takecare_id,
                },
                orderBy: { fall_timestamp: 'desc' }
            });

            let noti_status: number | null = null;
            let noti_time: Date | null = null;

            // --- บันทึกข้อมูลการล้ม (รอเซฟ noti_status/noti_time เพิ่มท้าย) ---
            const fallData: any = {
                users_id: user.users_id,
                takecare_id: takecareperson.takecare_id,
                x_axis: Number(body.x_axis),
                y_axis: Number(body.y_axis),
                z_axis: Number(body.z_axis),
                fall_latitude: body.latitude,
                fall_longitude: body.longitude,
                fall_status: fallStatus
            };

            // --- แจ้งเตือนเฉพาะสถานะ 2, 3 และยังไม่แจ้งซ้ำภายใน 5 นาที ---
            if ((fallStatus === 2 || fallStatus === 3) && (
                !lastFall || lastFall.noti_status !== 1 || moment().diff(moment(lastFall.noti_time), 'minutes') >= 5
            )) {
                const message = fallStatus === 2
                    ? `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname} กด "ไม่โอเค" ขอความช่วยเหลือ`
                    : `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname} ไม่มีการตอบสนองภายใน 30 วินาที`;

                const replyToken = user.users_line_id || '';
                if (replyToken) {
                    await replyNotificationPostbackfall({
                        userId: user.users_id,
                        takecarepersonId: takecareperson.takecare_id,
                        type: 'fall',
                        message,
                        replyToken,
                    });
                }

                noti_status = 1;
                noti_time = new Date();
            } else {
                noti_status = 0;
                noti_time = null;
                console.log("ล้มแต่ยังไม่เข้าเงื่อนไขแจ้งเตือน LINE หรือแจ้งไปแล้วใน 5 นาที");
            }

            // --- เพิ่ม field noti_status, noti_time (ถ้า model รองรับ) ---
            fallData.noti_status = noti_status;
            fallData.noti_time = noti_time;

            await prisma.fall_records.create({ data: fallData });

            return res.status(200).json({ message: 'success', data: 'บันทึกข้อมูลการล้มและแจ้งเตือนเรียบร้อย' });

        } catch (error) {
            console.error("🚀 ~ API /sentFall error:", error);
            return res.status(400).json({ message: 'error', data: error });
        }
    } else {
        res.setHeader('Allow', ['PUT', 'POST']);
        return res.status(405).json({ message: 'error', data: `วิธี ${req.method} ไม่อนุญาต` });
    }
}
