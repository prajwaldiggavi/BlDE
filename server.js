const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const port = 8080;

// Enable CORS
app.use(cors({
    origin: 'https://bl-de.vercel.app',
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

    dbConnection.connect(err => {
        if (err) {
            console.error('Error connecting to db: ' + err.stack);
            setTimeout(handleDisconnect, 2000);
        } else {
            console.log('Connected to db as id ' + dbConnection.threadId);
        }
    });

    dbConnection.on('error', err => {
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

// Helper Function: Execute MySQL Queries
const executeQuery = (query, params) => {
    return new Promise((resolve, reject) => {
        dbConnection.query(query, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

// Endpoint to add a student
app.post('/add-student', async (req, res) => {
    const { studentId, studentName, semester, phone_number, email, dob, gender } = req.body;

    if (!studentId || !studentName || !semester || !phone_number || !email || !dob || !gender) {
        return res.status(400).send('Missing required fields.');
    }

    try {
        await executeQuery('INSERT INTO students (studentId, studentName, semester, phone_number, email, dob, gender) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [studentId, studentName, semester, phone_number, email, dob, gender]);
        res.send('Student added successfully!');
    } catch (error) {
        console.error('Error inserting student data:', error);
        res.status(500).send('Error adding student.');
    }
});

// Endpoint to get students by semester
app.get('/students/:semester', async (req, res) => {
    try {
        const results = await executeQuery('SELECT * FROM students WHERE semester = ?', [req.params.semester]);
        res.json(results);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).send('Error fetching students.');
    }
});

// Endpoint to delete a student by studentId
app.delete('/delete-student/:studentId', async (req, res) => {
    try {
        const results = await executeQuery('DELETE FROM students WHERE studentId = ?', [req.params.studentId]);
        if (results.affectedRows === 0) {
            return res.status(404).send('Student not found.');
        }
        res.send('Student deleted successfully!');
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).send('Error deleting student.');
    }
});

// Route to save or update attendance
// Route to save or update attendance and display present/absent counts
app.post('/attendance', async (req, res) => {
    const { date, subjectName, attendance } = req.body;
    if (!date || !subjectName || !attendance || attendance.length === 0) {
        return res.status(400).json({ message: "Invalid or incomplete data provided." });
    }

    try {
        const rollNumbers = attendance.map(record => record.roll_number);

        // Save or update attendance records
        await Promise.all(attendance.map(async (record) => {
            const existingRecord = await executeQuery('SELECT id FROM attendance WHERE date = ? AND roll_number = ?', [date, record.roll_number]);
            if (existingRecord.length > 0) {
                return executeQuery('UPDATE attendance SET status = ?, subjectName = ? WHERE date = ? AND roll_number = ?',
                    [record.status, subjectName, date, record.roll_number]);
            } else {
                return executeQuery('INSERT INTO attendance (date, roll_number, status, subjectName) VALUES (?, ?, ?, ?)',
                    [date, record.roll_number, record.status, subjectName]);
            }
        }));

        // Calculate present and absent counts
        const presentCount = attendance.filter(record => record.status === 'present').length;
        const absentCount = attendance.filter(record => record.status === 'absent').length;

        res.json({
            message: 'Attendance saved successfully',
            presentCount,
            absentCount
        });
    } catch (err) {
        console.error('Error saving attendance:', err);
        res.status(500).json({ message: 'Error saving attendance', error: err.message });
    }
});

// Endpoint to retrieve total classes present and absent for a particular student by studentId and subjectName
app.get('/attendance/:studentId/:subjectName', async (req, res) => {
    const { studentId, subjectName } = req.params;

    if (!studentId || !subjectName) {
        return res.status(400).json({ message: 'Student ID and Subject Name are required.' });
    }

    try {
        // Fetch the attendance records for the given student and subject
        const attendanceRecords = await executeQuery(
            'SELECT date, status FROM attendance WHERE studentId = ? AND subjectName = ?',
            [studentId, subjectName]
        );

        if (attendanceRecords.length === 0) {
            return res.status(404).json({ message: 'No attendance records found for this student and subject.' });
        }

        // Calculate present and absent counts
        const presentClasses = attendanceRecords.filter(record => record.status === 'present');
        const absentClasses = attendanceRecords.filter(record => record.status === 'absent');

        res.json({
            studentId,
            subjectName,
            presentClasses: presentClasses.length,
            absentClasses: absentClasses.length,
            details: {
                presentClasses: presentClasses,
                absentClasses: absentClasses
            }
        });
    } catch (err) {
        console.error('Error fetching attendance:', err);
        res.status(500).json({ message: 'Error fetching attendance.' });
    }
});




app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
