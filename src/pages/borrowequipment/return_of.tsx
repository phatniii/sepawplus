import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { getBorrowEquipmentList, updateBorrowEquipmentStatus } from "@/lib/service/borrowEquipment"; // นำเข้า service API
import Container from "react-bootstrap/Container";
import Toast from "react-bootstrap/Toast";
import Button from "react-bootstrap/Button";

import styles from "@/styles/page.module.css";

interface ListItemType {
  borrow_id: number;
  listName: string;
  numberCard: string;
  startDate: string;
  endDate: string;
}

const ReturnOf = () => {
  const [listItem, setListItem] = useState<ListItemType[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "" });

  // 📌 ดึงข้อมูล userId จาก Redux
  const user = useSelector((state: RootState) => state.user.user);

  // 📌 ดึงข้อมูลอุปกรณ์ที่ถูกยืมเมื่อหน้าโหลด
  useEffect(() => {
    fetchBorrowedItems();
  }, []);

  const fetchBorrowedItems = async () => {
    try {
      const response = await getBorrowEquipmentList("", "", "1"); // ดึงอุปกรณ์ที่ยังไม่ถูกคืน
      if (response.data) {
        const formattedData = response.data.map((item: any) => ({
          borrow_id: item.borrow_id,
          listName: item.borrow_name,
          numberCard: item.borrow_equipment_number,
          startDate: item.borrow_date,
          endDate: item.borrow_return,
        }));
        setListItem(formattedData);
      }
    } catch (error) {
      console.error("Error fetching borrowed items:", error);
    }
  };

  // คืนอุปกรณ์
  const handleReturn = async (borrow_id: number) => {
    setLoading(true);
    try {
      // ตรวจสอบ userId ก่อนเรียก API
      if (!user?.userId) {
        setAlert({ show: true, message: "ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบ" });
        setLoading(false);
        return;
      }

      await updateBorrowEquipmentStatus(0, borrow_id, user.userId); // อัปเดตสถานะเป็นคืนแล้ว (0)
      setListItem(listItem.filter((item) => item.borrow_id !== borrow_id)); // ลบออกจาก UI
    } catch (error) {
      console.error("Error returning equipment:", error);
      setAlert({ show: true, message: "เกิดข้อผิดพลาด กรุณาลองใหม่" });
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
        {listItem.length > 0 ? (
          listItem.map((item, index) => (
            <Toast key={index} onClose={() => handleReturn(item.borrow_id)} className="mb-2">
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
        ) : (
          <p className="text-center py-3">ไม่มีอุปกรณ์ที่ต้องคืน</p>
        )}
      </div>
    </Container>
  );
};

export default ReturnOf;
