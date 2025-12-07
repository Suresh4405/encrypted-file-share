import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import '../css/ShareLink.css';

const ShareLink = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [expiryInfo, setExpiryInfo] = useState('');
  const [requiresLogin, setRequiresLogin] = useState(false);

 useEffect(() => {
  const accessShareLink = async () => {
    try {
      setLoading(true);
            const userToken = localStorage.getItem('token');
            const config = userToken ? {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      } : {};
      
      const response = await API.get(`/files/share/${token}`, config);
      
      if (response.data.success) {
        setFile(response.data.file);
        
        if (response.data.linkInfo) {
          if (response.data.linkInfo.isExpired) {
            setError('This share link has expired');
          } else if (response.data.linkInfo.remainingTime) {
            setExpiryInfo(formatRemainingTime(response.data.linkInfo.remainingTime));
          }
        }
      }
    } catch (err) {
      console.error('Share link access error:', err);
      
      if (err.response?.status === 401) {
        setRequiresLogin(true);
        setError('Please login to access this file');
      } else if (err.response?.status === 404) {
        setError('File not found or link expired');
      } else if (err.response?.status === 410) {
        setError('Share link has expired');
      } else {
        setError(err.response?.data?.message || 'Failed to access file');
      }
    } finally {
      setLoading(false);
    }
  };

  if (token) {
    accessShareLink();
  }
}, [token]);

  const formatRemainingTime = (seconds) => {
    if (!seconds) return 'Unknown';
    
    if (seconds < 60) {
      return `${seconds} seconds`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      if (minutes > 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
      }
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
  };

  const handleDownload = async () => {
    if (!file) return;

    try {
      setDownloading(true);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please login to download');
        setRequiresLogin(true);
        return;
      }

     const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const response = await fetch(`${API_URL}/api/files/download/${file.id}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.originalName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Download failed');
      }
    } catch (err) {
      console.error('Download error:', err);
      setError('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleLoginRedirect = () => {
    localStorage.setItem('redirectAfterLogin', `/share/${token}`);
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="share-link-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading shared file...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="share-link-container">
      <div className="share-link-card">
        <div className="share-link-header">
          <div className="logo">
            <span className="logo-icon">📁</span>
            <h1>Secure File Share</h1>
          </div>
        </div>

        {error && !requiresLogin && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {requiresLogin ? (
          <div className="login-required">
            <div className="login-icon">🔒</div>
            <h3>Authentication Required</h3>
            <p>You need to login to access this shared file.</p>
            <button className="btn btn-primary" onClick={handleLoginRedirect}>
              Login to Access
            </button>
            <p className="register-link">
              Don't have an account? <a href="/register">Register here</a>
            </p>
          </div>
        ) : file && (
          <>
            <div className="file-info">
              <div className="file-preview">
                <div className="file-icon-large">
                  {file.type.includes('image') ? '🖼️' : 
                   file.type.includes('pdf') ? '📄' : 
                   file.type.includes('word') ? '📝' : 
                   file.type.includes('excel') || file.type.includes('csv') ? '📊' : 
                   '📁'}
                </div>
                <h3>{file.originalName}</h3>
                
                {expiryInfo && (
                  <div className="expiry-display">
                    <div className="expiry-alert">
                      ⏰ Link expires in: {expiryInfo}
                    </div>
                  </div>
                )}
                
                <div className="file-details">
                  <div>Type: {file.type}</div>
                  <div>Size: {formatFileSize(file.size)}</div>
                  <div>Shared by: {file.owner?.name || 'Unknown'}</div>
                  <div>Uploaded: {new Date(file.uploadDate).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            <div className="file-actions">
              <button
                className="btn btn-primary btn-large"
                onClick={handleDownload}
                disabled={downloading || error}
              >
                {downloading ? 'Downloading...' : 'Download File'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default ShareLink;