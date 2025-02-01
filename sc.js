const express = require('express');
const dbConnection = require('../db'); // Import the database connection
const router = express.Router();

// (Optional) Middleware to ensure CORS headers on these routes (if not handled globally)
router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://bl-de.vercel.app");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Mark attendance
router.post('/mark', (req, res) => {
  const { studentId, date, status } = req.body;

  if (!studentId || !date || !status) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const query = 'INSERT INTO attendance (studentId, date, status) VALUES (?, ?, ?)';
  dbConnection.query(query, [studentId, date, status], (error, results) => {
    if (error) {
      console.error('Error marking attendance:', error);
      return res.status(500).json({ error: 'Error marking attendance.' });
    }
    res.json({ message: 'Attendance marked successfully!' });
  });
});

// Get attendance by studentId
router.get('/:studentId', (req, res) => {
  const studentId = req.params.studentId;
  const query = 'SELECT * FROM attendance WHERE studentId = ?';

  dbConnection.query(query, [studentId], (error, results) => {
    if (error) {
      console.error('Error fetching attendance:', error);
      return res.status(500).json({ error: 'Error fetching attendance.' });
    }
    res.json(results);
  });
});

module.exports = router;
