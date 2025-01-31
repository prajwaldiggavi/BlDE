const express = require("express");
const mysql = require("mysql");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 8080;

// Enable CORS for frontend access
app.use(cors({
    origin: 'https://bl-de.vercel.app',  // Update with your actual frontend URL
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

// Create MySQL connection pool
const db = mysql.createPool({
    connectionLimit: 10,
    host: 'sql10.freesqldatabase.com',
    user: 'sql10760370',
    password: 'GUeSnpUSjf',
    database: 'sql10760370',
    port: 3306
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Add a Student
app.post("/add-student", (req, res) => {
    const { studentId, studentName, semester, phone_number, email, dob, gender } = req.body;
    
    if (!studentId || !studentName || !semester || !phone_number || !email || !dob || !gender) {
        return res.status(400).json({ message: "All fields are required!" });
    }

    const query = "INSERT INTO students (studentId, studentName, semester, phone_number, email, dob, gender) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(query, [studentId, studentName, semester, phone_number, email, dob, gender], (error, results) => {
        if (error) {
            console.error("Error inserting student data:", error);
            return res.status(500).json({ message: "Error adding student." });
        }
        res.json({ message: "Student added successfully!" });
    });
});

// ✅ Get Students by Semester
app.get("/students/:semester", (req, res) => {
    const { semester } = req.params;
    
    const query = "SELECT * FROM students WHERE semester = ?";
    db.query(query, [semester], (error, results) => {
        if (error) {
            console.error("Error fetching students:", error);
            return res.status(500).json({ message: "Error fetching students." });
        }
        res.json(results);
    });
});

// ✅ Delete a Student
app.delete("/delete-student/:studentId", (req, res) => {
    const { studentId } = req.params;

    const query = "DELETE FROM students WHERE studentId = ?";
    db.query(query, [studentId], (error, results) => {
        if (error) {
            console.error("Error deleting student:", error);
            return res.status(500).json({ message: "Error deleting student." });
        }
        res.json({ message: `Student with ID ${studentId} deleted successfully!` });
    });
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
