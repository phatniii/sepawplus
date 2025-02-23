import React, { useState, useEffect } from 'react';
import axios from 'axios';

import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Toast from 'react-bootstrap/Toast';
import ButtonState from '@/components/Button/ButtonState';
import ModalAlert from '@/components/Modals/ModalAlert';

import styles from '@/styles/page.module.css';

interface BorrowedItem {
  borrow_equipment_id: number;
  equipment_name: string;
  equipment_code: string;
  startDate: string;
  endDate: string;
}

const ReturnOf = () => {
  const [borrowedItems, setBorrowedItems] = useState<BorrowedItem[]>([]);
  const [returnList, setReturnList] = useState<number[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '' });

  // ดึงข้อมูลอุปกรณ์ที่ถูกยืมของผู้ใช้ (เฉพาะรายการที่ได้รับการอนุมัติจากแอดมิน)
  useEffect(() => {
    const fetchBorrowedItems = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${process.env.WEB_DOMAIN}/api/borrowequipment/list`);
        if (res.data?.data) {
          // สมมติว่า API ส่งกลับข้อมูลในรูปแบบของชุดอุปกรณ์พร้อมรายการอุปกรณ์ในแต่ละชุด
          const data: BorrowedItem[] = res.data.data.flatMap((item: any) =>
            item.borrowequipment_list.map((eq: any) => ({
              borrow_equipment_id: eq.borrow_equipment_id,
              equipment_name: eq.equipment?.equipment_name || 'ไม่พบข้อมูล',
              equipment_code: eq.equipment?.equipment_code || 'ไม่พบข้อมูล',
              startDate: item.borrow_date ? new Date(item.borrow_date).toISOString().split('T')[0] : '',
              endDate: item.borrow_return ? new Date(item.borrow_return).toISOString().split('T')[0] : '',
            }))
          );
          setBorrowedItems(data);
        }
      } catch (error) {
        console.error('Error fetching borrowed equipment:', error);
        setAlert({ show: true, message: 'ไม่สามารถโหลดรายการอุปกรณ์ที่ถูกยืมได้' });
      } finally {
        setLoading(false);
      }
    };

    fetchBorrowedItems();
  }, []);

  // เมื่อผู้ใช้คลิกปุ่มปิดของ Toast ให้ถือว่าต้องการคืนอุปกรณ์ชิ้นนั้น
  const handleReturnItem = (id: number, index: number) => {
    setReturnList([...returnList, id]);
    setBorrowedItems(borrowedItems.filter((_, i) => i !== index));
  };

  // เมื่อผู้ใช้กดปุ่ม "บันทึก" เพื่อคืนอุปกรณ์
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (returnList.length === 0) {
      setAlert({ show: true, message: 'กรุณาเลือกรายการที่ต้องการคืน' });
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${process.env.WEB_DOMAIN}/api/borrowequipment/return`, { returnList });
      setAlert({ show: true, message: 'คืนอุปกรณ์สำเร็จแล้ว' });
      setReturnList([]);
      // โหลดข้อมูลใหม่เพื่ออัปเดตรายการที่ยังคงค้างอยู่ (ถ้ามี)
      // หรือคุณอาจเลือกให้หน้าจอยังคงเป็นรายการที่เหลืออยู่แล้วก็ได้
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
        <Form noValidate onSubmit={handleSubmit}>
          <Form.Group className="py-2">
            {borrowedItems.length > 0 ? (
              borrowedItems.map((item, index) => (
                <Toast key={index} onClose={() => handleReturnItem(item.borrow_equipment_id, index)} className="mb-2">
                  <Toast.Header>
                    <strong className="me-auto">{item.equipment_name}</strong>
                  </Toast.Header>
                  <Toast.Body>
                    <div style={{ fontWeight: 'bold' }}>หมายเลขอุปกรณ์: {item.equipment_code}</div>
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
          <Form.Group className="d-flex justify-content-center py-3">
            <ButtonState type="submit" className={styles.button} text={isLoading ? 'กำลังบันทึก...' : 'บันทึก'} icon="fas fa-save" isLoading={isLoading} />
          </Form.Group>
        </Form>
      </div>
      <ModalAlert show={alert.show} message={alert.message} handleClose={() => setAlert({ show: false, message: '' })} />
    </Container>
  );
};

export default ReturnOf;
