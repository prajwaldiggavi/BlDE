const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080;

// Enable CORS to allow frontend to communicate with the backend
app.use(cors({
    origin: '*', // Allow all origins or replace '*' with specific frontend URL (e.g., 'https://yourfrontend.com')
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

// MySQL connection
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
            setTimeout(handleDisconnect, 2000); // Retry connection after 2 seconds
        } else {
            console.log('Connected to db as id ' + dbConnection.threadId);
        }
    });

    dbConnection.on('error', function(err) {
        console.error('DB error: ', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect(); // Reconnect if connection is lost
        } else {
            throw err;
        }
    });
}
handleDisconnect();

// Parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Endpoint to get students by semester
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

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
