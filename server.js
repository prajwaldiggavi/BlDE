const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 8080;

// Enable CORS for your frontend
app.use(cors({
    origin: 'https://bl-de.vercel.app',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Create MySQL Connection Pool (Prevents Crashes)
const dbConnection = mysql.createPool({
    connectionLimit: 10, // Prevents too many open connections
    host: 'sql10.freesqldatabase.com',
    user: 'sql10760370',
    password: 'GUeSnpUSjf',
    database: 'sql10760370',
    port: 3306
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Keep server alive (Prevents Railway from stopping)
setInterval(() => {
    console.log("✅ Server is alive");
}, 30000); // Logs every 30 seconds

// Endpoint to add a student
app.post('/add-student', (req, res) => {
    const { studentId, studentName, semester, phone_number, email, dob, gender } = req.body;

    if (studentId && studentName && semester && phone_number && email && dob && gender) {
        const query = 'INSERT INTO students (studentId, studentName, semester, phone_number, email, dob, gender) VALUES (?, ?, ?, ?, ?, ?, ?)';
        dbConnection.query(query, [studentId, studentName, semester, phone_number, email, dob, gender], (error, results) => {
            if (error) {
                console.error('❌ Error inserting student data:', error);
                return res.status(500).send('Error adding student.');
            }
            res.send('✅ Student added successfully!');
        });
    } else {
        res.status(400).send('❌ Missing required fields.');
    }
});

// Endpoint to get students by semester
app.get('/students/:semester', (req, res) => {
    const semester = req.params.semester;
    const query = 'SELECT * FROM students WHERE semester = ?';

    dbConnection.query(query, [semester], (error, results) => {
        if (error) {
            console.error('❌ Error fetching students:', error);
            return res.status(500).send('Error fetching students.');
        }
        res.json(results);
    });
});

// Graceful Shutdown (Prevents Railway Auto-Kill)
process.on('SIGTERM', () => {
    console.log('🚨 Received SIGTERM, shutting down gracefully...');
    if (dbConnection) dbConnection.end();
    process.exit(0);
});

// Start Server
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
