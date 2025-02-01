const express = require('express');
const dbConnection = require('../db'); // Import database connection
const router = express.Router();

// ✅ Middleware to Set CORS Headers for Every Response
router.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "https://bl-de.vercel.app");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    
    next();
});

// ✅ Add a student
router.post('/add', (req, res) => {
    const { studentId, studentName, semester, phone_number, email, dob, gender } = req.body;

    if (studentId && studentName && semester && phone_number && email && dob && gender) {
        const query = 'INSERT INTO students (studentId, studentName, semester, phone_number, email, dob, gender) VALUES (?, ?, ?, ?, ?, ?, ?)';
        dbConnection.query(query, [studentId, studentName, semester, phone_number, email, dob, gender], (error, results) => {
            if (error) {
                console.error('Error inserting student data:', error);
                return res.status(500).json({ error: 'Error adding student.' });
            }
            res.json({ message: 'Student added successfully!' });
        });
    } else {
        res.status(400).json({ error: 'Missing required fields.' });
    }
});

// ✅ Get students by semester
router.get('/:semester', (req, res) => {
    const semester = req.params.semester;
    const query = 'SELECT * FROM students WHERE semester = ?';

    dbConnection.query(query, [semester], (error, results) => {
        if (error) {
            console.error('Error fetching students:', error);
            return res.status(500).json({ error: 'Error fetching students.' });
        }
        res.json(results);
    });
});

// ✅ Delete a student by studentId
router.delete('/delete/:studentId', (req, res) => {
    const studentId = req.params.studentId;
    const query = 'DELETE FROM students WHERE studentId = ?';

    dbConnection.query(query, [studentId], (error, results) => {
        if (error) {
            console.error('Error deleting student:', error);
            return res.status(500).json({ error: 'Error deleting student.' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Student not found.' });
        }
        res.json({ message: 'Student deleted successfully!' });
    });
});

module.exports = router;
