import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Toast from 'react-bootstrap/Toast';
import Button from 'react-bootstrap/Button';

import styles from '@/styles/page.module.css';

interface ListItemType {
  listName: string; // ชื่ออุปกรณ์
  numberCard: string; // หมายเลขอุปกรณ์ (equipment_code)
  startDate: string;
  endDate: string;
}

const ReturnOf = () => {
  const inputRef = useRef<HTMLFormElement>(null);

  const [validated, setValidated] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '' });
  const [isLoading, setLoading] = useState(true);
  const [listItem, setListItem] = useState<ListItemType[]>([]);
  const [removedItems, setRemovedItems] = useState<string[]>([]); // ✅ เก็บรายการอุปกรณ์ที่ถูกลบ

  // 🔹 ดึงข้อมูลอุปกรณ์ที่ถูกยืมจาก API
  const fetchBorrowedItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.WEB_DOMAIN}/api/borrowequipment/list`);
      if (response.data && response.data.data) {
        const borrowedData = response.data.data.map((item: any) => ({
          listName: item.borrowequipment_list.map((eq: any) => eq.equipment?.equipment_name).join(", "),
          numberCard: item.borrowequipment_list.map((eq: any) => eq.equipment?.equipment_code).join(", "),
          startDate: item.borrow_date ? new Date(item.borrow_date).toISOString().split('T')[0] : "",
          endDate: item.borrow_return ? new Date(item.borrow_return).toISOString().split('T')[0] : "",
        }));
        setListItem(borrowedData);
      }
    } catch (error) {
      console.error('Error fetching borrowed equipment:', error);
      setAlert({ show: true, message: 'ไม่สามารถดึงข้อมูลได้' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrowedItems();
  }, []);

  // 🔹 ฟังก์ชันลบอุปกรณ์ออกจากรายการ (UI)
  const removeListener = (index: number) => {
    const removedEquipmentCode = listItem[index].numberCard;
    setRemovedItems(prev => [...prev, removedEquipmentCode]); // ✅ เพิ่มอุปกรณ์ที่ถูกลบลงในรายการ
    const newList = listItem.filter((_, i) => i !== index);
    setListItem(newList);
  };

  // 🔹 ฟังก์ชันคืนอุปกรณ์ที่ถูกลบ
  const handleReturnEquipment = async () => {
    try {
      setLoading(true);
      if (removedItems.length === 0) {
        setAlert({ show: true, message: 'ไม่มีอุปกรณ์ที่ต้องคืน' });
        return;
      }

      // ✅ ส่งคำขอไปยัง API เพื่อคืนอุปกรณ์ที่ถูกลบ
      const response = await axios.put(`${process.env.WEB_DOMAIN}/api/borrowequipment/return`, {
        equipmentCodes: removedItems,
      });

      if (response.status === 200) {
        setAlert({ show: true, message: 'คืนอุปกรณ์สำเร็จ' });
        setRemovedItems([]); // ✅ ล้างรายการที่ถูกลบ
        fetchBorrowedItems(); // ✅ รีโหลดรายการอุปกรณ์ที่เหลือ
      } else {
        setAlert({ show: true, message: 'คืนอุปกรณ์ไม่สำเร็จ' });
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
        <Form noValidate validated={validated} onSubmit={(e) => e.preventDefault()}>
          <Form.Group className="py-2">
            {isLoading ? (
              <p>กำลังโหลดข้อมูล...</p>
            ) : listItem.length > 0 ? (
              listItem.map((item, index) => (
                <Toast key={index} onClose={() => removeListener(index)} className="mb-2">
                  <Toast.Header>
                    <strong className="me-auto">{item.listName}</strong>
                  </Toast.Header>
                  <Toast.Body>
                    <div>
                      <strong>หมายเลขอุปกรณ์:</strong> <span style={{ color: 'red', fontWeight: 'bold' }}>{item.numberCard}</span>
                    </div>
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

          {/* 🔹 ปุ่มบันทึก (คืนอุปกรณ์) */}
          <Form.Group className="d-flex justify-content-center py-3">
            <Button variant="primary" onClick={handleReturnEquipment} disabled={isLoading || removedItems.length === 0}>
              {isLoading ? "กำลังคืนอุปกรณ์..." : "บันทึก"}
            </Button>
          </Form.Group>
        </Form>
      </div>
    </Container>
  );
};

export default ReturnOf;
