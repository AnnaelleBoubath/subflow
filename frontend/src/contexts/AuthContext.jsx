import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const savedUser = localStorage.getItem('subflow_user');
  const [user, setUser]       = useState(savedUser ? JSON.parse(savedUser) : null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('subflow_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authAPI.me()
      .then(u => {
        setUser(u);
        localStorage.setItem('subflow_user', JSON.stringify(u));
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem('subflow_token');
        localStorage.removeItem('subflow_user');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, mot_de_passe) => {
    const res = await authAPI.login(email, mot_de_passe);
    setUser(res.user);
    return res;
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
