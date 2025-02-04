const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const port = 8080;

// Enable CORS
app.use(cors({
    origin: 'https://bl-de.vercel.app',
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type']
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

// Route to save or update attendance
async function fetchStudents() {
    const semester = document.getElementById("classSelector").value;
    const studentsList = document.getElementById("studentsList");
    studentsList.innerHTML = ''; // Clear previous list

    if (!semester) {
        alert("Please select a semester.");
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/students/${semester}`);
        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        const students = await response.json();
        students.forEach(student => {
            const li = document.createElement('li');
            li.innerHTML = `  
                ${student.studentName} (ID: ${student.studentId})
                <div class="student-actions">
                    <button class="present-btn" data-roll="${student.studentId}" onclick="toggleAttendance(this, true)">Present</button>
                    <button class="absent-btn" data-roll="${student.studentId}" onclick="toggleAttendance(this, false)">Absent</button>
                </div>
            `;
            studentsList.appendChild(li);
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        alert("Failed to fetch students.");
    }
}

// Submit attendance for the selected date and subject
async function submitAttendance() {
    const subjectName = document.getElementById("subjectName").value;
    const dateInput = document.getElementById("attendanceDateInput").value;
    const semester = document.getElementById("classSelector").value;

    if (!subjectName || !dateInput || !semester) {
        alert("Please fill all fields before submitting.");
        return;
    }

    const studentsList = document.querySelectorAll("#studentsList li");
    const attendance = [];

    studentsList.forEach(studentItem => {
        const rollNumber = studentItem.querySelector(".present-btn").dataset.roll;
        const isPresent = studentItem.querySelector(".present-btn").style.display === "none" ? "Present" : "Absent";
        attendance.push({ roll_number: rollNumber, status: isPresent });
    });

    try {
        const response = await fetch(`${BACKEND_URL}/attendance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: dateInput, subjectName, semester, attendance }),
        });

        if (!response.ok) throw new Error("Error saving attendance.");

        alert("Attendance submitted successfully.");
        updateAttendanceStats(semester, subjectName);
        fetchAttendanceReport(semester, subjectName);
    } catch (error) {
        console.error("Error submitting attendance:", error);
        alert("Failed to submit attendance.");
    }
}

// Update attendance statistics after submitting
async function updateAttendanceStats(semester, subjectName) {
    try {
        const response = await fetch(`${BACKEND_URL}/attendance/stats/${semester}/${subjectName}`);
        if (!response.ok) throw new Error(`Error fetching attendance statistics: ${response.status}`);

        const stats = await response.json();
        document.getElementById("totalStudentsDisplay").textContent = stats.totalStudents;
        document.getElementById("presentCountDisplay").textContent = stats.presentCount;
        document.getElementById("absentCountDisplay").textContent = stats.absentCount;
    } catch (error) {
        console.error("Error fetching attendance statistics:", error);
        alert("Failed to fetch attendance statistics.");
    }
}

// Fetch attendance for a specific student and subject
async function fetchAttendanceReport(semester, subjectName) {
    const studentId = document.getElementById("studentIdInput").value;
    if (!studentId || !subjectName) {
        alert("Please enter both Student ID and Subject Name.");
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/attendance/${studentId}/${subjectName}`);
        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        const attendanceRecords = await response.json();
        if (attendanceRecords.length === 0) {
            document.getElementById("attendanceDetailsDisplay").innerHTML = "No attendance records found.";
            return;
        }

        let attendedClasses = 0;
        let dates = [];
        attendanceRecords.forEach(record => {
            if (record.status === "Present") attendedClasses++;
            dates.push(record.date);
        });

        document.getElementById("attendanceDetailsDisplay").innerHTML = `
            Student ID: ${studentId}<br>
            Subject: ${subjectName}<br>
            Classes Attended: ${attendedClasses}<br>
            Dates: ${dates.join(', ')}
        `;
    } catch (error) {
        console.error("Error fetching attendance:", error);
        alert("Failed to fetch attendance.");
    }
}

// Toggle attendance status (Present/Absent)
function toggleAttendance(button, isPresent) {
    const parentDiv = button.parentElement;
    const presentButton = parentDiv.querySelector(".present-btn");
    const absentButton = parentDiv.querySelector(".absent-btn");

    if (isPresent) {
        presentButton.style.display = "none"; // Mark as present
        absentButton.style.display = "inline-block"; // Show absent button
    } else {
        presentButton.style.display = "inline-block"; // Show present button
        absentButton.style.display = "none"; // Hide absent button
    }
}

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
