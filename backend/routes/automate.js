const express = require('express');
const { sql, runInDatabase, getQueueDatabaseName } = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
  const { database, rows } = req.body;

  if (!database || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'database and rows are required' });
  }

  const queueDb = getQueueDatabaseName();
  if (!queueDb) {
    return res.status(500).json({ error: 'Queue database not configured' });
  }

  try {
    await runInDatabase(queueDb, async (request) => {
      const table = new sql.Table('Automation_Queue_Spare_Credit');
      table.create = false;

      // New simpler structure based on the request
      table.columns.add('Brand', sql.NVarChar(50), { nullable: true });
      table.columns.add('สาขา', sql.NVarChar(255), { nullable: true });
      table.columns.add('เลขที่ใบกำกับภาษี', sql.NVarChar(255), { nullable: true });
      table.columns.add('วันที่ใบกำกับภาษี', sql.DateTime, { nullable: true });
      table.columns.add('รหัสลูกค้า', sql.NVarChar(255), { nullable: true });
      table.columns.add('ชื่อลูกค้า', sql.NVarChar(sql.MAX), { nullable: true });
      table.columns.add('มูลค่าสินค้า', sql.Decimal(18, 2), { nullable: true });
      table.columns.add('ภาษีมูลค่าเพิ่ม', sql.Decimal(18, 2), { nullable: true });
      table.columns.add('ราคารวมภาษี', sql.Decimal(18, 2), { nullable: true });
      table.columns.add('ต้นทุน', sql.Decimal(18, 2), { nullable: true });
      table.columns.add('automate_status', sql.NVarChar(100), { nullable: true });
      table.columns.add('ส่งBP', sql.NVarChar(255), { nullable: true });
      table.columns.add('หมายเหตุ', sql.NVarChar(sql.MAX), { nullable: true });

      rows.forEach((row) => {
        table.rows.add(
          row['Brand'] || 'Ford',
          row['สาขา'] || null,
          row['เลขที่ใบกำกับภาษี'] || null,
          row['วันที่ใบกำกับภาษี'] ? new Date(row['วันที่ใบกำกับภาษี']) : null,
          row['รหัสลูกค้า'] || null,
          row['ชื่อลูกค้า'] || null,
          row['มูลค่าสินค้า'] != null ? Number(row['มูลค่าสินค้า']) : 0,
          row['ภาษีมูลค่าเพิ่ม'] != null ? Number(row['ภาษีมูลค่าเพิ่ม']) : 0,
          row['ราคารวมภาษี'] != null ? Number(row['ราคารวมภาษี']) : 0,
          row['ต้นทุน'] != null ? Number(row['ต้นทุน']) : 0,
          'กำลังAutomate',
          null, // ส่งBP
          null  // หมายเหตุ
        );
      });

      await request.bulk(table);
    });

    return res.json({ success: true, inserted: rows.length });
  } catch (err) {
    console.error('Error inserting into Automation_Queue_Spare_Credit', err);
    const message =
      process.env.NODE_ENV === 'development' ? err.message : 'Failed to queue automation';
    return res.status(500).json({ error: 'Failed to send records to automation queue.', detail: message });
  }
});

module.exports = router;
