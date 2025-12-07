import React, { useState } from 'react';
import API from '../api';
import '../css/FileUpload.css';

const FileUpload = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    const maxSize = 10 * 1024 * 1024;
    const invalidFiles = selectedFiles.filter(file => file.size > maxSize);
    
    if (invalidFiles.length > 0) {
      setError(`Some files exceed 10MB limit: ${invalidFiles.map(f => f.name).join(', ')}`);
      return;
    }
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
    
    const invalidTypes = selectedFiles.filter(file => !allowedTypes.includes(file.type));
    if (invalidTypes.length > 0) {
      setError(`Invalid file types: ${invalidTypes.map(f => f.name).join(', ')}`);
      return;
    }
    
    setFiles([...files, ...selectedFiles]);
    setError('');
  };

  const handleRemoveFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No authentication token found. Please login again.');
        setUploading(false);
        return;
      }
      if (files.length === 1) {
        const formData = new FormData();
        formData.append('file', files[0]);
        for (let [key, value] of formData.entries()) {
          console.log(`${key}:`, value);
        }
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);
        const config = {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        };

        const response = await API.post('/files/upload', formData, config);

        clearInterval(progressInterval);
        setProgress(100);
        
        if (response.data.success) {
          setSuccess('File uploaded successfully!');
          setFiles([]);
        } else {
          setError(response.data.message || 'Upload failed');
        }
      } 
      else {
        const formData = new FormData();
        files.forEach((file, index) => {
          formData.append('files', file);
        });
      
        for (let [key, value] of formData.entries()) {
          console.log(`${key}:`, value.name || value);
        }

        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);
        const config = {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        };

        const response = await API.post('/files/upload-multiple', formData, config);

        clearInterval(progressInterval);
        setProgress(100);
        
        if (response.data.success) {
          setSuccess(`${response.data.files.length} files uploaded successfully!`);
          setFiles([]);
        } else {
          setError(response.data.message || 'Upload failed');
        }
      }
      
      setTimeout(() => {
        setSuccess('');
        setProgress(0);
      }, 3000);
    } catch (err) {
      console.error('Upload error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(err.response?.data?.message || 'Upload failed. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="file-upload">
      <div className="page-header">
        <h2>Upload Files</h2>
        <button 
          className="btn btn-secondary"
          onClick={() => window.history.back()}
        >
          ← Back to Dashboard
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button className="alert-close" onClick={() => setError('')}>×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span>{success}</span>
          <button className="alert-close" onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      <div className="card upload-area">
        <div className="upload-dropzone">
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            id="file-upload"
            style={{ display: 'none' }}
            accept=".jpg,.jpeg,.png,.gif,.pdf,.csv,.doc,.docx,.txt,.xls,.xlsx"
          />
          <label htmlFor="file-upload" className="upload-label">
            <div className="upload-icon">📤</div>
            <h3>Select Files to Upload</h3>
            <p className="upload-hint">
              Click to browse or drag and drop files here
            </p>
            <p className="upload-info">
              Max 10MB per file. Allowed: Images, PDF, CSV, Excel, Word docs, text files
            </p>
          </label>
        </div>
      </div>

      {files.length > 0 && (
        <div className="card">
          <h3>Selected Files ({files.length})</h3>
          <div className="file-list">
            {files.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-item-info">
                  <span className="file-icon">📄</span>
                  <div className="file-details">
                    <div className="file-name">{file.name}</div>
                    <div className="file-meta">
                      <span className="file-size">{formatFileSize(file.size)}</span>
                      <span className="file-type">{file.type.split('/')[1] || file.type}</span>
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleRemoveFile(index)}
                  disabled={uploading}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploading && (
        <div className="card">
          <h3>Uploading Files...</h3>
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="progress-text">{progress}%</div>
          </div>
        </div>
      )}

      <div className="upload-actions">
        <button
          className="btn btn-primary btn-large"
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
        >
          {uploading ? `Uploading... (${progress}%)` : `Upload ${files.length} File(s)`}
        </button>
      </div>
    </div>
  );
};

export default FileUpload;