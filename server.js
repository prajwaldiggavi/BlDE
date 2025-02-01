const express = require('express');
const mysql = require('mysql');
const cors = require('cors'); // Import CORS middleware
const app = express();
const port = 8080;

// Enable CORS for your frontend (replace with your actual frontend URL)
app.use(cors({
    origin: 'https://bl-de.vercel.app',  // Your frontend URL (update it as needed)
    methods: ['GET', 'POST', 'DELETE'], // Allowed methods
    allowedHeaders: ['Content-Type']    // Allowed headers
}));

// MySQL connection setup with automatic reconnection
let dbConnection;
function handleDisconnect() {
    dbConnection = mysql.createConnection({
        host: 'sql10.freesqldatabase.com',
        user: 'sql10760370',
        password: 'GUeSnpUSjf',
        database: 'sql10760370',
        port: 3306
    });

    dbConnection.connect(function (err) {
        if (err) {
            console.error('Error connecting to db: ' + err.stack);
            setTimeout(handleDisconnect, 2000); // Retry connection after 2 seconds
        } else {
            console.log('Connected to db as id ' + dbConnection.threadId);
        }
    });

    dbConnection.on('error', function (err) {
        console.error('DB error: ', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect(); // Reconnect if connection is lost
        } else {
            throw err;
        }
    });
}

handleDisconnect();

// Middleware to handle JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint to add a student
app.post('/add-student', (req, res) => {
    const { studentId, studentName, semester, phone_number, email, dob, gender } = req.body;

    // Validate input fields
    if (!studentId || !studentName || !semester || !phone_number || !email || !dob || !gender) {
        return res.status(400).send('❌ Missing required fields.');
    }

    // SQL query to insert a new student into the database
    const query = 'INSERT INTO students (studentId, studentName, semester, phone_number, email, dob, gender) VALUES (?, ?, ?, ?, ?, ?, ?)';
    dbConnection.query(query, [studentId, studentName, semester, phone_number, email, dob, gender], (error, results) => {
        if (error) {
            console.error('Error inserting student data:', error);
            return res.status(500).send('❌ Error adding student.');
        }
        res.send('✅ Student added successfully!');
    });
});

// Endpoint to get students by semester
app.get('/students/:semester', (req, res) => {
    const semester = req.params.semester;
    const query = 'SELECT * FROM students WHERE semester = ?';

    dbConnection.query(query, [semester], (error, results) => {
        if (error) {
            console.error('Error fetching students:', error);
            return res.status(500).send('❌ Error fetching students.');
        }
        if (results.length === 0) {
            return res.status(404).send('❌ No students found for this semester.');
        }
        res.json(results); // Send the student data as JSON
    });
});

// Endpoint to delete a student by ID
app.delete('/delete-student/:id', (req, res) => {
    const studentId = req.params.id;

    // SQL query to delete a student from the database
    const query = 'DELETE FROM students WHERE studentId = ?';
    dbConnection.query(query, [studentId], (error, results) => {
        if (error) {
            console.error('Error deleting student:', error);
            return res.status(500).send('❌ Error deleting student.');
        }
        if (results.affectedRows === 0) {
            return res.status(404).send('❌ Student not found.');
        }
        res.send(`✅ Student with ID ${studentId} deleted successfully!`);
    });
});

// Start the server
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
