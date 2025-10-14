import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

const FooterContainer = styled.footer`
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
  padding: 4rem 0 1rem;
  margin-top: auto;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
  }
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 3rem;
  padding: 0 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const FooterColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

const FooterTitle = styled.h3`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
  font-weight: 700;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 40px;
    height: 2px;
    background: linear-gradient(90deg, #667eea, #764ba2);
  }
`;

// Componente para enlaces internos
const FooterLink = styled(Link)`
  color: #bdc3c7;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
  transition: all 0.3s ease;
  padding: 0.3rem 0;
  
  &:hover {
    color: white;
    transform: translateX(5px);
  }
  
  svg {
    font-size: 0.9rem;
    opacity: 0.7;
  }
`;

// Componente para enlaces externos
const ExternalLink = styled.a`
  color: #bdc3c7;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
  transition: all 0.3s ease;
  padding: 0.3rem 0;
  
  &:hover {
    color: white;
    transform: translateX(5px);
  }
  
  svg {
    font-size: 0.9rem;
    opacity: 0.7;
  }
`;

const FooterText = styled.p`
  color: #bdc3c7;
  line-height: 1.6;
  margin-bottom: 1rem;
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const SocialLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: #bdc3c7;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
  }
`;

const FooterBottom = styled.div`
  border-top: 1px solid #34495e;
  margin-top: 3rem;
  padding-top: 2rem;
  text-align: center;
  color: #95a5a6;
  
  @media (max-width: 768px) {
    margin-top: 2rem;
    padding-top: 1.5rem;
  }
`;

const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  color: #bdc3c7;
  
  svg {
    color: #667eea;
    font-size: 1.1rem;
  }
`;

const Footer: React.FC = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <FooterColumn>
          <FooterTitle>FERREMAS</FooterTitle>
          <FooterText>
            Tu ferretería de confianza con más de 10,000 productos de calidad. 
            Ofrecemos las mejores herramientas y materiales para todos tus proyectos.
          </FooterText>
          <SocialLinks>
            <SocialLink href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <FaFacebook />
            </SocialLink>
            <SocialLink href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <FaTwitter />
            </SocialLink>
            <SocialLink href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <FaInstagram />
            </SocialLink>
            <SocialLink href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <FaLinkedin />
            </SocialLink>
          </SocialLinks>
        </FooterColumn>

        <FooterColumn>
          <FooterTitle>Enlaces Rápidos</FooterTitle>
          <FooterLink to="/">
            Inicio
          </FooterLink>
          <FooterLink to="/products">
            Productos
          </FooterLink>
          <FooterLink to="/cart">
            Carrito de Compras
          </FooterLink>
          <FooterLink to="/profile">
            Mi Cuenta
          </FooterLink>
          <FooterLink to="/orders">
            Mis Pedidos
          </FooterLink>
        </FooterColumn>

        <FooterColumn>
          <FooterTitle>Categorías</FooterTitle>
          <FooterLink to="/products?category=herramientas">
            Herramientas
          </FooterLink>
          <FooterLink to="/products?category=electricos">
            Eléctricos
          </FooterLink>
          <FooterLink to="/products?category=plomeria">
            Plomería
          </FooterLink>
          <FooterLink to="/products?category=pinturas">
            Pinturas
          </FooterLink>
          <FooterLink to="/products?category=construccion">
            Construcción
          </FooterLink>
        </FooterColumn>

        <FooterColumn>
          <FooterTitle>Contacto</FooterTitle>
          <ContactInfo>
            <ContactItem>
              <FaPhone />
              <span>+56 9 1234 5678</span>
            </ContactItem>
            <ContactItem>
              <FaEnvelope />
              <span>contacto@ferremas.cl</span>
            </ContactItem>
            <ContactItem>
              <FaMapMarkerAlt />
              <span>Av. Principal 123, Santiago, Chile</span>
            </ContactItem>
            <ContactItem>
              <FaClock />
              <span>Lun - Vie: 8:00 - 18:00<br />Sáb: 9:00 - 14:00</span>
            </ContactItem>
          </ContactInfo>
        </FooterColumn>
      </FooterContent>

      <FooterBottom>
        <p>&copy; 2024 FERREMAS. Todos los derechos reservados. | Política de Privacidad | Términos y Condiciones</p>
      </FooterBottom>
    </FooterContainer>
  );
};

export default Footer;