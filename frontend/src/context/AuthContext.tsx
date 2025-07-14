import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService } from '../services/api';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  role?: string;
  profile_picture?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  shipping_phone?: string;
  shipping_first_name?: string;
  shipping_last_name?: string;
  shipping_company?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  hasPermission: (role: 'is_staff') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authService.getCurrentUser();
      setUser(response.data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      try {
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          const response = await authService.getCurrentUser();
          setUser(response.data);
        }
      } catch (error) {
        console.error('Error al obtener el usuario actual:', error);
        setUser(null);
      }
      setLoading(false);
    };

    checkUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authService.login(email, password);
      
      console.log('🔍 Respuesta completa del login:', response);
      console.log('🔍 Datos de la respuesta:', response.data);
      
      if (response.data.success && response.data.token) {
        localStorage.setItem('access_token', response.data.token);
        console.log('✅ Token guardado:', response.data.token);
      }
      
      const userResponse = await authService.getCurrentUser();
      setUser(userResponse.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      localStorage.removeItem('access_token');
      setUser(null);
      window.location.href = '/login';
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const response = await authService.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      console.error('Error al actualizar el usuario:', error);
      throw error;
    }
  };

  const hasPermission = (role: 'is_staff'): boolean => {
    if (!user) return false;
    return user[role] === true;
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
    updateUser,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};