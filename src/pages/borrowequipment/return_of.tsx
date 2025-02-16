import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Toast from 'react-bootstrap/Toast';

import styles from '@/styles/page.module.css';

interface ListItemType {
  borrowEquipmentId: number;
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
  const [removedItems, setRemovedItems] = useState<number[]>([]); // เก็บ ID ของอุปกรณ์ที่ถูกลบ

  // 🔹 ดึงข้อมูลจาก API เมื่อหน้าโหลด
  useEffect(() => {
    fetchBorrowedItems();
  }, []);

  const fetchBorrowedItems = async () => {
    try {
      const response = await axios.get(`${process.env.WEB_DOMAIN}/api/borrowequipment/list`);
      if (response.data && response.data.data) {
        const borrowedData = response.data.data.map((item: any) => ({
          borrowEquipmentId: item.borrow_equipment_id, // ✅ เก็บ ID ของอุปกรณ์เพื่อใช้คืน
          listName: item.borrowequipment.borrow_name, // ✅ ชื่อของอุปกรณ์ที่ยืม
          numberCard: item.borrow_equipment_number, // ✅ หมายเลขอุปกรณ์
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

  // 🔹 ฟังก์ชันลบอุปกรณ์ออกจากรายการ
  const removeItem = (borrowEquipmentId: number) => {
    setListItem((prevList) => prevList.filter(item => item.borrowEquipmentId !== borrowEquipmentId));
    setRemovedItems((prevRemoved) => [...prevRemoved, borrowEquipmentId]); // เก็บ ID ที่ถูกลบไว้
  };

  // 🔹 ฟังก์ชันส่งคืนอุปกรณ์ (กด "บันทึก")
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (listItem.length === 0) {
      setAlert({ show: true, message: 'กรุณาเลือกอุปกรณ์ที่ต้องการคืน' });
      return;
    }

    setLoading(true);
    
    try {
      const data = { removedItems };
      await axios.post(`${process.env.WEB_DOMAIN}/api/borrowequipment/return`, data); // 🔹 API คืนอุปกรณ์
      setAlert({ show: true, message: 'บันทึกการคืนอุปกรณ์สำเร็จ' });
      
      // รีเซ็ตรายการหลังจากคืนอุปกรณ์แล้ว
      setRemovedItems([]);
      fetchBorrowedItems(); // โหลดข้อมูลใหม่
    } catch (error) {
      setAlert({ show: true, message: 'เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่' });
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
          
          {/* 🔹 ซ่อนรายการทั้งหมด ถ้าไม่มีข้อมูล */}
          {listItem.length > 0 && (
            <Form.Group className="py-2">
              {listItem.map((item, index) => (
                <Toast key={index} onClose={() => removeItem(item.borrowEquipmentId)} className="mb-2">
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
              ))}
            </Form.Group>
          )}

          {/* 🔹 ซ่อนปุ่มบันทึก ถ้าไม่มีข้อมูล */}
          {listItem.length > 0 && (
            <Form.Group className="d-flex justify-content-center py-3">
              <button type="submit" className={styles.button} disabled={isLoading}>
                {isLoading ? 'กำลังบันทึก...' : 'บันทึกการคืนอุปกรณ์'}
              </button>
            </Form.Group>
          )}

        </Form>
      </div>
    </Container>
  );
};

export default ReturnOf;
