const express = require('express');
const mysql = require('mysql');
const app = express();
const port = 8080;

// Create a function to handle MySQL connection and automatic reconnection
let dbConnection;
function handleDisconnect() {
    dbConnection = mysql.createConnection({
        host: 'sql10.freesqldatabase.com',   // FreeSQL Host
        user: 'sql10760370',                 // FreeSQL Username
        password: 'GUeSnpUSjf',              // FreeSQL Password
        database: 'sql10760370',             // FreeSQL Database Name
        port: 3306                           // Default MySQL Port
    });

    // Connect to MySQL
    dbConnection.connect(function(err) {
        if (err) {
            console.error('Error connecting to db: ' + err.stack);
            setTimeout(handleDisconnect, 2000); // Reconnect after 2 seconds if error occurs
        } else {
            console.log('Connected to db as id ' + dbConnection.threadId);
        }
    });

    // Reconnect on connection loss
    dbConnection.on('error', function(err) {
        console.error('DB error: ', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect(); // Reconnect if the connection is lost
        } else {
            throw err;
        }
    });
}

// Initialize database connection
handleDisconnect();

// Middleware to parse incoming requests
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
        res.json(results); // Return student data as JSON
    });
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
