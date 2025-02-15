import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Toast from 'react-bootstrap/Toast';

import InputLabel from '@/components/Form/InputLabel';
import ModalAlert from '@/components/Modals/ModalAlert';
import ButtonState from '@/components/Button/ButtonState';
import styles from '@/styles/page.module.css';

interface ListItemType {
  id: number;
  listName: string;
  numberCard: string;
  startDate: string;
  endDate: string;
}

const ReturnOf = () => {
  const router = useRouter();
  const [validated, setValidated] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '' });
  const [isLoading, setLoading] = useState(false);
  const [listItem, setListItem] = useState<ListItemType[]>([]);
  const [returnName, setReturnName] = useState('');
  const [returnNote, setReturnNote] = useState('');

  useEffect(() => {
    if (router.query.auToken) {
      fetchApprovedItems(router.query.auToken as string);
    }
  }, [router.query.auToken]);

  const fetchApprovedItems = async (auToken: string) => {
    try {
      const response = await axios.get(`${process.env.WEB_DOMAIN}/api/borrowequipment/approved`, {
        params: { auToken }
      });
      if (response.data.success) {
        setListItem(response.data.data);
      } else {
        setAlert({ show: true, message: 'ไม่พบข้อมูลอุปกรณ์ที่ได้รับอนุมัติให้คืน' });
      }
    } catch (error) {
      setAlert({ show: true, message: 'เกิดข้อผิดพลาดในการโหลดข้อมูล' });
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
            id: item.id,
            listName: item.listName,
            numberCard: item.numberCard,
          })),
        };

        await axios.post(`${process.env.WEB_DOMAIN}/api/borrowequipment/return`, data);
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
          

          {/* แสดงรายการอุปกรณ์ที่ได้รับอนุมัติให้คืน */}
          <Form.Group className="py-2">
            {listItem.length > 0 ? (
              listItem.map((item, index) => (
                <Toast key={index} className="mb-2">
                  <Toast.Header>
                    <strong className="me-auto">{item.listName}</strong>
                  </Toast.Header>
                  <Toast.Body>
                    {item.numberCard}
                    <div className={styles.toastDate}>
                      <span>ยืมเมื่อ {item.startDate}</span>
                      <span>กำหนดคืน {item.endDate}</span>
                    </div>
                  </Toast.Body>
                </Toast>
              ))
            ) : (
              <p>ไม่มีรายการอุปกรณ์ที่ได้รับอนุมัติให้คืน</p>
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
