import React, { useState, useEffect } from 'react';
import axios from 'axios';

import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Toast from 'react-bootstrap/Toast';

import ModalAlert from '@/components/Modals/ModalAlert';
import ButtonState from '@/components/Button/ButtonState';
import styles from '@/styles/page.module.css';

interface ListItemType {
  borrow_equipment_id: number;
  listName: string;
  numberCard: string;
  startDate: string;
  endDate: string;
}

const ReturnOf = () => {
  const [validated, setValidated] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '' });
  const [isLoading, setLoading] = useState(false);
  const [listItem, setListItem] = useState<ListItemType[]>([]);
  const [returnName, setReturnName] = useState('');
  const [returnNote, setReturnNote] = useState('');

  useEffect(() => {
    fetchBorrowedEquipment();
  }, []);

  // 📌 ดึงข้อมูลอุปกรณ์ที่ยืมไปแล้ว (แต่ยังไม่คืน)
  const fetchBorrowedEquipment = async () => {
    try {
      const response = await axios.get(`${process.env.WEB_DOMAIN}/borrowequipment/borrow`);
      if (response.data.success) {
        setListItem(response.data.data);
      } else {
        setAlert({ show: true, message: 'ไม่พบข้อมูลอุปกรณ์ที่ถูกยืม' });
      }
    } catch (error) {
      setAlert({ show: true, message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลอุปกรณ์ที่ยืม' });
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (listItem.length > 0) {
        const data = {
          return_name: returnName,
          return_note: returnNote,
          return_list: listItem.map(item => ({
            id: item.borrow_equipment_id,
            listName: item.listName,
            numberCard: item.numberCard,
          })),
        };

        await axios.post(`${process.env.WEB_DOMAIN}/api/borrowequipment/return_of`, data);
        setAlert({ show: true, message: 'คืนอุปกรณ์สำเร็จ' });
        setListItem([]);
        setReturnName('');
        setReturnNote('');
      } else {
        setAlert({ show: true, message: 'ไม่มีอุปกรณ์ให้คืน' });
      }
    } catch (error) {
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
          <Form.Group>
            <label>ชื่อผู้คืน:</label>
            <input
              type="text"
              value={returnName}
              onChange={(e) => setReturnName(e.target.value)}
              placeholder="กรอกชื่อผู้คืน"
              required
              className="form-control"
            />
          </Form.Group>

          <Form.Group>
            <label>หมายเหตุการคืน:</label>
            <input
              type="text"
              value={returnNote}
              onChange={(e) => setReturnNote(e.target.value)}
              placeholder="กรอกหมายเหตุ (ถ้ามี)"
              className="form-control"
            />
          </Form.Group>

          {/* แสดงรายการอุปกรณ์ที่ยืมไป แต่ยังไม่ได้คืน */}
          <Form.Group className="py-2">
            {listItem.length > 0 ? (
              listItem.map((item, index) => (
                <Toast key={index} className="mb-2">
                  <Toast.Header>
                    <strong className="me-auto">{item.listName}</strong>
                  </Toast.Header>
                  <Toast.Body>
                    หมายเลขอุปกรณ์: {item.numberCard}
                    <div className={styles.toastDate}>
                      <span>ยืมเมื่อ {item.startDate}</span>
                      <span>กำหนดคืน {item.endDate}</span>
                    </div>
                  </Toast.Body>
                </Toast>
              ))
            ) : (
              <p>ไม่มีรายการอุปกรณ์ที่ต้องคืน</p>
            )}
          </Form.Group>

          <Form.Group className="d-flex justify-content-center py-3">
            <ButtonState type="submit" className={styles.button} text={'บันทึกการคืน'} icon="fas fa-save" isLoading={isLoading} />
          </Form.Group>
        </Form>
      </div>
      <ModalAlert show={alert.show} message={alert.message} handleClose={() => setAlert({ show: false, message: '' })} />
    </Container>
  );
};

export default ReturnOf;
