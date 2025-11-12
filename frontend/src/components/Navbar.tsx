import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { FaShoppingCart, FaUser, FaSearch, FaBars, FaTimes, FaHome, FaBox, FaUserCircle, FaCog, FaWarehouse, FaCalculator } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { cartService } from '../services/api';

const slideDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const glow = keyframes`
  0% {
    box-shadow: 0 0 5px rgba(102, 126, 234, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(102, 126, 234, 0.6);
  }
  100% {
    box-shadow: 0 0 5px rgba(102, 126, 234, 0.3);
  }
`;

interface NavLinksProps {
  isOpen: boolean;
}

interface NavButtonProps {
  primary?: boolean;
}

const NavbarContainer = styled.nav`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
  color: var(--text-primary);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  animation: ${slideDown} 0.6s ease-out;
  transition: all 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
  }
`;

const Logo = styled(Link)`
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    transform: scale(1.05);
    animation: ${glow} 1s ease-in-out;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, #667eea, #764ba2);
    transition: width 0.3s ease;
  }
  
  &:hover::after {
    width: 100%;
  }
`;

const NavLinks = styled.div<NavLinksProps>`
  display: flex;
  align-items: center;
  gap: 2rem;
  
  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    right: ${({ isOpen }) => (isOpen ? '0' : '-100%')};
    width: 80%;
    height: 100vh;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
    flex-direction: column;
    justify-content: flex-start;
    padding-top: 6rem;
    transition: right 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
    gap: 3rem;
  }
`;

const NavLink = styled(Link)`
  color: var(--text-primary);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  position: relative;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
    border-radius: 50px;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    color: var(--primary-color);
    transform: translateY(-2px);
  }
  
  &:hover::before {
    opacity: 1;
  }
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
    padding: 1rem 2rem;
    width: 80%;
    justify-content: center;
  }
`;

const NavButton = styled(Link)<NavButtonProps>`
  background: ${({ primary }) => 
    primary 
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
      : 'transparent'
  };
  color: ${({ primary }) => (primary ? 'white' : 'var(--primary-color)')};
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  border: ${({ primary }) => (primary ? 'none' : '2px solid var(--primary-color)')};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
  }
  
  &:hover::before {
    left: 100%;
  }
  
  @media (max-width: 768px) {
    width: 80%;
    justify-content: center;
    margin: 0.5rem 0;
  }
`;

const LogoutButton = styled.button<NavButtonProps>`
  background: ${({ primary }) => 
    primary 
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
      : 'transparent'
  };
  color: ${({ primary }) => (primary ? 'white' : 'var(--primary-color)')};
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  border: ${({ primary }) => (primary ? 'none' : '2px solid var(--primary-color)')};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
  }
  
  &:hover::before {
    left: 100%;
  }
  
  @media (max-width: 768px) {
    width: 80%;
    justify-content: center;
    margin: 0.5rem 0;
  }
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    color: var(--primary-color);
    background: rgba(102, 126, 234, 0.1);
    transform: scale(1.1);
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.3s ease;
  
  &:hover {
    color: var(--primary-color);
    background: rgba(102, 126, 234, 0.1);
    transform: rotate(90deg);
  }
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const CartBadge = styled.span`
  position: absolute;
  top: -8px;
  right: -8px;
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
  animation: ${glow} 2s ease-in-out infinite;
`;

const SearchContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const SearchInput = styled.input`
  padding: 0.5rem 1rem 0.5rem 2.5rem;
  border: 2px solid rgba(102, 126, 234, 0.2);
  border-radius: 50px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  outline: none;
  transition: all 0.3s ease;
  width: 200px;
  
  &:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    width: 250px;
  }
  
  &::placeholder {
    color: var(--text-muted);
  }
`;

const SearchIcon = styled(FaSearch)`
  position: absolute;
  left: 1rem;
  color: var(--text-muted);
  transition: color 0.3s ease;
  cursor: pointer;
  
  &:hover {
    color: var(--primary-color);
  }
`;

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      loadCartCount();
    } else {
      setCartCount(0);
    }
  }, [user]);

  useEffect(() => {
    const handleCartUpdate = () => {
      if (user) {
        loadCartCount();
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [user]);

  const loadCartCount = async () => {
    try {
      const response = await cartService.getCart();
      if (response.data && response.data.items) {
        const totalItems = response.data.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
        setCartCount(totalItems);
      }
    } catch (error) {
      console.error('Error loading cart count:', error);
      setCartCount(0);
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const handleCartClick = () => {
    if (user) {
      navigate('/cart');
    } else {
      navigate('/login');
    }
  };

  return (
    <NavbarContainer>
      <Logo to="/">FERREMAS</Logo>
      
      <NavLinks isOpen={isOpen}>
        <NavLink to="/" onClick={() => setIsOpen(false)}>
          <FaHome /> Inicio
        </NavLink>
        <NavLink to="/products" onClick={() => setIsOpen(false)}>
          <FaBox /> Productos
        </NavLink>
        
        {user ? (
          <>
            <NavLink to="/profile" onClick={() => setIsOpen(false)}>
              <FaUserCircle /> Mi Perfil
            </NavLink>
            
            {/* Panel de Administrador */}
            {user.is_staff && (
              <NavLink to="/admin-dashboard" onClick={() => setIsOpen(false)}>
                <FaCog /> Panel Admin
              </NavLink>
            )}
            
            {/* Panel de Bodeguero */}
            {(user.is_staff || user.role === 'bodeguero') && (
              <NavLink to="/warehouse-dashboard" onClick={() => setIsOpen(false)}>
                <FaWarehouse /> Bodega
              </NavLink>
            )}
            
            {/* Panel de Contador */}
            {user.is_staff && (
              <NavLink to="/accountant-dashboard" onClick={() => setIsOpen(false)}>
                <FaCalculator /> Contabilidad
              </NavLink>
            )}
            
            <LogoutButton onClick={handleLogout}>
              Cerrar Sesión
            </LogoutButton>
          </>
        ) : (
          <>
            <NavButton to="/login" onClick={() => setIsOpen(false)}>
              <FaUser /> Iniciar Sesión
            </NavButton>
            <NavButton to="/register" primary onClick={() => setIsOpen(false)}>
              Registrarse
            </NavButton>
          </>
        )}
      </NavLinks>
      
      <IconContainer>
        <IconButton onClick={handleCartClick}>
          <FaShoppingCart />
          {cartCount > 0 && <CartBadge>{cartCount}</CartBadge>}
        </IconButton>
        
        <MobileMenuButton onClick={toggleMenu}>
          {isOpen ? <FaTimes /> : <FaBars />}
        </MobileMenuButton>
      </IconContainer>
    </NavbarContainer>
  );
};

export default Navbar;
