import React, { useState, useRef } from 'react'

import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import Col from 'react-bootstrap/Col';
import Toast from 'react-bootstrap/Toast';

import InputLabel from '@/components/Form/InputLabel'
import TextareaLabel from '@/components/Form/TextareaLabel'
import ModalAlert from '@/components/Modals/ModalAlert'
import ModalActions from '@/components/Modals/ModalActions'
import ButtonState from '@/components/Button/ButtonState';
import ButtonAdd from '@/components/Button/ButtonAdd';
import DatePickerX from '@/components/DatePicker/DatePickerX';

import styles from '@/styles/page.module.css'

interface ListItemType {
  listName: string;
  numberCard: string;
  startDate: string;
  endDate: string;
}
const ReturnOf = () => {
  const inputRef = useRef<HTMLFormElement>(null)

  const [validated, setValidated] = useState(false);
  const [validatedModal, setValidatedModal] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '' });
  const [isLoading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [modalSave, setModalSave] = useState(false);

  const [listItem, setListItem] = useState<ListItemType[]>([
    { listName: 'ชุดนาฬิกาติดตาม 1', numberCard: 'SW-123456789', startDate: '1/1/2023', endDate: '31/1/2023' },
    { listName: 'ชุดนาฬิกาติดตาม 2', numberCard: 'SW-123456789', startDate: '2/1/2023', endDate: '31/1/2023' },
    { listName: 'ชุดนาฬิกาติดตาม 3', numberCard: 'SW-123456789', startDate: '3/1/2023', endDate: '31/1/2023' },
  ]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    setLoading(true)
    if (form.checkValidity() === false) {
      setAlert({ show: true, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' })
      event.preventDefault();
      event.stopPropagation();

    } else {
      setAlert({ show: true, message: 'ระบบยังอยู่ในช่วงพัฒนา' })
      event.preventDefault();
      event.stopPropagation();
    }
    setTimeout(() => {
      setLoading(false)
    }, 2000);
    setValidated(true);
  };

  // const handleSave = async () => {
  //     try {
  //         const formInput = inputRef.current
  //         if (formInput) {
  //             if (formInput.checkValidity()) {
  //                 setListItem([...listItem, { listName: formInput['listName'].value, numberCard: formInput['numberCard'].value }])
  //                 setModalSave(false)
  //                 setValidatedModal(false);
  //             }else{
  //                 setValidatedModal(true);
  //             }
  //         }

  //     } catch (error) {

  //     }
  // }
  const removeListener = (index: number) => {
    const newList = listItem.filter((item, i) => i !== index)
    setListItem(newList)
  }

  return (
    <Container>
      <div className={styles.main}>
        <h1 className="py-2">คืนอุปกรณ์ครุภัณฑ์</h1>
      </div>
      <div className="px-5">
        <Form noValidate validated={validated} onSubmit={(e) => handleSubmit(e)}>

          <Form.Group className="py-2">
            {
              listItem.length > 0 && listItem.map((item, index) => (
                <Toast key={index} onClose={() => removeListener(index)} className="mb-2">
                  <Toast.Header>
                    <strong className="me-auto">{item.listName}</strong>
                  </Toast.Header>
                  <Toast.Body>
                    {item.numberCard}
                    <div className={styles.toastDate}>
                    <span>เริ่ม {item.startDate}</span>
                    <span>สิ้นสุด {item.endDate}</span>
                    </div>
                  </Toast.Body>
                </Toast>
              ))
            }

          </Form.Group>
          <Form.Group className="d-flex justify-content-center py-3">
            <ButtonState type="submit" className={styles.button} text={'บันทึก'} icon="fas fa-save" isLoading={isLoading} />
          </Form.Group>
        </Form>
      </div>
      <ModalAlert show={alert.show} message={alert.message} handleClose={() => setAlert({ show: false, message: '' })} />
      {/* <ModalActions show={modalSave} title='เพิ่มข้อมูลอุปกรณ์' onClick={() => handleSave()} onHide={() => setModalSave(false)}>
              <Form noValidate validated={validatedModal} ref={inputRef}>
                  <Form.Group>
                      <InputLabel label='รายการ' id='listName' placeholder="กรอกรายการ" required />
                  </Form.Group>
                  <Form.Group>
                      <InputLabel label='หมายเลขชุดอุปกรณ์' id='numberCard' placeholder="กรอกหมายเลขชุดอุปกรณ์" required />
                  </Form.Group>
              </Form>
          </ModalActions> */}
    </Container>
  )
}

export default ReturnOf