# Sales Credit Dashboard + Automate

ระบบติดตามและจัดการงานตัดชำระหนี้อะไหล่เงินเชื่อ แบ่งเป็น `frontend` (React) และ `backend` (Express + SQL Server)

## Features

- Dashboard สำหรับค้นหาเอกสารจาก `vw_SALES_CREDIT_RETURN`
- ส่งรายการที่เลือกเข้า queue (`Automation_Queue_Spare_Credit`)
- หน้า Automation Status ติดตามสถานะคิว
- หน้า รายงานตัดชำระหนี้ (Automation)
  - แสดงรายการที่กำลังรอการประมวลผล (`automate_status = กำลังautomate`)
  - ดูรายละเอียดเอกสารใบกำกับภาษีในแต่ละ Batch
  - เก็บข้อมูลหลักลง `Debt_batch` และรายละเอียดรายใบกำกับลง `Debt_detail`
- หน้า Automate Completed
  - เลือกรายการที่เสร็จแล้วเพื่อสร้าง Batch ตัดชำระ
  - ระบุ RS Document No, ค่าธรรมเนียม (Fee), ส่วนต่างเดบิต/เครดิต
  - แสดงรายการใบกำกับภาษีที่จะถูกรวมเข้า Batch

## Tech Stack

- Frontend: React, Vite, TailwindCSS, Axios, TanStack React Table, React Router
- Backend: Node.js, Express, mssql
- Database: Microsoft SQL Server

## Project Structure

- `frontend/` : UI
- `backend/` : API และ SQL scripts
- `backend/routes/` : endpoint ต่างๆ
- `backend/scripts/` : สคริปต์สร้าง/อัปเดตตาราง

## Prerequisites

- Node.js 18+
- SQL Server (เข้าถึงได้จาก backend)

## Setup

### 1) Backend

```bash
cd backend
npm install
npm run init_db
```

สร้างไฟล์ `.env` ใน `backend/` (ตัวอย่างค่าพื้นฐาน):

```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

DB_SERVER=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=your_password
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

QUEUE_DB_NAME=Ford_Spare_Credit
DB_DATABASES=GWM,OMODA
```

รัน backend:

```bash
npm run dev
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

ถ้าต้องการระบุ API:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## SQL Scripts ที่ต้องรัน

รันในฐานข้อมูล `Ford_Spare_Credit`:

1. `backend/scripts/init_db.js`
   - รันเพื่อสร้างตาราง `Automation_Queue_Spare_Credit`, `Debt_batch`, `Debt_detail`
   - (อัปเดตสม่ำเสมอเมื่อมีฟิลด์ใหม่)

## Main API

- `GET /api/databases` (ดึงรายการฐานข้อมูล)
- `GET /api/sales` (ดึงข้อมูลยอดขายจาก ERP)
- `POST /api/automate` (ส่งรายการเข้า queue)
- `GET /api/automate-queue` (ดึงสถานะคิว)
- `POST /api/debt-clearing-batch` (สร้าง Batch ตัดชำระลง `Debt_batch`)
- `GET /api/reconcile-batches` (ดึงรายการสรุป Batch)
- `GET /api/reconcile-batches/:id/details` (ดึงรายการใบกำกับภาษีใน Batch)

## Debt Clearing Batch Payload (ตัวอย่าง)

```json
{
  "database_name": "Ford_Spare_Credit",
  "branch": "10",
  "รหัสลูกค้า": "1TC_000000010",
  "rs_docno": "RS6902-004",
  "fee": 100.00,
  "diff_debit": 0,
  "diff_credit": 0,
  "rows": [
    {
      "id": 12,
      "Brand": "Ford",
      "invoice_no": "GCD26020017",
      "amount": 20174.50
    }
  ]
}
```

## Notes

- ระบบ batch จะคำนวณและบันทึก `[ยอดรวมสุทธิ]` จาก `rows[].amount` อัตโนมัติ
- ถ้าแก้โครงสร้างตารางแล้วเจอ error คอลัมน์หาย ให้รัน SQL script ล่าสุดซ้ำอีกครั้ง
- ถ้า frontend เรียก API ไม่เจอ ให้ตรวจ `VITE_API_BASE_URL` และพอร์ต backend
