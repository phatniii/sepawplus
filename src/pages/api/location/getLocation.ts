
import { NextApiRequest, NextApiResponse } from 'next'
import { NextResponse } from 'next/server'
import axios from "axios";
import prisma from '@/lib/prisma'
import _ from "lodash";

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            const takecare_id = req.query.takecare_id
            const users_id = req.query.users_id
            const safezone_id = req.query.safezone_id
            const location_id = req.query.location_id
            if(_.isNaN(Number(takecare_id)) || _.isNaN(Number(users_id) || _.isNaN(Number(safezone_id)))){ // ถ้าไม่ใช่ตัวเลข
                return res.status(400).json({ message: 'error', data: 'พารามิเตอร์ takecare_id หรือ users_id ไม่ใช่ตัวเลข' })
            }
            if(location_id && _.isNaN(Number(location_id))){
                return res.status(400).json({ message: 'error', data: 'พารามิเตอร์ location_id ไม่ใช่ตัวเลข' })
            }
            if(location_id){
                const location = await prisma.location.findFirst({
                    where: {
                        location_id: Number(location_id)
                    }
                })
                return res.status(200).json({ message: 'success', data: location })
            }
            if(users_id && takecare_id && safezone_id){
               const location = await prisma.location.findFirst({
                    where: {
                        users_id: Number(users_id),
                        takecare_id: Number(takecare_id),
                    }
                })
                return res.status(200).json({ message: 'success', data: location })
            }else{
                return res.status(200).json({ message: 'success', data: null })
            }
            

        } catch (error) {
            return res.status(400).json({ message: 'error', data: error })
        }

    } else {
        res.setHeader('Allow', ['GET'])
        res.status(400).json({ message: `วิธี ${req.method} ไม่อนุญาต` })
    }

}
