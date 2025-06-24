import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/api';

// Definición de tipos
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'cliente' | 'bodeguero' | 'contador' | 'admin';
  address?: string;
  phone?: string;
  date_joined: string;
  // New profile picture field
  profile_picture?: string;
  // New personal fields
  date_of_birth?: string;
  gender?: string;
  // New shipping fields
  shipping_first_name?: string;
  shipping_last_name?: string;
  shipping_company?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  shipping_country?: string;
  shipping_phone?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
}



// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook para usar el contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Proveedor del contexto
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar si hay un usuario autenticado al cargar la aplicación
  useEffect(() => {
    const checkUser = async () => {
      try {
        // Solo verificar si NO estamos en la página de login o register
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          const response = await authService.getCurrentUser();
          setUser(response.data);
        }
      } catch (error) {
        console.error('Error al obtener el usuario actual:', error);
        // No hay sesión activa, el usuario no está autenticado
        setUser(null);
      }
      setIsLoading(false);
    };

    checkUser();
  }, []);

  // Función para iniciar sesión
  const login = async (email: string, password: string) => {
    try {
      // Hacer login - esto establecerá la cookie de sesión
      const response = await authService.login(email, password);
      
      // AGREGAR LOGGING TEMPORAL
      console.log('🔍 Respuesta completa del login:', response);
      console.log('🔍 Datos de la respuesta:', response.data);
      console.log('🔍 ¿Tiene token?:', response.data.token);
      
      // ✅ AGREGAR: Guardar token si viene en la respuesta
      if (response.data.success && response.data.token) {
        localStorage.setItem('access_token', response.data.token);
        console.log('✅ Token guardado:', response.data.token);
      } else {
        console.log('❌ No se encontró token en la respuesta');
      }
      
      // Obtener datos del usuario después del login exitoso
      const userResponse = await authService.getCurrentUser();
      setUser(userResponse.data);
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
  };
  
// Función para cerrar sesión - MODIFICADA
const logout = async () => {
  try {
    await authService.logout();
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  } finally {
    // ✅ AGREGAR: Eliminar token del localStorage
    localStorage.removeItem('access_token');
    setUser(null);
    // Redirigir al login
    window.location.href = '/login';
  }
};

// Función para actualizar datos del usuario
  const updateUser = async (userData: Partial<User>) => {
    try {
    // Obtener los datos actualizados del servidor después de la actualización
    const response = await authService.getCurrentUser();
    setUser(response.data);
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    throw error;
  }
};

// ... existing code ...

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};