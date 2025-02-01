const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const port = 3001; // Changed to match the frontend

// Enable CORS
app.use(cors({
    origin: '*', // Allow all origins for development, change to specific origin in production
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

// MySQL connection and automatic reconnection
let dbConnection;
function handleDisconnect() {
    dbConnection = mysql.createConnection({
        host: 'sql10.freesqldatabase.com',
        user: 'sql10760370',
        password: 'GUeSnpUSjf',
        database: 'sql10760370',
        port: 3306
    });

    dbConnection.connect(function(err) {
        if (err) {
            console.error('Error connecting to db: ' + err.stack);
            setTimeout(handleDisconnect, 2000);
        } else {
            console.log('Connected to db as id ' + dbConnection.threadId);
        }
    });

    dbConnection.on('error', function(err) {
        console.error('DB error: ', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        } else {
            throw err;
        }
    });
}
handleDisconnect();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Existing endpoints

// Endpoint to add a student
app.post('/add-student', (req, res) => {
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

// Modified endpoint to get students by semester
app.get('/students/semester/:semester', (req, res) => {
    const semester = req.params.semester;
    const query = 'SELECT * FROM students WHERE semester = ?';

    dbConnection.query(query, [semester], (error, results) => {
        if (error) {
            console.error('Error fetching students:', error);
            return res.status(500).send('Error fetching students.');
        }
        res.json({ students: results }); // Wrap results in an object with 'students' key
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

// New endpoint to submit attendance
app.post('/attendance', (req, res) => {
    const { date, subjectName, semester, attendance } = req.body;

    if (!date || !subjectName || !semester || !attendance || !Array.isArray(attendance)) {
        return res.status(400).send('Invalid input data');
    }

    const values = attendance.map(record => [date, subjectName, semester, record.roll_number, record.status]);
    const query = 'INSERT INTO attendance (date, subject_name, semester, student_id, status) VALUES ?';

    dbConnection.query(query, [values], (error, results) => {
        if (error) {
            console.error('Error inserting attendance data:', error);
            return res.status(500).send('Error saving attendance.');
        }
        res.send('Attendance submitted successfully!');
    });
});

// New endpoint to fetch attendance for a specific student and subject
app.get('/attendance/:studentId/:subjectName', (req, res) => {
    const { studentId, subjectName } = req.params;
    const query = 'SELECT date, status FROM attendance WHERE student_id = ? AND subject_name = ?';

    dbConnection.query(query, [studentId, subjectName], (error, results) => {
        if (error) {
            console.error('Error fetching attendance:', error);
            return res.status(500).send('Error fetching attendance.');
        }
        res.json({ attendance: results });
    });
});

// Optional: Endpoint to export attendance (placeholder)
app.get('/export-attendance', (req, res) => {
    // Implement export logic here
    res.send('Attendance export feature not implemented yet.');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
