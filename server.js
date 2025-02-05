const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const PDFDocument = require('pdfkit');

const app = express();
const port = 8080; // Define port

// Enable CORS for specific origin
app.use(cors({
    origin: 'https://bl-de.vercel.app',  // Allow requests from this specific origin
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type'],
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
            setTimeout(handleDisconnect, 2000);  // Retry connection after 2 seconds
        } else {
            console.log('Connected to db as id ' + dbConnection.threadId);
        }
    });

    dbConnection.on('error', err => {
        console.error('DB error: ', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();  // Reconnect if connection is lost
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
app.get('/attendance/:roll_number/:subjectName', async (req, res) => {
    const { roll_number, subjectName } = req.params;

    if (!roll_number || !subjectName) {
        return res.status(400).json({ message: 'Roll number and Subject Name are required.' });
    }

    try {
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

// Endpoint to generate attendance report PDF
app.get('/export-attendance/:semester/:subjectName/:date', async (req, res) => {
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
        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Disposition', `attachment; filename=Attendance_${subjectName}_${date}.pdf`);
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);

        // Title
        doc.fontSize(18).fillColor('#007BFF').text('📌 Attendance Report', { align: 'center', underline: true });
        doc.moveDown(1);

        // Metadata
        doc.fontSize(12).fillColor('black');
        doc.text(`📚 Subject: ${subjectName}`);
        doc.text(`📅 Date: ${date}`);
        doc.text(`🎓 Semester: ${semester}`);
        doc.moveDown(1);

        // Draw table header
        doc.fontSize(12).fillColor('#444444').text('🎟️ Roll Number', 80, doc.y, { continued: true });
        doc.text('📊 Status', 300);
        doc.moveTo(80, doc.y + 5).lineTo(500, doc.y + 5).stroke();  // Header underline
        doc.moveDown(1);

        // Attendance Data
        attendanceRecords.forEach(record => {
            const statusEmoji = record.status === 'Present' ? '✅ Present' : '❌ Absent';
            doc.fillColor('black').text(record.roll_number, 80, doc.y, { continued: true });
            doc.text(statusEmoji, 300);
            doc.moveDown(0.5);
        });

        doc.moveDown(1);
        doc.fontSize(12).fillColor('#28A745').text(`✔️ Total Students: ${totalStudents}`);
        doc.fontSize(12).fillColor('#17A2B8').text(`✅ Present: ${presentCount}`);
        doc.fontSize(12).fillColor('#DC3545').text(`❌ Absent: ${absentCount}`);

        // Footer
        doc.moveDown(2);
        doc.fontSize(10).fillColor('#888888').text('Generated by Attendance System ✅', { align: 'center' });

        doc.end();
    } catch (err) {
        console.error('Error generating attendance PDF:', err);
        res.status(500).json({ message: 'Error generating PDF report.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
