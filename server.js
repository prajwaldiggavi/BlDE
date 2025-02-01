const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080;

// Enable CORS for frontend access
app.use(cors({
    origin: '*', // Change this to your frontend URL if needed
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

// MySQL Database Connection (with Auto Reconnect)
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
            console.error('❌ Database connection error:', err);
            setTimeout(handleDisconnect, 2000);
        } else {
            console.log('✅ Connected to MySQL DB');
        }
    });

    dbConnection.on('error', function (err) {
        console.error('⚠️ Database error:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        } else {
            throw err;
        }
    });
}
handleDisconnect();

app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Support URL-encoded bodies

// ➤ **Add Student**
app.post('/add-student', (req, res) => {
    const { studentId, studentName, semester, phone_number, email, dob, gender } = req.body;
    if (!studentId || !studentName || !semester || !phone_number || !email || !dob || !gender) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const query = 'INSERT INTO students (studentId, studentName, semester, phone_number, email, dob, gender) VALUES (?, ?, ?, ?, ?, ?, ?)';
    dbConnection.query(query, [studentId, studentName, semester, phone_number, email, dob, gender], (error) => {
        if (error) {
            console.error('❌ Error adding student:', error);
            return res.status(500).json({ error: 'Database error while adding student' });
        }
        res.json({ message: '✅ Student added successfully!' });
    });
});

// ➤ **Get Students by Semester**
app.get('/students/:semester', (req, res) => {
    const { semester } = req.params;
    dbConnection.query('SELECT * FROM students WHERE semester = ?', [semester], (error, results) => {
        if (error) {
            console.error('❌ Error fetching students:', error);
            return res.status(500).json({ error: 'Database error while fetching students' });
        }
        res.json(results);
    });
});

// ➤ **Delete Student**
app.delete('/delete-student/:studentId', (req, res) => {
    const { studentId } = req.params;
    dbConnection.query('DELETE FROM students WHERE studentId = ?', [studentId], (error, results) => {
        if (error) {
            console.error('❌ Error deleting student:', error);
            return res.status(500).json({ error: 'Database error while deleting student' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json({ message: '✅ Student deleted successfully!' });
    });
});

// ➤ **Start Server**
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
