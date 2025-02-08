import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { replyNotification, replyNotificationPostback } from '@/utils/apiLineReply';
import _ from 'lodash';
import moment from 'moment';
type Data = {
    message: string;
    data?: any;
}
export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'PUT') {
        if (req.headers['content-type'] !== 'application/json') {
            return res.status(400).json({ message: 'error', error: "Content-Type must be application/json" });
        }
        try {
            const { uId, takecare_id, latitude, longitude, distance, battery, status } = req.body;

            console.log("Received Data:", req.body);

            if (!uId || !takecare_id || !latitude || !longitude || !distance || !battery || !status) {
                return res.status(400).json({ message: 'error', data: 'พารามิเตอร์ไม่ครบถ้วน' });
            }

            // ตรวจสอบพารามิเตอร์ว่าเป็นตัวเลข
            if (_.isNaN(Number(uId)) || _.isNaN(Number(takecare_id)) || _.isNaN(Number(status)) || _.isNaN(Number(distance)) || _.isNaN(Number(battery))) {
                return res.status(400).json({ message: 'error', data: 'พารามิเตอร์ไม่ใช่ตัวเลข' });
            }

            const user = await prisma.users.findFirst({
                where: { users_id: Number(uId) },
                include: {
                    users_status_id: { select: { status_name: true } },
                },
            });

            const takecareperson = await prisma.takecareperson.findFirst({
                where: { takecare_id: Number(takecare_id), takecare_status: 1 }
            });

            if (user && takecareperson) {
                const safezone = await prisma.safezone.findFirst({
                    where: {
                        takecare_id: takecareperson.takecare_id as number,
                        users_id: user.users_id as number,
                    }
                });

                if (safezone) {
                    const location = await prisma.location.findFirst({
                        where: {
                            users_id: user.users_id as number,
                            takecare_id: takecareperson.takecare_id as number,
                        },
                        orderBy: {
                            locat_timestamp: 'desc'
                        }
                    });

                    let noti_time = null;
                    let noti_status = null;

                    if (location) {
                        if (status === 1) {
                            noti_time = new Date();
                            if (!location?.locat_noti_time && !location?.locat_noti_status) {
                                const message = `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname} \nออกนอก Safezone ชั้นที่ 1 แล้ว`;
                                if (user.users_line_id) {
                                    await replyNotification({ replyToken: user.users_line_id, message });
                                }
                                noti_status = 1;
                            } else {
                                const distanceThreshold = (Number(safezone.safez_radiuslv1) * 0.8);
                                const checkTime = location.locat_noti_status === 2 && moment().diff(moment(location.locat_noti_time), 'minutes') >= 5 ? true : false;

                                if (Number(distance) >= distanceThreshold) {
                                    noti_status = 2;
                                    noti_time = location.locat_noti_time;
                                    const message = `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname} \nเข้าใกล้ Safezone ชั้นที่ 2 แล้ว`;
                                    if (location.locat_noti_status === 1 && user.users_line_id) {
                                        await replyNotification({ replyToken: user.users_line_id, message });
                                    } else if (location.locat_noti_status === 2 && checkTime && user.users_line_id) {
                                        await replyNotification({ replyToken: user.users_line_id, message });
                                        noti_time = new Date();
                                    }
                                }
                            }
                        } else if (status === 2) {
                            const message = `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname} \nออกนอกเขต Safezone ชั้นที่ 2 แล้ว`;
                            const checkTime = location?.locat_noti_status === 3 && moment().diff(moment(location.locat_noti_time), 'minutes') >= 5 ? true : false;
                            const params = {
                                replyToken: user.users_line_id || '', // fallback เป็น '' ถ้า replyToken ไม่มีค่า
                                userId: user.users_id,
                                takecarepersonId: takecareperson.takecare_id,
                                type: 'safezone',
                                message
                            };
                            noti_status = 3;
                            noti_time = location?.locat_noti_time;
                            if (location?.locat_noti_status === 2 || location?.locat_noti_status === 1) {
                                if (user.users_line_id) {
                                    await replyNotificationPostback(params);
                                    noti_time = new Date();
                                }
                            }
                        }

                        // อัพเดตตำแหน่งในฐานข้อมูล
                        await prisma.location.update({
                            where: { location_id: location.location_id as number },
                            data: {
                                locat_timestamp: new Date(),
                                locat_latitude: latitude,
                                locat_longitude: longitude,
                                locat_status: status,
                                locat_distance: Number(distance),
                                locat_battery: Number(battery),
                                locat_noti_time: noti_time,
                                locat_noti_status: noti_status,
                            }
                        });

                    } else {
                        // ถ้าไม่พบตำแหน่งสร้างข้อมูลใหม่
                        await prisma.location.create({
                            data: {
                                users_id: user.users_id,
                                takecare_id: takecareperson.takecare_id,
                                locat_timestamp: new Date(),
                                locat_latitude: latitude,
                                locat_longitude: longitude,
                                locat_status: status,
                                locat_distance: Number(distance),
                                locat_battery: Number(battery),
                            }
                        });
                    }

                    return res.status(200).json({ message: 'success', data: 'บันทึกข้อมูลเรียบร้อย' });

                } else {
                    return res.status(404).json({ message: 'error', data: 'ไม่พบข้อมูล Safezone' });
                }
            } else {
                return res.status(404).json({ message: 'error', data: 'ไม่พบข้อมูล user หรือ takecareperson' });
            }

        } catch (error) {
            console.error("Error:", error);
            return res.status(500).json({ message: 'error', data: 'เกิดข้อผิดพลาดในการประมวลผล' });
        }

    } else {
        res.setHeader('Allow', ['PUT']);
        res.status(405).json({ message: `วิธี ${req.method} ไม่อนุญาต` });
    }
}
