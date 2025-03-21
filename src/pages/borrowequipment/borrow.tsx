import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Toast from 'react-bootstrap/Toast';

import InputLabel from '@/components/Form/InputLabel';
import TextareaLabel from '@/components/Form/TextareaLabel';
import ModalAlert from '@/components/Modals/ModalAlert';
import ModalActions from '@/components/Modals/ModalActions';
import ButtonState from '@/components/Button/ButtonState';
import ButtonAdd from '@/components/Button/ButtonAdd';
import DatePickerX from '@/components/DatePicker/DatePickerX';
import { encrypt } from '@/utils/helpers'
import styles from '@/styles/page.module.css';
import moment from 'moment';
interface EquipmentType {
    equipment_id: number;
    equipment_name: string;
    equipment_code: string;
}

const Borrow = () => {
    const router = useRouter();
    const inputRef = useRef<HTMLFormElement>(null);

    const [validated, setValidated] = useState(false);
    const [validatedModal, setValidatedModal] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '' });
    const [isLoading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState<Date | null>(new Date());
    const [endDate, setEndDate] = useState<Date | null>(new Date());
    const [modalSave, setModalSave] = useState(false);

    const [user, setUser] = useState<any>(null);
    const [availableEquipment, setAvailableEquipment] = useState<EquipmentType[]>([]);
    const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType | null>(null);
    const [listItem, setListItem] = useState<EquipmentType[]>([]);
    const [carePerson, setCarePerson] = useState<any>(null);

    const [answers, setAnswers] = useState<any>({
        question1: '',
        question2: '',
        question3: '',
        question4: '',
        question5: '',
        question6: '',
        question7: '',
        question8: '',
        question9: '',
        question10: ''
    });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, question: string) => {
        setAnswers({
            ...answers,
            [question]: e.target.value
        });
    };

    // โหลดรายการอุปกรณ์ครั้งเดียวเมื่อ component mount
    useEffect(() => {
        fetchAvailableEquipment();
    }, []);

    // โหลดข้อมูลผู้ใช้เมื่อค่า auToken พร้อมใช้งาน
    useEffect(() => {
        if (router.query.auToken) {
            fetchUserData();
        }
    }, [router.query.auToken]);

     // ฟังก์ชันที่คำนวณวันที่สิ้นสุด (90 วันหลังจากวันที่เริ่ม)
     const handleStartDateChange = (date: Date | null) => {
        if (date) {
            setStartDate(date);
            // คำนวณวันที่สิ้นสุด (90 วันหลังจากวันที่เริ่ม)
            const calculatedEndDate = moment(date).add(90, 'days').toDate();
            setEndDate(calculatedEndDate);  // ตั้งค่าวันที่สิ้นสุด
        }
    };

    const fetchAvailableEquipment = async () => {
        try {
            const response = await axios.get(`/api/borrowequipment/getAvailableEquipment`);
            if (response.data?.data) {
                setAvailableEquipment(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching available equipment:", error);
            setAlert({ show: true, message: 'ไม่สามารถโหลดรายการอุปกรณ์ได้' });
        }
    };

    const fetchUserData = async () => {
        try {
            const auToken = router.query.auToken;
            if (auToken) {
                const responseUser = await axios.get(`${process.env.WEB_DOMAIN}/api/user/getUser/${auToken}`);
                if (responseUser.data?.data) {
                    setUser(responseUser.data.data);
                    const encodedUsersId = encrypt(responseUser.data?.data.users_id.toString());
                    // ดึงข้อมูลผู้สูงอายุจากผู้ดูแล
                    const responseTakecareperson = await axios.get(`${process.env.WEB_DOMAIN}/api/user/getUserTakecareperson/${encodedUsersId}`);
                    const data = responseTakecareperson.data?.data;
                    if (data) {
                        setCarePerson(data);  // เก็บข้อมูลผู้สูงอายุที่ดูแล
                    }
                } else {
                    setAlert({ show: true, message: 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้' });
                }
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            setAlert({ show: true, message: 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้' });
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();

        // ตรวจสอบว่ามีการเพิ่มอุปกรณ์และข้อมูลผู้ใช้ถูกโหลดแล้ว
        if (!listItem.length || !user || !carePerson) {
            setAlert({ show: true, message: 'กรุณาเลือกอุปกรณ์และกรอกข้อมูลให้ครบถ้วน' });
            return;
        }

        setLoading(true);

        try {
            const data = {
                borrow_date: startDate,
                borrow_return: endDate,
                borrow_status: 1,
                borrow_user_id: user.users_id,
                borrow_address: event.currentTarget['borrow_address'].value,
                borrow_tel: event.currentTarget['borrow_tel'].value,
               // borrow_objective: event.currentTarget['borrow_objective'].value,
                borrow_name: event.currentTarget['borrow_name'].value, // เก็บชื่อผู้สูงอายุ
                borrow_list: listItem.map(item => ({ equipment_id: item.equipment_id }))
               // answers: answers  // เพิ่มการส่งคำตอบจากแบบสอบถาม
            };

            await axios.post(`${process.env.WEB_DOMAIN}/api/borrowequipment/create`, data);
            setAlert({ show: true, message: 'บันทึกข้อมูลสำเร็จ' });
        } catch (error) {
            setAlert({ show: true, message: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง' });
        } finally {
            setLoading(false);
            setValidated(true);
        }
    };

    const handleAddEquipment = () => {
        if (selectedEquipment && !listItem.some(item => item.equipment_id === selectedEquipment.equipment_id)) {
            setListItem([...listItem, selectedEquipment]);
            setModalSave(false);
        } else {
            setValidatedModal(true);
        }
    };

    const removeItem = (index: number) => {
        setListItem(listItem.filter((_, i) => i !== index));
    };

    return (
        <Container>
            <div className={styles.main}>
                <h1 className="py-2">ยืมอุปกรณ์นาฬิกา</h1>
            </div>
            <div className="px-5">
                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    {/* ชื่อผู้ดูแล */}
                    <Form.Group>
                        <Form.Label>ชื่อผู้ดูแล</Form.Label>
                        <Form.Control
                            value={user ? `${user.users_fname} ${user.users_sname}` : ''}
                            readOnly
                            disabled
                        />
                    </Form.Group>

                    {/* ชื่อผู้สูงอายุ */}
                    <Form.Group>
                        <Form.Label>ชื่อผู้สูงอายุ</Form.Label>
                        <Form.Control
                            value={carePerson ? `${carePerson.takecare_fname} ${carePerson.takecare_sname}` : ''}
                            disabled
                            readOnly
                        />
                        <Form.Control
                            type="hidden"
                            id="borrow_name"
                            name="borrow_name"
                            value={carePerson ? `${carePerson.takecare_fname} ${carePerson.takecare_sname}` : ''}
                        />
                    </Form.Group>

                    {/* ที่อยู่และเบอร์โทร */}
                    <Form.Group>
                        <Form.Label>ที่อยู่</Form.Label>
                        <Form.Control 
                            value={user ? `${user.users_number} ${user.users_moo} ${user.users_road} ${user.users_tubon} ${user.users_amphur} ${user.users_province} ${user.users_postcode}` :''}
                            disabled
                            readOnly />
                             <Form.Control
                            type="hidden"
                            id="borrow_address"
                            name="borrow_address"
                            value={user ? `${user.users_number} ${user.users_moo} ${user.users_road} ${user.users_tubon} ${user.users_amphur} ${user.users_province} ${user.users_postcode}` :''}
                        />
                        
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>เบอร์โทรศัพท์</Form.Label>
                        <Form.Control 
                            value={user ? `${user.users_tel1} ` :''}
                            disabled
                            readOnly />
                             <Form.Control
                            type="hidden"
                            id="borrow_tel"
                            name="borrow_tel"
                            value={user ? `${user.users_tel1} ` :''}
                        />
                    </Form.Group>
                   
            
                    
                    <p className="m-0">กรุณาเลือกวันที่ต้องการยืมอุปกรณ์นาฬิกา</p>
                    <DatePickerX selected={startDate} onChange={handleStartDateChange} />

                    <p className="m-0">วันเดือนปี (สิ้นสุด)</p>
                    <DatePickerX selected={endDate} onChange={setEndDate} disabled/>

                    <h1 className="py-2">กรุณากรอกแบบสอบถาม</h1>
                    <h3 className="py-2">ตอนที่ 1 ข้อมูลทั่วไปของผู้สูงอายุ</h3>
                    <TextareaLabel label='1.เพศ' id="borrow_address" required />
                    <TextareaLabel label='2.อายุ' id="borrow_address" required />
                    <TextareaLabel label='3.สถานภาพสมรส' id="borrow_address" required />
                    <TextareaLabel label='4.ลักษณะของครอบครัว' id="borrow_address" required />
                    <TextareaLabel label='5.ระดับการศึกษา' id="borrow_address" required />
                    <TextareaLabel label='6.รายได้' id="borrow_address" required />
                    <TextareaLabel label='7.ท่านมีรายได้เพียงพอต่อค่าใช้จ่ายหรือไม่' id="borrow_address" required />
                    <TextareaLabel label='8.ท่านมีโรคประจำตัวหรือไม่' id="borrow_address" required />
                    <TextareaLabel label='9.การรับประทานยา' id="borrow_address" required />
                    <TextareaLabel label='10.การเข้าถึงระบบบริการสุขภาพ' id="borrow_address" required />
                    <TextareaLabel label='11.การมีผู้ดูแลผู้สูงอายุ' id="borrow_address" required />
                    <TextareaLabel label='12.การเข้าร่วมกิจกรรม' id="borrow_address" required />
                    
                     <h3>ตอนที่2.ความสามารถในการทำกิจกรรมพื้นฐาน</h3>

                    {/* แทรกคำถาม 1 */}
                    <Form.Group controlId="question1">
                        <Form.Label>1. รับประทานอาหารเมื่อเตรียมสำหรับไว้ให้เรียบร้อยต่อหน้า</Form.Label>
                        <Col>
                            <Form.Check 
                                type="radio"
                                label="0 ไม่สามารถตักอาหารเข้าปากได้ ต้องมีคนป้อนให้"
                                value="0"
                                checked={answers.question1 === '0'}
                                onChange={(e) => handleChange(e, 'question1')}
                            />
                            <Form.Check 
                                type="radio"
                                label="1 ตักอาหารเองได้ แต่ต้องมีคนช่วย"
                                value="1"
                                checked={answers.question1 === '1'}
                                onChange={(e) => handleChange(e, 'question1')}
                            />
                            <Form.Check 
                                type="radio"
                                label="2 ตักอาหารและช่วยตัวเองได้เป็นปกติ"
                                value="2"
                                checked={answers.question1 === '2'}
                                onChange={(e) => handleChange(e, 'question1')}
                            />
                        </Col>
                    </Form.Group>
                     {/* คำถามที่ 2 */}
            <Form.Group controlId="question2">
                <Form.Label>2. ล้างหน้า หวีผม แปรงฟัน โกนหนวด ในระยะเวลา 24 – 48 ชั่วโมงที่ผ่านมา</Form.Label>
                <Col>
                    <Form.Check 
                        type="radio"
                        label="0 ต้องการความช่วยเหลือ"
                        value="0"
                        checked={answers.question2 === '0'}
                        onChange={(e) => handleChange(e, 'question2')}
                    />
                    <Form.Check 
                        type="radio"
                        label="1 ทำเองได้ (รวมทั้งที่ทำได้เอง ถ้าเตรียมอุปกรณ์ไว้ให้)"
                        value="1"
                        checked={answers.question2 === '1'}
                        onChange={(e) => handleChange(e, 'question2')}
                    />
                </Col>
            </Form.Group>

            {/* คำถามที่ 3 */}
            <Form.Group controlId="question3">
                <Form.Label>3. ลุกนั่งจากที่นอน หรือจากเตียงไปยังเก้าอี้</Form.Label>
                <Col>
                    <Form.Check 
                        type="radio"
                        label="0 ไม่สามารถนั่งได้ (นั่งแล้วจะล้มเสมอ) หรือต้องใช้คนสองคนช่วยกันยกขึ้น"
                        value="0"
                        checked={answers.question3 === '0'}
                        onChange={(e) => handleChange(e, 'question3')}
                    />
                    <Form.Check 
                        type="radio"
                        label="1 ต้องการความช่วยเหลืออย่างมากจึงจะนั่งได้"
                        value="1"
                        checked={answers.question3 === '1'}
                        onChange={(e) => handleChange(e, 'question3')}
                    />
                    <Form.Check 
                        type="radio"
                        label="2 ต้องการความช่วยเหลือบ้าง เช่น บอกให้ทำตาม หรือช่วยพยุงเล็กน้อย"
                        value="2"
                        checked={answers.question3 === '2'}
                        onChange={(e) => handleChange(e, 'question3')}
                    />
                    <Form.Check 
                        type="radio"
                        label="3 ทำได้เอง"
                        value="3"
                        checked={answers.question3 === '3'}
                        onChange={(e) => handleChange(e, 'question3')}
                    />
                </Col>
            </Form.Group>

            {/* คำถามที่ 4 */}
            <Form.Group controlId="question4">
                <Form.Label>4. ใช้ห้องน้ำ</Form.Label>
                <Col>
                    <Form.Check 
                        type="radio"
                        label="0 ช่วยตัวเองไม่ได้"
                        value="0"
                        checked={answers.question4 === '0'}
                        onChange={(e) => handleChange(e, 'question4')}
                    />
                    <Form.Check 
                        type="radio"
                        label="1 ทำเองได้บ้าง (อย่างน้อยทำความสะอาดตัวเองได้หลังจากเสร็จธุระ)"
                        value="1"
                        checked={answers.question4 === '1'}
                        onChange={(e) => handleChange(e, 'question4')}
                    />
                    <Form.Check 
                        type="radio"
                        label="2 ช่วยตัวเองได้ดี"
                        value="2"
                        checked={answers.question4 === '2'}
                        onChange={(e) => handleChange(e, 'question4')}
                    />
                </Col>
            </Form.Group>

            {/* คำถามที่ 5 */}
            <Form.Group controlId="question5">
                <Form.Label>5. การเคลื่อนที่ภายในห้องหรือบ้าน</Form.Label>
                <Col>
                    <Form.Check 
                        type="radio"
                        label="0 เคลื่อนที่ไปไหนไม่ได้"
                        value="0"
                        checked={answers.question5 === '0'}
                        onChange={(e) => handleChange(e, 'question5')}
                    />
                    <Form.Check 
                        type="radio"
                        label="1 ต้องใช้รถเข็นช่วยตัวเอง"
                        value="1"
                        checked={answers.question5 === '1'}
                        onChange={(e) => handleChange(e, 'question5')}
                    />
                    <Form.Check 
                        type="radio"
                        label="2 เดินหรือเคลื่อนที่โดยมีคนช่วย"
                        value="2"
                        checked={answers.question5 === '2'}
                        onChange={(e) => handleChange(e, 'question5')}
                    />
                    <Form.Check 
                        type="radio"
                        label="3 เดินหรือเคลื่อนที่ได้เอง"
                        value="3"
                        checked={answers.question5 === '3'}
                        onChange={(e) => handleChange(e, 'question5')}
                    />
                </Col>
            </Form.Group>

            {/* คำถามที่ 6 */}
            <Form.Group controlId="question6">
                <Form.Label>6. การสวมใส่เสื้อผ้า</Form.Label>
                <Col>
                    <Form.Check 
                        type="radio"
                        label="0 ต้องมีคนสวมใส่ให้"
                        value="0"
                        checked={answers.question6 === '0'}
                        onChange={(e) => handleChange(e, 'question6')}
                    />
                    <Form.Check 
                        type="radio"
                        label="1 ช่วยตัวเองได้ประมาณร้อยละ 50"
                        value="1"
                        checked={answers.question6 === '1'}
                        onChange={(e) => handleChange(e, 'question6')}
                    />
                    <Form.Check 
                        type="radio"
                        label="2 ช่วยตัวเองได้ดี"
                        value="2"
                        checked={answers.question6 === '2'}
                        onChange={(e) => handleChange(e, 'question6')}
                    />
                </Col>
            </Form.Group>

            {/* คำถามที่ 7 */}
            <Form.Group controlId="question7">
                <Form.Label>7. การขึ้นลงบันได 1 ชั้น</Form.Label>
                <Col>
                    <Form.Check 
                        type="radio"
                        label="0 ไม่สามารถทำได้"
                        value="0"
                        checked={answers.question7 === '0'}
                        onChange={(e) => handleChange(e, 'question7')}
                    />
                    <Form.Check 
                        type="radio"
                        label="1 ต้องการคนช่วย"
                        value="1"
                        checked={answers.question7 === '1'}
                        onChange={(e) => handleChange(e, 'question7')}
                    />
                    <Form.Check 
                        type="radio"
                        label="2 ขึ้นลงได้เอง"
                        value="2"
                        checked={answers.question7 === '2'}
                        onChange={(e) => handleChange(e, 'question7')}
                    />
                </Col>
            </Form.Group>

            {/* คำถามที่ 8 */}
            <Form.Group controlId="question8">
                <Form.Label>8. การอาบน้ำ</Form.Label>
                <Col>
                    <Form.Check 
                        type="radio"
                        label="0 ต้องมีคนช่วยหรือทำให้"
                        value="0"
                        checked={answers.question8 === '0'}
                        onChange={(e) => handleChange(e, 'question8')}
                    />
                    <Form.Check 
                        type="radio"
                        label="1 อาบน้ำเองได้"
                        value="1"
                        checked={answers.question8 === '1'}
                        onChange={(e) => handleChange(e, 'question8')}
                    />
                </Col>
            </Form.Group>

            {/* คำถามที่ 9 */}
            <Form.Group controlId="question9">
                <Form.Label>9. การกลั้นการถ่ายอุจจาระในระยะ 1 สัปดาห์ที่ผ่านมา</Form.Label>
                <Col>
                    <Form.Check 
                        type="radio"
                        label="0 กลั้นไม่ได้"
                        value="0"
                        checked={answers.question9 === '0'}
                        onChange={(e) => handleChange(e, 'question9')}
                    />
                    <Form.Check 
                        type="radio"
                        label="1 กลั้นไม่ได้บางครั้ง"
                        value="1"
                        checked={answers.question9 === '1'}
                        onChange={(e) => handleChange(e, 'question9')}
                    />
                    <Form.Check 
                        type="radio"
                        label="2 กลั้นได้เป็นปกติ"
                        value="2"
                        checked={answers.question9 === '2'}
                        onChange={(e) => handleChange(e, 'question9')}
                    />
                </Col>
            </Form.Group>

            {/* คำถามที่ 10 */}
            <Form.Group controlId="question10">
                <Form.Label>10. การกลั้นปัสสาวะในระยะ 1 สัปดาห์ที่ผ่านมา</Form.Label>
                <Col>
                    <Form.Check 
                        type="radio"
                        label="0 กลั้นไม่ได้"
                        value="0"
                        checked={answers.question10 === '0'}
                        onChange={(e) => handleChange(e, 'question10')}
                    />
                    <Form.Check 
                        type="radio"
                        label="1 กลั้นไม่ได้บางครั้ง"
                        value="1"
                        checked={answers.question10 === '1'}
                        onChange={(e) => handleChange(e, 'question10')}
                    />
                    <Form.Check 
                        type="radio"
                        label="2 กลั้นได้เป็นปกติ"
                        value="2"
                        checked={answers.question10 === '2'}
                        onChange={(e) => handleChange(e, 'question10')}
                    />
                </Col>
            </Form.Group>

                    <Form.Group className="py-2">
                        {listItem.length > 0 && listItem.map((item, index) => (
                            <Toast key={index} onClose={() => removeItem(index)} className="mb-2">
                                <Toast.Header>
                                    <strong className="me-auto">{item.equipment_name}</strong>
                                </Toast.Header>
                                <Toast.Body>{item.equipment_code}</Toast.Body>
                            </Toast>
                        ))}
                        <Col sm={2}>
                            <ButtonAdd onClick={() => setModalSave(true)} title='เพิ่มข้อมูลอุปกรณ์' />
                        </Col>
                    </Form.Group>

                    <Form.Group className="d-flex justify-content-center py-3">
                        <ButtonState type="submit" text={'บันทึก'} isLoading={isLoading} />
                    </Form.Group>
                </Form>
            </div>

            <ModalAlert show={alert.show} message={alert.message} handleClose={() => setAlert({ show: false, message: '' })} />
            
            <ModalActions show={modalSave} title='เพิ่มข้อมูลอุปกรณ์' onClick={handleAddEquipment} onHide={() => setModalSave(false)}>
                <Form noValidate validated={validatedModal}>
                    <Form.Group>
                        <Form.Label>เลือกอุปกรณ์</Form.Label>
                        <Form.Select onChange={(e) => {
                            const selected = availableEquipment.find(eq => eq.equipment_id === Number(e.target.value));
                            if (selected) setSelectedEquipment(selected);
                        }}>
                            <option value="">-- เลือกอุปกรณ์ --</option>
                            {availableEquipment.map(e => (
                                <option key={e.equipment_id} value={e.equipment_id}>
                                    {e.equipment_name} - {e.equipment_code}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Form>
            </ModalActions>
        </Container>
    );
};

export default Borrow;
