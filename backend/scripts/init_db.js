const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const config = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'master', // Start with master to create the new DB
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  },
};

async function initDB() {
  let pool;
  try {
    console.log('Connecting to SQL Server...');
    pool = await sql.connect(config);
    console.log('Connected!');

    const dbName = 'Ford_Spare_Credit';
    const tableName = 'Automation_Queue_Spare_Credit';

    // 1. Create Database if not exists
    console.log(`Checking database: ${dbName}...`);
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '${dbName}')
      BEGIN
        CREATE DATABASE [${dbName}];
        PRINT 'Database created.';
      END
      ELSE
      BEGIN
        PRINT 'Database already exists.';
      END
    `);

    // 2. Create Table
    console.log(`Creating table: ${tableName} in ${dbName}...`);
    await pool.request().query(`
      USE [${dbName}];
      IF OBJECT_ID('${tableName}', 'U') IS NOT NULL
      BEGIN
        DROP TABLE [${tableName}]; -- Drop to recreate with new structure as requested
        PRINT 'Old table dropped.';
      END

      CREATE TABLE [${tableName}] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [Brand] NVARCHAR(50),
        [สาขา] NVARCHAR(255),
        [เลขที่ใบกำกับภาษี] NVARCHAR(255),
        [วันที่ใบกำกับภาษี] DATETIME,
        [รหัสลูกค้า] NVARCHAR(255),
        [ชื่อลูกค้า] NVARCHAR(MAX),
        [มูลค่าสินค้า] DECIMAL(18, 2),
        [ภาษีมูลค่าเพิ่ม] DECIMAL(18, 2),
        [ราคารวมภาษี] DECIMAL(18, 2),
        [ต้นทุน] DECIMAL(18, 2),
        [automate_status] NVARCHAR(100),
        [ส่งBP] NVARCHAR(255),
        [หมายเหตุ] NVARCHAR(MAX),
        [created_at] DATETIME DEFAULT GETDATE()
      );

      IF OBJECT_ID('Debt_batch', 'U') IS NOT NULL DROP TABLE [Debt_batch];
      CREATE TABLE [Debt_batch] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [Brand] NVARCHAR(50),
        [สาขา] NVARCHAR(255),
        [rs_docno] NVARCHAR(255),
        [fee] DECIMAL(18, 2),
        [diff_debit] DECIMAL(18, 2),
        [diff_credit] DECIMAL(18, 2),
        [automate_status] NVARCHAR(100) DEFAULT N'กำลังautomate',
        [created_at] DATETIME DEFAULT GETDATE(),
        [รหัสลูกค้า] NVARCHAR(255),
        [ยอดรวมสุทธิ] DECIMAL(18, 2)
      );

      IF OBJECT_ID('Debt_detail', 'U') IS NOT NULL DROP TABLE [Debt_detail];
      CREATE TABLE [Debt_detail] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [batch_id] INT,
        [queue_id] INT,
        [เลขที่ใบกำกับภาษี] NVARCHAR(255),
        [ราคารวมภาษี] DECIMAL(18, 2),
        [created_at] DATETIME DEFAULT GETDATE()
      );
      PRINT 'Tables created successfully.';
    `);

    console.log('Database initialization completed successfully!');
  } catch (err) {
    console.error('Database initialization failed:', err);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

initDB();
