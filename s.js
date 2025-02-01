const express = require('express');
const cors = require('cors');
const studentRoutes = require('./routes/students');
const attendanceRoutes = require('./routes/attendance');

const app = express();
const port = 8080;

// ✅ Enable CORS for all responses
app.use(cors({
    origin: 'https://bl-de.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

// ✅ Global Middleware to Set Headers for All Responses
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "https://bl-de.vercel.app");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Use routes
app.use('/students', studentRoutes);
app.use('/attendance', attendanceRoutes);

// ✅ Catch-all Route for 404 Errors
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ✅ Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
