require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = 8080;

// Enable CORS (Allow frontend access)
app.use(cors({
    origin: 'https://bl-de.vercel.app',  // Update with your frontend URL
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// Define Schema & Model
const studentSchema = new mongoose.Schema({
    studentId: String,
    studentName: String,
    semester: Number,
    phone_number: String,
    email: String,
    dob: String,
    gender: String
});

const Student = mongoose.model('Student', studentSchema);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Add Student API
app.post('/add-student', async (req, res) => {
    try {
        const newStudent = new Student(req.body);
        await newStudent.save();
        res.send('✅ Student added successfully!');
    } catch (err) {
        res.status(500).send('❌ Error adding student.');
    }
});

// ✅ Get Students by Semester API
app.get('/students/:semester', async (req, res) => {
    try {
        const students = await Student.find({ semester: req.params.semester });
        res.json(students);
    } catch (err) {
        res.status(500).send('❌ Error fetching students.');
    }
});

// Start Server
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
