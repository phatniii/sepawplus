import { NextApiRequest, NextApiResponse } from 'next'
import { NextResponse } from 'next/server'
import axios from "axios";
import prisma from '@/lib/prisma'
import _ from "lodash";

// ฟังก์ชันสำหรับดึงข้อมูลสรุปของกลุ่มจาก LINE Messaging API
const getGroupSummary = async (groupId: string) => {
  try {
    const response = await axios.get(`https://api.line.me/v2/bot/group/${groupId}/summary`, {
      headers: {
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`  // ตรวจสอบให้แน่ใจว่า LINE_CHANNEL_ACCESS_TOKEN ตั้งค่าใน .env แล้ว
      }
    });
    return response.data;  // response.data ควรมี property groupName เป็นต้น
  } catch (error) {
    console.error("Error fetching group summary:", error);
    return null;
  }
};

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            const group_line_id = req.body.group_line_id;
            // รับค่า group_name จาก body ถ้ามี ถ้าไม่มีให้เป็นค่าว่าง
            let group_name = req.body.group_name || '';

            if (!_.isUndefined(group_line_id) && !group_line_id) {
                return res.status(400).json({ message: 'error', data: 'พารามิเตอร์ group_line_id POST' });
            }

            // ถ้า group_name เป็นค่าว่าง ให้ลองดึงข้อมูลจาก LINE Messaging API
            if (!group_name) {
                const groupSummary = await getGroupSummary(group_line_id);
                if (groupSummary && groupSummary.groupName) {
                    group_name = groupSummary.groupName;
                } else {
                    // ถ้าไม่ดึงชื่อได้ ก็สามารถกำหนดเป็นค่า default ได้ (หรือคงค่าว่างไว้)
                    group_name = "";
                }
            }

            // บันทึกข้อมูลลงฐานข้อมูล โดยใช้ group_line_id และ group_name ที่ได้
            const createGroupLine = await prisma.groupLine.create({
                data: {
                    group_line_id: group_line_id,
                    group_name   : group_name,
                    group_status : 1
                }
            });

            return res.status(200).json({ message: 'success', id: createGroupLine.group_id });
        } catch (error) {
            return res.status(400).json({ message: 'error', data: error });
        }
    } else if (req.method === 'GET') {
        try {
            const group_line_id = req.query.group_line_id;
            if (!_.isUndefined(group_line_id) && !group_line_id) {
                return res.status(400).json({ message: 'error', data: 'พารามิเตอร์ group_line_id GET' });
            }
            const groupLine = await prisma.groupLine.findFirst({
                where: {
                    group_line_id: group_line_id as string,
                    group_status : 1
                }
            });

            return res.status(200).json({ message: 'success', data: groupLine });
        } catch (error) {
            return res.status(400).json({ message: 'error', data: error });
        }
    } else {
        res.setHeader('Allow', ['POST','GET']);
        res.status(400).json({ message: `วิธี ${req.method} ไม่อนุญาต` });
    }
}
