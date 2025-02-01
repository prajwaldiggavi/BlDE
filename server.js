const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
require('dotenv').config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 8080; // Railway assigns a port automatically

// Enable CORS
app.use(cors({
    origin: 'https://bl-de.vercel.app',
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

// MySQL Connection with automatic reconnection
let dbConnection;
function handleDisconnect() {
    dbConnection = mysql.createConnection({
        host: process.env.DB_HOST || 'sql10.freesqldatabase.com',
        user: process.env.DB_USER || 'sql10760370',
        password: process.env.DB_PASS || 'GUeSnpUSjf',
        database: process.env.DB_NAME || 'sql10760370',
        port: process.env.DB_PORT || 3306
    });

    dbConnection.connect(err => {
        if (err) {
            console.error('Database connection error:', err);
            setTimeout(handleDisconnect, 2000); // Retry after 2 seconds
        } else {
            console.log('Connected to MySQL DB:', dbConnection.threadId);
        }
    });

    dbConnection.on('error', err => {
        console.error('Database error:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect(); // Reconnect on connection loss
        } else {
            throw err;
        }
    });
}
handleDisconnect();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint to add a student
app.post('/add-student', (req, res) => {
    const { studentId, studentName, semester, phone_number, email, dob, gender } = req.body;

    if (!studentId || !studentName || !semester || !phone_number || !email || !dob || !gender) {
        return res.status(400).send('Missing required fields.');
    }

    const query = 'INSERT INTO students (studentId, studentName, semester, phone_number, email, dob, gender) VALUES (?, ?, ?, ?, ?, ?, ?)';
    dbConnection.query(query, [studentId, studentName, semester, phone_number, email, dob, gender], (error, results) => {
        if (error) {
            console.error('Error inserting student data:', error);
            return res.status(500).send('Error adding student.');
        }
        res.send('Student added successfully!');
    });
});

// Endpoint to get students by semester
app.get('/students/:semester', (req, res) => {
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

// Endpoint to delete a student by studentId
app.delete('/delete-student/:studentId', (req, res) => {
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

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
