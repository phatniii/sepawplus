import { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';
import axios from "axios";
import prisma from '@/lib/prisma';
import _ from "lodash";

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { group_line_id, group_name } = req.body;

      // ตรวจสอบค่าของ group_line_id และ group_name
      if (!group_line_id || !group_name) {
        return res.status(400).json({ message: 'Error: Missing group_line_id or group_name' });
      }

      // บันทึกข้อมูลกลุ่มในฐานข้อมูล Prisma
      const createGroupLine = await prisma.groupLine.create({
        data: {
          group_line_id: group_line_id,
          group_name: group_name,
          group_status: 1, // สถานะ 1 หมายถึงกลุ่มที่เปิดใช้งาน
        }
      });

      return res.status(200).json({ message: 'Group added successfully', id: createGroupLine.group_id });
    } catch (error) {
      console.error('Error adding group:', error);
      return res.status(400).json({ message: 'Error: Unable to add group' });
    }
  } else if (req.method === 'GET') {
    try {
      const { group_line_id } = req.query;

      if (!group_line_id || group_line_id === '') {
        return res.status(400).json({ message: 'Error: Missing group_line_id GET' });
      }

      const groupLine = await prisma.groupLine.findFirst({
        where: {
          group_line_id: group_line_id as string,
          group_status: 1,
        }
      });

      return res.status(200).json({ message: 'success', data: groupLine });
    } catch (error) {
      return res.status(400).json({ message: 'Error', data: error });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(400).json({ message: `Method ${req.method} not allowed` });
  }
}
