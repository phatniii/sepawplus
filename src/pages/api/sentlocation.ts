import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { replyNotification, replyNotificationPostback } from '@/utils/apiLineReply';
import moment from 'moment';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    // ✅ ปรับให้รองรับทั้ง POST และ PUT
    if (req.method === 'PUT' || req.method === 'POST') {
        try {
            const { uId, takecare_id, distance, latitude, longitude, battery } = req.body;

            console.log("Received Data:", req.body);

            // ตรวจสอบว่าได้ส่งข้อมูลครบถ้วน
            if (!uId || !takecare_id || !distance || !latitude || !longitude || !battery) {
                return res.status(400).json({ message: 'error', data: 'พารามิเตอร์ไม่ครบถ้วน' });
            }

            // ดึงข้อมูล Safezone
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

            // คำนวณ 80% ของ r2
            const safezoneThreshold = r2 * 0.8;

            // คำนวณสถานะจากระยะทาง
            let calculatedStatus = 0;
            if (distance <= r1) {
                calculatedStatus = 0; // อยู่ใน Safezone
            } else if (distance > r1 && distance < safezoneThreshold) {
                calculatedStatus = 1; // ออกนอก Safezone ชั้นที่ 1
            } else if (distance >= safezoneThreshold && distance <= r2) {
                calculatedStatus = 3; // เข้าใกล้ Safezone ชั้นที่ 2
            } else if (distance > r2) {
                calculatedStatus = 2; // ออกนอก Safezone ชั้นที่ 2
            }

            // ✅ หาแถวล่าสุดของคู่ users_id + takecare_id
            const latest = await prisma.location.findFirst({
                where: {
                    users_id: Number(uId),
                    takecare_id: Number(takecare_id),
                },
                orderBy: {
                    // ถ้าคอลัมน์เวลาหลักของตารางเป็นชื่ออื่น ปรับตรงนี้ให้ตรงกับสคีมาจริง
                    locat_timestamp: 'desc',
                },
            });

            // เตรียมข้อมูลที่จะบันทึก (เหมือนของเดิม)
            const dataPayload = {
                users_id: Number(uId),
                takecare_id: Number(takecare_id),
                locat_timestamp: new Date(),
                locat_latitude: latitude.toString(),
                locat_longitude: longitude.toString(),
                locat_status: calculatedStatus,
                locat_distance: Number(distance),
                locat_battery: Number(battery),
                // ด้านล่างคงพฤติกรรมเดิมไว้
                locat_noti_time: new Date(),
                locat_noti_status: 1,
            };

            // ✅ ถ้ามีแถวเดิม -> update, ถ้าไม่มีก็ create
            let savedLocation;
            if (latest) {
                // หมายเหตุ: สมมติ primary key ชื่อ `locat_id`
                // ถ้าของจริงชื่ออื่น (เช่น location_id) ให้แก้ชื่อตรงนี้ให้ตรงสคีมา
                savedLocation = await prisma.location.update({
                    where: {location_id: (latest as any).locat_id },
                    data: dataPayload,
                });
            } else {
                savedLocation = await prisma.location.create({ data: dataPayload });
            }

            // ถ้าสถานะเป็น 0 (อยู่ใน Safezone) ไม่ต้องส่งการแจ้งเตือน
            if (calculatedStatus === 0) {
                console.log(`Status is ${calculatedStatus}, no notification sent.`);
                return res.status(200).json({
                    message: 'success',
                    data: savedLocation,
                });
            }

            // ค้นหาผู้ใช้และผู้ดูแล (คงของเดิม)
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
                const replyToken = user.users_line_id || ''; // รับ replyToken

                // ถ้าสถานะเป็น 3 (เข้าใกล้ Safezone ชั้นที่ 2)
                if (calculatedStatus === 3) {
                    const warningMessage = `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname} \nเข้าใกล้เขตปลอดภัย ชั้นที่ 2 แล้ว`;
                    if (replyToken) {
                        await replyNotification({
                            replyToken,
                            message: warningMessage,
                        });
                    } else {
                        console.warn("User does not have a Line ID for notification");
                    }
                }
                // ถ้าสถานะเป็น 1 (ออกนอก Safezone ชั้นที่ 1)
                else if (calculatedStatus === 1) {
                    const message = `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname} \nออกนอกเขตปลอดภัย ชั้นที่ 1 แล้ว`;
                    if (replyToken) {
                        await replyNotification({ replyToken, message });
                    } else {
                        console.warn("User does not have a Line ID for notification");
                    }
                }
                // ถ้าสถานะเป็น 2 (ออกนอก Safezone ชั้นที่ 2)
                else if (calculatedStatus === 2) {
                    const postbackMessage = `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname} \nออกนอกเขตปลอดภัย ชั้นที่ 2 แล้ว`;
                    if (replyToken) {
                        await replyNotificationPostback({
                            userId: Number(uId),
                            takecarepersonId: Number(takecare_id),
                            type: 'safezone', // กำหนด type เป็น 'safezone'
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
                data: savedLocation,
            });
        } catch (error) {
            console.error("Error:", error);
            return res.status(500).json({ message: 'error', data: 'เกิดข้อผิดพลาดในการประมวลผล' });
        }
    } else {
        // ✅ อัปเดตรายการ Allow ให้ตรงกับวิธีที่รองรับ
        res.setHeader('Allow', ['PUT', 'POST']);
        res.status(405).json({ message: `วิธี ${req.method} ไม่อนุญาต` });
    }
}
