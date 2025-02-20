import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Toast from 'react-bootstrap/Toast';
import Button from 'react-bootstrap/Button';

import styles from '@/styles/page.module.css';

interface BorrowedItemType {
  borrow_equipment_id: number;
  equipment_id: number;
  equipment_name: string;
  equipment_code: string;
  startDate: string;
  endDate: string;
  borrow_user_id: number; // 🆕 เก็บ ID ของคนที่ยืม
}

const ReturnOf = () => {
  const router = useRouter();
  const [isLoading, setLoading] = useState(true);
  const [borrowedItems, setBorrowedItems] = useState<BorrowedItemType[]>([]);
  const [returnList, setReturnList] = useState<number[]>([]); // 🆕 เก็บรายการอุปกรณ์ที่ต้องการคืน
  const [alert, setAlert] = useState({ show: false, message: '' });
  const [user, setUser] = useState<{ user_id: number } | null>(null); // 🆕 เก็บข้อมูลผู้ใช้

  // 🔹 ดึงข้อมูลของผู้ใช้ปัจจุบัน
  const fetchUserData = async () => {
    try {
      const auToken = router.query.auToken;
      if (auToken) {
        const responseUser = await axios.get(`${process.env.WEB_DOMAIN}/api/user/getUser/${auToken}`);
        if (responseUser.data?.data) {
          setUser(responseUser.data.data);
        } else {
          setAlert({ show: true, message: 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้' });
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setAlert({ show: true, message: 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้' });
    }
  };

  // 🔹 ดึงข้อมูลอุปกรณ์ที่ผู้ใช้ยืม
  const fetchBorrowedItems = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await axios.get(`${process.env.WEB_DOMAIN}/api/borrowequipment/list`, {
        params: { user_id: user?.user_id } // ✅ ส่ง user_id ไปกับ API
      });

      if (response.data?.data) {
        const borrowedData: BorrowedItemType[] = response.data.data.flatMap((item: any) =>
          item.borrowequipment_list.map((eq: any) => ({
            borrow_equipment_id: eq.borrow_equipment_id,
            equipment_id: eq.equipment?.equipment_id,
            equipment_name: eq.equipment?.equipment_name || "ไม่พบข้อมูล",
            equipment_code: eq.equipment?.equipment_code || "ไม่พบข้อมูล",
            startDate: item.borrow_date ? new Date(item.borrow_date).toISOString().split('T')[0] : "",
            endDate: item.borrow_return ? new Date(item.borrow_return).toISOString().split('T')[0] : "",
            borrow_user_id: item.borrow_user_id,
          }))
        );
        
        setBorrowedItems(borrowedData.filter(item => item.borrow_user_id === user.user_id));
        
      }
    } catch (error) {
      console.error('Error fetching borrowed equipment:', error);
      setAlert({ show: true, message: 'ไม่สามารถโหลดรายการอุปกรณ์ที่ถูกยืมได้' });
    } finally {
      setLoading(false);
    }
  };

  // 📌 โหลดข้อมูลผู้ใช้ก่อน และโหลดอุปกรณ์หลังจากรู้ว่าใครเป็นผู้ใช้
  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (user) {
      fetchBorrowedItems();
    }
  }, [user]);

  // 🔹 ฟังก์ชันลบอุปกรณ์ออกจาก UI (ถือว่าอุปกรณ์ถูกคืน)
  const removeItem = (index: number, id: number) => {
    setReturnList([...returnList, id]); // 🆕 เก็บ ID อุปกรณ์ที่ต้องการคืน
    setBorrowedItems(borrowedItems.filter((_, i) => i !== index));
  };

  // 🔹 ฟังก์ชันบันทึกการคืนอุปกรณ์
  const handleReturnSubmit = async () => {
    if (returnList.length === 0) {
      setAlert({ show: true, message: 'กรุณาเลือกรายการที่ต้องการคืน' });
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${process.env.WEB_DOMAIN}/api/borrowequipment/return`, {
        returnList,
        user_id: user?.user_id, // 🆕 ส่ง ID ของคนที่คืนไปด้วย
      });

      setAlert({ show: true, message: 'คืนอุปกรณ์สำเร็จแล้ว' });

      // ✅ อัปเดต UI โดยโหลดข้อมูลใหม่
      setReturnList([]);
      fetchBorrowedItems(); // ✅ โหลดข้อมูลใหม่หลังจากคืนอุปกรณ์
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
        <Form noValidate>
          <Form.Group className="py-2">
            {isLoading ? (
              <p>กำลังโหลด...</p>
            ) : borrowedItems.length > 0 ? (
              borrowedItems.map((item, index) => (
                <Toast key={index} onClose={() => removeItem(index, item.equipment_id)} className="mb-2">
                  <Toast.Header>
                    <strong className="me-auto">{item.equipment_name}</strong>
                  </Toast.Header>
                  <Toast.Body>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>หมายเลขอุปกรณ์: {item.equipment_code}</span>
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

          {/* 🔹 ปุ่มบันทึกการคืนอุปกรณ์ */}
          <Button variant="primary" onClick={handleReturnSubmit} disabled={returnList.length === 0}>
            {isLoading ? 'กำลังบันทึก...' : 'บันทึกการคืน'}
          </Button>
        </Form>
      </div>
    </Container>
  );
};

export default ReturnOf;
