const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const app = express();
const port = 8080;

// Enable CORS for your frontend (replace with your actual frontend URL)
app.use(cors({
    origin: 'https://bl-de.vercel.app',  // Your frontend URL
    methods: ['GET', 'POST', 'DELETE'], // Allow DELETE method here
    allowedHeaders: ['Content-Type']    // Allowed headers
}));

// Create a function to handle MySQL connection and automatic reconnection
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
