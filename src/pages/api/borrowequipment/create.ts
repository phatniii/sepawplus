
import { NextApiRequest, NextApiResponse } from 'next'
import { NextResponse } from 'next/server'
import axios from "axios";
import prisma from '@/lib/prisma'
import { replyMessage, replyRegistration } from '@/utils/apiLineReply';
type Data = {
    message: string;
    data?: any;
}
export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            if (req.body) {
                const body = req.body
                if (body.borrow_date && body.borrow_return && body.borrow_user_id && body.borrow_address && body.borrow_tel && body.borrow_objective && body.borrow_name && body.borrow_list) {
                    const borrowequipment = await prisma.borrowequipment.create({
                        data: {
                            borrow_date          : new Date(body.borrow_date),
                            borrow_return        : new Date(body.borrow_return),
                            borrow_user_id       : body.borrow_user_id,
                            borrow_address       : body.borrow_address,
                            borrow_tel           : body.borrow_tel,
                            borrow_objective     : body.borrow_objective,
                            borrow_name          : body.borrow_name,
                            borrow_create_date   : new Date(),
                            borrow_update_date   : new Date(),
                            borrow_update_user_id: body.borrow_user_id,
                        },
                    })
                    if (borrowequipment) {
                        if (body.borrow_list) {
                            for (const item of body.borrow_list) {
                                await prisma.borrowequipment_list.create({
                                    data: {
                                        borrow_id: borrowequipment.borrow_id,
                                        borrow_equipment: item.listName,
                                        borrow_equipment_number: item.numberCard,
                                    }
                                })
                            }
                        }
                    }

                } else {
                    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' })
                }

            }
            return res.status(200).json({ message: 'success' })
        } catch (error) {
            console.log("🚀 ~ file: create.ts:31 ~ handle ~ error:", error)
            return res.status(400).json({ message: 'error', data: error })
        }

    } else {
        res.setHeader('Allow', ['POST'])
        res.status(400).json({ message: `วิธี ${req.method} ไม่อนุญาต` })
    }

}
