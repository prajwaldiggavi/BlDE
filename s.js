const express = require('express');
const dbConnection = require('../db'); // Import database connection
const router = express.Router();

// Add a student
router.post('/add', (req, res) => {
    const { studentId, studentName, semester, phone_number, email, dob, gender } = req.body;

    if (studentId && studentName && semester && phone_number && email && dob && gender) {
        const query = 'INSERT INTO students (studentId, studentName, semester, phone_number, email, dob, gender) VALUES (?, ?, ?, ?, ?, ?, ?)';
        dbConnection.query(query, [studentId, studentName, semester, phone_number, email, dob, gender], (error, results) => {
            if (error) {
                console.error('Error inserting student data:', error);
                return res.status(500).send('Error adding student.');
            }
            res.send('Student added successfully!');
        });
    } else {
        res.status(400).send('Missing required fields.');
    }
});

// Get students by semester
router.get('/:semester', (req, res) => {
    const semester = req.params.semester;
    const query = 'SELECT * FROM students WHERE semester = ?';

    dbConnection.query(query, [semester], (error, results) => {
        if (error) {
            console.error('Error fetching students:', error);
            return res.status(500).send('Error fetching students.');
        }
        res.json(results);
    });
});

// Delete a student by studentId
router.delete('/delete/:studentId', (req, res) => {
    const studentId = req.params.studentId;
    const query = 'DELETE FROM students WHERE studentId = ?';

    dbConnection.query(query, [studentId], (error, results) => {
        if (error) {
            console.error('Error deleting student:', error);
            return res.status(500).send('Error deleting student.');
        }
        if (results.affectedRows === 0) {
            return res.status(404).send('Student not found.');
        }
        res.send('Student deleted successfully!');
    });
});

module.exports = router;
