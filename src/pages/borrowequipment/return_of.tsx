import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Toast from 'react-bootstrap/Toast';
import ButtonState from '@/components/Button/ButtonState';
import ModalAlert from '@/components/Modals/ModalAlert';
import styles from '@/styles/page.module.css';

interface BorrowEquipmentItem {
  borrow_equipment_id: number;
  borrow_name: string;
  borrow_date: Date;
  borrow_return: Date;
  equipment: {
    equipment_id: number;
    equipment_name: string;
    equipment_code: string;
  };
}

const ReturnOf = () => {
  const router = useRouter();
  const { auToken } = router.query;

  const [user, setUser] = useState<any>(null);
  const [flatList, setFlatList] = useState<BorrowEquipmentItem[]>([]);
  const [returnedList, setReturnedList] = useState<number[]>([]);
  const [validated, setValidated] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '' });
  const [isLoading, setLoading] = useState(false);

  // ดึงข้อมูลผู้ใช้เมื่อมี auToken
  useEffect(() => {
    if (auToken) {
      fetchUserData();
    }
  }, [auToken]);

  // เมื่อได้ข้อมูลผู้ใช้แล้วให้ดึงข้อมูลการยืมที่ได้รับการอนุมัติ
  useEffect(() => {
    if (user) {
      fetchApprovedBorrows();
    }
  }, [user]);

  // ดึงข้อมูลผู้ใช้จาก API (ปรับให้ตรงกับระบบของคุณ)
  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${process.env.WEB_DOMAIN}/api/user/getUser/${auToken}`);
      if (response.data?.data) {
        setUser(response.data.data);
      } else {
        setAlert({ show: true, message: 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้' });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setAlert({ show: true, message: 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้' });
    }
  };

  // ดึงข้อมูลการยืมที่ได้รับการอนุมัติและแปลงเป็น flat list
  const fetchApprovedBorrows = async () => {
    try {
      const response = await axios.get(`/api/borrowequipment/list`, {
        params: { user_id: user.users_id },
      });
      if (response.data?.data) {
        // response.data.data เป็น array ของ borrow equipment ซึ่งแต่ละรายการมี borrowequipment_list
        const flat: BorrowEquipmentItem[] = [];
        response.data.data.forEach((borrow: any) => {
          borrow.borrowequipment_list.forEach((item: any) => {
            flat.push({
              borrow_equipment_id: item.borrow_equipment_id,
              borrow_name: borrow.borrow_name,
              borrow_date: borrow.borrow_date,
              borrow_return: borrow.borrow_return,
              equipment: item.equipment,
            });
          });
        });
        setFlatList(flat);
      }
    } catch (error) {
      console.error('Error fetching approved borrow data:', error);
      setAlert({ show: true, message: 'ไม่สามารถโหลดข้อมูลการยืมได้' });
    }
  };

  // เมื่อกดกากบาทบน Toast ให้ลบรายการออกจาก UI และบันทึก id สำหรับคืน
  const handleRemoveItem = (id: number) => {
    setFlatList(prev => prev.filter(item => item.borrow_equipment_id !== id));
    setReturnedList(prev => [...prev, id]);
  };

  // เมื่อกดบันทึก ระบบจะส่งรายการคืนไปยัง API
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (returnedList.length === 0) {
      setAlert({ show: true, message: 'กรุณาเลือกอุปกรณ์ที่ต้องการคืน' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`/api/borrowequipment/return`, {
        returnList: returnedList,
      });
      if (response.data?.message) {
        setAlert({ show: true, message: response.data.message });
      }
    } catch (error) {
      console.error('Error updating return status:', error);
      setAlert({ show: true, message: 'เกิดข้อผิดพลาดในการคืนอุปกรณ์' });
    } finally {
      setLoading(false);
      setValidated(true);
    }
  };

  return (
    <Container>
      <div className={styles.main}>
        <h1 className="py-2">คืนอุปกรณ์ครุภัณฑ์</h1>
      </div>
      <div className="px-5">
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          {flatList.length > 0 ? (
            flatList.map((item) => (
              <Toast 
                key={item.borrow_equipment_id} 
                className="mb-2" 
                onClose={() => handleRemoveItem(item.borrow_equipment_id)}
              >
                <Toast.Header>
                  <strong className="me-auto">{item.borrow_name}</strong>
                </Toast.Header>
                <Toast.Body>
                  {item.equipment.equipment_name} - {item.equipment.equipment_code}
                  <div className={styles.toastDate}>
                    <span>เริ่ม {new Date(item.borrow_date).toLocaleDateString()}</span>
                    <span>สิ้นสุด {new Date(item.borrow_return).toLocaleDateString()}</span>
                  </div>
                </Toast.Body>
              </Toast>
            ))
          ) : (
            <p>ไม่มีข้อมูลการยืมที่ได้รับการอนุมัติ หรือท่านได้ทำการคืนอุปกรณ์ครบแล้ว</p>
          )}
          <div className="d-flex justify-content-center py-3">
            <ButtonState type="submit" text={'บันทึก'} isLoading={isLoading} />
          </div>
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
