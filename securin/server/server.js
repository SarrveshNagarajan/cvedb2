const express = require('express');
const cors = require('cors');
const cveRoutes = require('./routes/CVEroutes')
require('dotenv').config();


const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET','POST'],
    credentials: true 
}));
app.use(express.json());

// Routes
app.use('/cves', cveRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});