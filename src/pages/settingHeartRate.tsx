'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'

import Spinner from 'react-bootstrap/Spinner'
import Container from 'react-bootstrap/Container'
import ButtonState from '@/components/Button/ButtonState'
import ModalAlert from '@/components/Modals/ModalAlert'
import RangeSlider from '@/components/RangeSlider/RangeSlider'
import { encrypt } from '@/utils/helpers'
import Card from 'react-bootstrap/Card'
import Badge from 'react-bootstrap/Badge'


interface DataUserState {
  isLogin: boolean
  userData: any | null
  takecareData: any | null
}

const SettingHeartRate = () => {
  const router = useRouter()

  const [alert, setAlert] = useState({ show: false, message: '' })
  const [isLoading, setLoading] = useState(false)
  const [dataUser, setDataUser] = useState<DataUserState>({
    isLogin: false,
    userData: null,
    takecareData: null,
  })
  const [idSetting, setIdSetting] = useState<number | null>(null)
  const [maxBpm, setMaxBpm] = useState<number>(120)

  useEffect(() => {
    const auToken = router.query.auToken
    if (auToken) {
      fetchUserData(auToken as string)
    }
  }, [router.query.auToken])

  const fetchUserData = async (auToken: string) => {
    try {
      const responseUser = await axios.get(`${process.env.WEB_DOMAIN}/api/user/getUser/${auToken}`)
      if (responseUser.data?.data) {
        const encodedUsersId = encrypt(responseUser.data.data.users_id.toString())
        const responseTakecare = await axios.get(
          `${process.env.WEB_DOMAIN}/api/user/getUserTakecareperson/${encodedUsersId}`
        )
        const takecareData = responseTakecare.data?.data
        if (takecareData) {
          setDataUser({ isLogin: true, userData: responseUser.data.data, takecareData: takecareData })
          const settingIdParam = router.query.idsetting
          if (settingIdParam && Number(settingIdParam) > 0) {
            fetchHeartRateSetting(Number(settingIdParam))
          }
        } else {
          showAlert('ไม่พบข้อมูลผู้ดูแล')
        }
      } else {
        showAlert('ไม่พบข้อมูลผู้ใช้')
      }
    } catch (error) {
      showAlert('ระบบไม่สามารถดึงข้อมูลของท่านได้ กรุณาลองใหม่อีกครั้ง')
    }
  }

  const fetchHeartRateSetting = async (settingId: number) => {
    try {
      const res = await axios.get(`${process.env.WEB_DOMAIN}/api/setting/getHeartRate?id=${settingId}`)
      if (res.data?.data) {
        const data = res.data.data
        setMaxBpm(Number(data.max_bpm))
        setIdSetting(settingId)
      }
    } catch (error) {
      showAlert('ไม่สามารถดึงข้อมูลการตั้งค่าได้')
    }
  }

  const showAlert = (message: string) => {
    setAlert({ show: true, message })
  }

  const handleSave = async () => {
    if (!dataUser.takecareData || !dataUser.userData) {
      showAlert('ไม่พบข้อมูลผู้ใช้งาน')
      return
    }
    setLoading(true)
    try {
      const payload: any = {
        takecare_id: dataUser.takecareData.takecare_id,
        users_id: dataUser.userData.users_id,
        max_bpm: maxBpm,
      }
      if (idSetting) {
        payload.id = idSetting
      }
      const res = await axios.post(`${process.env.WEB_DOMAIN}/api/setting/saveHeartRate`, payload)
      if (res.data?.id) {
        setIdSetting(res.data.id)
        router.push(`/settingHeartRate?auToken=${router.query.auToken}&idsetting=${res.data.id}`)
      }
      showAlert('บันทึกข้อมูลสำเร็จ')
    } catch (error) {
      showAlert('ไม่สามารถบันทึกข้อมูลได้')
    }
    setLoading(false)
  }

  return (
    <>
      {!dataUser.isLogin ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <Container className="d-flex justify-content-center align-items-center min-vh-100" style={{ background: "#f7fafd" }}>
          <div
            className="shadow"
            style={{
              background: "#fff",
              borderRadius: 24,
              padding: "32px 24px 28px 24px",
              maxWidth: 380,
              width: "100%",
              boxShadow: "0 2px 24px 0 rgba(0,0,0,0.07)"
            }}
          >
            <div className="text-center mb-3">
              {/* SVG หัวใจใหม่ที่เลือก */}
              <svg width="90" height="90" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                <path
                  fill="#f00"
                  fillRule="evenodd"
                  d="M.549 4.85C.592 1.94 3.795-.766 6.898 2.764a.27.27 0 0 0 .4 0c3.104-3.53 6.307-.825 6.35 2.086c0 4.428-5.298 8.062-6.55 8.062c-.939 0-4.153-2.044-5.702-4.934a.24.24 0 0 1 .218-.353h1.534a.63.63 0 0 0 .483-.228l.948-1.155a.25.25 0 0 1 .405.026l1.648 2.635a.625.625 0 0 0 1.013.065l1.458-1.776a.25.25 0 0 1 .194-.091h1.306a.625.625 0 1 0 0-1.25h-1.72a.63.63 0 0 0-.483.228l-.948 1.155a.25.25 0 0 1-.405-.026L5.398 4.573a.625.625 0 0 0-1.013-.065L2.928 6.284a.25.25 0 0 1-.194.091H.946a.244.244 0 0 1-.24-.187A6 6 0 0 1 .55 4.85Z"
                  clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-center mb-3">
              <h2 style={{ fontWeight: 700, color: "#2c3746", marginBottom: 12, fontSize: 26, lineHeight: 1.2 }}>
                ตั้งค่าการแจ้งเตือน<br />ชีพจร
              </h2>
            </div>
            <Card className="mb-3" style={{ borderRadius: 16, border: '1px solid #eef1f6' }}>
              <Card.Body style={{ padding: '12px 14px' }}>
                <Badge bg="light" text="dark" style={{ border: '1px solid #e8ecf3' }}>คำแนะนำ</Badge>
                <div style={{ fontSize: 14, color: '#48526b', marginTop: 8 }}>
                  อัตราการเต้นหัวใจขณะพักโดยทั่วไป: <strong>60–100 bpm</strong><br />

                </div>
              </Card.Body>
            </Card>

            <div className="mb-2" style={{ fontSize: 18, color: "#48526b", fontWeight: 500 }}>
              ค่าอัตราการเต้นสูงสุดที่อนุญาต:
              <span style={{ color: "#ff6641", fontWeight: 700, marginLeft: 6 }}>{maxBpm} bpm</span>
            </div>
            <div className="my-3">
              <RangeSlider
                min={50}
                max={200}
                step={1}
                value={maxBpm}
                onChange={(value) => setMaxBpm(Number(value))}
              />
            </div>
            <div className="mb-4" style={{ fontSize: 16, color: "#48526b", marginTop: 20 }}>
              หากเกินค่านี้ ระบบจะแจ้งเตือนทันทีผ่าน LINE
            </div>
            <ButtonState
              text="✔ บันทึกการตั้งค่า"
              isLoading={isLoading}
              onClick={handleSave}
              className="w-100"
            />
            <ModalAlert show={alert.show} message={alert.message} handleClose={() => setAlert({ show: false, message: '' })} />
          </div>
        </Container>
      )}
    </>
  )
}

export default SettingHeartRate
