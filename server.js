const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const port = 8080;

// ✅ Enable CORS for your frontend
app.use(cors({
    origin: 'https://bl-de.vercel.app',  // Frontend URL
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

// ✅ MySQL Connection with Auto-Reconnect
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
            console.error('❌ MySQL Connection Error:', err);
            setTimeout(handleDisconnect, 5000); // Try reconnecting after 5 seconds
        } else {
            console.log('✅ Connected to MySQL Database');
        }
    });

    dbConnection.on('error', err => {
        console.error('⚠️ MySQL Error:', err);
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

// ➤ ✅ Add Student
app.post('/add-student', (req, res) => {
    const { studentId, studentName, semester, phone_number, email, dob, gender } = req.body;

    if (!studentId || !studentName || !semester || !phone_number || !email || !dob || !gender) {
        return res.status(400).send('❌ Missing required fields.');
    }

    const query = 'INSERT INTO students (studentId, studentName, semester, phone_number, email, dob, gender) VALUES (?, ?, ?, ?, ?, ?, ?)';
    dbConnection.query(query, [studentId, studentName, semester, phone_number, email, dob, gender], (error) => {
        if (error) {
            console.error('❌ Error adding student:', error);
            return res.status(500).send('❌ Error adding student.');
        }
        res.send('✅ Student added successfully!');
    });
});

// ➤ ✅ Get Students by Semester
app.get('/students/:semester', (req, res) => {
    const semester = req.params.semester;
    const query = 'SELECT * FROM students WHERE semester = ?';

    dbConnection.query(query, [semester], (error, results) => {
        if (error) {
            console.error('❌ Error fetching students:', error);
            return res.status(500).send('❌ Error fetching students.');
        }
        res.json(results);
    });
});

// ➤ ✅ Delete Student
app.delete('/delete-student/:id', (req, res) => {
    const studentId = req.params.id;
    const query = 'DELETE FROM students WHERE studentId = ?';

    dbConnection.query(query, [studentId], (error, results) => {
        if (error) {
            console.error('❌ Error deleting student:', error);
            return res.status(500).send('❌ Error deleting student.');
        }
        res.send(`✅ Student with ID ${studentId} deleted successfully!`);
    });
});

// ➤ ✅ Start Server
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
