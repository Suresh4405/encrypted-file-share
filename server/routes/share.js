const express = require("express");
const router = express.Router();
const File = require("../models/File");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

router.get("/:token", protect, async (req, res) => {
  try {
    const { token } = req.params;
    
    const file = await File.findOne({ linkToken: token })
      .populate("owner", "name email");
    
    if (!file) {
      return res.status(404).json({ msg: "File not found or link expired" });
    }
    
    if (file.linkExpiry && new Date() > file.linkExpiry) {
      return res.status(410).json({ msg: "Share link has expired" });
    }
    
    
    
    res.json({
      file: {
        id: file._id,
        originalName: file.originalName,
        type: file.type,
        size: file.size,
        uploadDate: file.uploadDate,
        owner: file.owner
      },
      canDownload: true
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

router.delete("/link/:fileId", protect, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);
    
    if (!file) {
      return res.status(404).json({ msg: "File not found" });
    }
    
    if (!file.owner.equals(req.user._id)) {
      return res.status(403).json({ msg: "Not authorized" });
    }
    
    file.linkToken = null;
    file.linkExpiry = null;
    await file.save();
    
    res.json({ msg: "Share link revoked" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;