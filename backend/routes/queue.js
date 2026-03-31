const express = require('express');
const { executeQuery, getQueueDatabaseName, runInDatabase } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  const queueDb = getQueueDatabaseName();
  if (!queueDb) {
    return res.status(500).json({ error: 'Queue database not configured' });
  }

  // Default status to 'กำลังAutomate' as per request
  const { status = 'กำลังAutomate' } = req.query;

  const query = `
    SELECT
      id,
      [Brand],
      [สาขา],
      [เลขที่ใบกำกับภาษี],
      [วันที่ใบกำกับภาษี],
      [รหัสลูกค้า],
      [ชื่อลูกค้า],
      [มูลค่าสินค้า],
      [ภาษีมูลค่าเพิ่ม],
      [ราคารวมภาษี],
      [ต้นทุน],
      [automate_status],
      [ส่งBP],
      [หมายเหตุ],
      [created_at]
    FROM [dbo].[Automation_Queue_Spare_Credit]
    WHERE
      (@status IS NULL OR automate_status = @status)
    ORDER BY [วันที่ใบกำกับภาษี] ASC, [เลขที่ใบกำกับภาษี] ASC, id ASC
  `;

  try {
    const result = await executeQuery(queueDb, query, {
      status: status || null,
    });
    return res.json(result.recordset || []);
  } catch (err) {
    console.error('Error fetching automation queue', err);
    return res.status(500).json({ error: 'Failed to fetch automation queue' });
  }
});

router.put('/:id', async (req, res) => {
  const queueDb = getQueueDatabaseName();
  if (!queueDb) {
    return res.status(500).json({ error: 'Queue database not configured' });
  }

  const { id } = req.params;
  const {
    ประเภท: type,
    BankStatement,
    ส่งBP: sendBp,
    หมายเหตุ: note,
    หักค่าธรรมเนียม: fee,
    ส่วนต่างเดบิต: diffDebit,
    ส่วนต่างเครดิต: diffCredit,
  } = req.body;

  const query = `
    UPDATE [dbo].[Automation_Queue_Spare_Credit]
    SET
      [ประเภท] = @type,
      [BankStatement] = @bank,
      [ส่งBP] = @sendBp,
      [หมายเหตุ] = @note,
      [หักค่าธรรมเนียม] = @fee,
      [ส่วนต่างเดบิต] = @diffDebit,
      [ส่วนต่างเครดิต] = @diffCredit
    WHERE id = @id
  `;

  try {
    await executeQuery(queueDb, query, {
      id,
      type: type ?? null,
      bank: BankStatement ?? null,
      sendBp: sendBp ?? null,
      note: note ?? null,
      fee: fee != null ? Number(fee) : null,
      diffDebit: diffDebit != null ? Number(diffDebit) : null,
      diffCredit: diffCredit != null ? Number(diffCredit) : null,
    });
    return res.json({ success: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error updating automation queue row', err);
    return res.status(500).json({ error: 'Failed to update automation queue row' });
  }
});

// ส่งแถวไป Debt_Clearing และอัปเดต automate_status เป็น Automateตัดชำระ
router.post('/:id/send-to-debt-clearing', async (req, res) => {
  const queueDb = getQueueDatabaseName();
  if (!queueDb) {
    return res.status(500).json({ error: 'Queue database not configured' });
  }

  const { id } = req.params;

  const insertQuery = `
    INSERT INTO [dbo].[Debt_Clearing] (
      database_name,
      [Exp_ID],
      [เลขที่ใบกำกับ],
      [เลขที่ใบเบิก],
      [สาขา],
      [วันที่ใบกำกับ],
      [รหัสลูกค้า],
      [ชื่อลูกค้า],
      [ยอดสุทธิ],
      [ต้นทุนรวม],
      [ประเภท],
      [BankStatement],
      [ส่งBP],
      [หมายเหตุ],
      [หักค่าธรรมเนียม],
      [ส่วนต่างเดบิต],
      [ส่วนต่างเครดิต]
    )
    SELECT
      database_name,
      [Exp_ID],
      [เลขที่ใบกำกับ],
      [เลขที่ใบเบิก],
      [สาขา],
      [วันที่ใบกำกับ],
      [รหัสลูกค้า],
      [ชื่อลูกค้า],
      [ยอดสุทธิ],
      [ต้นทุนรวม],
      [ประเภท],
      [BankStatement],
      [ส่งBP],
      [หมายเหตุ],
      [หักค่าธรรมเนียม],
      [ส่วนต่างเดบิต],
      [ส่วนต่างเครดิต]
    FROM [dbo].[Automation_Queue_Spare_Credit]
    WHERE id = @id
  `;

  const updateQuery = `
    UPDATE [dbo].[Automation_Queue_Spare_Credit]
    SET automate_status = N'Automateตัดชำระ'
    WHERE id = @id
  `;

  try {
    await runInDatabase(queueDb, async (request) => {
      request.input('id', id);
      const insertResult = await request.query(insertQuery);
      if (insertResult.rowsAffected[0] === 0) {
        throw new Error('Queue row not found');
      }
      await request.query(updateQuery);
    });
    return res.json({ success: true });
  } catch (err) {
    console.error('Error sending to debt clearing', err);
    if (err.message === 'Queue row not found') {
      return res.status(404).json({ error: 'Queue row not found' });
    }
    const detail = err.original?.info?.message || err.message;
    return res.status(500).json({
      error: 'Failed to send to debt clearing',
      detail: process.env.NODE_ENV !== 'production' ? detail : undefined,
    });
  }
});

module.exports = router;
