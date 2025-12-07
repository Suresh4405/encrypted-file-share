import React, { useState, useEffect } from 'react';
import API, { setAuthToken } from '../api';
import { downloadFile } from '../utils/download';
import '../css/Dashboard.css';

const Dashboard = ({ onLogout }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [linkDialog, setLinkDialog] = useState(false);
  const [expiryOption, setExpiryOption] = useState('24h');
  const [copySuccess, setCopySuccess] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await API.get('/files/myfiles');
      
      if (response.data.success && Array.isArray(response.data.files)) {
        setFiles(response.data.files);
      } else {
        setFiles([]);
      }
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to load files');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setError('');

    try {
      const response = await API.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setSuccess('File uploaded successfully!');
        fetchFiles();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        onLogout();
      } else {
        setError(err.response?.data?.message || 'Upload failed. Please try again.');
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDownload = async (fileId, filename) => {
    setError('');
    const result = await downloadFile(fileId, filename);
    
    if (!result.success) {
      if (result.error.includes('token') || result.error.includes('401')) {
        setError('Session expired. Please login again.');
        onLogout();
      } else {
        setError(result.error);
      }
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await API.delete(`/files/${fileId}`);
      
      if (response.data.success) {
        setSuccess('File deleted successfully!');
        fetchFiles();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.message || 'Delete failed');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete file');
    }
  };

  const handleGenerateLink = async () => {
    if (!selectedFile) return;

    try {
      const response = await API.post(`/files/share/link/${selectedFile.id}`, {
        expiryOption: expiryOption
      });

      if (response.data.success) {
        const frontendBaseUrl = window.location.origin;
        const shareLink = `${frontendBaseUrl}/share/${response.data.shareToken}`;
                await navigator.clipboard.writeText(shareLink);
        setCopySuccess(true);
                setTimeout(() => {
          setCopySuccess(false);
          setLinkDialog(false);
          setSuccess('Share link copied to clipboard!');
          setTimeout(() => setSuccess(''), 3000);
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to generate link');
      }
    } catch (err) {
      console.error('Generate link error:', err);
      
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        onLogout();
      } else {
        setError(err.response?.data?.message || 'Failed to generate link');
      }
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    onLogout();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getExpiryLabel = (option) => {
    switch(option) {
      case '30s': return '30 seconds';
      case '1h': return '1 hour';
      case '6h': return '6 hours';
      case '24h': return '24 hours';
      case 'never': return 'Never expire';
      default: return '24 hours';
    }
  };

  const getTotalSize = () => {
    return files.reduce((total, file) => total + (file.size || 0), 0);
  };

  const getFileTypeIcon = (type) => {
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('csv')) return '📊';
    return '📁';
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">📁</span>
            <h1>Secure File Share</h1>
          </div>
        </div>
        <div className="header-right">
          <div className="user-info">
            <div className="welcome">Welcome, {user.name || 'User'}</div>
            <div className="user-email">{user.email}</div>
          </div>
          <button className="btn btn-outline" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      <main className="dashboard-main">

        {(error || success) && (
          <div className={`alert ${error ? 'alert-error' : 'alert-success'}`}>
            <span>{error || success}</span>
            <button 
              className="alert-close" 
              onClick={() => { setError(''); setSuccess(''); }}
            >
              ×
            </button>
          </div>
        )}

        <div className="upload-section">
          <div className="section-header">
            <h2>Upload Files</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
            Upload files from your device (Max 10MB per file)
          </p>
          <label className="upload-area">
            <input
              type="file"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              accept=".jpg,.jpeg,.png,.gif,.pdf,.csv,.doc,.docx,.txt,.xls,.xlsx"
              disabled={uploading}
            />
            <div className="upload-content">
              <div className="upload-icon">{uploading ? '⏳' : '📤'}</div>
              <h3>{uploading ? 'Uploading...' : 'Click to upload'}</h3>
              <p>or drag and drop files here</p>
            </div>
          </label>
        </div>
        <div className="files-section">
          <div className="section-header">
            <h2>My Files</h2>
            <span className="file-count">{files.length} files</span>
          </div>
          
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading files...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <h3>No files yet</h3>
              <p>Upload your first file to get started</p>
            </div>
          ) : (
            <div className="files-grid">
              {files.map((file) => (
                <div key={file.id} className="file-card">
                  <div className="file-header">
                    <div className="file-icon">
                      {getFileTypeIcon(file.type)}
                    </div>
                    <div className="file-info">
                      <div className="file-name" title={file.filename}>
                        {file.filename}
                      </div>
                      <div className="file-type">
                        {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="file-meta">
                    <div className="meta-item">
                      <span className="meta-label">Size</span>
                      <span className="meta-value">{formatFileSize(file.size)}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Uploaded</span>
                      <span className="meta-value">{formatDate(file.uploadDate)}</span>
                    </div>
                  </div>

                  <div className="file-actions">
                    <button
                      className="btn-action download"
                      onClick={() => handleDownload(file.id, file.filename)}
                    >
                      <i>⬇️</i>
                      <span>Download</span>
                    </button>
                    <button
                      className="btn-action share"
                      onClick={() => {
                        setSelectedFile(file);
                        setLinkDialog(true);
                        setCopySuccess(false);
                      }}
                    >
                      <i>🔗</i>
                      <span>Generate URL</span>
                    </button>
                    <button
                      className="btn-action delete"
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      <i>🗑️</i>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {linkDialog && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Generate Share Link</h3>
              <button className="modal-close" onClick={() => setLinkDialog(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {selectedFile && (
                <div style={{ 
                  background: 'var(--gray-100)', 
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  marginBottom: '24px',
                  border: '1px solid var(--gray-200)'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: 'var(--primary-light)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px'
                    }}>
                      {getFileTypeIcon(selectedFile.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '14px', 
                        color: 'var(--text-muted)',
                        marginBottom: '2px'
                      }}>
                        Selected File
                      </div>
                      <div style={{ 
                        fontSize: '15px', 
                        color: 'var(--text-primary)',
                        fontWeight: '600',
                        wordBreak: 'break-word'
                      }}>
                        {selectedFile.filename}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <div style={{ 
                  fontSize: '14px', 
                  color: 'var(--text-secondary)', 
                  marginBottom: '16px',
                  fontWeight: '600'
                }}>
                  Link Duration
                </div>
                <div className="duration-options">
                  <button
                    className={`duration-btn ${expiryOption === '30s' ? 'active' : ''}`}
                    onClick={() => setExpiryOption('30s')}
                  >
                    30 seconds
                  </button>
                  <button
                    className={`duration-btn ${expiryOption === '1h' ? 'active' : ''}`}
                    onClick={() => setExpiryOption('1h')}
                  >
                    1 hour
                  </button>
                  <button
                    className={`duration-btn ${expiryOption === '6h' ? 'active' : ''}`}
                    onClick={() => setExpiryOption('6h')}
                  >
                    6 hours
                  </button>
                  <button
                    className={`duration-btn ${expiryOption === '24h' ? 'active' : ''}`}
                    onClick={() => setExpiryOption('24h')}
                  >
                    24 hours
                  </button>
                  <button
                    className={`duration-btn ${expiryOption === 'never' ? 'active' : ''}`}
                    onClick={() => setExpiryOption('never')}
                  >
                    Never expire
                  </button>
                </div>
              </div>

              {copySuccess && (
                <div className="copy-success">
                  <div className="copy-success-icon">✓</div>
                  <h4>Link Copied!</h4>
                  <p>Share this link with others. Expires in: {getExpiryLabel(expiryOption)}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setLinkDialog(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleGenerateLink}
                disabled={copySuccess}
              >
                {copySuccess ? 'Copied!' : 'Generate & Copy Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;