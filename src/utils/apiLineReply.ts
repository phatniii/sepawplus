import axios from 'axios';
import moment from 'moment';

const WEB_API = process.env.WEB_API_URL;
const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message/reply';
const LINE_PUSH_MESSAGING_API = 'https://api.line.me/v2/bot/message/push';
const LINE_PROFILE_API = 'https://api.line.me/v2/bot/profile';
const LINE_HEADER = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN_LINE}`, // Replace with your LINE Channel Access Token
};

interface ReplyMessage {
    replyToken: string;
    message   : string;
}
interface ReplyRegistration {
    replyToken: string;
    userId    : string;
}
interface ReplyNotification {
    replyToken : string;
    message    : string;
    groupLineId   ?: string | null;
}
interface ReplyNotificationPostback {
    userId          : number;
    takecarepersonId: number;
    type            : string;
    message         : string;
    replyToken      : string;
}
interface ReplyNotificationPostbackTemp{
    userId          : number;
    takecarepersonId : number;
    type             : string;
    message           : string;
    replyToken          : string;
}
interface ReplyUserData {
    replyToken: string;
    userData: {
        users_id       : string;
        users_line_id  : string;
        users_fname    : string;
        users_sname    : string;
        users_pin      : string;
        users_number   : string;
        users_moo      : string;
        users_road     : string;
        users_tubon    : string;
        users_amphur   : string;
        users_province : string;
        users_postcode : string;
        users_tel1     : string;
        users_status_id: {
            status_name: string;
        }
    };
    userTakecarepersonData?: any;
}
interface ReplySettingData {
    replyToken: string;
    userData: {
        users_id       : string;
        users_line_id  : string;
        users_fname    : string;
        users_sname    : string;
        users_pin      : string;
        users_number   : string;
        users_moo      : string;
        users_road     : string;
        users_tubon    : string;
        users_amphur   : string;
        users_province : string;
        users_postcode : string;
        users_tel1     : string;
        users_status_id: {
            status_name: string;
        }
    };
    userTakecarepersonData?: any;
    safezoneData?: any;
    temperatureSettingData?: any;
}
interface ReplyLocationData {
    replyToken: string;
    userData: {
        users_id       : string;
        users_line_id  : string;
        users_fname    : string;
        users_sname    : string;
        users_pin      : string;
        users_number   : string;
        users_moo      : string;
        users_road     : string;
        users_tubon    : string;
        users_amphur   : string;
        users_province : string;
        users_postcode : string;
        users_tel1     : string;
        users_status_id: {
            status_name: string;
        }
    };
    userTakecarepersonData?: any;
    safezoneData?: any;
    locationData?: any;
}

const layoutBoxBaseline = (label: string, text: string, flex1 = 2, flex2 = 5) => {
    return {
        type: "box",
        layout: "baseline",
        contents: [
            {
                type: "text",
                text: label,
                flex: flex1,
                size: "sm",
                color: "#AAAAAA"
            },
            {
                type: "text",
                text: text,
                flex: flex2,
                size: "sm",
                color: "#666666",
                wrap: true
            }
        ]
    }
}



export const getUserProfile = async (userId: string) => {
    try {
        const response = await axios.get(`${LINE_PROFILE_API}/${userId}`, { headers: LINE_HEADER });
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
    }
}

export const replyMessage = async ({
    replyToken,
    message
}: ReplyMessage) => {
    try {
        const requestData = {
            replyToken,
            messages: [
                {
                    type: 'text',
                    text: message,
                },
            ],
        };

        const response = await axios.post(LINE_MESSAGING_API, requestData, { headers: LINE_HEADER });
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
    }
}

export const pushMessage = async ({
    replyToken,
    message
}: ReplyMessage) => {
    try {
        const requestData = {
            to:replyToken,
            messages: [
                {
                    type: 'text',
                    text: message,
                },
            ],
        };

        const response = await axios.post(LINE_PUSH_MESSAGING_API, requestData, { headers: LINE_HEADER });
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
    }
}

export const replyRegistration = async ({
    replyToken,
    userId
}: ReplyRegistration) => {
    try {
        const profile = await getUserProfile(userId);
        const requestData = {
            replyToken,
            messages: [
                {
                    type    : "flex",
                    altText : "ลงทะเบียน",
                    contents: {
                        type: "bubble",
                        body: {
                            type    : "box",
                            layout  : "vertical",
                            contents: [
                                {
                                    type  : "text",
                                    text  : "ลงทะเบียน",
                                    color : "#FFB400",
                                    size  : "xl",
                                    weight: "bold",
                                    wrap  : true
                                },
                                {
                                    type  : "text",
                                    text  : `คุณ ${profile.displayName}`,
                                    size  : "sm",
                                    color : "#555555",
                                    wrap  : true,
                                    margin: "sm"
                                },
                                {
                                    type  : "separator",
                                    margin: "xxl"
                                },
                                {
                                    type  : "button",
                                    style : "primary",
                                    height: "sm",
                                    margin: "xxl",
                                    action: {
                                        type : "uri",
                                        label: "ยืนยันลงทะเบียน",
                                        uri  : `${WEB_API}/registration?auToken=${userId}`
                                    }
                                },
                            ]
                        }
                    }
                }
            ],
        };
       await axios.post(LINE_MESSAGING_API, requestData, { headers:LINE_HEADER });
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
    }
}

export const replyNotRegistration = async ({
    replyToken,
    userId
}: ReplyRegistration) => {
    try {
        const profile = await getUserProfile(userId);
        const requestData = {
            replyToken,
            messages: [
                {
                    type    : "flex",
                    altText : "ลงทะเบียน",
                    contents: {
                        type: "bubble",
                        body: {
                            type    : "box",
                            layout  : "vertical",
                            contents: [
                                {
                                    type  : "text",
                                    text  : "ลงทะเบียน",
                                    color : "#FFB400",
                                    size  : "xl",
                                    weight: "bold",
                                    wrap  : true
                                },
                                {
                                    type  : "text",
                                    text  : `คุณ ${profile.displayName} ยังไม่ได้ลงทะเบียน กรูณาลงทะเบียนก่อนเข้าใช้งาน`,
                                    size  : "sm",
                                    color : "#555555",
                                    wrap  : true,
                                    margin: "sm"
                                },
                                {
                                    type  : "separator",
                                    margin: "xxl"
                                },
                                {
                                    type  : "button",
                                    style : "primary",
                                    height: "sm",
                                    margin: "xxl",
                                    action: {
                                        type : "uri",
                                        label: "ยืนยันลงทะเบียน",
                                        uri  : `${WEB_API}/registration?auToken=${userId}`
                                    }
                                },
                            ]
                        }
                    }
                }
            ],
        };
       await axios.post(LINE_MESSAGING_API, requestData, { headers:LINE_HEADER });
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
    }
}

export const replyMenuBorrowequipment = async ({
    replyToken,
    userData
}: ReplyUserData) => {
    try {
        const profile = await getUserProfile(userData.users_line_id);
        const requestData = {
            replyToken,
            messages: [
                {
                    type    : "flex",
                    altText : "การยืม การคืนครุภัณฑ์",
                    contents: {
                        type: "bubble",
                        body: {
                            type    : "box",
                            layout  : "vertical",
                            contents: [
                                {
                                    type  : "text",
                                    text  : "การยืม การคืนครุภัณฑ์",
                                    color : "#FFB400",
                                    size  : "xl",
                                    weight: "bold",
                                    wrap  : true
                                },
                                {
                                    type  : "text",
                                    text  : `คุณ ${profile.displayName}`,
                                    size  : "sm",
                                    color : "#555555",
                                    wrap  : true,
                                    margin: "sm"
                                },
                                {
                                    type  : "separator",
                                    margin: "xxl"
                                },
                                {
                                    type  : "button",
                                    style : "primary",
                                    height: "sm",
                                    margin: "xxl",
                                    action: {
                                        type : "uri",
                                        label: "การยืมครุภัณฑ์",
                                        uri  : `${WEB_API}/borrowequipment/borrow?auToken=${userData.users_line_id}`
                                    }
                                },
                                {
                                    type  : "button",
                                    style : "primary",
                                    height: "sm",
                                    margin: "xxl",
                                    color : "#4477CE",
                                    action: {
                                        type : "uri",
                                        label: "การคืนครุภัณฑ์",
                                        uri  : `${WEB_API}/borrowequipment/return_of?auToken=${userData.users_line_id}`
                                    }
                                },
                            ]
                        }
                    }
                }
            ],
        };
       await axios.post(LINE_MESSAGING_API, requestData, { headers:LINE_HEADER });
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
    }
}
export const replyConnection = async ({
    replyToken,
    userData,
    userTakecarepersonData
}: ReplyUserData) => {
    try {
        const profile = await getUserProfile(userData.users_line_id);
        const requestData = {
            replyToken,
            messages: [
                {
                    type    : "flex",
                    altText : "การเชื่อมต่อนาฬิกา",
                    contents: {
                        type: "bubble",
                        body: {
                            type    : "box",
                            layout  : "vertical",
                            contents: [
                                {
                                    type  : "text",
                                    text  : "การเชื่อมต่อนาฬิกา",
                                    color : "#FFB400",
                                    size  : "xl",
                                    weight: "bold",
                                    wrap  : true
                                },
                                {
                                    type  : "text",
                                    text  : `คุณ ${profile.displayName}`,
                                    size  : "sm",
                                    color : "#555555",
                                    wrap  : true,
                                    margin: "sm"
                                },
                                {
                                    type  : "separator",
                                    margin: "xxl"
                                },
                                {
                                    type  : "text",
                                    text  : `ข้อมูลผู้ดูแล`,
                                    size  : "md",
                                    color : "#555555",
                                    wrap  : true,
                                    margin: "sm"
                                },
                                {
                                    type: "box",
                                    layout: "vertical",
                                    margin: "xxl",
                                    spacing: "sm",
                                    contents: [
                                        layoutBoxBaseline("ชื่อ-สกุล", `${userData.users_fname} ${userData.users_sname}`, 4, 5),
                                        layoutBoxBaseline("เบอร์โทร", `${userData.users_tel1 || '-'}`, 4, 5),
                                    ]

                                },
                                {
                                    type  : "text",
                                    text  : `ข้อมูลผู้สูงอายุ`,
                                    size  : "md",
                                    color : "#555555",
                                    wrap  : true,
                                    margin: "sm"
                                },
                                {
                                    type: "box",
                                    layout: "vertical",
                                    margin: "xxl",
                                    spacing: "sm",
                                    contents: [
                                        layoutBoxBaseline("ชื่อ-สกุล", `${userTakecarepersonData.takecare_fname} ${userTakecarepersonData.takecare_sname}`, 4, 5),
                                        layoutBoxBaseline("เบอร์โทร", `${userTakecarepersonData.takecare_tel1 || '-'}`, 4, 5),
                                    ]

                                },
                                {
                                    type: "box",
                                    layout: "vertical",
                                    margin: "xxl",
                                    spacing: "sm",
                                    contents: [
                                        layoutBoxBaseline("ID", `${userData.users_id}`),
                                        layoutBoxBaseline("PIN", `${userData.users_pin}`),
                                    ]
                                },
                                // {
                                //     type  : "button",
                                //     style : "primary",
                                //     height: "sm",
                                //     margin: "xxl",
                                //     action: {
                                //         type : "uri",
                                //         label: "ตั้งค่าการเชื่อมต่อนาฬิกา",
                                //         uri  : `${WEB_API}/connection?auToken=${userData.users_line_id}`
                                //     }
                                // },
                            ]
                        }
                    }
                }
            ],
        };
       await axios.post(LINE_MESSAGING_API, requestData, { headers:LINE_HEADER });
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
    }
}
export const replyLocation = async ({
    replyToken,
    userData,
    safezoneData,
    userTakecarepersonData,
    locationData
}: ReplyLocationData) => {
    try {
        // const profile = await getUserProfile(userData.users_line_id);
        let latitude = Number(safezoneData.safez_latitude)
        let longitude = Number(safezoneData.safez_longitude)
        if(locationData){
            latitude = Number(locationData.locat_latitude)
            longitude = Number(locationData.locat_longitude)
        }
        const requestData = {
            replyToken,
            messages: [
                {
                    type     : "location",
                    title    : `ตำแหน่งปัจจุบันของผู้สูงอายุ ${userTakecarepersonData.takecare_fname} ${userTakecarepersonData.takecare_sname}`,
                    address  : `สถานที่ตั้งปัจจุบันของผู้สูงอายุ`,
                    latitude : latitude,
                    longitude: longitude
                },
                {
                    type    : "flex",
                    altText : "ตำแหน่งปัจจุบัน",
                    contents: {
                        type: "bubble",
                        body: {
                            type    : "box",
                            layout  : "vertical",
                            contents: [
                                {
                                    type  : "text",
                                    text  : "ตำแหน่งปัจจุบัน",
                                    color : "#FFB400",
                                    size  : "xl",
                                    weight: "bold",
                                    wrap  : true
                                },
                                {
                                    type  : "separator",
                                    margin: "xxl"
                                },
                                {
                                    type  : "text",
                                    text  : `ข้อมูลผู้สูงอายุ`,
                                    size  : "md",
                                    color : "#555555",
                                    wrap  : true,
                                    margin: "sm"
                                },
                                {
                                    type: "box",
                                    layout: "vertical",
                                    margin: "xxl",
                                    spacing: "sm",
                                    contents: [
                                        layoutBoxBaseline("ชื่อ-สกุล", `${userTakecarepersonData.takecare_fname} ${userTakecarepersonData.takecare_sname}`),
                                        layoutBoxBaseline("latitude", `${latitude}`),
                                        layoutBoxBaseline("longitude", `${longitude}`),
                                    ]

                                },
                                {
                                    type  : "button",
                                    style : "primary",
                                    height: "sm",
                                    margin: "xxl",
                                    color : "#4477CE",
                                    action: {
                                        type : "uri",
                                        label: `โทร ${userTakecarepersonData.takecare_tel1 || '-'}`,
                                        uri  : `tel:${userTakecarepersonData.takecare_tel1 || '-'}`
                                    }
                                },
                                { 
                                    type  : "button",
                                    style : "primary",
                                    height: "sm",
                                    margin: "xxl",
                                    action: {
                                        type : "uri",
                                        label: "ดูแผนที่จากระบบ",
                                        uri  : `${WEB_API}/location?auToken=${userData.users_line_id}&idsafezone=${safezoneData.safezone_id}&idlocation=${locationData ? locationData.location_id : ''}`
                                    }
                                },
                            ]
                        }
                    }
                }
            ],
        };
       await axios.post(LINE_MESSAGING_API, requestData, { headers:LINE_HEADER });
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
    }
}
export const replySetting = async ({
  replyToken,
  userData,
  userTakecarepersonData,
  safezoneData,
  temperatureSettingData // เพิ่มข้อมูลตั้งค่าอุณหภูมิ (ถ้ามี)
}: ReplySettingData & { temperatureSettingData?: any }) => {
  try {
    // ค่า default
    let r1 = 0;
    let r2 = 0;
    let idsafezone = 0;
    let maxTemperature = 0; // ค่า default อุณหภูมิ
    let idSetting = 0; // รหัส setting อุณหภูมิ

    if (safezoneData) {
      r1 = safezoneData.safez_radiuslv1 || 0;
      r2 = safezoneData.safez_radiuslv2 || 0;
      idsafezone = safezoneData.safezone_id || 0;
    }

    if (temperatureSettingData) {
      maxTemperature = temperatureSettingData.max_temperature || 37;
      idSetting = temperatureSettingData.setting_id || 0;
    }

    const requestData = {
      replyToken,
      messages: [
        {
          type: "flex",
          altText: "ตั้งค่าเขตปลอดภัยและอุณหภูมิ",
          contents: {
            type: "bubble",
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "ตั้งค่าเขตปลอดภัยและอุณหภูมิ",
                  color: "#FFB400",
                  size: "xl",
                  weight: "bold",
                  wrap: true
                },
                {
                  type: "separator",
                  margin: "xxl"
                },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "xxl",
                  spacing: "sm",
                  contents: [
                    {
                      type: "box",
                      layout: "baseline",
                      contents: [
                        { type: "text", text: "ชื่อ", flex: 2, weight: "bold" },
                        { type: "text", text: `${userTakecarepersonData.takecare_fname} ${userTakecarepersonData.takecare_sname}`, flex: 3, wrap: true }
                      ]
                    },
                    {
                      type: "box",
                      layout: "baseline",
                      contents: [
                        { type: "text", text: "รัศมี ชั้นที่ 1", flex: 2, weight: "bold" },
                        { type: "text", text: `${r1} ม.`, flex: 3 }
                      ]
                    },
                    {
                      type: "box",
                      layout: "baseline",
                      contents: [
                        { type: "text", text: "รัศมี ชั้นที่ 2", flex: 2, weight: "bold" },
                        { type: "text", text: `${r2} ม.`, flex: 3 }
                      ]
                    },
                    {
                      type: "box",
                      layout: "baseline",
                      contents: [
                        { type: "text", text: "อุณหภูมิสูงสุด", flex: 2, weight: "bold" },
                        { type: "text", text: `${maxTemperature} °C`, flex: 3 }
                      ]
                    },
                  ]
                },
                {
                  type: "button",
                  style: "primary",
                  height: "sm",
                  margin: "xxl",
                  action: {
                    type: "uri",
                    label: "ตั้งค่าเขตปลอดภัย",
                    uri: `${WEB_API}/setting?auToken=${userData.users_line_id}&idsafezone=${idsafezone}`
                  }
                },
                {
                  type: "button",
                  style: "primary",
                  height: "sm",
                  margin: "xxl",
                  color: "#4477CE",
                  action: {
                    type: "uri",
                    label: "ตั้งค่าอุณหภูมิร่างกาย",
                    uri: `${WEB_API}/settingTemp?auToken=${userData.users_line_id}&idsetting=${idSetting || ''}`
                  }
                }
              ]
            }
          }
        }
      ]
    };

    await axios.post(LINE_MESSAGING_API, requestData, { headers: LINE_HEADER });

  } catch (error) {
    if (error instanceof Error) {
      console.error("replySetting error:", error.message);
    }
  }
};
export const replyUserInfo = async ({
    replyToken,
    userData,
    userTakecarepersonData
}: ReplyUserData) => {
    try {
       // const profile = await getUserProfile(userData.users_line_id);
        let contentTakecareperson = [
            layoutBoxBaseline("ข้อมูล", 'ยังไม่ได้เพิ่มข้อมูลผู้สูงอายุ'),
        ]
   
        if (userTakecarepersonData) {
            contentTakecareperson = [
                layoutBoxBaseline("ชื่อ-สกุล", `${userTakecarepersonData.takecare_fname} ${userTakecarepersonData.takecare_sname}`, 4, 5),
                layoutBoxBaseline("วันเดือนปีเกิด", `${moment(userTakecarepersonData.takecare_birthday).format('DD/MM/YYYY')}`, 4, 5),
                layoutBoxBaseline("ที่อยู่", `${userTakecarepersonData.takecare_number || '-'} หมู่ ${userTakecarepersonData.takecare_moo || '-'}`, 4, 5),
                layoutBoxBaseline("ถนน", `${userTakecarepersonData.takecare_road || '-'}`, 4, 5),
                layoutBoxBaseline("ตำบล", `${userTakecarepersonData.takecare_tubon || '-'}`, 4, 5),
                layoutBoxBaseline("อำเภอ", `${userTakecarepersonData.takecare_amphur || '-'}`, 4, 5),
                layoutBoxBaseline("จังหวัด", `${userTakecarepersonData.takecare_province || '-'}`, 4, 5),
                layoutBoxBaseline("รหัสไปรษณีย์", `${userTakecarepersonData.takecare_postcode || '-'}`, 4, 5),
                layoutBoxBaseline("เบอร์โทร", `${userTakecarepersonData.takecare_tel1 || '-'}`, 4, 5),
                layoutBoxBaseline("โรคประจำตัว", `${userTakecarepersonData.takecare_disease || '-'}`, 4, 5),
                layoutBoxBaseline("ยาที่ใช้ประจำ", `${userTakecarepersonData.takecare_drug || '-'}`, 4, 5),
            ]
        }

        const requestData = {
            replyToken,
            messages: [
                {
                    type    : "flex",
                    altText : "ข้อมูลผู้ใช้งาน",
                    contents: {
                        type: "bubble",
                        body: {
                            type    : "box",
                            layout  : "vertical",
                            contents: [
                                {
                                    type  : "text",
                                    text  : "ข้อมูลผู้ใช้งาน",
                                    color : "#FFB400",
                                    size  : "xl",
                                    weight: "bold",
                                    wrap  : true
                                },
                                {
                                    type  : "separator",
                                    margin: "xxl"
                                },
                                {
                                    type  : "text",
                                    text  : `ข้อมูลผู้ดูแล`,
                                    size  : "md",
                                    color : "#555555",
                                    wrap  : true,
                                    margin: "sm"
                                },
                                
                                {
                                    type: "box",
                                    layout: "vertical",
                                    margin: "xxl",
                                    spacing: "sm",
                                    contents: [
                                        layoutBoxBaseline("ชื่อ-สกุล", `${userData.users_fname} ${userData.users_sname}`, 4, 5),
                                        layoutBoxBaseline("ที่อยู่", `${userData.users_number || '-'} หมู่ ${userData.users_moo || '-'}`, 4, 5),
                                        layoutBoxBaseline("ถนน", `${userData.users_road || '-'}`, 4, 5),
                                        layoutBoxBaseline("ตำบล", `${userData.users_tubon || '-'}`, 4, 5),
                                        layoutBoxBaseline("อำเภอ", `${userData.users_amphur || '-'}`, 4, 5),
                                        layoutBoxBaseline("จังหวัด", `${userData.users_province || '-'}`, 4, 5),
                                        layoutBoxBaseline("รหัสไปรษณีย์", `${userData.users_postcode || '-'}`, 4, 5),
                                        layoutBoxBaseline("เบอร์โทร", `${userData.users_tel1 || '-'}`, 4, 5),
                                    ]

                                },
                                {
                                    type  : "separator",
                                    margin: "xxl"
                                },
                                {
                                    type  : "text",
                                    text  : `ข้อมูลผู้สูงอายุ`,
                                    size  : "md",
                                    color : "#555555",
                                    wrap  : true,
                                    margin: "sm"
                                },
                                
                                {
                                    type: "box",
                                    layout: "vertical",
                                    margin: "xxl",
                                    spacing: "sm",
                                    contents: [
                                        ...contentTakecareperson
                                    ]

                                },

                                
                                {
                                    type  : "button",
                                    style : "primary",
                                    height: "sm",
                                    margin: "xxl",
                                    action: {
                                        type : "uri",
                                        label: "ตั้งค่าข้อมูลผู้ดูแล",
                                        uri  : `${WEB_API}/userinfo/cuserinfo?auToken=${userData.users_line_id}`
                                    },
                                   
                                },
                                {
                                    type  : "button",
                                    style : "primary",
                                    height: "sm",
                                    margin: "xxl",
                                    color : "#4477CE",
                                    action: {
                                        type : "uri",
                                        label: "ตั้งค่าข้อมูลผู้สูงอายุ",
                                        uri  : userTakecarepersonData ? `${WEB_API}/userinfo/puserinfo?auToken=${userData.users_line_id}` : `${WEB_API}/elderly_registration?auToken=${userData.users_line_id}`
                                    }
                                }
                                
                            ]
                        }
                    }
                }
            ],
        };

       await axios.post(LINE_MESSAGING_API, requestData, { headers:LINE_HEADER });
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
    }
}

export const replyUserData = async ({
    replyToken,
    userData
}: ReplyUserData) => {

    try {
        const profile = await getUserProfile(userData.users_line_id);
        const requestData = { 
            replyToken,
            messages: [
                {
                    type    : "flex",
                    altText : "ลงทะเบียน",
                    contents: {
                        type: "bubble",
                        body: {
                            type    : "box",
                            layout  : "vertical",
                            contents: [
                                {
                                    type  : "text",
                                    text  : "ข้อมูลลงทะเบียน",
                                    color : "#FFB400",
                                    size  : "xl",
                                    weight: "bold",
                                    wrap  : true
                                },
                                {
                                    type  : "text",
                                    text  : `คุณ ${profile.displayName}`,
                                    size  : "sm",
                                    color : "#555555",
                                    wrap  : true,
                                    margin: "sm"
                                },
                                {
                                    type  : "separator",
                                    margin: "xxl"
                                },
                                {
                                    type: "box",
                                    layout: "vertical",
                                    margin: "xxl",
                                    spacing: "sm",
                                    contents: [
                                        layoutBoxBaseline("ชื่อ", `${userData.users_fname} ${userData.users_sname}`),
                                        layoutBoxBaseline("Pin", userData.users_pin.toString()),
                                        layoutBoxBaseline("สถานะ", userData.users_status_id.status_name),
                                        layoutBoxBaseline("ที่อยู่", `${userData.users_number || '-'} หมู่ ${userData.users_moo || '-'}`),
                                        layoutBoxBaseline("ถนน", `${userData.users_road || '-'}`),
                                        layoutBoxBaseline("ตำบล", `${userData.users_tubon || '-'}`),
                                        layoutBoxBaseline("อำเภอ", `${userData.users_amphur || '-'}`),
                                        layoutBoxBaseline("จังหวัด", `${userData.users_province || '-'}`),
                                        layoutBoxBaseline("รหัสไปรษณีย์", `${userData.users_postcode || '-'}`),
                                        layoutBoxBaseline("เบอร์โทรศัพท์", `${userData.users_tel1 || '-'}`),
                                        layoutBoxBaseline("LINE ID", userData.users_line_id),
                                    ]

                                },
                                {
                                    type  : "button",
                                    style : "primary",
                                    height: "sm",
                                    margin: "xxl",
                                    action: {
                                        type : "uri",
                                        label: "ลงทะเบียนผู้สูงอายุ",
                                        uri  : `${WEB_API}/elderly_registration?auToken=${userData.users_line_id}`
                                    }
                                },
                            ]
                        }
                    }
                }
            ],
        };
       await axios.post(LINE_MESSAGING_API, requestData, { headers:LINE_HEADER });
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
    }
}

export const replyNotification = async ({
    replyToken,
    message
}: ReplyNotification) => {
    try {
        const requestData = {
            to:replyToken,
            messages: [
                {
                    type    : "flex",
                    altText : "แจ้งเตือน",
                    contents: {
                        type: "bubble",
                        body: {
                            type    : "box",
                            layout  : "vertical",
                            contents: [
                                {
                                    type    : "text",
                                    text    : " ",
                                    contents: [
                                        {
                                            type      : "span",
                                            text      : "แจ้งเตือนเขตปลอดภัย",
                                            color     : "#FC0303",
                                            size      : "xl",
                                            weight    : "bold",
                                            decoration: "none"
                                        },
                                        {
                                            type      : "span",
                                            text      : " ",
                                            size      : "xxl",
                                            decoration: "none"
                                        }
                                    ]
                                },
                                {
                                    type  : "separator",
                                    margin: "md"
                                },
                                {
                                    type  : "text",
                                    text  : " ",
                                    wrap : true,
                                    lineSpacing: "5px",
                                    margin: "md",
                                    contents:[
                                        {
                                            type      : "span",
                                            text      : message,
                                            color     : "#555555",
                                            size      : "md",
                                            // decoration: "none",
                                            // wrap      : true
                                        },
                                        {
                                            type      : "span",
                                            text      : " ",
                                            size      : "xl",
                                            decoration: "none"
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                }
            ],
        };
       await axios.post(LINE_PUSH_MESSAGING_API, requestData, { headers:LINE_HEADER });
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
    }
}

export const replyNotificationPostback = async ({
    userId,
    takecarepersonId,
    type,
    message,
    replyToken,
    
}: ReplyNotificationPostback ) => {
    try {
        const requestData = {
            to:replyToken,
            messages: [
                {
                    type    : "flex",
                    altText : "แจ้งเตือน",
                    contents: {
                        type: "bubble",
                        body: {
                            type    : "box",
                            layout  : "vertical",
                            contents: [
                                {
                                    type    : "text",
                                    text    : " ",
                                    contents: [
                                        {
                                            type      : "span",
                                            text      : "แจ้งเตือนเขตปลอดภัย",
                                            color     : "#FC0303",
                                            size      : "xl",
                                            weight    : "bold",
                                            decoration: "none"
                                        },
                                        {
                                            type      : "span",
                                            text      : " ",
                                            size      : "xxl",
                                            decoration: "none"
                                        }
                                    ]
                                },
                                {
                                    type  : "separator",
                                    margin: "md"
                                },
                                {
                                    type  : "text",
                                    text  : " ",
                                    wrap : true,
                                    lineSpacing: "5px",
                                    margin: "md",
                                    contents:[
                                        {
                                            type      : "span",
                                            text      : message,
                                            color     : "#555555",
                                            size      : "md",
                                            // decoration: "none",
                                            // wrap      : true
                                        },
                                        {
                                            type      : "span",
                                            text      : " ",
                                            size      : "xl",
                                            decoration: "none"
                                        }
                                    ]
                                },
                                {
                                    type  : "button",
                                    style : "primary",
                                    height: "sm",
                                    margin: "xxl",
                                    action: {
                                        type : "postback",
                                        label: "ส่งความช่วยเหลือเพิ่มเติม",
                                        data : `userLineId=${replyToken}&takecarepersonId=${takecarepersonId}&type=${type}`,
                                    }
                                },
                                { 
                                    type  : "text",
                                    text  : " ",
                                    wrap  : true,
                                    lineSpacing: "5px",
                                    margin: "md",
                                    contents:[
                                        {
                                            type      : "span",
                                            text      : "*หมาย: ข้าพเจ้ายินยอมเปิดเผยข้อมูลตำแหน่งปัจจุบันของผู้สูงอายุ",
                                            color     : "#FC0303",
                                            size      : "md",
                                            // decoration: "none",
                                            // wrap      : true
                                        },
                                        {
                                            type      : "span",
                                            text      : " ",
                                            size      : "xl",
                                            decoration: "none"
                                        }
                                    ]
                                },
                            ]
                        }
                    }
                }
            ],
        };
       await axios.post(LINE_PUSH_MESSAGING_API, requestData, { headers:LINE_HEADER });
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
    }
}

export const replyNotificationSOS = async ({
    replyToken,
    message
}: ReplyNotification) => {
    try {

        const requestData = {
            to:replyToken,
            messages: [
                {
                    type    : "flex",
                    altText : "แจ้งเตือน",
                    contents: {
                        type: "bubble",
                        body: {
                            type    : "box",
                            layout  : "vertical",
                            contents: [
                                {
                                    type    : "text",
                                    text    : " ",
                                    contents: [
                                        {
                                            type      : "span",
                                            text      : "แจ้งเตือนฉุกเฉิน",
                                            color     : "#FC0303",
                                            size      : "xl",
                                            weight    : "bold",
                                            decoration: "none"
                                        },
                                        {
                                            type      : "span",
                                            text      : " ",
                                            size      : "xxl",
                                            decoration: "none"
                                        }
                                    ]
                                },
                                {
                                    type  : "separator",
                                    margin: "md"
                                },
                                {
                                    type  : "text",
                                    text  : " ",
                                    wrap : true,
                                    lineSpacing: "5px",
                                    margin: "md",
                                    contents:[
                                        {
                                            type      : "span",
                                            text      : message,
                                            color     : "#555555",
                                            size      : "md",
                                            // decoration: "none",
                                            // wrap      : true
                                        },
                                        {
                                            type      : "span",
                                            text      : " ",
                                            size      : "xl",
                                            decoration: "none"
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                }
            ],
        };
       await axios.post(LINE_PUSH_MESSAGING_API, requestData, { headers:LINE_HEADER });
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
    }
}

export const replyNotificationSendDocQuery = async ({
    replyToken,
    userData
}: {
     replyToken: string;
     userData  : any;
}) => {
    try {

        const requestData = {
            to:replyToken,
            messages: [
                {
                    type    : "flex",
                    altText : "แจ้งเตือน",
                    contents: {
                        type: "bubble",
                        body: {
                            type    : "box",
                            layout  : "vertical",
                            contents: [
                                {
                                    type    : "text",
                                    text    : " ",
                                    contents: [
                                        {
                                            type      : "span",
                                            text      : "แบบสอบถาม",
                                            color     : "#FC0303",
                                            size      : "xl",
                                            weight    : "bold",
                                            decoration: "none"
                                        },
                                        {
                                            type      : "span",
                                            text      : " ",
                                            size      : "xxl",
                                            decoration: "none"
                                        }
                                    ]
                                },
                                {
                                    type  : "separator",
                                    margin: "md"
                                },
                                {
                                    type  : "text",
                                    text  : " ",
                                    wrap : true,
                                    lineSpacing: "5px",
                                    margin: "md",
                                    contents:[
                                        {
                                            type      : "span",
                                            text      : "กรุณาตอบแบบสอบถามเพื่อให้ข้อมูลที่ถูกต้อง",
                                            color     : "#555555",
                                            size      : "md",
                                            // decoration: "none",
                                            // wrap      : true
                                        },
                                       
                                        {
                                            type      : "span",
                                            text      : " ",
                                            size      : "xl",
                                            decoration: "none"
                                        }
                                    ]
                                },
                                {
                                    type  : "button",
                                    style : "primary",
                                    height: "sm",
                                    margin: "xxl",
                                    action: {
                                        type : "uri",
                                        label: "ตอบแบบสอบถาม",
                                        uri  : `${WEB_API}/questionnaire?id=${userData.borrow_id}`
                                    }
                                },
                            ]
                        }
                    }
                }
            ],
        };
       await axios.post(LINE_PUSH_MESSAGING_API, requestData, { headers:LINE_HEADER });
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
    }
}
export const replyNotificationPostbackTemp = async ({
    userId,
    takecarepersonId,
    type,
    message,
    replyToken,
    
}: ReplyNotificationPostbackTemp ) => {
    try {
        const requestData = {
            to:replyToken,
            messages: [
                {
                    type    : "flex",
                    altText : "แจ้งเตือน",
                    contents: {
                        type: "bubble",
                        body: {
                            type    : "box",
                            layout  : "vertical",
                            contents: [
                                {
                                    type    : "text",
                                    text    : " ",
                                    contents: [
                                        {
                                            type      : "span",
                                            text      : "แจ้งอุณหภูมิร่างกายสูง",
                                            color     : "#FC0303",
                                            size      : "xl",
                                            weight    : "bold",
                                            decoration: "none"
                                        },
                                        {
                                            type      : "span",
                                            text      : " ",
                                            size      : "xxl",
                                            decoration: "none"
                                        }
                                    ]
                                },
                                {
                                    type  : "separator",
                                    margin: "md"
                                },
                                {
                                    type  : "text",
                                    text  : " ",
                                    wrap : true,
                                    lineSpacing: "5px",
                                    margin: "md",
                                    contents:[
                                        {
                                            type      : "span",
                                            text      : message,
                                            color     : "#555555",
                                            size      : "md",
                                            // decoration: "none",
                                            // wrap      : true
                                        },
                                        {
                                            type      : "span",
                                            text      : " ",
                                            size      : "xl",
                                            decoration: "none"
                                        }
                                    ]
                                },
                                {
                                    type  : "button",
                                    style : "primary",
                                    height: "sm",
                                    margin: "xxl",
                                    action: {
                                        type : "postback",
                                        label: "ส่งความช่วยเหลือเพิ่มเติม",
                                        data : `userLineId=${replyToken}&takecarepersonId=${takecarepersonId}&type=${type}`,
                                    }
                                },
                                { 
                                    type  : "text",
                                    text  : " ",
                                    wrap  : true,
                                    lineSpacing: "5px",
                                    margin: "md",
                                    contents:[
                                        {
                                            type      : "span",
                                            text      : "*หมาย: ข้าพเจ้ายินยอมเปิดเผยข้อมูลตำแหน่งปัจจุบันของผู้สูงอายุ",
                                            color     : "#FC0303",
                                            size      : "md",
                                            // decoration: "none",
                                            // wrap      : true
                                        },
                                        {
                                            type      : "span",
                                            text      : " ",
                                            size      : "xl",
                                            decoration: "none"
                                        }
                                    ]
                                },
                            ]
                        }
                    }
                }
            ],
        };
       await axios.post(LINE_PUSH_MESSAGING_API, requestData, { headers:LINE_HEADER });
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
    }
} 