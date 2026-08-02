const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');

// Import routes
const authRoutes = require('./routes/auth');
const petRoutes = require('./routes/pets');
const applicationRoutes = require('./routes/applications');
const messageRoutes = require('./routes/messages');
const paymentRoutes = require('./routes/payments');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Database Tables and Seeding
initDb().then(() => {
  console.log('Database system initialized successfully.');
}).catch((err) => {
  console.error('Failed to initialize database system:', err);
});

// Basic Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the PetPal SQL MERN API Server!' });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
