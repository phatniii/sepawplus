
import { NextApiRequest, NextApiResponse } from 'next'
import { NextResponse } from 'next/server'
import axios from "axios";
import prisma from '@/lib/prisma'
import _ from "lodash";

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            // รับข้อมูลจาก body request
            const { group_line_id, group_name } = req.body;

            // ตรวจสอบว่า group_line_id ถูกส่งมาหรือไม่
            if (_.isUndefined(group_line_id) || !group_line_id) {
                return res.status(400).json({ message: 'error', data: 'พารามิเตอร์ group_line_id POST' });
            }

            // สร้างกลุ่มไลน์ใหม่ในฐานข้อมูล
            const createGroupLine = await prisma.groupLine.create({
                data: {
                    group_line_id: group_line_id,
                    group_name   : group_name || '',  // ถ้าไม่มีชื่อกลุ่มให้ใช้ค่าว่าง
                    group_status : 1,  // ค่าเริ่มต้นสำหรับสถานะกลุ่ม
                }
            });

            // ส่งผลลัพธ์กลับไปยัง client
            return res.status(200).json({ message: 'success', id: createGroupLine.group_id });
        } catch (error) {
            // กรณีเกิดข้อผิดพลาด
            if (error instanceof Error) {
                console.error("Error occurred during group creation:", error.message);
                return res.status(400).json({ message: 'error', data: error.message });
            } else {
                console.error("Unknown error:", error);
                return res.status(400).json({ message: 'error', data: 'Unknown error occurred' });
            }
        }
    } else if (req.method === 'GET') {
        try {
            // รับข้อมูลจาก query
            const { group_line_id } = req.query;

            // ตรวจสอบว่า group_line_id ถูกส่งมาหรือไม่
            if (_.isUndefined(group_line_id) || !group_line_id) {
                return res.status(400).json({ message: 'error', data: 'พารามิเตอร์ group_line_id GET' });
            }

            // ค้นหากลุ่มไลน์จากฐานข้อมูล
            const groupLine = await prisma.groupLine.findFirst({
                where: {
                    group_line_id: group_line_id as string,
                    group_status : 1  // ค้นหากลุ่มที่มีสถานะเป็น 1 (เปิดใช้งาน)
                }
            });

            // ส่งข้อมูลกลับไป
            return res.status(200).json({ message: 'success', data: groupLine });
        } catch (error) {
            // กรณีเกิดข้อผิดพลาดขณะดึงข้อมูล
            if (error instanceof Error) {
                console.error("Error occurred while fetching group:", error.message);
                return res.status(400).json({ message: 'error', data: error.message });
            } else {
                console.error("Unknown error:", error);
                return res.status(400).json({ message: 'error', data: 'Unknown error occurred' });
            }
        }
    } else {
        // กรณีที่ method ไม่ใช่ POST หรือ GET
        res.setHeader('Allow', ['POST', 'GET']);
        res.status(400).json({ message: `Method ${req.method} not allowed` });
    }
}