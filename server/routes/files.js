const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const File = require('../models/File');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const uploadSingle = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 
  }
}).single('file');

const uploadMultiple = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 
  }
}).array('files', 30); 

router.post('/upload', auth, (req, res) => {
  uploadSingle(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ 
        success: false,
        message: err.message || 'File upload failed'
      });
    }

    try {
      console.log('Upload request received');
      console.log('File:', req.file);
      console.log('User:', req.user);
      
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: 'No file uploaded' 
        });
      }

      const file = new File({
        filename: req.file.filename,
        originalName: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
        owner: req.user._id
      });

      await file.save();

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        file: {
          id: file._id,
          originalName: file.originalName,
          type: file.type,
          size: file.size,
          uploadDate: file.uploadDate,
          filename: file.filename
        }
      });
    } catch (error) {
      console.error('Upload error:', error);
            if (req.file && req.file.filename) {
        const filePath = path.join(uploadDir, req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      res.status(500).json({ 
        success: false,
        message: 'Server error during upload',
        error: error.message 
      });
    }
  });
});

router.post('/upload-multiple', auth, (req, res) => {
  uploadMultiple(req, res, async (err) => {
    if (err) {
      console.error('Multiple upload error:', err);
      return res.status(400).json({ 
        success: false,
        message: err.message || 'Files upload failed'
      });
    }

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ 
          success: false,
          message: 'No files uploaded' 
        });
      }

      const savedFiles = [];
      
      for (const uploadedFile of req.files) {
        const file = new File({
          filename: uploadedFile.filename,
          originalName: uploadedFile.originalname,
          type: uploadedFile.mimetype,
          size: uploadedFile.size,
          owner: req.user._id
        });

        await file.save();
        savedFiles.push({
          id: file._id,
          originalName: file.originalName,
          type: file.type,
          size: file.size,
          uploadDate: file.uploadDate
        });
      }

      res.status(201).json({
        success: true,
        message: `${savedFiles.length} files uploaded successfully`,
        files: savedFiles
      });
    } catch (error) {
      console.error('Multiple upload error:', error);
      
      if (req.files) {
        req.files.forEach(uploadedFile => {
          const filePath = path.join(uploadDir, uploadedFile.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: 'Server error during upload' 
      });
    }
  });
});
router.get('/myfiles', auth, async (req, res) => {
  try {
    const files = await File.find({ owner: req.user._id }).sort({ uploadDate: -1 });
    
    const formattedFiles = files.map(file => ({
      id: file._id,
      filename: file.originalName,
      type: file.type,
      size: file.size,
      uploadDate: file.uploadDate,
      sharedWith: file.sharedWith || [],
      shareToken: file.shareToken ? true : false,
      linkExpiry: file.linkExpiry
    }));
    
    res.json({
      success: true,
      files: formattedFiles,
      count: formattedFiles.length
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching files' 
    });
  }
});

router.get('/download/:id', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ 
        success: false,
        message: 'File not found' 
      });
    }
    const canDownload = 
      file.owner.equals(req.user._id) || 
      (file.sharedWith && file.sharedWith.some(userId => userId.equals(req.user._id)));
    
    if (!canDownload) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. You do not have permission to download this file.' 
      });
    }

    const filePath = path.join(uploadDir, file.filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false,
        message: 'File not found on server' 
      });
    }

    res.download(filePath, file.originalName, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ 
            success: false,
            message: 'Error downloading file' 
          });
        }
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});
router.post('/share/:id', auth, async (req, res) => {
  try {
    const { userIds } = req.body;
    const fileId = req.params.id;

    const file = await File.findById(fileId);
    
    if (!file) {
      return res.status(404).json({ 
        success: false,
        message: 'File not found' 
      });
    }
    if (!file.owner.equals(req.user._id)) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to share this file' 
      });
    }
    const usersToShare = Array.isArray(userIds) ? userIds : [userIds];
        for (const userId of usersToShare) {
      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(400).json({ 
          success: false,
          message: `User with ID ${userId} not found` 
        });
      }
    }

    if (!file.sharedWith) {
      file.sharedWith = [];
    }
    
    file.sharedWith = [...new Set([...file.sharedWith, ...usersToShare])];
    await file.save();

    res.json({ 
      success: true,
      message: 'File shared successfully',
      sharedWith: file.sharedWith
    });
  } catch (error) {
    console.error('Share error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

router.post('/share/link/:id', auth, async (req, res) => {
  try {
    const { expiryOption } = req.body;
    const fileId = req.params.id;

    const file = await File.findById(fileId);
    
    if (!file) {
      return res.status(404).json({ 
        success: false,
        message: 'File not found' 
      });
    }

    if (!file.owner.equals(req.user._id)) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to share this file' 
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    file.shareToken = token;

    if (expiryOption && expiryOption !== 'never') {
      const expiryDate = new Date();
      
      switch(expiryOption) {
        case '30s':
          expiryDate.setSeconds(expiryDate.getSeconds() + 30);
          break;
        case '1h':
          expiryDate.setHours(expiryDate.getHours() + 1);
          break;
        case '3h':
          expiryDate.setHours(expiryDate.getHours() + 3);
          break;
        case '24h':
          expiryDate.setHours(expiryDate.getHours() + 24);
          break;
        default:
          expiryDate.setHours(expiryDate.getHours() + 24);
      }
      
      file.linkExpiry = expiryDate;
    }

    await file.save();
    
    res.json({
      success: true,
      message: 'Share link created',
      shareToken: token,
      expiryOption: expiryOption
    });
  } catch (error) {
    console.error('Create share link error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

router.get('/shared', auth, async (req, res) => {
  try {
    const files = await File.find({
      sharedWith: req.user._id
    })
    .populate('owner', 'name email')
    .sort({ uploadDate: -1 });
    
    const formattedFiles = files.map(file => ({
      id: file._id,
      filename: file.originalName,
      type: file.type,
      size: file.size,
      uploadDate: file.uploadDate,
      owner: {
        name: file.owner.name,
        email: file.owner.email
      }
    }));
    
    res.json({
      success: true,
      files: formattedFiles,
      count: formattedFiles.length
    });
  } catch (error) {
    console.error('Get shared files error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

router.get('/share/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const authHeader = req.header('Authorization');

    console.log('Share link access - Token:', token);
    console.log('Share link access - Auth header:', authHeader ? 'Present' : 'Missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required. Please login to access this file.',
        requiresAuth: true
      });
    }

    const authToken = authHeader.replace('Bearer ', '');
    let decoded;
    
    try {
      decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'secret123');
    } catch (authError) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid or expired token. Please login again.',
        requiresAuth: true
      });
    }

    const file = await File.findOne({ shareToken: token })
      .populate('owner', 'name email');
    
    if (!file) {
      return res.status(404).json({ 
        success: false,
        message: 'File not found or link expired' 
      });
    }

    let remainingTime = null;
    let isExpired = false;
    
    if (file.linkExpiry) {
      const now = new Date();
      const expiry = new Date(file.linkExpiry);
      remainingTime = Math.max(0, Math.floor((expiry - now) / 1000));
      isExpired = now > expiry;
      
      if (isExpired) {
        return res.status(410).json({ 
          success: false,
          message: 'Share link has expired',
          expiredAt: file.linkExpiry,
          remainingTime: 0
        });
      }
    }

    const userId = decoded.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    const hasAccess = 
      file.owner._id.equals(userObjectId) || 
      (file.sharedWith && file.sharedWith.some(sharedUserId => 
        sharedUserId.equals(userObjectId)
      ));
    
    if (!hasAccess) {
      if (!file.sharedWith) {
        file.sharedWith = [];
      }
      if (!file.sharedWith.some(id => id.equals(userObjectId))) {
        file.sharedWith.push(userObjectId);
        await file.save();
        console.log('Added user to sharedWith:', userId);
      }
    }

    res.json({
      success: true,
      file: {
        id: file._id,
        originalName: file.originalName,
        type: file.type,
        size: file.size,
        uploadDate: file.uploadDate,
        owner: file.owner
      },
      linkInfo: {
        expiresAt: file.linkExpiry,
        remainingTime: remainingTime,
        isExpired: isExpired
      },
      message: 'Access granted'
    });
  } catch (error) {
    console.error('Share link access error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ 
        success: false,
        message: 'File not found' 
      });
    }

    if (!file.owner.equals(req.user._id)) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to delete this file' 
      });
    }
    const filePath = path.join(uploadDir, file.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    await File.findByIdAndDelete(req.params.id);

    res.json({ 
      success: true,
      message: 'File deleted successfully' 
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

module.exports = router;