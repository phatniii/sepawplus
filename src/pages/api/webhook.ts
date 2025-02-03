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
  replyConnection, // สำหรับ "การเชื่อมต่ออุปกรณ์"
  replyNotification, // สำหรับ "แจ้งเตือน"
  replyNotificationSOS, // สำหรับ "SOS"
  replyNotificationSendDocQuery, // สำหรับ "แบบสอบถาม"
  replyNotificationPostback // สำหรับจัดการ postback (เพิ่มเข้ามา)
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

  // กรณี events ไม่มีข้อมูล (เช่น การ Verify Webhook)
  if (!events || events.length === 0) {
    console.warn("No events found in the request body");
    return res.status(200).json({ message: "No events found" }); // ตอบกลับ 200 OK เสมอ
  }

  try {
    const event = events[0];
    const { replyToken, source, type, message, postback } = event;
    const userId = source?.userId;

    // ตรวจสอบ replyToken และ userId
    if (!replyToken || !userId) {
      console.error("Missing replyToken or userId", { replyToken, userId });
      return res.status(200).json({ message: "Missing replyToken or userId" });
    }

    if (type === "message" && message?.type === "text") {
      const userMessage = message.text.trim();
      console.log(`Received message: "${userMessage}" from user: ${userId}`);

      // Handle คำสั่งต่าง ๆ
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

        case "ลงทะเบียน": {
          console.log("Handling registration request for user:", userId);
          try {
            // ดึงข้อมูลผู้ใช้งาน
            const userData = await safeApiCall(() => getUser(userId));

            if (userData) {
              console.log("User already registered:", userData);

              // แสดงข้อมูลผู้ดูแล และเมนู "ลงทะเบียนผู้สูงอายุ"
              await replyUserData({ replyToken, userData });
            } else {
              console.log("User not registered yet.");

              // เรียกฟังก์ชันเพื่อเริ่มกระบวนการลงทะเบียนใหม่
              await replyRegistration({ replyToken, userId });
            }
          } catch (error) {
            console.error("Error occurred during registration handling:", error);

            // แจ้งข้อผิดพลาดให้ผู้ใช้ทราบ
            await replyMessage({
              replyToken,
              message: "เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง",
            });
          }
          break;
        }

        case "ดูข้อมูลผู้ใช้งาน": {
          console.log("Handling user info request for user:", userId);
          try {
            // ดึงข้อมูลผู้ใช้งาน
            const userData = await safeApiCall(() => getUser(userId));

            if (userData) {
              console.log("Fetched user data:", userData);

              // เข้ารหัส users_id
              const encodedUserId = encodeURIComponent(userData.users_id);

              // ดึงข้อมูลผู้สูงอายุ (Takecare person)
              const userTakecarepersonData = await safeApiCall(() =>
                getTakecareperson(encodedUserId)
              );

              // เรียกใช้ replyUserInfo เพื่อตอบกลับข้อมูล
              await replyUserInfo({
                replyToken,
                userData,
                userTakecarepersonData: userTakecarepersonData?.takecare_id ? userTakecarepersonData : null, // ส่งข้อมูลผู้สูงอายุถ้ามี
              });
            } else {
              console.error("User data not found.");
              // กรณีไม่พบข้อมูลผู้ใช้งาน
              await replyMessage({
                replyToken,
                message: "ไม่พบข้อมูลผู้ใช้งานในระบบ กรุณาลงทะเบียนก่อน",
              });
            }
          } catch (error) {
            console.error("Error occurred while fetching user info:", error);
            // กรณีเกิดข้อผิดพลาด
            await replyMessage({
              replyToken,
              message: "เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองใหม่อีกครั้ง",
            });
          }
          break;
        }

        case "การเชื่อมต่อนาฬิกา": {
          console.log("Handling device connection for user:", userId);
          try {
            // ดึงข้อมูลผู้ใช้งาน
            const userData = await safeApiCall(() => getUser(userId));
            if (userData) {
              console.log("Fetched user data:", userData);

              // เข้ารหัส users_id
              const encodedUserId = encodeURIComponent(userData.users_id);

              // ดึงข้อมูลผู้สูงอายุ (Takecare person)
              const takecareperson = await safeApiCall(() =>
                getTakecareperson(encodedUserId)
              );

              if (takecareperson?.takecare_id) {
                console.log("Fetched takecareperson data:", takecareperson);

                // เรียกใช้ replyConnection เพื่อตอบกลับข้อมูล
                await replyConnection({
                  replyToken,
                  userData,
                  userTakecarepersonData: takecareperson,
                });
              } else {
                console.error("Takecare person data not found.");
                await replyMessage({
                  replyToken,
                  message: "ยังไม่ได้เพิ่มข้อมูลผู้สูงอายุ ไม่สามารถดำเนินการเชื่อมต่อได้",
                });
              }
            } else {
              console.error("User data not found.");
              await replyNotRegistration({ replyToken, userId });
            }
          } catch (error) {
            console.error("Error occurred while handling device connection:", error);
            await replyMessage({
              replyToken,
              message: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
            });
          }
          break;
        }

        case "การยืม-คืนอุปกรณ์": {
          console.log("Handling borrow equipment request for user:", userId);
          const userData = await safeApiCall(() => getUser(userId));
          if (userData) {
            await replyMenuBorrowequipment({ replyToken, userData });
          } else {
            await replyNotRegistration({ replyToken, userId });
          }
          break;
        }

        case "แจ้งเตือน": {
          console.log("Handling notification request");
          await replyNotification({
            replyToken,
            message: "ระบบแจ้งเตือนกำลังทำงาน",
          });
          break;
        }

        case "SOS": {
          console.log("Handling emergency SOS");
          await replyNotificationSOS({
            replyToken,
            message: "มีการแจ้งเตือนฉุกเฉิน! โปรดตรวจสอบด่วน",
          });
          break;
        }

        case "แบบสอบถาม": {
          console.log("Handling survey request for user:", userId);
          const userData = await safeApiCall(() => getUser(userId));
          if (userData) {
            await replyNotificationSendDocQuery({
              replyToken,
              userData,
            });
          } else {
            await replyNotRegistration({ replyToken, userId });
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
    } else if (type === "postback") {
      // เพิ่มการจัดการสำหรับ postback event
      const postbackData = postback?.data;
      console.log(`Received postback: "${postbackData}" from user: ${userId}`);

      // แปลงข้อมูล postback ที่ส่งมาในรูปแบบ query string
      const params = new URLSearchParams(postbackData);
      const userLineId = params.get("userLineId");
      const takecarepersonId = params.get("takecarepersonId");
      const typeParam = params.get("type");

      if (typeParam === "alert") {
        if (!userLineId || !takecarepersonId) {
          await replyMessage({
            replyToken,
            message: "ข้อมูล postback ไม่ครบถ้วน"
          });
        } else {
          await replyNotificationPostback({
            // เนื่องจาก type definition ของ replyNotificationPostback ระบุ userId เป็น number
            // แต่จาก postback data ที่ได้รับเป็น string (LINE user id) จึงใช้ type assertion เพื่อบังคับให้ผ่าน error
            // (แนะนำให้ปรับ type definition ใน replyNotificationPostback ให้ userId เป็น string ถ้าเหมาะสม)
            userId: userLineId as unknown as number,
            takecarepersonId: Number(takecarepersonId),
            type: typeParam,
            message: "รับคำขอความช่วยเหลือเพิ่มเติมแล้ว",
            replyToken
          });
        }
      } else {
        await replyMessage({
          replyToken,
          message: "postback action ไม่ถูกต้องหรือไม่รองรับ"
        });
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
