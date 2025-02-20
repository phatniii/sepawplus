import React, { useState, useEffect } from 'react';
import axios from 'axios';

import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Toast from 'react-bootstrap/Toast';
import Button from 'react-bootstrap/Button';

import styles from '@/styles/page.module.css';

interface EquipmentType {
  equipment_id: number;
  equipment_name: string;
  equipment_code: string;
}

const ReturnOf = () => {
  const [isLoading, setLoading] = useState(true);
  const [equipmentList, setEquipmentList] = useState<EquipmentType[]>([]);
  const [returnList, setReturnList] = useState<number[]>([]); // 🔹 เก็บรายการอุปกรณ์ที่ถูกลบ

  // 🔹 ฟังก์ชันดึงข้อมูลอุปกรณ์ที่ถูกยืมอยู่
  const fetchBorrowedEquipment = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.WEB_DOMAIN}/api/equipment/list`);
      if (response.data && response.data.data) {
        const borrowedData = response.data.data.map((item: any) => ({
          equipment_id: item.equipment_id,
          equipment_name: item.equipment_name,
          equipment_code: item.equipment_code,
        }));
        setEquipmentList(borrowedData);
      }
    } catch (error) {
      console.error('Error fetching borrowed equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrowedEquipment();
  }, []);

  // 🔹 ฟังก์ชันลบอุปกรณ์ที่คืน (เฉพาะ UI)
  const removeEquipment = (index: number, id: number) => {
    setReturnList([...returnList, id]); // 🆕 เพิ่ม ID อุปกรณ์ที่ถูกลบลงใน returnList
    const newList = equipmentList.filter((_, i) => i !== index);
    setEquipmentList(newList);
  };

  // 🔹 ฟังก์ชันบันทึกการคืนอุปกรณ์
  const handleReturnSubmit = async () => {
    if (returnList.length === 0) {
      alert('กรุณาลบอุปกรณ์ที่ต้องการคืนก่อน');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${process.env.WEB_DOMAIN}/api/equipment/return`, {
        returnList, // 🆕 ส่งอุปกรณ์ที่ถูกลบไปอัปเดตในฐานข้อมูล
      });

      alert('คืนอุปกรณ์เรียบร้อยแล้ว');
      setReturnList([]); // 🆕 เคลียร์รายการที่คืน
      fetchBorrowedEquipment(); // 🔹 โหลดข้อมูลใหม่
    } catch (error) {
      console.error('Error returning equipment:', error);
      alert('เกิดข้อผิดพลาดในการคืนอุปกรณ์');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className={styles.main}>
        <h1 className="py-2">คืนอุปกรณ์</h1>
      </div>
      <div className="px-5">
        <Form noValidate>
          <Form.Group className="py-2">
            {isLoading ? (
              <p>กำลังโหลด...</p>
            ) : equipmentList.length > 0 ? (
              equipmentList.map((item, index) => (
                <Toast key={index} onClose={() => removeEquipment(index, item.equipment_id)} className="mb-2">
                  <Toast.Header>
                    <strong className="me-auto">{item.equipment_name}</strong>
                  </Toast.Header>
                  <Toast.Body>
                    <span style={{ color: 'red', fontWeight: 'bold' }}>{item.equipment_code}</span>
                  </Toast.Body>
                </Toast>
              ))
            ) : (
              <p>ไม่มีข้อมูลอุปกรณ์ที่ถูกยืม</p>
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
