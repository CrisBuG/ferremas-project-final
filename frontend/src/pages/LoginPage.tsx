import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaGoogle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const { login, updateUser } = useAuth();

  // Load Google API
  useEffect(() => {
    const loadGoogleAPI = () => {
      // Verificar si el script ya está cargado
      if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google API script loaded successfully');
      };
      script.onerror = () => {
        console.error('Failed to load Google API script');
      };
      document.head.appendChild(script);
    };

    loadGoogleAPI();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar mensajes al escribir
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Usar la función login del AuthContext que espera email y password
      await login(formData.email, formData.password);
      
      setSuccess('¡Inicio de sesión exitoso!');
      toast.success('¡Bienvenido de vuelta!');
      
      // Redirigir después del login exitoso
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error: any) {
      console.error('Error en login:', error);
      const errorMessage = error.response?.data?.message || 'Error en el servidor';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle Google login response
  const handleGoogleResponse = async (response: any) => {
    console.log('Google response received:', response);
    setGoogleLoading(true);
    setError('');
    
    try {
      // Enviar el credential al backend para verificación
      const result = await authService.googleAuth(response.credential);
      
      if (result.data.success) {
        const userData = result.data.user;
        // Actualizar el usuario en el contexto directamente
        await updateUser(userData);
        toast.success('¡Inicio de sesión con Google exitoso!');
        navigate('/');
      } else {
        const errorMsg = result.data.message || 'Error en el inicio de sesión con Google';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error('Error en Google login:', error);
      const errorMessage = error.response?.data?.message || 'Error en el inicio de sesión con Google';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Google login button click - versión corregida
  const handleGoogleLogin = () => {
    console.log('Google login clicked');
    console.log('window.google available:', !!window.google);
    
    if (window.google && window.google.accounts && window.google.accounts.id) {
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      console.log('Initializing Google Auth with Client ID:', clientId);
      
      if (!clientId) {
        console.error('Google Client ID is missing. Check your .env file and restart the server.');
        setError('Google Client ID no está configurado.');
        toast.error('Google Client ID no está configurado.');
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });
        
        // Mostrar el prompt de Google - versión corregida sin argumentos
        window.google.accounts.id.prompt();
        
        // Renderizar botón de fallback
        setTimeout(() => {
          const googleButtonContainer = document.getElementById('google-signin-button');
          if (googleButtonContainer && window.google) {
            googleButtonContainer.innerHTML = ''; // Limpiar contenido previo
            window.google.accounts.id.renderButton(
              googleButtonContainer,
              {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'signin_with',
                width: '100%'
              }
            );
          }
        }, 1000);
        
      } catch (error) {
        console.error('Error initializing Google Sign-In:', error);
        setError('Error al inicializar Google Sign-In');
        toast.error('Error al inicializar Google Sign-In');
      }
    } else {
      console.error('Google API not loaded');
      setError('Google API no está cargada. Intenta recargar la página.');
      toast.error('Google API no está cargada. Intenta recargar la página.');
    }
  };

  // Estilos inline
  const styles = {
    loginPage: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative' as const,
      overflow: 'hidden' as const,
    },
    loginPageBefore: {
      content: '""',
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `
        radial-gradient(circle at 20% 80%, rgba(231, 76, 60, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(231, 76, 60, 0.08) 0%, transparent 50%)
      `,
      pointerEvents: 'none' as const,
    },
    particlesBg: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden' as const,
      pointerEvents: 'none' as const,
    },
    particle: {
      position: 'absolute' as const,
      width: '4px',
      height: '4px',
      background: 'rgba(255, 255, 255, 0.3)',
      borderRadius: '50%',
      animation: 'float 6s ease-in-out infinite',
    },
    loginContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 'calc(100vh - 80px)',
      padding: '3rem 1rem',
      position: 'relative' as const,
      zIndex: 1,
    },
    loginCard: {
      width: '100%',
      maxWidth: '480px',
      padding: '3rem',
      background: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      position: 'relative' as const,
      animation: 'fadeIn 0.6s ease-out',
      transform: 'translateY(0)',
      transition: 'all 0.3s ease',
    },
    loginCardBefore: {
      content: '""',
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      background: 'linear-gradient(90deg, #e74c3c, #f39c12)',
      borderRadius: '24px 24px 0 0',
    },
    loginHeader: {
      textAlign: 'center' as const,
      marginBottom: '3rem',
    },
    ferremasLogo: {
      fontSize: '2.5rem',
      fontWeight: 800,
      background: 'linear-gradient(90deg, #e74c3c, #f39c12)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      marginBottom: '1rem',
      letterSpacing: '2px',
      animation: 'scaleIn 0.6s ease-out 0.2s both',
    },
    loginTitle: {
      fontSize: '2rem',
      fontWeight: 700,
      color: '#2d3748',
      marginBottom: '0.5rem',
      animation: 'slideInUp 0.6s ease-out 0.3s both',
    },
    loginSubtitle: {
      color: '#718096',
      fontSize: '1.125rem',
      fontWeight: 400,
      animation: 'slideInUp 0.6s ease-out 0.4s both',
    },
    loginForm: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1.5rem',
      marginBottom: '2rem',
    },
    formGroup: {
      position: 'relative' as const,
    },
    formControl: {
      width: '100%',
      padding: '1rem 1rem 1rem 3rem',
      fontSize: '1rem',
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      background: '#ffffff',
      transition: 'all 0.3s ease',
      outline: 'none',
    },
    formControlFocus: {
      borderColor: '#e74c3c',
      boxShadow: '0 0 0 3px rgba(231, 76, 60, 0.1)',
    },
    formLabel: {
      position: 'absolute' as const,
      left: '1rem',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#718096',
      fontSize: '1rem',
      pointerEvents: 'none' as const,
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    inputIcon: {
      color: '#e74c3c',
    },
    passwordInputContainer: {
      position: 'relative' as const,
    },
    passwordToggle: {
      position: 'absolute' as const,
      right: '1rem',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      color: '#718096',
      cursor: 'pointer',
      padding: '0.5rem',
      borderRadius: '8px',
      transition: 'all 0.3s ease',
      zIndex: 10,
    },
    passwordToggleHover: {
      color: '#e74c3c',
      background: 'rgba(231, 76, 60, 0.1)',
    },
    btn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      padding: '1rem 2rem',
      fontSize: '1rem',
      fontWeight: 600,
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textDecoration: 'none',
      outline: 'none',
      position: 'relative' as const,
      overflow: 'hidden' as const,
    },
    btnPrimary: {
      background: 'linear-gradient(135deg, #e74c3c 0%, #f39c12 100%)',
      color: 'white',
      boxShadow: '0 4px 15px rgba(231, 76, 60, 0.3)',
    },
    btnPrimaryHover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(231, 76, 60, 0.4)',
    },
    btnOutline: {
      background: 'transparent',
      color: '#4285f4',
      border: '2px solid #e2e8f0',
    },
    btnOutlineHover: {
      borderColor: '#4285f4',
      background: 'rgba(66, 133, 244, 0.05)',
      transform: 'translateY(-2px)',
    },
    btnLg: {
      padding: '1.25rem 2rem',
      fontSize: '1.125rem',
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      margin: '2rem 0',
      position: 'relative' as const,
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      background: 'linear-gradient(90deg, transparent, #cbd5e0, transparent)',
    },
    dividerText: {
      padding: '0 1.5rem',
      color: '#718096',
      fontSize: '0.875rem',
      fontWeight: 500,
      background: 'white',
    },
    googleIcon: {
      fontSize: '1.125rem',
      color: '#4285f4',
    },
    registerLink: {
      textAlign: 'center' as const,
      color: '#718096',
      fontSize: '0.875rem',
      marginTop: '1rem',
    },
    linkPrimary: {
      color: '#e74c3c',
      textDecoration: 'none',
      fontWeight: 600,
      marginLeft: '0.25rem',
      transition: 'all 0.3s ease',
      position: 'relative' as const,
    },
    linkPrimaryHover: {
      color: '#c0392b',
    },
    loadingSpinner: {
      width: '20px',
      height: '20px',
      border: '2px solid transparent',
      borderTop: '2px solid currentColor',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    alert: {
      padding: '1rem',
      borderRadius: '8px',
      marginBottom: '1rem',
      fontSize: '0.875rem',
      fontWeight: 500,
    },
    alertDanger: {
      background: 'rgba(239, 68, 68, 0.1)',
      color: '#dc2626',
      border: '1px solid rgba(239, 68, 68, 0.2)',
    },
    alertSuccess: {
      background: 'rgba(34, 197, 94, 0.1)',
      color: '#16a34a',
      border: '1px solid rgba(34, 197, 94, 0.2)',
    },
  };

  return (
    <div style={styles.loginPage}>
      {/* Fondo con efecto overlay */}
      <div style={styles.loginPageBefore}></div>
      
      {/* Fondo con partículas animadas */}
      <div style={styles.particlesBg}>
        <div style={{...styles.particle, top: '20%', left: '10%', animationDelay: '0s'}}></div>
        <div style={{...styles.particle, top: '60%', left: '80%', animationDelay: '2s'}}></div>
        <div style={{...styles.particle, top: '80%', left: '20%', animationDelay: '4s'}}></div>
        <div style={{...styles.particle, top: '30%', left: '70%', animationDelay: '1s'}}></div>
        <div style={{...styles.particle, top: '70%', left: '50%', animationDelay: '3s'}}></div>
      </div>
      
      <Navbar />
      
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          {/* Barra superior del card */}
          <div style={styles.loginCardBefore}></div>
          
          {/* Header con logo animado */}
          <div style={styles.loginHeader}>
            <h1 style={styles.ferremasLogo}>FERREMAS</h1>
            <h2 style={styles.loginTitle}>Iniciar Sesión</h2>
            <p style={styles.loginSubtitle}>Bienvenido de vuelta a Ferremas</p>
          </div>
          
          {/* Mensajes de estado */}
          {error && (
            <div style={{...styles.alert, ...styles.alertDanger}}>
              {error}
            </div>
          )}
          {success && (
            <div style={{...styles.alert, ...styles.alertSuccess}}>
              {success}
            </div>
          )}
          
          {/* Formulario principal */}
          <form onSubmit={handleSubmit} style={styles.loginForm}>
            <div style={styles.formGroup}>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Correo Electrónico"
                style={{
                  ...styles.formControl,
                  paddingLeft: '3rem'
                }}
                required
              />
              <div style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#e74c3c',
                pointerEvents: 'none'
              }}>
                <FaUser />
              </div>
            </div>
            
            <div style={styles.formGroup}>
              <div style={styles.passwordInputContainer}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Contraseña"
                  style={{
                    ...styles.formControl,
                    paddingLeft: '3rem'
                  }}
                  required
                />
                <div style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#e74c3c',
                  pointerEvents: 'none'
                }}>
                  <FaLock />
                </div>
                <button
                  type="button"
                  style={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  onMouseEnter={(e) => {
                    Object.assign(e.currentTarget.style, styles.passwordToggleHover);
                  }}
                  onMouseLeave={(e) => {
                    Object.assign(e.currentTarget.style, styles.passwordToggle);
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{
                ...styles.btn,
                ...styles.btnPrimary,
                ...styles.btnLg,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  Object.assign(e.currentTarget.style, styles.btnPrimaryHover);
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(231, 76, 60, 0.3)';
                }
              }}
            >
              {loading ? (
                <>
                  <div style={styles.loadingSpinner}></div>
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>
          
          {/* Divider */}
          <div style={styles.divider}>
            <div style={styles.dividerLine}></div>
            <span style={styles.dividerText}>o continúa con</span>
            <div style={styles.dividerLine}></div>
          </div>
          
          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            style={{
              ...styles.btn,
              ...styles.btnOutline,
              ...styles.btnLg,
              opacity: googleLoading ? 0.7 : 1,
              cursor: googleLoading ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!googleLoading) {
                Object.assign(e.currentTarget.style, styles.btnOutlineHover);
              }
            }}
            onMouseLeave={(e) => {
              if (!googleLoading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <FaGoogle style={styles.googleIcon} />
            {googleLoading ? (
              <>
                <div style={styles.loadingSpinner}></div>
                Conectando con Google...
              </>
            ) : (
              'Continuar con Google'
            )}
          </button>
          
          {/* Contenedor para el botón de Google renderizado (fallback) */}
          <div id="google-signin-button" style={{ marginTop: '1rem' }}></div>
          
          {/* Link de registro */}
          <div style={styles.registerLink}>
            ¿No tienes una cuenta? 
            <Link 
              to="/register" 
              style={styles.linkPrimary}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, styles.linkPrimaryHover);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#e74c3c';
              }}
            >
              Regístrate aquí
            </Link>
          </div>
        </div>
      </div>
      
      {/* Estilos CSS para animaciones */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.8;
          }
        }
        
        @media (max-width: 768px) {
          .login-container {
            padding: 1.5rem 1rem !important;
          }
          
          .login-card {
            padding: 2rem !important;
            margin: 1rem !important;
          }
          
          .ferremas-logo {
            font-size: 2rem !important;
          }
          
          .login-title {
            font-size: 1.5rem !important;
          }
        }
        
        @media (max-width: 480px) {
          .login-card {
            padding: 1.5rem !important;
            margin: 0.5rem !important;
          }
          
          .login-form {
            gap: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;