import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { Button, Toast, Container, Alert, Form } from 'react-bootstrap';
import styles from '@/styles/page.module.css';

interface BorrowedItemType {
  borrow_equipment_id: number;
  equipment_name: string;
  equipment_code: string;
  startDate: string;
  endDate: string;
}

interface UserType {
  users_id: number;
}

const ReturnOf = () => {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [borrowedItems, setBorrowedItems] = useState<BorrowedItemType[]>([]);
  const [returnList, setReturnList] = useState<number[]>([]); // เก็บ ID ของอุปกรณ์ที่ต้องการคืน
  const [alert, setAlert] = useState({ show: false, message: '' });

  // ฟังก์ชันดึงข้อมูลผู้ใช้โดยใช้ auToken
  const fetchUserData = async () => {
    const auToken = router.query.auToken;
    if (auToken) {
      const userData = await getUser(auToken as string);
      if (userData) {
        setUser(userData);
      } else {
        setAlert({ show: true, message: 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้' });
      }
    }
  };

  // ฟังก์ชันดึงข้อมูลผู้ใช้จาก API
  const getUser = async (userId: string) => {
    try {
      const responseUser = await axios.get(`${process.env.WEB_DOMAIN}/api/user/getUser/${userId}`);
      if (responseUser.data?.data) {
        return responseUser.data.data;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setAlert({ show: true, message: 'ไม่สามารถโหลดข้อมูลผู้ใช้' });
      return null;
    }
  };

  // ฟังก์ชันดึงข้อมูลอุปกรณ์ที่ถูกยืมของผู้ใช้ที่ล็อกอินอยู่ โดยใช้ userId เป็นเงื่อนไข
  const fetchBorrowedItems = async (userId: number) => {
    try {
      setLoading(true);
      // กรองข้อมูลที่ยืมโดยผู้ใช้ที่ล็อกอิน (ใช้ borrow_user_id) และตรวจสอบสถานะการอนุมัติ
      const response = await axios.get(`${process.env.WEB_DOMAIN}/api/borrowequipment/list?userId=${userId}`);
      if (response.data?.data) {
        setBorrowedItems(response.data.data); // แสดงเฉพาะอุปกรณ์ที่ยืมของผู้ใช้นี้
      }
    } catch (error) {
      console.error('Error fetching borrowed equipment:', error);
      setAlert({ show: true, message: 'ไม่สามารถโหลดรายการอุปกรณ์ที่ถูกยืมได้' });
    } finally {
      setLoading(false);
    }
  };

  // ดึงข้อมูลผู้ใช้เมื่อค่า auToken พร้อมใช้งาน
  useEffect(() => {
    if (router.query.auToken) {
      fetchUserData();
    }
  }, [router.query.auToken]);

  // เมื่อผู้ใช้ถูกโหลดแล้ว ให้นำ userId ไปดึงรายการอุปกรณ์ที่ยืมไป
  useEffect(() => {
    if (user) {
      fetchBorrowedItems(user.users_id);
    }
  }, [user]);

  // ฟังก์ชันลบรายการอุปกรณ์ออกจาก UI (ถือว่าอุปกรณ์ถูกคืน)
  const removeItem = (index: number, id: number) => {
    setReturnList([...returnList, id]);
    setBorrowedItems(borrowedItems.filter((_, i) => i !== index));
  };

  // ฟังก์ชันบันทึกการคืนอุปกรณ์
  const handleReturnSubmit = async () => {
    if (returnList.length === 0) {
      setAlert({ show: true, message: 'กรุณาเลือกรายการที่ต้องการคืน' });
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${process.env.WEB_DOMAIN}/api/borrowequipment/return`, {
        returnList,
      });
      setAlert({ show: true, message: 'คืนอุปกรณ์สำเร็จแล้ว' });
      setReturnList([]);
      if (user) {
        fetchBorrowedItems(user.users_id); // โหลดข้อมูลใหม่หลังคืนอุปกรณ์
      }
    } catch (error) {
      console.error('Error returning equipment:', error);
      setAlert({ show: true, message: 'เกิดข้อผิดพลาดในการคืนอุปกรณ์' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className={styles.main}>
        <h1 className="py-2">คืนอุปกรณ์ครุภัณฑ์</h1>
      </div>
      <div className="px-5">
        {alert.show && <Alert variant="danger">{alert.message}</Alert>}
        <Form noValidate>
          <Form.Group className="py-2">
            {isLoading ? (
              <p>กำลังโหลด...</p>
            ) : borrowedItems.length > 0 ? (
              borrowedItems.map((item, index) => (
                <Toast
                  key={index}
                  onClose={() => removeItem(index, item.borrow_equipment_id)}
                  className="mb-2"
                >
                  <Toast.Header>
                    <strong className="me-auto">{item.equipment_name}</strong>
                  </Toast.Header>
                  <Toast.Body>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>
                        หมายเลขอุปกรณ์: {item.equipment_code}
                      </span>
                    </div>
                    <div className={styles.toastDate}>
                      <span>เริ่ม {item.startDate}</span>
                      <span>สิ้นสุด {item.endDate}</span>
                    </div>
                  </Toast.Body>
                </Toast>
              ))
            ) : (
              <p>ไม่มีอุปกรณ์ที่ถูกยืม</p>
            )}
          </Form.Group>
          <Button variant="primary" onClick={handleReturnSubmit} disabled={returnList.length === 0}>
            {isLoading ? 'กำลังบันทึก...' : 'บันทึกการคืน'}
          </Button>
        </Form>
      </div>
    </Container>
  );
};

export default ReturnOf;
