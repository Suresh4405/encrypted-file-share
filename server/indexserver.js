const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const connectDB = async () => {
  try {    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/file_sharing', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, 
    });
    
    console.log('DB connected successfully!');    
  } catch (err) {
    console.error('DB connection FAILED:', err.message);
    process.exit(1); 
  }
};

connectDB();

mongoose.connection.on('error', err => {
  console.error('DB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('DB disconnected');
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/files', require('./routes/files'));

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is running',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };
  
  res.json({
    server: 'Running',
    database: statusMap[dbStatus] || 'Unknown',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${PORT}`);
});