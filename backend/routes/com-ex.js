const express = require('express');
const { executeQuery, getQueueDatabaseName } = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const dbName = getQueueDatabaseName();
    const result = await executeQuery(dbName, 'SELECT * FROM Com_Ex_Tb');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/', async (req, res) => {
  try {
    const { Brand, Branch, LoneCode, ExpressCode, Cusname } = req.body;
    const dbName = getQueueDatabaseName();
    await executeQuery(dbName, `
      INSERT INTO Com_Ex_Tb (Brand, Branch, LoneCode, ExpressCode, Cusname) 
      VALUES (@Brand, @Branch, @LoneCode, @ExpressCode, @Cusname)
    `, {
      Brand, Branch, LoneCode, ExpressCode, Cusname
    });
    res.status(201).json({ message: 'Added successfully' });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.put('/:brand/:branch', async (req, res) => {
  try {
    const { brand, branch } = req.params;
    const { Brand, Branch, LoneCode, ExpressCode, Cusname } = req.body;
    const dbName = getQueueDatabaseName();
    await executeQuery(dbName, `
      UPDATE Com_Ex_Tb 
      SET Brand=@Brand, Branch=@Branch, LoneCode=@LoneCode, ExpressCode=@ExpressCode, Cusname=@Cusname
      WHERE Brand=@oldBrand AND Branch=@oldBranch
    `, {
      oldBrand: brand,
      oldBranch: branch,
      Brand, Branch, LoneCode, ExpressCode, Cusname
    });
    res.json({ message: 'Updated successfully' });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.delete('/:brand/:branch', async (req, res) => {
  try {
    const { brand, branch } = req.params;
    const dbName = getQueueDatabaseName();
    await executeQuery(dbName, `
      DELETE FROM Com_Ex_Tb WHERE Brand=@Brand AND Branch=@Branch
    `, {
      Brand: brand,
      Branch: branch
    });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
