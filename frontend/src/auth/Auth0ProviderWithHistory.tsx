import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { authService } from '../services/api';

// Hook personalizado para integrar Auth0 con nuestro contexto de autenticación
export const useAuth0Integration = () => {
  const {
    isAuthenticated,
    isLoading,
    user,
    getAccessTokenSilently,
    loginWithRedirect,
    logout: auth0Logout
  } = useAuth0();

  // Función para sincronizar el usuario de Auth0 con nuestro backend
  const syncUserWithBackend = async () => {
    if (isAuthenticated && user) {
      try {
        // Obtener token de acceso
        const token = await getAccessTokenSilently();
        
        // Guardar token en localStorage para uso en interceptores
        localStorage.setItem('auth_token', token);
        
        // Sincronizar información del usuario con el backend
        // Esto podría ser un endpoint específico que crea o actualiza el usuario
        // basado en la información de Auth0
        await authService.syncAuth0User({
          auth0_id: user.sub,
          email: user.email,
          first_name: user.given_name || user.name?.split(' ')[0] || '',
          last_name: user.family_name || user.name?.split(' ').slice(1).join(' ') || '',
          picture: user.picture
        });
        
        // Obtener información completa del usuario desde nuestro backend
        return await authService.getCurrentUser();
      } catch (error) {
        console.error('Error al sincronizar usuario con backend:', error);
        throw error;
      }
    }
    return null;
  };

  // Función para iniciar sesión
  const login = () => {
    loginWithRedirect();
  };

  // Función para cerrar sesión
  const logout = () => {
    // Limpiar token local
    localStorage.removeItem('auth_token');
    
    // Cerrar sesión en Auth0
    auth0Logout({ 
      logoutParams: {
        returnTo: window.location.origin 
      }
    });
  };

  return {
    isAuthenticated,
    isLoading,
    user: user,
    login,
    logout,
    syncUserWithBackend,
    getAccessTokenSilently
  };
};