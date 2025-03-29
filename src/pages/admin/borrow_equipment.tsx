import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useDispatch } from 'react-redux';

import LayoutPage from '@/components/LayoutPage';
import { getBorrowEquipmentList, updateBorrowEquipmentStatus } from '@/lib/service/borrowEquipment';
import { openModalAlert } from '@/redux/features/modal';

import { Card, Container, Row, Form, Button, Table, Modal } from 'react-bootstrap';
import moment from 'moment';
import axios from 'axios';
import { replyNotificationSendBorrow } from '@/utils/apiLineReply'; // หรือใช้ path ที่ถูกต้องตามที่ไฟล์จริงอยู่

const defaultShowState = {
  isShow: false,
  title: '',
  body: {
    borrow_id: 0,
    users_id_ref: {
      users_fname: '',
      users_sname: ''
    },
    borrow_name: '',
    borrow_date: '',
    borrow_return: '',
    borrow_equipment_status: 1,
    borrow_approver_ref: {
      users_fname: '',
      users_sname: ''
    },
    borrow_approver_date: '',
    borrowequipment_list: []
  }
};

const BorrowEquipment = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const dispatch = useDispatch();

  const [validated, setValidated] = useState(false);
  const [show, setShow] = useState(defaultShowState);
  const [showQuestionnaire, setShowQuestionnaire] = useState({ isShow: false, title: '', body: {} });
  const [borrowEquipmentList, setBorrowEquipmentList] = useState<any[]>([]);

  // เพิ่ม State สำหรับเก็บข้อมูลอุปกรณ์ทั้งหมด (จาก model equipment)
  const [equipmentListAll, setEquipmentListAll] = useState<any[]>([]);
  // State สำหรับเก็บ equipment_id ที่เจ้าหน้าที่เลือก
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);

  // State สำหรับวันที่เริ่มและสิ้นสุด (ถ้าต้องการระบุวันที่)
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const borrow_equipment_status = React.createRef<HTMLSelectElement>();

  useEffect(() => {
    getBorrowEquipmentListData('', '', '');
    fetchAllEquipment();
  }, []);

  const getBorrowEquipmentListData = useCallback(async (name: string, name_borrow: string, status: string) => {
    try {
      const res = await getBorrowEquipmentList(name, name_borrow, status);
      if (res.data) {
        setBorrowEquipmentList(res.data);
      }
    } catch (error) {
      console.log("🚀 ~ getBorrowEquipmentListData ~ error:", error);
    }
  }, []);

  // ฟังก์ชันดึงข้อมูลอุปกรณ์ทั้งหมดจาก API (ไม่มีเงื่อนไข)
  const fetchAllEquipment = async () => {
    try {
      const res = await axios.get('/api/borrowequipment/getAvailableEquipment');
      if (res.data?.data) {
        setEquipmentListAll(res.data.data);
      } else {
        setEquipmentListAll(res.data);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
    }
  };

  // เมื่อเปลี่ยนวันที่เริ่มยืม ให้คำนวณวันที่สิ้นสุด (ตัวอย่างเพิ่ม 90 วัน)
  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (value) {
      const calculatedEndDate = moment(value).add(90, 'days').format('YYYY-MM-DD');
      setEndDate(calculatedEndDate);
    } else {
      setEndDate('');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      setValidated(true);
      return;
    }
    await getBorrowEquipmentListData(form['name_user'].value, form['name_borrow'].value, form['status'].value);
  };

  const handleClose = () => {
    setShow(defaultShowState);
    setShowQuestionnaire({ isShow: false, title: '', body: {} });
    // รีเซ็ต state ที่เกี่ยวข้องกับการเลือกอุปกรณ์และวันที่
    setSelectedEquipmentId(null);
    setStartDate('');
    setEndDate('');
  };

  const handleSaveBorrow = useCallback(async () => {
    try {
      const borrow_equipment_status_value = borrow_equipment_status.current?.value;
      if (!borrow_equipment_status_value || !show.body.borrow_id || !user.userId) {
        return;
      }
      // 1) อัปเดตสถานะการยืม (ตามที่มีอยู่เดิม)
      await updateBorrowEquipmentStatus(
        parseInt(borrow_equipment_status_value),
        user.userId,
        show.body.borrow_id
      );
      // 2) ถ้าเจ้าหน้าที่เลือกอุปกรณ์และระบุวันที่เริ่ม (และสิ้นสุด) แล้ว
      if (selectedEquipmentId && startDate && endDate) {
        // เรียก API เพื่อเพิ่มข้อมูลอุปกรณ์ที่ยืมลงใน borrowequipment_list
        await axios.post('/api/borrowequipment_list/add', {
          borrow_id: show.body.borrow_id,
          equipment_id: selectedEquipmentId,
          borrow_start_date: startDate,
          borrow_end_date: endDate,
        });
      }
      handleClose();
      dispatch(openModalAlert({ show: true, message: 'บันทึกสำเร็จ' }));
      await getBorrowEquipmentListData('', '', '');
    } catch (error) {
      console.log("🚀 ~ handleSaveBorrow ~ error", error);
      dispatch(openModalAlert({ show: true, message: 'บันทึกไม่สำเร็จ' }));
    }
  }, [
    borrow_equipment_status,
    show,
    user,
    selectedEquipmentId,
    startDate,
    endDate,
    dispatch,
    getBorrowEquipmentListData
  ]);

  return (
    <LayoutPage>
      <Container fluid>
        <Row className="py-3">
          <Card className="card-stats card-dashboard shadow mb-4 mb-xl-0 p-0">
            <Card.Header>
              <Card.Title>ค้นหา</Card.Title>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={(e) => handleSubmit(e)} noValidate validated={validated} className="row p-2">
                <Form.Group className="col">
                  <Form.Label>ชื่อ-สกุล ของผู้ดูแลผู้สูงอายุ</Form.Label>
                  <Form.Control type="text" name="name_user" placeholder="ชื่อ-สกุล ของผู้ดูแลผู้สูงอายุ" />
                </Form.Group>
                <Form.Group className="col">
                  <Form.Label>ชื่อ-สกุล ของผู้สูงอายุ </Form.Label>
                  <Form.Control type="text" name="name_borrow" placeholder="ชื่อ-สกุล ของผู้สูงอายุ" />
                </Form.Group>
                <Form.Group className="col">
                  <Form.Label>สถานะ</Form.Label>
                  <Form.Select name={'status'}>
                    <option value={''}>{'เลือกสถานะ'}</option>
                    <option value={'1'}>{'รออนุมัติ'}</option>
                    <option value={'2'}>{'อนุมัติ'}</option>
                    <option value={'3'}>{'ไม่อนุมัติ'}</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="col d-flex align-items-end">
                  <Button variant="primary" type="submit">
                    ค้นหา
                  </Button>
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </Row>
        <Row>
          <Card className="card-stats card-dashboard shadow mb-4 mb-xl-0 p-0">
            <Card.Header>
              <p className="m-0">รายการยืมครุภัณฑ์</p>
            </Card.Header>
            <Card.Body>
            <Table striped bordered hover>
  <thead>
    <tr>
      <th className="px-2">ลำดับ</th>
      <th className="px-2">ชื่อ-สกุล ของผู้ดูแลผู้สูงอายุ</th>
      <th className="px-2">ชื่อ-สกุล ของผู้สูงอายุ</th>
      <th className="px-2">แบบสอบถาม</th>
      <th className="px-2">วันที่ขอ</th>
      <th className="px-2">วันที่สิ้นสุด</th>
      <th className="px-2">สถานะ</th>
      <th className="px-2">เครื่องมือ</th>
      <th className="px-2">แจ้ง</th> {/* เพิ่มคอลัมน์สำหรับปุ่มส่งแจ้งเตือน */}
    </tr>
  </thead>
  <tbody>
    {borrowEquipmentList.map((item: any, index: number) => {
      return (
        <tr key={index}>
          <td className="px-2">{index + 1}</td>
          <td className="px-2">
            {item.users_id_ref.users_fname + ' ' + item.users_id_ref.users_sname}
          </td>
          <td className="px-2">{item.borrow_name}</td>
          <td className="px-2">
            <Button
              variant="link"
              className="p-0 btn-edit"
              onClick={() =>
                setShowQuestionnaire({ isShow: true, title: item.borrow_name, body: '' })
              }
            >
              <i className="fa-solid fa-file"></i>
            </Button>
          </td>
          <td className="px-2">{moment(item.borrow_date).format('DD-MM-YYYY')}</td>
          <td className="px-2">
            {item.borrow_return ? moment(item.borrow_return).format('DD-MM-YYYY') : '-'}
          </td>
          <td className="px-2">
            {item.borrow_equipment_status === 1
              ? 'รออนุมัติ'
              : item.borrow_equipment_status === 2
              ? <span className="alert-success">{'อนุมัติ'}</span>
              : <span className="alert-danger">{'ไม่อนุมัติ'}</span>}
          </td>
          <td className="px-2">
            <Button
              variant="link"
              className="p-0 btn-edit"
              onClick={() => setShow({ isShow: true, title: item.borrow_name, body: item })}
            >
              <i className="fas fa-edit"></i>
            </Button>
          </td>
          {/* ปุ่มแจ้งเตือน */}
          <td className="px-2">
            <Button
              variant="success"
              onClick={() => replyNotificationSendBorrow({
                replyToken: item.reply_token, // ตัวแปรนี้ต้องดึงจากข้อมูลที่ได้
                userData: item // ส่งข้อมูลของผู้ยืม
              })}
            >
              ส่ง
            </Button>
          </td>
        </tr>
      );
    })}
  </tbody>
</Table>

            </Card.Body>
          </Card>
        </Row>

        {/* Modal สำหรับดู/แก้ไขรายการยืม */}
        <Modal show={show.isShow} onHide={() => handleClose()} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{show.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Table striped bordered hover>
              <tbody>
                <tr>
                  <td className="px-2">{'ชื่อ-สกุล ของผู้ดูแลผู้สูงอายุ'}</td>
                  <td className="px-2">
                    {show.body.users_id_ref.users_fname} {show.body.users_id_ref.users_sname}
                  </td>
                </tr>
                <tr>
                  <td className="px-2">{'ชื่อ-สกุล ของผู้สูงอายุ'}</td>
                  <td className="px-2">{show.body.borrow_name}</td>
                </tr>
                <tr>
                  <td className="px-2">{'วันที่ขอ'}</td>
                  <td className="px-2">{moment(show.body.borrow_date).format('DD-MM-YYYY')}</td>
                </tr>
                <tr>
                  <td className="px-2">{'วันที่สินสุด'}</td>
                  <td className="px-2">
                    {show.body.borrow_return ? moment(show.body.borrow_return).format('DD-MM-YYYY') : '-'}
                  </td>
                </tr>
                <tr>
                  <td className="px-2">{'สถานะ'}</td>
                  <td className="px-2">
                    {show.body.borrow_equipment_status === 1
                      ? 'รออนุมัติ'
                      : show.body.borrow_equipment_status === 2
                      ? <span className="alert-success">{'อนุมัติ'}</span>
                      : <span className="alert-danger">{'ไม่อนุมัติ'}</span>}
                  </td>
                </tr>
                <tr>
                  <td className="px-2">{'ผู้อนุมัติ'}</td>
                  <td className="px-2">
                    {show.body.borrow_approver_ref?.users_fname} {show.body.borrow_approver_ref?.users_sname}
                  </td>
                </tr>
                <tr>
                  <td className="px-2">{'ผู้อนุมัติวันที่'}</td>
                  <td className="px-2">
                    {show.body.borrow_approver_date ? moment(show.body.borrow_approver_date).format('DD-MM-YYYY') : ''}
                  </td>
                </tr>
              </tbody>
            </Table>
            {/* <Form.Group>
              <Form.Label>เครื่องที่ยืม</Form.Label>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th className="px-2">ลำดับ</th>
                    <th className="px-2">รายการ</th>
                    <th className="px-2">ID เครื่อง</th>
                  </tr>
                </thead>
                <tbody>
                  {show.body.borrowequipment_list.map((item: any, index: number) => (
                    <tr key={index}>
                      <td className="px-2">{index + 1}</td>
                      <td className="px-2">{item.equipment?.equipment_name || '-'}</td>
                      <td className="px-2">{item.equipment?.equipment_code || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Form.Group> */}

            {/* ส่วนเพิ่ม: ให้แอดมินเลือกอุปกรณ์ (ดึงจาก equipmentListAll) และเลือกวันที่ */}
            <hr />
            <h5>เพิ่ม/แก้ไขชุดอุปกรณ์ (โดยเจ้าหน้าที่)</h5>
            <Form.Group className="mb-3">
              <Form.Label>เลือกอุปกรณ์</Form.Label>
              <Form.Select
                value={selectedEquipmentId ?? ''}
                onChange={(e) => setSelectedEquipmentId(Number(e.target.value))}
              >
                <option value="">-- เลือกอุปกรณ์ --</option>
                {equipmentListAll.map((eq) => (
                  <option key={eq.equipment_id} value={eq.equipment_id}>
                    {eq.equipment_name} ({eq.equipment_code})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>วันที่เริ่มยืม</Form.Label>
              <Form.Control
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
            </Form.Group>
            {startDate && (
              <p>
                วันที่สิ้นสุด (90 วัน): <strong>{endDate || '-'}</strong>
              </p>
            )}
            <hr />
            <Form.Group>
              <Form.Label>เลือกสถานะ</Form.Label>
              <Form.Select name={'borrow_equipment_status'} ref={borrow_equipment_status}>
                <option value="">{'เลือกสถานะ'}</option>
                <option value="1">{'รออนุมัติ'}</option>
                <option value="2">{'อนุมัติ'}</option>
                <option value="3">{'ไม่อนุมัติ'}</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => handleClose()}>
              ปิด
            </Button>
            <Button variant="primary" onClick={() => handleSaveBorrow()}>
              บันทึก
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal สำหรับแบบสอบถาม */}
        <Modal show={showQuestionnaire.isShow} onHide={() => handleClose()} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{'แบบสอบถามการดูแลผู้สูงอายุ'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h5>ตอนที่ 1 ข้อมูลทั่วไปของผู้สูงอายุ</h5>
            <Table striped bordered hover>
              <tbody>
                <tr>
                  <td className="px-2">{'1.เพศ'}</td>
                  <td className="px-2">{'หญิง'}</td>
                </tr>
                <tr>
                  <td className="px-2">{'2.อายุ'}</td>
                  <td className="px-2">{'70'}</td>
                </tr>
                <tr>
                  <td className="px-2">{'3.สถานภาพสมรส'}</td>
                  <td className="px-2">{'สมรส'}</td>
                </tr>
                <tr>
                  <td className="px-2">{'4.ลักษณะของครอบครัว'}</td>
                  <td className="px-2">{'ครอบครัวเดี่ยว'}</td>
                </tr>
                <tr>
                  <td className="px-2">{'5.ระดับการศึกษา'}</td>
                  <td className="px-2">{'มัธยมศึกษา'}</td>
                </tr>
                <tr>
                  <td className="px-2">{'6.รายได้'}</td>
                  <td className="px-2">{'ตนเอง'}</td>
                </tr>
                <tr>
                  <td className="px-2">{'7.ท่านมีรายได้เพียงพอต่อค่าใช้จ่ายหรือไม่'}</td>
                  <td className="px-2">{'ใช้จ่ายเพียงพอไม่มีหนี้สิน'}</td>
                </tr>
                <tr>
                  <td className="px-2">{'8.ท่านมีโรคประจําตัว'}</td>
                  <td className="px-2">{'ไม่มี'}</td>
                </tr>
                <tr>
                  <td className="px-2">{'9.รับประทานยา'}</td>
                  <td className="px-2">{'ไม่จําเป็นต้องรับประทานยา'}</td>
                </tr>
                <tr>
                  <td className="px-2">{'10.การเข้าถึงระบบบริการสุขภาพ'}</td>
                  <td className="px-2">{'สะดวกในการเข้าถึง'}</td>
                </tr>
                <tr>
                  <td className="px-2">{'11.การมีผู้ดูแลผู้สูงอายุ'}</td>
                  <td className="px-2">{'มีผู้ดูแล'}</td>
                </tr>
                <tr>
                  <td className="px-2">{'12.การเข้าร่วมกิจกรรม'}</td>
                  <td className="px-2">{'เป็นสมาชิกชมรมผู้สูงอายุ และเข้าร่วมกิจกรรมไม่  สม่ำเสมอ (น้อยกว่า 8 ครั้งต่อปี)'}</td>
                </tr>
              </tbody>
            </Table>
            <h5>ตอนที่ 2 ความสามารถในการประกอบกิจวัตรประจำวัน</h5>
            <Table striped bordered hover>
              <tbody>
                <tr>
                  <td className="px-2">{'1.รับประทานอาหารเมื่อเตรียมสํารับไว้ให้เรียบร้อยต่อหน้า '}</td>
                  <td className="px-2">{'1 คะแนน ตักอาหารเองได้ แต่ต้องมีคนช่วย เช่น ช่วยใช้ช้อนตักเตรียมไว้'}</td>
                </tr>
                <tr>
                  <td className="px-2">{'2.การล้างหน้า หวีผม แปรงฟัน โกนหนวดในระยะเวลา 24–48 ชั่วโมงที่ผ่านมา'}</td>
                  <td className="px-2">{'1 คะแนน ทําได้เอง (รวมทั้งที่ทําได้เองถ้าเตรียมอุปกรณ์ไว้ให้)'}</td>
                </tr>
                <tr>
                  <td className="px-2">{'3.ลุกนั่งจากที่นอน หรือจากเตียงไปยังเก้าอี้'}</td>
                  <td className="px-2">{'3 คะแนน ทําได้เอง'}</td>
                </tr>
                <tr>
                  <td className="px-2">{'4.การใช้ห้องน้ำ'}</td>
                  <td className="px-2">{'2 คะแนน ช่วยเหลือตัวเองได้ดี (ขึ้นนั่งและลงจากโถส้วมเองได้ ทําความสะอาดได้เรียบร้อย หลังจากเสร็จธุระ ถอดใส่เสื้อผ้าได้เรียบร้อย'}</td>
                </tr>
                <tr>
                  <td className="px-2">{'5.การเคลื่อนที่ภายในห้องหรือบ้าน '}</td>
                  <td className="px-2">{'3 คะแนน เดินหรือเคลื่อนที่ได้เอง'}</td>
                </tr>
                <tr>
                  <td className="px-2">{'6.การสวมใส่เสื้อผ้า'}</td>
                  <td className="px-2">{'2 คะแนน ช่วยตัวเองได้ดี '}</td>
                </tr>
                <tr>
                  <td className="px-2">{'7.การขึ้นลงบันได 1 ชั้น'}</td>
                  <td className="px-2">{'2 คะแนน ขึ้นลงได้เอง (ถ้าต้องใช้เครื่องช่วยเดิน เช่น Walker จะต้องเอาขึ้นลงได้ด้วย)'}</td>
                </tr>
                <tr>
                  <td className="px-2">{'8.การอาบน้ำ'}</td>
                  <td className="px-2">{'1 คะแนน อาบน้ำได้เอง'}</td>
                </tr>
                <tr>
                  <td className="px-2">{'9.การกลั้นการถ่ายอุจจาระ ใน 1 สัปดาห์ที่ผ่านมา'}</td>
                  <td className="px-2">{'2 คะแนน กลั้นได้เป็นปกติ'}</td>
                </tr>
                <tr>
                  <td className="px-2">{'10.	การกลั้นปัสสาวะในระยะ 1 สัปดาห์ที่ผ่านมา'}</td>
                  <td className="px-2">{'2 คะแนน กลั้นได้เป็นปกติ'}</td>
                </tr>
              </tbody>
            </Table>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => handleClose()}>
              ปิด
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </LayoutPage>
  );
};

export default BorrowEquipment;
