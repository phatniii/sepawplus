import { NextApiRequest, NextApiResponse } from 'next';
import axios from "axios";
import prisma from '@/lib/prisma';
import { 
  replyMessage, 
  replyRegistration, 
  replyUserData, 
  replyNotRegistration, 
  replyMenuBorrowequipment, 
  replyConnection, 
  replyLocation, 
  replySetting, 
  replyUserInfo, 
  replyNotification 
} from '@/utils/apiLineReply';
import { encrypt, parseQueryString } from '@/utils/helpers';
import { postbackSafezone, postbackAccept, postbackClose } from '@/lib/lineFunction';
import * as api from '@/lib/listAPI';

// Function to retrieve user data
const getUser = async (userId: string) => {
  const responseUser = await axios.get(`${process.env.WEB_DOMAIN}/api/user/getUser/${userId}`);
  if(responseUser.data?.data) {
    return responseUser.data.data;
  } else {
    return null;
  }
};

// Function to retrieve group information
const getGroupLine = async (groupId: string) => {
  const response = await axios.get(`${process.env.WEB_DOMAIN}/api/master/getGroupLine?group_line_id=${groupId}`);
  if(response.data?.data) {
    return response.data.data;
  } else {
    return null;
  }
};

// Function to add group to the database
const addGroupLine = async (groupId: string) => {
  const response = await axios.post(`${process.env.WEB_DOMAIN}/api/master/getGroupLine`, { group_line_id: groupId, group_name: '' });
  if(response.data?.id) {
    return response.data.id;
  } else {
    return null;
  }
};

// Function to get the user's takecareperson data
const getUserTakecareperson = async (userId: string) => {
  const responseUser = await axios.get(`${process.env.WEB_DOMAIN}/api/user/getUserTakecareperson/${userId}`);
  if(responseUser.data?.data) {
    return responseUser.data.data;
  } else {
    return null;
  }
};

// Function to retrieve safezone data
const getSafezone = async (takecare_id: number, users_id: number) => {
  const response = await axios.get(`${process.env.WEB_DOMAIN}/api/setting/getSafezone?takecare_id=${takecare_id}&users_id=${users_id}`);
  if(response.data?.data) {
    return response.data.data;
  } else {
    return null;
  }
};

// Function to retrieve location data
const getLocation = async (takecare_id: number, users_id: number, safezone_id:number) => {
  const response = await axios.get(`${process.env.WEB_DOMAIN}/api/location/getLocation?takecare_id=${takecare_id}&users_id=${users_id}&safezone_id=${safezone_id}`);
  if(response.data?.data) {
    return response.data.data;
  } else {
    return null;
  }
};

// Webhook handler for LINE events
export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const events = req.body?.events;
      if (events && events.length > 0) {
        const event = events[0];
        const { replyToken, source, type, message, postback } = event;
        const userId = source?.userId;

        if (!replyToken || !userId) {
          console.error("Missing replyToken or userId", { replyToken, userId });
          return res.status(200).json({ message: "Missing replyToken or userId" });
        }

        // Check if the event is from a group and the type is "join"
        if (events.source.type === "group" && events.type === "join") {
          const groupLine = await getGroupLine(events.source.groupId);
          if (!groupLine) {
            await addGroupLine(events.source.groupId);
          }
        }

        // Handle message events
        if (type === "message" && message?.type === "text") {
          const userMessage = message.text.trim();
          console.log(`Received message: "${userMessage}" from user: ${userId}`);

          switch (userMessage) {
            case "ลงทะเบียน":
              const responseUser = await api.getUser(userId);
              if (responseUser) {
                await replyUserData({ replyToken, userData: responseUser });
              } else {
                await replyRegistration({ replyToken, userId });
              }
              break;

            case "การยืม การคืนครุภัณฑ์":
              const responseUser2 = await api.getUser(userId);
              if (responseUser2) {
                await replyMenuBorrowequipment({ replyToken, userData: responseUser2 });
              } else {
                await replyNotRegistration({ replyToken, userId });
              }
              break;

            case "การเชื่อมต่อนาฬิกา":
              const responseUser3 = await api.getUser(userId);
              if (responseUser3) {
                const encodedUsersId = encrypt(responseUser3.users_id.toString());
                const responseUserTakecareperson = await getUserTakecareperson(encodedUsersId);
                if (responseUserTakecareperson) {
                  await replyConnection({ replyToken, userData: responseUser3, userTakecarepersonData: responseUserTakecareperson });
                } else {
                  await replyMessage({ replyToken, message: 'ยังไม่ได้เพิ่มข้อมูลผู้สูงอายุไม่สามารถเชื่อมต่อนาฬิกาได้' });
                }
              } else {
                await replyNotRegistration({ replyToken, userId });
              }
              break;

            case "ดูตำแหน่งปัจจุบัน":
              const responseUser4 = await api.getUser(userId);
              if (responseUser4) {
                const encodedUsersId = encrypt(responseUser4.users_id.toString());
                const responseUserTakecareperson = await getUserTakecareperson(encodedUsersId);
                if (responseUserTakecareperson) {
                  const responeSafezone = await getSafezone(responseUserTakecareperson.takecare_id, responseUser4.users_id);
                  if (responeSafezone) {
                    const responeLocation = await getLocation(responseUserTakecareperson.takecare_id, responseUser4.users_id, responeSafezone.safezone_id);
                    await replyLocation({ replyToken, userData: responseUser4, userTakecarepersonData: responseUserTakecareperson, safezoneData: responeSafezone, locationData: responeLocation });
                  } else {
                    await replyMessage({ replyToken, message: 'ยังไม่ได้ตั้งค่าเขตปลอดภัยไม่สามารถดูตำแหน่งปัจจุบันได้' });
                  }
                } else {
                  await replyMessage({ replyToken, message: 'ยังไม่ได้เพิ่มข้อมูลผู้สูงอายุไม่สามารถดูตำแหน่งปัจจุบันได้' });
                }
              } else {
                await replyNotRegistration({ replyToken, userId });
              }
              break;

            case "ตั้งค่าเขตปลอดภัย":
              const responseUser5 = await api.getUser(userId);
              if (responseUser5) {
                const encodedUsersId = encrypt(responseUser5.users_id.toString());
                const responseUserTakecareperson = await getUserTakecareperson(encodedUsersId);
                if (responseUserTakecareperson) {
                  const responeSafezone = await getSafezone(responseUserTakecareperson.takecare_id, responseUser5.users_id);
                  await replySetting({ replyToken, userData: responseUser5, userTakecarepersonData: responseUserTakecareperson, safezoneData: responeSafezone });
                } else {
                  await replyMessage({ replyToken, message: 'ยังไม่ได้เพิ่มข้อมูลผู้สูงอายุไม่สามารถตั้งค่าเขตปลอดภัยได้' });
                }
              } else {
                await replyNotRegistration({ replyToken, userId });
              }
              break;

            case "ข้อมูลผู้ใช้งาน":
              const responseUser6 = await api.getUser(userId);
              if (responseUser6) {
                const encodedUsersId = encrypt(responseUser6.users_id.toString());
                const responseUserTakecareperson = await getUserTakecareperson(encodedUsersId);
                await replyUserInfo({ replyToken, userData: responseUser6, userTakecarepersonData: responseUserTakecareperson });
              } else {
                await replyNotRegistration({ replyToken, userId });
              }
              break;
          }
        }

        // Handle postback events when user clicks on buttons
        if (events.type === "postback" && events.postback?.data) {
          const postbackData = parseQueryString(events.postback.data);
          if (postbackData.type === 'safezone') {
            const replyToken = await postbackSafezone({ userLineId: postbackData.userLineId, takecarepersonId: Number(postbackData.takecarepersonId) });
            if (replyToken) {
              await replyNotification({ replyToken, message: 'ส่งคำขอความช่วยเหลือแล้ว' });
            }
          } else if (postbackData.type === 'accept') {
            let data = postbackData;
            data.groupId = events.source.groupId;
            data.userIdAccept = events.source.userId;
            const replyToken = await postbackAccept(data);
            if (replyToken) {
              await replyNotification({ replyToken, message: 'ตอบรับเคสขอความช่วยเหลือแล้ว' });
            }
          } else if (postbackData.type === 'close') {
            let data = postbackData;
            data.groupId = events.source.groupId;
            data.userIdAccept = events.source.userId;
            const replyToken = await postbackClose(data);
            if (replyToken) {
              await replyNotification({ replyToken, message: 'ปิดเคสขอความช่วยเหลือแล้ว' });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in webhook handler:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    return res.status(200).json({ message: "Success" });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
