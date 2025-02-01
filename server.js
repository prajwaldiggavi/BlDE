const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const port = 8080;

// Enable CORS
app.use(cors({
    origin: 'https://bl-de.vercel.app', // Adjust as needed
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

// MySQL connection pool for efficient handling of multiple connections
const dbConnection = mysql.createPool({
    connectionLimit: 10,  // Limits the number of concurrent connections to the database
    host: 'sql10.freesqldatabase.com',
    user: 'sql10760370',
    password: 'GUeSnpUSjf',
    database: 'sql10760370',
    port: 3306
});

// Check database connection
dbConnection.getConnection((err, connection) => {
    if (err) {
        console.error('Error getting connection from pool:', err);
    } else {
        console.log('Connected to db as id ' + connection.threadId);
        connection.release(); // Release connection back to the pool
    }
});

app.use(express.json());  // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));  // Parse URL-encoded bodies

// Endpoint to add a student
app.post('/add-student', (req, res) => {
    const { studentId, studentName, semester, phone_number, email, dob, gender } = req.body;
    console.log('Request to add student:', req.body);  // Log incoming data

    if (studentId && studentName && semester && phone_number && email && dob && gender) {
        const query = 'INSERT INTO students (studentId, studentName, semester, phone_number, email, dob, gender) VALUES (?, ?, ?, ?, ?, ?, ?)';
        dbConnection.query(query, [studentId, studentName, semester, phone_number, email, dob, gender], (error, results) => {
            if (error) {
                console.error('Error inserting student data:', error);
                return res.status(500).send('Error adding student.');
            }
            console.log('Student added successfully:', results);  // Log success
            res.send('Student added successfully!');
        });
    } else {
        console.log('Missing required fields in request:', req.body);  // Log missing fields
        res.status(400).send('Missing required fields.');
    }
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

// Handle uncaught exceptions and unhandled promise rejections
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    process.exit(1);  // Exit process on uncaught exceptions
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err);
    process.exit(1);  // Exit process on unhandled promise rejections
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
