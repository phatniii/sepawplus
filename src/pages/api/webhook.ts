import { NextApiRequest, NextApiResponse } from "next";
import {
  replyMessage,
  replyRegistration,
  replyMenuBorrowequipment,
  replyUserInfo,
  replyNotRegistration,
  replyUserData,
  replyLocation,
  replySetting,
  replyConnection, 
  replyNotification, 
  replyNotificationSOS, 
  replyNotificationSendDocQuery
} from "@/utils/apiLineReply";
import { getUser, getTakecareperson, getSafezone, getLocation } from "@/lib/listAPI";

// Webhook handler
export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  console.log("Request body:", JSON.stringify(req.body, null, 2)); // Debugging: ดูข้อมูลทั้งหมดในคำขอ

  const events = req.body?.events;

  if (!events || events.length === 0) {
    console.warn("No events found in the request body");
    return res.status(200).json({ message: "No events found" });
  }

  try {
    const event = events[0];
    const { replyToken, source, type, message } = event;
    const userId = source?.userId;

    // ตรวจสอบ replyToken และ userId
    if (!replyToken || !userId) {
      console.error("Missing replyToken or userId", { replyToken, userId });
      return res.status(200).json({ message: "Missing replyToken or userId" });
    }

    if (type === "message" && message?.type === "text") {
      const userMessage = message.text.trim();
      console.log(`Received message: "${userMessage}" from user: ${userId}`);

      switch (userMessage) {
        case "ดูตำแหน่งปัจจุบัน": {
          console.log("Handling location request for user:", userId);
          const userData = await safeApiCall(() => getUser(userId));
          if (userData) {
            const encodedUserId = encodeURIComponent(userData.users_id);
            const takecareperson = await safeApiCall(() =>
              getTakecareperson(encodedUserId)
            );
            if (takecareperson?.takecare_id) {
              const safezone = await safeApiCall(() =>
                getSafezone(takecareperson.takecare_id, userData.users_id)
              );
              const location = await safeApiCall(() =>
                getLocation(
                  takecareperson.takecare_id,
                  userData.users_id,
                  safezone?.safezone_id
                )
              );
              // Send location instead of postback
              await replyLocation({
                replyToken,
                userData,
                userTakecarepersonData: takecareperson,
                safezoneData: safezone,
                locationData: location,
              });
            } else {
              await replyMessage({
                replyToken,
                message: "ยังไม่ได้เพิ่มข้อมูลผู้สูงอายุ ไม่สามารถดูตำแหน่งได้",
              });
            }
          } else {
            await replyNotRegistration({ replyToken, userId });
          }
          break;
        }

        case "ตั้งค่าเขตปลอดภัย": {
          console.log("Handling safe zone setup for user:", userId);
          const userData = await safeApiCall(() => getUser(userId));
          if (userData) {
            const encodedUserId = encodeURIComponent(userData.users_id);
            const takecareperson = await safeApiCall(() =>
              getTakecareperson(encodedUserId)
            );
            if (takecareperson?.takecare_id) {
              const safezone = await safeApiCall(() =>
                getSafezone(takecareperson.takecare_id, userData.users_id)
              );
              await replySetting({
                replyToken,
                userData,
                userTakecarepersonData: takecareperson,
                safezoneData: safezone,
              });
            } else {
              await replyMessage({
                replyToken,
                message: "ไม่พบข้อมูลผู้สูงอายุ ไม่สามารถตั้งค่าเขตปลอดภัยได้",
              });
            }
          } else {
            await replyNotRegistration({ replyToken, userId });
          }
          break;
        }

        case "ส่งความช่วยเหลือเพิ่มเติม": {
          // ทำการส่งตำแหน่งหรือข้อมูลอื่นๆที่จำเป็นไปยังกลุ่มหรือผู้ใช้
          const userData = await safeApiCall(() => getUser(userId));
          if (userData) {
            const takecareperson = await safeApiCall(() =>
              getTakecareperson(userData.users_id)
            );
            if (takecareperson?.takecare_id) {
              const safezone = await safeApiCall(() =>
                getSafezone(takecareperson.takecare_id, userData.users_id)
              );
              const location = await safeApiCall(() =>
                getLocation(
                  takecareperson.takecare_id,
                  userData.users_id,
                  safezone?.safezone_id
                )
              );
              // ส่งตำแหน่งในข้อความไปยังกลุ่ม
              await replyLocation({
                replyToken,
                userData,
                userTakecarepersonData: takecareperson,
                safezoneData: safezone,
                locationData: location,
              });
            }
          }
          break;
        }

        default: {
          console.warn("Unknown command received:", userMessage);
          await replyMessage({
            replyToken,
            message: "คำสั่งไม่ถูกต้อง กรุณาเลือกคำสั่งจากเมนู",
          });
          break;
        }
      }
    } else {
      console.warn("Unsupported message type:", type);
      await replyMessage({ replyToken, message: "ประเภทข้อความนี้ยังไม่รองรับ" });
    }

    return res.status(200).json({ message: "Success" });
  } catch (error) {
    console.error("Error in webhook handler:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

// Safe API Call wrapper for error handling
async function safeApiCall<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    console.error("Error during API call:", error);
    return null;
  }
}
