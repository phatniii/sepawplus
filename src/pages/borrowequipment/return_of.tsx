import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Toast from 'react-bootstrap/Toast';

import styles from '@/styles/page.module.css';

interface ListItemType {
  listName: string;
  numberCard: string;
  startDate: string;
  endDate: string;
}

const ReturnOf = () => {
  const inputRef = useRef<HTMLFormElement>(null);

  const [validated, setValidated] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '' });
  const [isLoading, setLoading] = useState(false);
  const [listItem, setListItem] = useState<ListItemType[]>([]);

  // 🔹 ฟังก์ชันดึงข้อมูลจาก API
  const fetchBorrowedItems = async () => {
    try {
      const response = await axios.get(`${process.env.WEB_DOMAIN}/api/borrowequipment/list`);
      if (response.data && response.data.data) {
        const borrowedData = response.data.data.map((item: any) => ({
          listName: item.borrowequipment.borrow_name, // ✅ ใช้ชื่อของอุปกรณ์ที่ยืมจาก borrowequipment
          numberCard: item.borrow_equipment_number, // ✅ ใช้หมายเลขอุปกรณ์
          startDate: item.borrowequipment.borrow_date, // ✅ วันที่เริ่มยืม
          endDate: item.borrowequipment.borrow_return, // ✅ วันที่ต้องคืน
        }));
        setListItem(borrowedData);
      }
    } catch (error) {
      console.error('Error fetching borrowed equipment:', error);
      setAlert({ show: true, message: 'ไม่สามารถดึงข้อมูลได้' });
    }
  };

  // 🔹 ใช้ useEffect เพื่อดึงข้อมูลเมื่อ component โหลด
  useEffect(() => {
    fetchBorrowedItems();
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    setLoading(true);
    if (form.checkValidity() === false) {
      setAlert({ show: true, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
      event.preventDefault();
      event.stopPropagation();
    } else {
      setAlert({ show: true, message: 'ระบบยังอยู่ในช่วงพัฒนา' });
      event.preventDefault();
      event.stopPropagation();
    }
    setTimeout(() => {
      setLoading(false);
    }, 2000);
    setValidated(true);
  };

  // 🔹 ฟังก์ชันลบรายการ (เฉพาะ UI)
  const removeListener = (index: number) => {
    const newList = listItem.filter((_, i) => i !== index);
    setListItem(newList);
  };

  return (
    <Container>
      <div className={styles.main}>
        <h1 className="py-2">คืนอุปกรณ์ครุภัณฑ์</h1>
      </div>
      <div className="px-5">
        <Form noValidate validated={validated} onSubmit={(e) => handleSubmit(e)}>
          <Form.Group className="py-2">
            {listItem.length > 0 ? (
              listItem.map((item, index) => (
                <Toast key={index} onClose={() => removeListener(index)} className="mb-2">
                  <Toast.Header>
                    <strong className="me-auto">{item.listName}</strong>
                  </Toast.Header>
                  <Toast.Body>
                    <span style={{ color: 'red', fontWeight: 'bold' }}>{item.numberCard}</span>
                    <div className={styles.toastDate}>
                      <span>เริ่ม {item.startDate}</span>
                      <span>สิ้นสุด {item.endDate}</span>
                    </div>
                  </Toast.Body>
                </Toast>
              ))
            ) : (
              <p>ไม่มีข้อมูลอุปกรณ์ที่ถูกยืม</p>
            )}
          </Form.Group>
        </Form>
      </div>
    </Container>
  );
};

export default ReturnOf;
