import React from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo" onClick={() => navigate('/')}>
              <span className="logo-icon">📁</span>
              <h1>Secure File Share</h1>
            </div>
            <div className="user-info">
              <span className="welcome">Welcome, {user.name || 'User'}</span>
              <nav className="nav">
                <Link to="/" className="nav-link">
                  <span className="nav-icon">📊</span> Dashboard
                </Link>
                <Link to="/upload" className="nav-link">
                  <span className="nav-icon">📤</span> Upload
                </Link>
                <Link to="/shared" className="nav-link">
                  <span className="nav-icon">🤝</span> Shared Files
                </Link>
                <button className="nav-link logout" onClick={handleLogout}>
                  <span className="nav-icon">🚪</span> Logout
                </button>
              </nav>
            </div>
          </div>
        </div>
      </header>
      <main className="main">
        <div className="container">
          {children || <Outlet />}
        </div>
      </main>
      <footer className="footer">
        <div className="container">
          <p>Secure File Sharing System © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;