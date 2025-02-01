const express = require('express');
const cors = require('cors');

const app = express();
const port = 8080;

// CORS Middleware
app.use(cors({
    origin: ['https://bl-de.vercel.app'], // Allow your frontend domain
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Your routes here
app.use('/students', require('./routes/students'));
app.use('/attendance', require('./routes/attendance'));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
