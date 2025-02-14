import React, { useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import ButtonState from "@/components/Button/ButtonState";
import InputLabel from "@/components/Form/InputLabel";
import ModalAlert from "@/components/Modals/ModalAlert";
import DatePickerX from "@/components/DatePicker/DatePickerX";
import axios from "axios";
import styles from "@/styles/page.module.css";

const Questionnaire = () => {
    const router = useRouter();
    const [validated, setValidated] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: "" });
    const [isLoading, setLoading] = useState(false);
    const [questionnaireData, setQuestionnaireData] = useState({
        gender: "",
        age: "",
        maritalStatus: "",
        familyType: "",
        educationLevel: "",
        income: "",
        sufficientIncome: "",
        chronicDisease: "",
        medication: "",
        healthcareAccess: "",
        elderlyCaregiver: "",
        activityParticipation: "",
    });
    const [birthDate, setBirthDate] = useState<Date | null>(new Date());

    useEffect(() => {
        const { id } = router.query;
        if (id) {
            fetchData(id as string);
        }
    }, [router.query.id]);

    const fetchData = async (id: string) => {
        try {
            const response = await axios.get(`${process.env.WEB_DOMAIN}/api/borrowequipment/questionnaire?id=${id}`);
            if (response.data) {
                setQuestionnaireData(response.data);
                setBirthDate(new Date(response.data.age));
            }
        } catch (error) {
            setAlert({ show: true, message: "เกิดข้อผิดพลาดในการโหลดข้อมูล" });
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (e.currentTarget.checkValidity() === false) {
            setAlert({ show: true, message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
            return;
        }

        const formData = new FormData(e.currentTarget);
        const formObject: any = {};
        formData.forEach((value, key) => {
            formObject[key] = value;
        });

        try {
            setLoading(true);
            await axios.post(`${process.env.WEB_DOMAIN}/api/borrowequipment/questionnaire`, {
                ...formObject,
                age: birthDate?.toISOString(),
            });
            setAlert({ show: true, message: "บันทึกข้อมูลสำเร็จ" });
            setLoading(false);
        } catch (error) {
            setLoading(false);
            setAlert({ show: true, message: "ไม่สามารถบันทึกข้อมูลได้" });
        } finally {
            setValidated(true);
        }
    };

    return (
        <Container>
            <div className={styles.main}>
                <h1 className="py-2">แบบสอบถามการดูแลผู้สูงอายุ</h1>
            </div>
            <div className="px-5">
                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <Form.Group>
                        <Form.Label>1. เพศ</Form.Label>
                        <Form.Select id="gender" defaultValue={questionnaireData.gender || ""} required>
                            <option value="">เลือก</option>
                            <option value="ชาย">ชาย</option>
                            <option value="หญิง">หญิง</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group>
                        <p className="m-0">2. วันเกิด</p>
                        <div className="py-2">
                            <DatePickerX selected={birthDate} onChange={setBirthDate} />
                        </div>
                    </Form.Group>

                    <Form.Group>
                        <InputLabel label="3. สถานภาพสมรส" id="maritalStatus" placeholder="กรอกสถานภาพสมรส" defaultValue={questionnaireData.maritalStatus || ""} required />
                    </Form.Group>

                    <Form.Group>
                        <InputLabel label="4. ลักษณะของครอบครัว" id="familyType" placeholder="กรอกลักษณะของครอบครัว" defaultValue={questionnaireData.familyType || ""} required />
                    </Form.Group>

                    <Form.Group>
                        <InputLabel label="5. ระดับการศึกษา" id="educationLevel" placeholder="กรอกระดับการศึกษา" defaultValue={questionnaireData.educationLevel || ""} required />
                    </Form.Group>

                    <Form.Group>
                        <InputLabel label="6. รายได้" id="income" placeholder="กรอกรายได้" defaultValue={questionnaireData.income || ""} required />
                    </Form.Group>

                    <Form.Group>
                        <Form.Label>7. รายได้เพียงพอหรือไม่</Form.Label>
                        <Form.Select id="sufficientIncome" defaultValue={questionnaireData.sufficientIncome || ""} required>
                            <option value="">เลือก</option>
                            <option value="เพียงพอ">เพียงพอ</option>
                            <option value="ไม่เพียงพอ">ไม่เพียงพอ</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="d-flex justify-content-center py-3">
                        <ButtonState type="submit" className={styles.button} text={"บันทึก"} icon="fas fa-save" isLoading={isLoading} />
                    </Form.Group>
                </Form>
            </div>
            <ModalAlert show={alert.show} message={alert.message} handleClose={() => setAlert({ show: false, message: "" })} />
        </Container>
    );
};

export const getServerSideProps: GetServerSideProps = async () => {
    return {
        props: {
            title: "แบบสอบถามการดูแลผู้สูงอายุ",
            description: "แบบสอบถามการดูแลผู้สูงอายุ",
            slug: "",
            titleBar: "แบบสอบถามการดูแลผู้สูงอายุ",
        },
    };
};

export default Questionnaire;
