# Sales Credit Dashboard + Automate

ระบบติดตามและจัดการงานตัดชำระหนี้อะไหล่เงินเชื่อ แบ่งเป็น `frontend` (React) และ `backend` (Express + SQL Server)

## Features

- Dashboard สำหรับค้นหาเอกสารจาก `vw_SALES_CREDIT_RETURN`
- ส่งรายการที่เลือกเข้า queue (`Automation_Queue_Spare_Credit`)
- หน้า Automation Status ติดตามสถานะคิว
- หน้า รายงานตัดชำระหนี้ อะไหล่เงินเชื่อ
  - แก้ไขข้อมูลรายแถว
  - เลือกหลายแถวสร้าง Batch ตัดชำระ
  - เก็บข้อมูล Batch ลง `reconcile_batch` และรายละเอียดลง `reconcile_detail`
- หน้า BPรายงานตัดชำระหนี้
  - แก้ไขหมายเหตุ
  - กด Save พร้อมยืนยัน แล้วเปลี่ยน `ส่งBP` เป็น `BPส่งกลับ`

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

QUEUE_DB_NAME=Spare_Credit
AVAILABLE_DATABASES=GWM
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

รันในฐานข้อมูล `Spare_Credit`:

1. `backend/scripts/create-automate-queue.sql`
   - ตาราง `Automation_Queue_Spare_Credit`
2. `backend/scripts/create-debt-clearing.sql`
   - ตาราง `Debt_Clearing`
3. `backend/scripts/create-reconcile-batch.sql`
   - ตาราง `reconcile_batch`
   - ตาราง `reconcile_detail`
   - รวมคอลัมน์บัญชีแยก code/name และ `[ยอดรวมสุทธิ]`

## Main API

- `GET /api/databases`
- `GET /api/sales`
- `POST /api/automate`
- `GET /api/automate-queue`
- `PUT /api/automate-queue/:id`
- `POST /api/automate-queue/:id/send-to-debt-clearing`
- `POST /api/debt-clearing-batch`

## Debt Clearing Batch Payload (ตัวอย่าง)

```json
{
  "database_name": "GWM",
  "branch": "10",
  "รหัสลูกค้า": "1TC_000000010",
  "rs_docno": "RS6902-004",
  "bank_account": "1101-04-02",
  "bank_account_name": "BAY 634-0-00147-5",
  "ar_account": "1102-01-02",
  "ar_account_name": "ลูกหนี้การค้า-ฝ่ายศูนย์บริการ/อะไหล่",
  "fee_account": "6221-02-00",
  "fee_account_name": "ค่าธรรมเนียมธนาคารและอื่นๆ-โคราช",
  "diff_account": "6225-99-00",
  "diff_account_name": "ส่วนต่างเงินสดจ่าย-เงินสดรับ",
  "fee": 100,
  "diff_debit": 0,
  "diff_credit": 0,
  "bank_statement": "confirm",
  "rows": [
    {
      "id": 1,
      "invoice_no": "GCD26020017",
      "pk_no": "",
      "amount": 20174
    }
  ]
}
```

## Notes

- ระบบ batch จะคำนวณและบันทึก `[ยอดรวมสุทธิ]` จาก `rows[].amount` อัตโนมัติ
- ถ้าแก้โครงสร้างตารางแล้วเจอ error คอลัมน์หาย ให้รัน SQL script ล่าสุดซ้ำอีกครั้ง
- ถ้า frontend เรียก API ไม่เจอ ให้ตรวจ `VITE_API_BASE_URL` และพอร์ต backend
