'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'

import Spinner from 'react-bootstrap/Spinner'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
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
  // const [minBpm, setMinBpm] = useState<number>(50) // <--- คอมเมนต์ออก
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
        // setMinBpm(Number(data.min_bpm)) // <--- คอมเมนต์ออก (ไม่ต้องโหลด min_bpm)
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
        // min_bpm: minBpm, // <--- คอมเมนต์ออก (ไม่ต้องส่ง min_bpm)
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
        <Container className="py-3">
          <Row>
            <Col>
              <h3>ตั้งค่าการแจ้งเตือนอัตราการเต้นของหัวใจ</h3>
              <p>กำหนดอัตราการเต้นของหัวใจสูงสุดที่อนุญาต (bpm)</p>
            </Col>
          </Row>
          <Row className="py-3">
            <Col>
              {/* <p>
                อัตราการเต้นของหัวใจต่ำสุด: <strong>{minBpm} bpm</strong>
              </p>
              <RangeSlider
                min={30}
                max={maxBpm}
                step={1}
                value={minBpm}
                onChange={(value) => setMinBpm(Number(value))}
              /> */}
              <p>
                อัตราการเต้นของหัวใจสูงสุดที่อนุญาต: <strong>{maxBpm} bpm</strong>
              </p>
              <RangeSlider
                min={50}
                max={200}
                step={1}
                value={maxBpm}
                onChange={(value) => setMaxBpm(Number(value))}
              />
            </Col>
          </Row>
          <Row className="py-3">
            <Col>
              <ButtonState text="บันทึก" isLoading={isLoading} onClick={handleSave} className="btn btn-primary" />
            </Col>
          </Row>
          <ModalAlert show={alert.show} message={alert.message} handleClose={() => setAlert({ show: false, message: '' })} />
        </Container>
      )}
    </>
  )
}

export default SettingHeartRate
