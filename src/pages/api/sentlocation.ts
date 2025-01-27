import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { replyNotification, replyNotificationPostback } from '@/utils/apiLineReply';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'PUT') {
        try {
            const { uId, takecare_id, distance, latitude, longitude, battery } = req.body; // ไม่รับ status จาก req.body

            console.log("Received Data:", req.body);

            if (!uId || !takecare_id || !distance || !latitude || !longitude || !battery) {
                return res.status(400).json({ message: 'error', data: 'พารามิเตอร์ไม่ครบถ้วน' });
            }

            // ดึงข้อมูล Safezone จากฐานข้อมูล
            const safezone = await prisma.safezone.findFirst({
                where: {
                    takecare_id: Number(takecare_id),
                    users_id: Number(uId),
                },
            });

            if (!safezone) {
                return res.status(404).json({
                    message: 'error',
                    data: 'ไม่พบข้อมูล Safezone',
                });
            }

            // กำหนด r1 และ r2 จาก safezone
            const r1 = safezone.safez_radiuslv1;
            const r2 = safezone.safez_radiuslv2;

            // คำนวณระยะ 80% ของ Safezone 2
            const safezoneThreshold = r2 * 0.8;

            // คำนวณสถานะจากระยะทาง
            let calculatedStatus = 0;

            if (distance <= r1) {
                calculatedStatus = 0; // อยู่ในบ้าน
            } else if (distance > r1 && distance <= safezoneThreshold) {
                calculatedStatus = 3; // เข้าใกล้ Safezone 2 (80%)
            } else if (distance > r1 && distance <= r2) {
                calculatedStatus = 1; // กำลังออกนอกบ้าน
            } else if (distance > r2) {
                calculatedStatus = 2; // ออกนอกเขตปลอดภัย
            }

            // บันทึกข้อมูลในฐานข้อมูล
            const updatedLocation = await prisma.location.create({
                data: {
                    users_id: Number(uId),
                    takecare_id: Number(takecare_id),
                    locat_timestamp: new Date(),
                    locat_latitude: latitude.toString(),
                    locat_longitude: longitude.toString(),
                    locat_status: calculatedStatus, // ใช้ calculatedStatus ที่คำนวณได้
                    locat_distance: Number(distance),
                    locat_battery: Number(battery),
                    locat_noti_time: new Date(),
                    locat_noti_status: 1,
                },
            });

            // ไม่ต้องแจ้งเตือนเมื่อสถานะเป็น 0
            if (calculatedStatus === 0) {
                console.log(`Status is ${calculatedStatus}, no notification sent.`);
                return res.status(200).json({
                    message: 'success',
                    data: updatedLocation,
                });
            }

            // ค้นหาข้อมูลผู้ใช้และผู้ดูแล
            const user = await prisma.users.findFirst({
                where: { users_id: Number(uId) },
            });

            const takecareperson = await prisma.takecareperson.findFirst({
                where: {
                    users_id: Number(uId),
                    takecare_id: Number(takecare_id),
                    takecare_status: 1,
                },
            });

            if (user && takecareperson) {
                const replyToken = user.users_line_id || '';

                if (calculatedStatus === 3) {
                    // สถานะ: เข้าใกล้ Safezone 2 (80%)
                    const warningMessage = `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname} \nเข้าใกล้ Safezone 2 (80%) แล้ว`;
                    if (replyToken) {
                        await replyNotification({
                            replyToken,
                            message: warningMessage,
                        });
                    } else {
                        console.warn("User does not have a Line ID for notification");
                    }
                } else if (calculatedStatus === 1) {
                    // สถานะ: กำลังออกนอกบ้าน
                    const message = `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname} \nออกนอก Safezone ชั้นที่ 1 แล้ว`;
                    if (replyToken) {
                        await replyNotification({ replyToken, message });
                    } else {
                        console.warn("User does not have a Line ID for notification");
                    }
                } else if (calculatedStatus === 2) {
                    // สถานะ: ออกนอกเขตปลอดภัย
                    const postbackMessage = `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname} \nออกนอก Safezone ชั้นที่ 2 แล้ว`;
                    if (replyToken) {
                        await replyNotificationPostback({
                            userId: Number(uId),
                            takecarepersonId: Number(takecare_id),
                            type: 'alert',
                            message: postbackMessage,
                            replyToken,
                        });
                    } else {
                        console.warn("User does not have a Line ID for postback notification");
                    }
                }
            }

            return res.status(200).json({
                message: 'success',
                data: updatedLocation,
            });
        } catch (error) {
            console.error("Error:", error);
            return res.status(500).json({ message: 'error', data: 'เกิดข้อผิดพลาดในการประมวลผล' });
        }
    } else {
        res.setHeader('Allow', ['PUT']);
        res.status(405).json({ message: `วิธี ${req.method} ไม่อนุญาต` });
    }
}
