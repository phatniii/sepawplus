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
              {/* SVG หัวใจเต็มดวง สวยๆ */}
              <svg width="90" height="90" viewBox="0 0 90 90" fill="none" style={{ marginBottom: 10 }}>
                <rect width="90" height="90" rx="28" fill="#FFF0EB"/>
                <g>
                  <path
                    d="M45 69C44.3 68.4 21 50.6 21 34.5C21 25.7 28.8 19 37.5 19C41.6 19 45 21.2 46.8 23.8C48.6 21.2 52 19 56.1 19C64.8 19 72.6 25.7 72.6 34.5C72.6 50.6 49.7 68.3 45 69Z"
                    fill="#FF6464"
                  />
                  <polyline
                    points="32,52 40,44 47,55 54,36 61,52"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              </svg>
            </div>
            <div className="text-center mb-3">
              <h2 style={{ fontWeight: 700, color: "#2c3746", marginBottom: 12, fontSize: 26, lineHeight: 1.2 }}>
                ตั้งค่าการแจ้งเตือน<br />อัตราการเต้นหัวใจ
              </h2>
            </div>
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
