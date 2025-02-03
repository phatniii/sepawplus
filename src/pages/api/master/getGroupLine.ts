
import { NextApiRequest, NextApiResponse } from 'next'
import { NextResponse } from 'next/server'
import axios from "axios";
import prisma from '@/lib/prisma'
import _ from "lodash";

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const events = req.body?.events;

        // ตรวจสอบว่า events มีข้อมูลหรือไม่
        if (!events || events.length === 0) {
            return res.status(400).json({ message: 'error', data: 'No events found' });
        }

        try {
            // ทำงานกับแต่ละ event ที่ได้รับ
            const event = events[0];
            const { type, source } = event;
            let group_line_id = '';
            let group_name = '';

            // ตรวจสอบ event type ว่าเป็น join หรือไม่ (เมื่อ Bot ถูกเพิ่มเข้าในกลุ่ม)
            if (type === 'join' && source?.type === 'group') {
                group_line_id = source.groupId;  // รับ group_line_id จาก event
                group_name = event.source.groupName || '';  // รับชื่อกลุ่ม (ถ้ามี)

                // ตรวจสอบว่า group_line_id ถูกส่งมา
                if (!group_line_id) {
                    return res.status(400).json({ message: 'error', data: 'Missing group_line_id' });
                }

                // ทำการบันทึกข้อมูลกลุ่มในฐานข้อมูล
                const createGroupLine = await prisma.groupLine.create({
                    data: {
                        group_line_id: group_line_id,
                        group_name: group_name,
                        group_status: 1, // สถานะกลุ่มเป็น 1 (ใช้งาน)
                    }
                });

                // ส่งกลับข้อความยืนยัน
                return res.status(200).json({ message: 'success', id: createGroupLine.group_id });
            } else {
                return res.status(400).json({ message: 'error', data: 'Event type not supported' });
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                return res.status(400).json({ message: 'error', data: error.message });
            } else {
                return res.status(400).json({ message: 'error', data: 'Unknown error occurred' });
            }
        }
    } else if (req.method === 'GET') {
        try {
            const group_line_id = req.query.group_line_id;

            // ตรวจสอบว่า group_line_id ถูกต้อง
            if (!group_line_id) {
                return res.status(400).json({ message: 'error', data: 'พารามิเตอร์ group_line_id GET ไม่ถูกต้อง' });
            }

            // ค้นหาข้อมูลในตาราง groupLine
            const groupLine = await prisma.groupLine.findFirst({
                where: {
                    group_line_id: group_line_id as string,
                    group_status: 1,  // ค้นหากลุ่มที่สถานะเป็น 1 (กำลังใช้งาน)
                }
            });

            if (!groupLine) {
                return res.status(404).json({ message: 'error', data: 'ไม่พบข้อมูลกลุ่ม' });
            }

            return res.status(200).json({ message: 'success', data: groupLine });
        } catch (error: unknown) {
            if (error instanceof Error) {
                return res.status(400).json({ message: 'error', data: error.message });
            } else {
                return res.status(400).json({ message: 'error', data: 'Unknown error occurred' });
            }
        }
    } else {
        res.setHeader('Allow', ['POST', 'GET']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
}
