const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');  
const User = require('../models/User');

router.post('/register', async (req, res) => {
  try {
    console.log('Register request:', req.body);
    
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide name, email, and password' 
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }

    const user = new User({ 
      name, 
      email: email.toLowerCase(), 
      password 
    });
    
    await user.save();
    console.log('user saved to mongodb:', user._id);

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '7d' }
    );

    console.log('Registration successful for:', user.email);
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration',
      error: error.message 
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt for:', req.body.email);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide email and password' 
      });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('user not found:', email);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    console.log('User email', user.email);
    let isMatch;
    
    if (user.password) {
      isMatch = await user.comparePassword(password);
    } else if (user.passwordHash) {
      isMatch = await bcrypt.compare(password, user.passwordHash);
    } else {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid user account' 
      });
    }

    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '7d' }
    );

    console.log('login successful for:', user.email);
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login',
      error: error.message 
    });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ 
      success: true,
      users 
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

module.exports = router;