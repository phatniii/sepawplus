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
//สร้างฟังก์ชันของอุณหภูมิ 
export const postbackTemp = async ({ userLineId, takecarepersonId }: PostbackSafezoneProps) => {
  try {
    const resUser = await api.getUser(userLineId);
    const resTakecareperson = await api.getTakecareperson(takecarepersonId.toString());

    if (resUser && resTakecareperson) {
      const resSafezone = await api.getSafezone(resTakecareperson.takecare_id, resUser.users_id);
      if (resSafezone) {
        const responseLocation = await getLocation(
          resTakecareperson.takecare_id,
          resUser.users_id,
          resSafezone.safezone_id
        );

        const resExtendedHelp = await api.getExtendedHelp(resTakecareperson.takecare_id, resUser.users_id);
        let extendedHelpId = null;

        if (resExtendedHelp) {
          // เคสเก่ายังไม่มีคนตอบรับ → ส่งอีกครั้ง
          if (
            resExtendedHelp.exten_received_user_id === null &&
            resExtendedHelp.exten_received_date === null
          ) {
            extendedHelpId = resExtendedHelp.exten_id;
            await api.updateExtendedHelp({
              extenId: extendedHelpId,
              typeStatus: 'sendAgain',
            });
          } else {
            // เคสเก่าโดนรับแล้ว → สร้างเคสใหม่
            const data = {
              takecareId: resTakecareperson.takecare_id,
              usersId: resUser.users_id,
              typeStatus: 'save',
              safezLatitude: resSafezone.safez_latitude,
              safezLongitude: resSafezone.safez_longitude,
            };
            const resNewId = await api.saveExtendedHelp(data);
            extendedHelpId = resNewId;
          }
        } else {
          // ไม่เคยมีเคสมาก่อน → สร้างใหม่
          const data = {
            takecareId: resTakecareperson.takecare_id,
            usersId: resUser.users_id,
            typeStatus: 'save',
            safezLatitude: resSafezone.safez_latitude,
            safezLongitude: resSafezone.safez_longitude,
          };
          const resNewId = await api.saveExtendedHelp(data);
          extendedHelpId = resNewId;
        }

        await replyNotification({
          resUser,
          resTakecareperson,
          resSafezone,
          extendedHelpId,
          locationData: responseLocation,
        });

        return extendedHelpId;
      }
    }

    return null;
  } catch (error) {
    console.log("🚨 ~ postbackTemp ~ error:", error);
    return null;
  }
};


//
export const postbackSafezone = async ({userLineId, takecarepersonId}:PostbackSafezoneProps) => {
  try {
      const resUser           = await api.getUser(userLineId)
      const resTakecareperson = await api.getTakecareperson(takecarepersonId.toString())

      if(resUser && resTakecareperson){
        const resSafezone = await api.getSafezone(resTakecareperson.takecare_id, resUser.users_id)
        if(resSafezone){
            const responeLocation = await getLocation(resTakecareperson.takecare_id, resUser.users_id, resSafezone.safezone_id)
            const resExtendedHelp = await api.getExtendedHelp(resTakecareperson.takecare_id, resUser.users_id)
            let extendedHelpId = null
            if(resExtendedHelp){
                extendedHelpId = resExtendedHelp.exten_id
                await api.updateExtendedHelp({ extenId: extendedHelpId, typeStatus: 'sendAgain'})
            }else{
                const data = {
                     takecareId : resTakecareperson.takecare_id,
                     usersId    : resUser.users_id,
                     typeStatus : 'save',
                     safezLatitude : resSafezone.safez_latitude,
                     safezLongitude : resSafezone.safez_longitude
                }
                const resExtendedHelpId = await api.saveExtendedHelp(data)
                extendedHelpId = resExtendedHelpId
            }
          
              await replyNotification({ resUser, resTakecareperson, resSafezone, extendedHelpId, locationData:responeLocation })
              return resUser.users_line_id
        }
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