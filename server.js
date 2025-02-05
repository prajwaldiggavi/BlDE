const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const port = 8080;

// Enable CORS for all routes globally
app.use(cors({
    origin: 'https://bl-de.vercel.app', // Only allow requests from this origin
    methods: ['GET', 'POST', 'DELETE'], // Allowed methods
    allowedHeaders: ['Content-Type'], // Allowed headers
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

// Middleware to parse JSON and URL-encoded data
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

// Route to save or update attendance and generate attendance report
app.post('/attendance', async (req, res) => {
    const { date, subjectName, semester, attendance } = req.body;
    if (!date || !subjectName || !semester || !attendance || attendance.length === 0) {
        return res.status(400).json({ message: "Invalid or incomplete data provided." });
    }

    try {
        // Save or update attendance records
        await Promise.all(attendance.map(async (record) => {
            const existingRecord = await executeQuery('SELECT id FROM attendance WHERE date = ? AND roll_number = ? AND subjectName = ?',
                [date, record.roll_number, subjectName]);
            
            if (existingRecord.length > 0) {
                // Update attendance record if it exists
                return executeQuery('UPDATE attendance SET status = ?, semester = ? WHERE date = ? AND roll_number = ? AND subjectName = ?',
                    [record.status, semester, date, record.roll_number, subjectName]);
            } else {
                // Insert new attendance record if it doesn't exist
                return executeQuery('INSERT INTO attendance (date, roll_number, status, subjectName, semester) VALUES (?, ?, ?, ?, ?)',
                    [date, record.roll_number, record.status, subjectName, semester]);
            }
        }));

        // Generate attendance report
        const totalStudents = attendance.length;
        const presentCount = attendance.filter(record => record.status === 'Present').length;
        const absentCount = totalStudents - presentCount;

        res.json({
            message: 'Attendance saved successfully',
            report: {
                totalStudents,
                presentCount,
                absentCount
            }
        });
    } catch (err) {
        console.error('Error saving attendance:', err);
        res.status(500).json({ message: 'Error saving attendance', error: err.message });
    }
});

// Endpoint to retrieve attendance for a student by roll_number and subjectName
// Fetch the attendance records for a specific student and subject
app.get('/attendance/:roll_number/:subjectName', async (req, res) => {
    const { roll_number, subjectName } = req.params;

    if (!roll_number || !subjectName) {
        return res.status(400).json({ message: 'Roll number and Subject Name are required.' });
    }

    try {
        // Fetch the attendance records for the given roll_number and subjectName
        const attendanceRecords = await executeQuery(
            'SELECT date, status, semester FROM attendance WHERE roll_number = ? AND subjectName = ?',
            [roll_number, subjectName]
        );

        if (attendanceRecords.length === 0) {
            return res.status(404).json({ message: 'No attendance records found for this roll number and subject.' });
        }

        res.json(attendanceRecords);
    } catch (err) {
        console.error('Error fetching attendance:', err);
        res.status(500).json({ message: 'Error fetching attendance.' });
    }
});

app.get('/attendance/stats/:semester/:subjectName/:date', async (req, res) => {
    const { semester, subjectName, date } = req.params;

    try {
        // Query for total students, present count, and absent count on a specific date
        const totalStudentsQuery = 'SELECT COUNT(DISTINCT roll_number) as totalStudents FROM attendance WHERE semester = ? AND subjectName = ? AND date = ?';
        const presentCountQuery = 'SELECT COUNT(*) as presentCount FROM attendance WHERE semester = ? AND subjectName = ? AND date = ? AND status = "Present"';
        const absentCountQuery = 'SELECT COUNT(*) as absentCount FROM attendance WHERE semester = ? AND subjectName = ? AND date = ? AND status = "Absent"';

        const totalStudents = await executeQuery(totalStudentsQuery, [semester, subjectName, date]);
        const presentCount = await executeQuery(presentCountQuery, [semester, subjectName, date]);
        const absentCount = await executeQuery(absentCountQuery, [semester, subjectName, date]);

        res.json({
            totalStudents: totalStudents[0].totalStudents,
            presentCount: presentCount[0].presentCount,
            absentCount: absentCount[0].absentCount
        });
    } catch (err) {
        console.error('Error fetching attendance stats:', err);
        res.status(500).json({ message: 'Error fetching attendance statistics.' });
    }
});
const PDFDocument = require('pdfkit');
const fs = require('fs');

const exportAttendancePDF = async (req, res) => {
    const { semester, subjectName, date } = req.params;
    try {
        // Fetch attendance records
        const attendanceRecords = await executeQuery(
            'SELECT roll_number, status FROM attendance WHERE semester = ? AND subjectName = ? AND date = ?',
            [semester, subjectName, date]
        );

        if (attendanceRecords.length === 0) {
            return res.status(404).json({ message: 'No attendance records found.' });
        }

        // Count total, present, and absent students
        const totalStudents = attendanceRecords.length;
        const presentCount = attendanceRecords.filter(record => record.status === 'Present').length;
        const absentCount = totalStudents - presentCount;

        // Create a PDF document
        const doc = new PDFDocument();
        res.setHeader('Content-Disposition', `attachment; filename=Attendance_${subjectName}_${date}.pdf`);
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);

        // Title
        doc.fontSize(16).text(`Attendance Report`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Subject: ${subjectName}`);
        doc.text(`Date: ${date}`);
        doc.text(`Semester: ${semester}`);
        doc.moveDown();

        // Table Header
        doc.fontSize(12).text(`Roll Number       Status`, { underline: true });
        doc.moveDown();

        // Attendance Data
        attendanceRecords.forEach(record => {
            doc.text(`${record.roll_number}             ${record.status}`);
        });

        doc.moveDown();
        doc.text(`Total Students: ${totalStudents}`);
        doc.text(`Present: ${presentCount}`);
        doc.text(`Absent: ${absentCount}`);

        doc.end();
    } catch (err) {
        console.error('Error generating attendance PDF:', err);
        res.status(500).json({ message: 'Error generating PDF report.' });
    }
};

// Add this route to your existing server file
app.get('/export-attendance/:semester/:subjectName/:date', exportAttendancePDF);



// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
