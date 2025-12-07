import React, { useState, useEffect } from 'react';
import API from '../api';
import '../css/SharedFiles.css';

const SharedFiles = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSharedFiles();
  }, []);

  const fetchSharedFiles = async () => {
    try {
      const response = await API.get('/files/shared');
      setFiles(response.data);
    } catch (err) {
      setError('Failed to load shared files');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId, filename) => {
    try {
      const response = await API.get(`/files/download/${fileId}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download file');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="shared-files">
      <div className="page-header">
        <h2>Files Shared With Me</h2>
        <button 
          className="btn btn-secondary"
          onClick={() => window.history.back()}
        >
          ← Back
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button className="alert-close" onClick={() => setError('')}>×</button>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading shared files...</div>
      ) : files.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🤝</div>
          <h3>No files shared with you yet</h3>
          <p>When someone shares files with you, they will appear here.</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Shared By</th>
                <th>Type</th>
                <th>Size</th>
                <th>Upload Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file._id}>
                  <td>
                    <div className="file-info">
                      <span className="file-icon">📄</span>
                      <span className="file-name">{file.originalName}</span>
                    </div>
                  </td>
                  <td>
                    <div className="shared-by">
                      <span className="user-icon">👤</span>
                      <div>
                        <div className="user-name">{file.owner?.name || 'Unknown'}</div>
                        <div className="user-email">{file.owner?.email || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="chip chip-primary">
                      {file.type.split('/')[1] || file.type}
                    </span>
                  </td>
                  <td>{formatFileSize(file.size)}</td>
                  <td>{formatDate(file.uploadDate)}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => handleDownload(file._id, file.originalName)}
                      title="Download"
                    >
                      ⬇️ Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SharedFiles;