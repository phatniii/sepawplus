import React, { useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import Container from 'react-bootstrap/Container'
import Card from 'react-bootstrap/Card'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'
import Alert from 'react-bootstrap/Alert'

const LoginLine = () => {
    const [validated, setValidated] = useState(false)
    const [pending, setPending] = useState(false)
    const [sendingOtp, setSendingOtp] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [uuid, setUuid] = useState('')

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        event.stopPropagation()
        setPending(true)
        setError('')
        setSuccess('')

        const form = event.currentTarget
        const formData = new FormData(form)
        const code = formData.get('code') as string

        if (!uuid || !code) {
            setError('กรุณากรอก UUID และรหัส OTP ให้ครบถ้วน')
            setPending(false)
            return
        }

        try {
            const response = await axios.post('/api/line/verify-otp', { uuid, code })
            if (response.data.success) {
                setSuccess('เข้าสู่ระบบสำเร็จ')
                // router.push('/dashboard')
            } else {
                setError('รหัสไม่ถูกต้องหรือหมดอายุ')
            }
        } catch (err) {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ')
        }

        setPending(false)
        setValidated(true)
    }

    const handleRequestOtp = async () => {
        if (!uuid) {
            setError('กรุณากรอก UUID ก่อนขอรหัสผ่าน')
            return
        }

        setSendingOtp(true)
        setError('')
        setSuccess('')

        try {
            const response = await axios.post('/api/line/request-otp', { uuid })
            if (response.data.success) {
                setSuccess('ส่งรหัส OTP ไปยัง LINE เรียบร้อยแล้ว')
            } else {
                setError('ไม่พบ UUID นี้ในระบบ หรือส่งรหัสไม่สำเร็จ')
            }
        } catch (err) {
            setError('เกิดข้อผิดพลาดในการส่ง OTP')
        }

        setSendingOtp(false)
    }

    return (
        <Container>
            <div className="row justify-content-center">
                <div className="col-4 mt-5">
                    <Card className="login">
                        <Card.Header as="h2" className="text-center">Login Line</Card.Header>
                        <Card.Body>
                            {error && <Alert variant="danger">{error}</Alert>}
                            {success && <Alert variant="success">{success}</Alert>}
                            <Form onSubmit={handleSubmit} noValidate validated={validated} className="row p-2">
                                <Form.Group controlId="formBasicUUID">
                                    <Form.Label>UUID</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="UUID"
                                        name="uuid"
                                        value={uuid}
                                        onChange={(e) => setUuid(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group>
                                    <Button
                                        variant="secondary"
                                        className="mt-2 mb-3 w-100"
                                        onClick={handleRequestOtp}
                                        disabled={sendingOtp}
                                    >
                                        {sendingOtp ? (
                                            <Spinner animation="border" variant="light" size="sm" />
                                        ) : (
                                            'ขอรหัส OTP ผ่าน LINE'
                                        )}
                                    </Button>
                                </Form.Group>

                                <Form.Group controlId="formBasicCode">
                                    <Form.Label>รหัส OTP</Form.Label>
                                    <Form.Control type="text" placeholder="รหัสที่ได้รับทาง LINE" name="code" required />
                                </Form.Group>

                                <Form.Group>
                                    <Button variant="primary" type="submit" className="mt-3 w-100" disabled={pending}>
                                        {pending ? <Spinner animation="border" variant="light" size="sm" /> : 'Submit'}
                                    </Button>
                                </Form.Group>
                            </Form>
                        </Card.Body>
                        <Card.Footer className="text-muted">
                            <Link href="/admin/login">
                                <p className="text-center mb-0">Login Admin</p>
                            </Link>
                        </Card.Footer>
                    </Card>
                </div>
            </div>
        </Container>
    )
}

export default LoginLine
