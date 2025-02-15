import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Toast from 'react-bootstrap/Toast';

import InputLabel from '@/components/Form/InputLabel';
import ModalAlert from '@/components/Modals/ModalAlert';
import ButtonState from '@/components/Button/ButtonState';
import styles from '@/styles/page.module.css';

interface ListItemType {
  borrow_equipment_id: number;
  borrow_equipment: string;
  borrow_equipment_number: string;
  borrow_date: string;
  borrow_return: string;
}

const ReturnOf = () => {
  const inputRef = useRef<HTMLFormElement>(null);

  const [validated, setValidated] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '' });
  const [isLoading, setLoading] = useState(false);
  const [listItem, setListItem] = useState<ListItemType[]>([]);

  useEffect(() => {
    fetchEquipmentList();
  }, []);

  // ✅ ดึงข้อมูลชุดอุปกรณ์จากฐานข้อมูลผ่าน API
  const fetchEquipmentList = async () => {
    try {
      const response = await axios.get(`${process.env.WEB_DOMAIN}/api/admin/getBorrowEquipmentListReturn`);
      if (response.data.success) {
        setListItem(response.data.data);
      } else {
        setAlert({ show: true, message: 'ไม่พบข้อมูลอุปกรณ์ที่ต้องคืน' });
      }
    } catch (error) {
      setAlert({ show: true, message: 'เกิดข้อผิดพลาดในการโหลดข้อมูล' });
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setValidated(true);
    }, 2000);

    setAlert({ show: true, message: 'ระบบยังอยู่ในช่วงพัฒนา' });
  };

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
                    <strong className="me-auto">{item.borrow_equipment}</strong>
                  </Toast.Header>
                  <Toast.Body>
                    {item.borrow_equipment_number}
                    <div className={styles.toastDate}>
                      <span>เริ่ม {item.borrow_date}</span>
                      <span>สิ้นสุด {item.borrow_return}</span>
                    </div>
                  </Toast.Body>
                </Toast>
              ))
            ) : (
              <p>ไม่มีรายการอุปกรณ์ที่ต้องคืน</p>
            )}
          </Form.Group>
          <Form.Group className="d-flex justify-content-center py-3">
            <ButtonState type="submit" className={styles.button} text={'บันทึก'} icon="fas fa-save" isLoading={isLoading} />
          </Form.Group>
        </Form>
      </div>
      <ModalAlert show={alert.show} message={alert.message} handleClose={() => setAlert({ show: false, message: '' })} />
    </Container>
  );
};

export default ReturnOf;
