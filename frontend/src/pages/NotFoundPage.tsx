import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle, FaHome, FaArrowLeft } from 'react-icons/fa';
import Navbar from '../components/Navbar';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const NotFoundContainer = styled.div`
  max-width: 800px;
  margin: 4rem auto;
  padding: 0 2rem;
  text-align: center;
  animation: ${fadeIn} 0.5s ease-out;
`;

const IconContainer = styled.div`
  font-size: 6rem;
  color: #e74c3c;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 3rem;
  color: #2c3e50;
  margin-bottom: 1rem;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #7f8c8d;
  margin-bottom: 2rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  
  @media (max-width: 576px) {
    flex-direction: column;
    align-items: center;
  }
`;

const Button = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 2rem;
  border-radius: 4px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s ease;
  
  svg {
    margin-right: 0.5rem;
  }
`;

const PrimaryButton = styled(Button)`
  background-color: #e74c3c;
  color: white;
  
  &:hover {
    background-color: #c0392b;
  }
`;

const SecondaryButton = styled(Button)`
  background-color: #3498db;
  color: white;
  
  &:hover {
    background-color: #2980b9;
  }
`;

const NotFoundPage: React.FC = () => {
  return (
    <PageContainer>
      <Navbar />
      
      <NotFoundContainer>
        <IconContainer>
          <FaExclamationTriangle />
        </IconContainer>
        
        <Title>404</Title>
        <Subtitle>Página no encontrada</Subtitle>
        
        <p>
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
          Por favor, verifica la URL o regresa a la página principal.
        </p>
        
        <ButtonContainer>
          <PrimaryButton to="/">
            <FaHome /> Página Principal
          </PrimaryButton>
          <SecondaryButton to="/products">
            <FaArrowLeft /> Ver Productos
          </SecondaryButton>
        </ButtonContainer>
      </NotFoundContainer>
    </PageContainer>
  );
};

export default NotFoundPage;
