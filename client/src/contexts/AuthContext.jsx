import React, { createContext, useState } from 'react';
import API, { setAuthToken } from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const stored = JSON.parse(localStorage.getItem('auth') || 'null');
  const [user, setUser] = useState(stored?.user || null);

  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    setAuthToken(data.token);
    localStorage.setItem('auth', JSON.stringify({ token: data.token, user: data.user }));
    setUser(data.user);
  };

  const register = async (name, email, password) => {
    const { data } = await API.post('/auth/register', { name, email, password });
    setAuthToken(data.token);
    localStorage.setItem('auth', JSON.stringify({ token: data.token, user: data.user }));
    setUser(data.user);
  };

  const logout = () => {
    setAuthToken(null);
    localStorage.removeItem('auth');
    setUser(null);
  };

  // set auth on mount
  React.useEffect(() => {
    const s = JSON.parse(localStorage.getItem('auth') || 'null');
    if (s) setAuthToken(s.token);
  }, []);

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
};
