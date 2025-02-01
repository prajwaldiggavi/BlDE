const express = require('express');
const cors = require('cors');
const dbConnection = require('./db'); // Import database connection
const studentRoutes = require('./routes/students'); // Import student routes
const attendanceRoutes = require('./routes/attendance'); // Import attendance routes

const app = express();
const port = 8080;

// Enable CORS
app.use(cors({
    origin: 'https://bl-de.vercel.app',
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use routes
app.use('/students', studentRoutes);
app.use('/attendance', attendanceRoutes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
