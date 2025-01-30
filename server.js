const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3001;  // Use Railway's dynamic port

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Database Connection (Using FreeSQL)
const db = mysql.createConnection({
    host: 'sql10.freesqldatabase.com',  // FreeSQL Host
    user: 'sql10760370',                // FreeSQL Username
    password: 'GUeSnpUSjf',              // FreeSQL Password
    database: 'sql10760370',             // FreeSQL Database Name
    port: 3306                           // Default MySQL Port
});

// Connect to Database
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to FreeSQL Cloud Database');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
