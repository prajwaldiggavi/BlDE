const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const port = 8080;

// Enable CORS with specific configuration
app.use(cors({
    origin: ['https://bl-de.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Handle preflight requests
app.options('*', cors());

// MySQL connection configuration
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
            console.error('Error connecting to db:', err);
            setTimeout(handleDisconnect, 2000);
            return;
        }
        console.log('Connected to database as id ' + dbConnection.threadId);
    });

    dbConnection.on('error', function(err) {
        console.error('Database error:', err);
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

// Middleware to set CORS headers for all responses
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://bl-de.vercel.app');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// 1. Get students by semester
app.get('/students/:semester', (req, res) => {
    const semester = req.params.semester;
    const query = 'SELECT * FROM students WHERE semester = ?';

    dbConnection.query(query, [semester], (error, results) => {
        if (error) {
            console.error('Error fetching students:', error);
            return res.status(500).json({ error: 'Error fetching students' });
        }
        res.json({ students: results });
    });
});

// 2. Add new student
app.post('/add-student', (req, res) => {
    const { studentId, studentName, semester, phone_number, email, dob, gender } = req.body;

    if (!studentId || !studentName || !semester) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = 'INSERT INTO students (studentId, studentName, semester, phone_number, email, dob, gender) VALUES (?, ?, ?, ?, ?, ?, ?)';
    dbConnection.query(query, [studentId, studentName, semester, phone_number, email, dob, gender], (error, results) => {
        if (error) {
            console.error('Error adding student:', error);
            return res.status(500).json({ error: 'Error adding student' });
        }
        res.json({ message: 'Student added successfully', id: results.insertId });
    });
});

// 3. Submit attendance
app.post('/attendance', (req, res) => {
    const { date, subjectName, semester, attendance } = req.body;

    if (!date || !subjectName || !semester || !attendance || !Array.isArray(attendance)) {
        return res.status(400).json({ error: 'Invalid attendance data' });
    }

    const values = attendance.map(record => [
        date,
        subjectName,
        semester,
        record.roll_number,
        record.status
    ]);

    const query = 'INSERT INTO attendance (date, subject_name, semester, student_id, status) VALUES ?';
    
    dbConnection.query(query, [values], (error, results) => {
        if (error) {
            console.error('Error submitting attendance:', error);
            return res.status(500).json({ error: 'Error submitting attendance' });
        }
        res.json({ message: 'Attendance submitted successfully' });
    });
});

// 4. Get attendance for a student
app.get('/attendance/:studentId/:subjectName', (req, res) => {
    const { studentId, subjectName } = req.params;
    const query = `
        SELECT a.date, a.status, s.studentName, a.subject_name
        FROM attendance a
        JOIN students s ON a.student_id = s.studentId
        WHERE a.student_id = ? AND a.subject_name = ?
        ORDER BY a.date DESC
    `;

    dbConnection.query(query, [studentId, subjectName], (error, results) => {
        if (error) {
            console.error('Error fetching attendance:', error);
            return res.status(500).json({ error: 'Error fetching attendance' });
        }
        res.json({ attendance: results });
    });
});

// 5. Get attendance statistics
app.get('/attendance-stats/:semester/:subjectName', (req, res) => {
    const { semester, subjectName } = req.params;
    const query = `
        SELECT 
            s.studentId,
            s.studentName,
            COUNT(CASE WHEN a.status = 'Present' THEN 1 END) as present_count,
            COUNT(a.id) as total_classes,
            ROUND((COUNT(CASE WHEN a.status = 'Present' THEN 1 END) / COUNT(a.id)) * 100, 2) as attendance_percentage
        FROM students s
        LEFT JOIN attendance a ON s.studentId = a.student_id 
            AND a.subject_name = ?
        WHERE s.semester = ?
        GROUP BY s.studentId, s.studentName
    `;

    dbConnection.query(query, [subjectName, semester], (error, results) => {
        if (error) {
            console.error('Error fetching attendance statistics:', error);
            return res.status(500).json({ error: 'Error fetching attendance statistics' });
        }
        res.json({ statistics: results });
    });
});

// 6. Delete student
app.delete('/delete-student/:studentId', (req, res) => {
    const studentId = req.params.studentId;
    const query = 'DELETE FROM students WHERE studentId = ?';

    dbConnection.query(query, [studentId], (error, results) => {
        if (error) {
            console.error('Error deleting student:', error);
            return res.status(500).json({ error: 'Error deleting student' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json({ message: 'Student deleted successfully' });
    });
});

// 7. Export attendance (CSV format)
app.get('/export-attendance/:semester/:subjectName', (req, res) => {
    const { semester, subjectName } = req.params;
    const query = `
        SELECT 
            s.studentId,
            s.studentName,
            a.date,
            a.status
        FROM students s
        LEFT JOIN attendance a ON s.studentId = a.student_id 
        WHERE s.semester = ? AND a.subject_name = ?
        ORDER BY s.studentId, a.date
    `;

    dbConnection.query(query, [semester, subjectName], (error, results) => {
        if (error) {
            console.error('Error exporting attendance:', error);
            return res.status(500).json({ error: 'Error exporting attendance' });
        }

        // Convert to CSV format
        const csv = [
            ['Student ID', 'Student Name', 'Date', 'Status'].join(','),
            ...results.map(row => [
                row.studentId,
                row.studentName,
                new Date(row.date).toISOString().split('T')[0],
                row.status
            ].join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=attendance_${semester}_${subjectName}.csv`);
        res.send(csv);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
