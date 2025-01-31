const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3001; // Supports Railway Deployment

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MySQL Database Connection (FreeSQL Cloud)
let dbConnection;
function handleDisconnect() {
    dbConnection = mysql.createConnection({
        host: 'sql10.freesqldatabase.com',  // FreeSQL host
        user: 'sql10760370',                // FreeSQL username
        password: 'GUeSnpUSjf',             // FreeSQL password
        database: 'sql10760370',            // FreeSQL database name
        port: 3306                          // Default MySQL port
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

// Email Configuration (Hardcoded Credentials)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'diggaviprajwal55@gmail.com',
        pass: 'bgnm kbga xkew pgpb' // Use your actual Google App Password
    }
});

// Helper Function to Execute MySQL Queries
const executeQuery = (query, params) => {
    return new Promise((resolve, reject) => {
        dbConnection.query(query, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

// Route to Add a Student
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

// Route to Get Students by Semester
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

// Route to Delete a Student by studentId
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

// Route to Save or Update Attendance and Send Email Notifications
app.post('/attendance', async (req, res) => {
    const { date, subjectName, attendance } = req.body;

    if (!date || !subjectName || !attendance || attendance.length === 0) {
        return res.status(400).json({ message: "Invalid or incomplete data provided." });
    }

    try {
        const rollNumbers = attendance.map(record => record.roll_number);

        // Save or update attendance records
        const attendancePromises = attendance.map(async (record) => {
            const { roll_number, status } = record;

            const existingRecord = await executeQuery(
                'SELECT id FROM attendance WHERE date = ? AND roll_number = ?',
                [date, roll_number]
            );

            if (existingRecord.length > 0) {
                return executeQuery(
                    'UPDATE attendance SET status = ?, subjectName = ? WHERE date = ? AND roll_number = ?',
                    [status, subjectName, date, roll_number]
                );
            } else {
                return executeQuery(
                    'INSERT INTO attendance (date, roll_number, status, subjectName) VALUES (?, ?, ?, ?)',
                    [date, roll_number, status, subjectName]
                );
            }
        });

        await Promise.all(attendancePromises);

        // Fetch email details and attendance summary
        const students = await executeQuery(
            'SELECT email, studentName, studentId FROM students WHERE studentId IN (?)',
            [rollNumbers]
        );

        const attendanceSummaries = await Promise.all(
            rollNumbers.map(async (rollNumber) => {
                const presentCount = await executeQuery(
                    'SELECT COUNT(*) AS total FROM attendance WHERE roll_number = ? AND subjectName = ? AND status = "Present"',
                    [rollNumber, subjectName]
                );
                return { rollNumber, total: presentCount[0]?.total || 0 };
            })
        );

        // Map students and attendance summaries
        const studentMap = students.reduce((acc, student) => {
            acc[student.studentId] = student;
            return acc;
        }, {});

        const attendanceMap = attendanceSummaries.reduce((acc, summary) => {
            acc[summary.rollNumber] = summary.total;
            return acc;
        }, {});

        // Send Email Notifications
        const emailPromises = attendance
            .filter(record => studentMap[record.roll_number])
            .map(record => {
                const student = studentMap[record.roll_number];
                const totalAttendance = attendanceMap[record.roll_number] || 0;

                const formattedDate = new Date(date).toLocaleDateString();

                const statusMessage = record.status === 'Present'
                    ? `You are marked as Present for ${subjectName} on ${formattedDate}.`
                    : `You are marked as Absent for ${subjectName} on ${formattedDate}.`;

                const mailOptions = {
                    from: 'diggaviprajwal55@gmail.com',
                    to: student.email,
                    subject: 'Attendance Status',
                    text: `Dear ${student.studentName},\n\n${statusMessage}\n\nYour total Present classes for ${subjectName} is ${totalAttendance}.\n\nRegards,\nDEPT OF ISE BLDEACET`
                };

                return transporter.sendMail(mailOptions);
            });

        await Promise.all(emailPromises);

        res.json({ message: 'Attendance saved and emails sent successfully' });
    } catch (err) {
        console.error('❌ Error saving attendance:', err);
        res.status(500).json({ message: 'Error saving attendance', error: err.message });
    }
});

// Start the Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
