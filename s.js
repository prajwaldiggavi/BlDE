const express = require('express');
const cors = require('cors');
const studentRoutes = require('./routes/students');
const attendanceRoutes = require('./routes/attendance');

const app = express();
const port = 8080;

// Enable CORS for all routes with specific options
app.use(cors({
  origin: 'https://bl-de.vercel.app', // Allow your frontend domain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Optional: Global middleware to handle OPTIONS requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use('/students', studentRoutes);
app.use('/attendance', attendanceRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
