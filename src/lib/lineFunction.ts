import { encrypt, parseQueryString } from '@/utils/helpers'
import * as api from '@/lib/listAPI'
import axios from 'axios';

import { replyNotification, replyNoti } from '@/utils/apiLineGroup';

interface PostbackSafezoneProps {
    userLineId      : string;
    takecarepersonId: number;
}

const getLocation = async (takecare_id: number, users_id: number, safezone_id:number) => {
	const response = await axios.get(`${process.env.WEB_DOMAIN}/api/location/getLocation?takecare_id=${takecare_id}&users_id=${users_id}&safezone_id=${safezone_id}`);
	if(response.data?.data){
		return response.data.data
	}else{
		return null
	}
}

export const postbackSafezone = async ({userLineId, takecarepersonId}:PostbackSafezoneProps) => {
  try {
      console.log("postbackSafezone called with:", { userLineId, takecarepersonId })

      const resUser = await api.getUser(userLineId)
      console.log("resUser:", resUser)

      const resTakecareperson = await api.getTakecareperson(takecarepersonId.toString())
      console.log("resTakecareperson:", resTakecareperson)

      if(resUser && resTakecareperson){
        const resSafezone = await api.getSafezone(resTakecareperson.takecare_id, resUser.users_id)
        console.log("resSafezone:", resSafezone)

        if(resSafezone){
            const responeLocation = await getLocation(resTakecareperson.takecare_id, resUser.users_id, resSafezone.safezone_id)
            console.log("responeLocation:", responeLocation)

            const resExtendedHelp = await api.getExtendedHelp(resTakecareperson.takecare_id, resUser.users_id)
            console.log("resExtendedHelp:", resExtendedHelp)

            let extendedHelpId = null
            if(resExtendedHelp){
                extendedHelpId = resExtendedHelp.exten_id
                console.log("Updating ExtendedHelp with id:", extendedHelpId)
                await api.updateExtendedHelp({ extenId: extendedHelpId, typeStatus: 'sendAgain'})
            } else {
                const data = {
                     takecareId : resTakecareperson.takecare_id,
                     usersId    : resUser.users_id,
                     typeStatus : 'save',
                     safezLatitude : resSafezone.safez_latitude,
                     safezLongitude : resSafezone.safez_longitude
                }
                console.log("Saving new ExtendedHelp with data:", data)
                const resExtendedHelpId = await api.saveExtendedHelp(data)
                extendedHelpId = resExtendedHelpId
            }

            await replyNotification({ resUser, resTakecareperson, resSafezone, extendedHelpId, locationData:responeLocation })
            return resUser.users_line_id
        } else {
          console.log("No safezone found")
        }
      } else {
        console.log("resUser or resTakecareperson is null")
      }
      return null
  } catch (error) {
      console.log("🚀 ~ postbackSafezone ~ error:", error)
      return error
  }
}


export const postbackAccept = async (data: any) => {
  try {
      const resUser = await api.getUser(data.userIdAccept)
      if(!resUser){
          await replyNoti({ replyToken: data.groupId, userIdAccept: data.userIdAccept, message: 'ไม่พบข้อมูลของคุณไม่สามารถรับเคสได้' })
          return null;
      }else{
        const resExtendedHelp = await api.getExtendedHelpById(data.extenId)
        if(resExtendedHelp){
            if(resExtendedHelp.exten_received_date && resExtendedHelp.exten_received_user_id){
                await replyNoti({ replyToken: data.groupId, userIdAccept: data.userIdAccept, message: 'มีผู้รับเคสช่วยเหลือแล้ว' })
                return null;
            }else{
                await api.updateExtendedHelp({ extenId: data.extenId, typeStatus: 'received', extenReceivedUserId: resUser.users_id })
                await replyNoti({ replyToken: data.groupId, userIdAccept: data.userIdAccept, message: 'รับเคสช่วยเหลือแล้ว' })
                return data.userLineId
            }
        }
      }
    return null
  } catch (error) {
      return error
  }
}

export const postbackClose = async (data: any) => {
    try {
        const resUser = await api.getUser(data.userIdAccept)
        if(!resUser){
            await replyNoti({ replyToken: data.groupId, userIdAccept: data.userIdAccept, message: 'ไม่พบข้อมูลของคุณไม่สามารถปิดเคสได้' })
            return null;
        }else{
          const resExtendedHelp = await api.getExtendedHelpById(data.extenId)
          if(resExtendedHelp){
              if(resExtendedHelp.exted_closed_date && resExtendedHelp.exten_closed_user_id){
                  await replyNoti({ replyToken: data.groupId, userIdAccept: data.userIdAccept, message: 'มีผู้ปิดเคสช่วยเหลือแล้ว' })
                  return null;
              }if(!resExtendedHelp.exten_received_date && !resExtendedHelp.exten_received_user_id){
                await replyNoti({ replyToken: data.groupId, userIdAccept: data.userIdAccept, message: 'ไม่สามารถปิดเคสได้ เนื่องจากยังไม่ได้ตอบรับการช่วยเหลือ' })
                return null;
              }else{
                  await api.updateExtendedHelp({ extenId: data.extenId, typeStatus: 'close', extenClosedUserId: resUser.users_id })
                  await replyNoti({ replyToken: data.groupId, userIdAccept: data.userIdAccept, message: 'ปิดเคสช่วยเหลือแล้ว' })
                  return data.userLineId
              }
          }
        }
      return null
    } catch (error) {
        return error
    }
  }