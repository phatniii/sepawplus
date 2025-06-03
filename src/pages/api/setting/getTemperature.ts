import { NextApiRequest, NextApiResponse } from 'next'
// import { NextResponse } from 'next/server'
// import axios from "axios";
import prisma from '@/lib/prisma'
import _ from "lodash";

export default async function handle(req:NextApiRequest,res:NextApiResponse){
    if(req.method==='GET'){
        try{
            const takecare_id= req.query.takecare_id
            const users_id = req.query.users_id
            const setting_id= req.query.setting_id

            if(_.isNaN(Number(takecare_id)) || _.isNaN(Number(users_id))){
                return res.status(400).json({message:'error',data:'พารามิเตอร์ takecare_id หรือ users_id ไม่ใช่ตัวเลข'})
            }
            let temperature_settings = null 
            if(setting_id){
                temperature_settings = await prisma.temperature_settings.findFirst({
                    where:{
                        setting_id:Number(setting_id),
                    }
                })
            }else{
                temperature_settings = await prisma.temperature_settings.findFirst({
                    where:{
                        takecare_id:Number(takecare_id),
                        users_id:Number(users_id)
                    }
                })

            }
            return res.status(200).json({message:'success',data:temperature_settings})

        }catch(error){
            console.error("Error fetching temperature settings:", error)
            return res.status(500).json({message:'success',data:error})
        }

    }else{
        res.setHeader('Allow',['GET'])
        res.status(405).json({message:`วิธี ${req.method} ไม่อนุญาต`})
    }
}