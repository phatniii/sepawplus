import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Toast from 'react-bootstrap/Toast';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

import styles from '@/styles/page.module.css';
import ModalAlert from '@/components/Modals/ModalAlert';

interface BorrowedItemType {
  borrow_equipment_id: number;
  equipment_id: number;
  equipment_name: string;
  equipment_code: string;
  startDate: string;
  endDate: string;
  borrow_status: number;
}

interface UserType {
  users_id: number;
}

const ReturnOf = () => {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [borrowedItems, setBorrowedItems] = useState<BorrowedItemType[]>([]);
  const [returnList, setReturnList] = useState<number[]>([]);
  const [alert, setAlert] = useState({ show: false, message: '' });

  // ดึงข้อมูลผู้ใช้
  const fetchUserData = async () => {
    try {
      const auToken = router.query.auToken;
      if (auToken) {
        const response = await axios.get(`${process.env.WEB_DOMAIN}/api/user/getUser/${auToken}`);
        if (response.data?.data) {
          setUser(response.data.data);
        } else {
          setAlert({ show: true, message: 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้' });
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setAlert({ show: true, message: 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้' });
    }
  };

  // ดึงรายการอุปกรณ์ที่ถูกยืม
  const fetchBorrowedItems = async (userId: number) => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.WEB_DOMAIN}/api/borrowequipment/list?userId=${userId}`);
      
      if (response.data?.data) {
        // กรองเฉพาะรายการที่อนุมัติแล้วและยังไม่คืน
        const filteredItems = response.data.data.flatMap((item: any) => 
          item.borrowequipment_list
            .filter((eq: any) => eq.equipment?.equipment_status === 0) // กรองเฉพาะที่ยังถูกยืมอยู่
            .map((eq: any) => ({
              borrow_equipment_id: eq.borrow_equipment_id,
              equipment_id: eq.equipment_id,
              equipment_name: eq.equipment?.equipment_name || "ไม่พบข้อมูล",
              equipment_code: eq.equipment?.equipment_code || "ไม่พบข้อมูล",
              startDate: item.borrow_date ? new Date(item.borrow_date).toLocaleDateString('th-TH') : "",
              endDate: item.borrow_return ? new Date(item.borrow_return).toLocaleDateString('th-TH') : "",
              borrow_status: item.borrow_status,
            }))
        );

        setBorrowedItems(filteredItems);
      }
    } catch (error) {
      console.error('Error fetching borrowed equipment:', error);
      setAlert({ show: true, message: 'ไม่สามารถโหลดรายการอุปกรณ์ที่ถูกยืมได้' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (router.query.auToken) {
      fetchUserData();
    }
  }, [router.query.auToken]);

  useEffect(() => {
    if (user) {
      fetchBorrowedItems(user.users_id);
    }
  }, [user]);

  const handleReturnItem = (id: number) => {
    if (returnList.includes(id)) {
      setReturnList(returnList.filter(itemId => itemId !== id));
    } else {
      setReturnList([...returnList, id]);
    }
  };

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
        <Form noValidate>
          <Form.Group className="py-2">
            {isLoading ? (
              <div className="text-center">
                <Spinner animation="border" variant="primary" />
                <p>กำลังโหลดข้อมูล...</p>
              </div>
            ) : borrowedItems.length > 0 ? (
              borrowedItems.map((item) => (
                <Toast 
                  key={item.borrow_equipment_id} 
                  className={`mb-2 ${returnList.includes(item.borrow_equipment_id) ? 'bg-light' : ''}`}
                  onClick={() => handleReturnItem(item.borrow_equipment_id)}
                  style={{ cursor: 'pointer' }}
                >
                  <Toast.Header>
                    <strong className="me-auto">{item.equipment_name}</strong>
                    <small>สถานะ: {item.borrow_status === 1 ? 'รออนุมัติ' : 'อนุมัติแล้ว'}</small>
                  </Toast.Header>
                  <Toast.Body>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>หมายเลขอุปกรณ์: {item.equipment_code}</span>
                    </div>
                    <div className={styles.toastDate}>
                      <span>วันที่ยืม: {item.startDate}</span>
                      <span>วันที่คืน: {item.endDate}</span>
                    </div>
                  </Toast.Body>
                </Toast>
              ))
            ) : (
              <p className="text-center">ไม่มีอุปกรณ์ที่ถูกยืม</p>
            )}
          </Form.Group>

          {borrowedItems.length > 0 && (
            <div className="text-center">
              <Button 
                variant="primary" 
                onClick={handleReturnSubmit} 
                disabled={returnList.length === 0 || isLoading}
              >
                {isLoading ? 'กำลังดำเนินการ...' : 'ยืนยันการคืนอุปกรณ์'}
              </Button>
            </div>
          )}
        </Form>
      </div>

      <ModalAlert 
        show={alert.show} 
        message={alert.message} 
        handleClose={() => setAlert({ show: false, message: '' })} 
      />
    </Container>
  );
};

export default ReturnOf;