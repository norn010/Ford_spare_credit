const express = require('express');
const { executeQuery, getQueueDatabaseName } = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const dbName = getQueueDatabaseName();
    const result = await executeQuery(dbName, 'SELECT * FROM Brand_Acc_Tb');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/', async (req, res) => {
  try {
    const { Brand, Branch, Shorts, Acc1, Acc2, Acc3 } = req.body;
    const dbName = getQueueDatabaseName();
    await executeQuery(dbName, `
      INSERT INTO Brand_Acc_Tb (Brand, Branch, Shorts, Acc1, Acc2, Acc3) 
      VALUES (@Brand, @Branch, @Shorts, @Acc1, @Acc2, @Acc3)
    `, {
      Brand, Branch, Shorts, Acc1, Acc2, Acc3
    });
    res.status(201).json({ message: 'Added successfully' });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { Brand, Branch, Shorts, Acc1, Acc2, Acc3 } = req.body;
    const dbName = getQueueDatabaseName();
    await executeQuery(dbName, `
      UPDATE Brand_Acc_Tb 
      SET Brand=@Brand, Branch=@Branch, Shorts=@Shorts, Acc1=@Acc1, Acc2=@Acc2, Acc3=@Acc3
      WHERE ID=@ID
    `, {
      ID: id,
      Brand, Branch, Shorts, Acc1, Acc2, Acc3
    });
    res.json({ message: 'Updated successfully' });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dbName = getQueueDatabaseName();
    await executeQuery(dbName, `
      DELETE FROM Brand_Acc_Tb WHERE ID=@ID
    `, {
      ID: id
    });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
