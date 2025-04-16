import React, { useState } from 'react';
import Link from 'next/link';

import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { useRouter } from 'next/router';

const LoginLine = () => {
  const [uuid, setUUID] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const handleCheckUUID = async () => {
    setPending(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/check-uuid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuid }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowOTP(true);
        setSuccess('ส่งรหัส OTP ไปยัง LINE สำเร็จแล้ว');
      } else {
        setError(data.message || 'ไม่สามารถส่ง OTP ได้');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
    setPending(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuid, code }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('เข้าสู่ระบบสำเร็จ');
        router.push('/admin/dashboard'); // เปลี่ยนเส้นทางตามระบบจริง
      } else {
        setError(data.message || 'OTP ไม่ถูกต้อง');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการยืนยัน OTP');
    }

    setPending(false);
  };

  return (
    <Container>
      <div className="row justify-content-center">
        <div className="col-4 mt-5">
          <Card className="login">
            <Card.Header as="h2" className="text-center">Login Line</Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <Form onSubmit={handleSubmit} className="row p-2">
                <Form.Group controlId="uuid">
                  <Form.Label>UUID</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="กรอก UUID"
                    value={uuid}
                    onChange={(e) => setUUID(e.target.value)}
                    required
                    disabled={showOTP}
                  />
                  {!showOTP && (
                    <Button
                      className="mt-2"
                      onClick={handleCheckUUID}
                      disabled={!uuid || pending}
                    >
                      {pending ? <Spinner animation="border" size="sm" /> : 'ขอรหัส OTP'}
                    </Button>
                  )}
                </Form.Group>

                {showOTP && (
                  <>
                    <Form.Group controlId="otp">
                      <Form.Label>รหัส OTP</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="กรอกรหัส OTP"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Button type="submit" className="mt-3 w-100" disabled={pending || !code}>
                      {pending ? <Spinner animation="border" size="sm" /> : 'Submit'}
                    </Button>
                  </>
                )}
              </Form>
            </Card.Body>
            <Card.Footer className="text-muted text-center">
              <Link href="/admin/login">
                <p className="mb-0">Login Admin</p>
              </Link>
            </Card.Footer>
          </Card>
        </div>
      </div>
    </Container>
  );
};

export default LoginLine;
