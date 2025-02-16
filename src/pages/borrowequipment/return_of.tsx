import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Toast from 'react-bootstrap/Toast';
import Button from 'react-bootstrap/Button';

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

  // 🔹 ดึงข้อมูลจาก API
  const fetchBorrowedItems = async () => {
    try {
      const response = await axios.get(`${process.env.WEB_DOMAIN}/api/borrowequipment/list`);
      if (response.data && response.data.data) {
        const borrowedData = response.data.data.flatMap((item: any) =>
          item.borrowequipment_list.map((eq: any) => ({
            borrowEquipmentId: eq.borrow_equipment_id, // ✅ ใช้ ID ของอุปกรณ์ที่ถูกยืม
            listName: eq.borrow_equipment, // ✅ ใช้ชื่ออุปกรณ์
            numberCard: eq.borrow_equipment_number, // ✅ หมายเลขอุปกรณ์
            startDate: eq.borrow_date ? new Date(eq.borrow_date).toLocaleDateString('th-TH') : "ไม่ระบุ", // ✅ แปลงวันที่
            endDate: eq.borrow_return ? new Date(eq.borrow_return).toLocaleDateString('th-TH') : "ไม่ระบุ", // ✅ แปลงวันที่
          }))
        );
        setListItem(borrowedData);
      }
    } catch (error) {
      console.error('❌ Error fetching borrowed equipment:', error);
      setAlert({ show: true, message: 'ไม่สามารถดึงข้อมูลได้' });
    }
  };

  // 🔹 ใช้ useEffect ดึงข้อมูลเมื่อ Component โหลด
  useEffect(() => {
    fetchBorrowedItems();
  }, []);

  // 🔹 ฟังก์ชันลบอุปกรณ์ออกจากรายการ (เฉพาะ UI ก่อนกดบันทึก)
  const removeListener = (borrowEquipmentId: number) => {
    setListItem((prevList) => prevList.filter(item => item.borrowEquipmentId !== borrowEquipmentId));
    setRemovedItems((prevRemoved) => [...prevRemoved, borrowEquipmentId]); // ✅ เก็บรายการที่ถูกลบไว้
  };

  // 🔹 ฟังก์ชันกด "บันทึกการคืนอุปกรณ์"
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (removedItems.length === 0) {
      setAlert({ show: true, message: 'กรุณาลบอุปกรณ์ก่อนกดบันทึก' });
      return;
    }

    setLoading(true);

    try {
      const data = { removedItems };
      await axios.post(`${process.env.WEB_DOMAIN}/api/borrowequipment/return`, data); // 🔹 API คืนอุปกรณ์
      setAlert({ show: true, message: 'บันทึกการคืนอุปกรณ์สำเร็จ' });

      // 🔹 รีเซ็ตรายการหลังจากคืนอุปกรณ์แล้ว
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
          {/* 🔹 แสดงรายการอุปกรณ์ที่ถูกยืม */}
          {listItem.length > 0 && (
            <Form.Group className="py-2">
              {listItem.map((item, index) => (
                <Toast key={index} onClose={() => removeListener(item.borrowEquipmentId)} className="mb-2">
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

          {/* 🔹 ปุ่มบันทึก */}
          {removedItems.length > 0 && (
            <Form.Group className="d-flex justify-content-center py-3">
              <Button type="submit" variant="danger" disabled={isLoading}>
                {isLoading ? 'กำลังบันทึก...' : 'บันทึกการคืนอุปกรณ์'}
              </Button>
            </Form.Group>
          )}
        </Form>
      </div>
    </Container>
  );
};

export default ReturnOf;
