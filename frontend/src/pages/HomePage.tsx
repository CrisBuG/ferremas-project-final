import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaTools, FaShippingFast, FaUserFriends, FaShieldAlt, FaArrowRight, FaStar, FaPlay } from 'react-icons/fa';

// ... existing code ...
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(60px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const float = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
  100% {
    transform: translateY(0px);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

const HomeContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
`;

// Nueva sección de video de introducción
const VideoIntroSection = styled.section`
  height: 100vh;
  background: #000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
`;

const VideoContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const IntroVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
`;

const VideoOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 2;
`;

const VideoTitle = styled.h1`
  font-size: 4rem;
  color: white;
  text-align: center;
  margin-bottom: 2rem;
  font-weight: 800;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  animation: ${fadeInUp} 1s ease-out;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const VideoSubtitle = styled.p`
  font-size: 1.5rem;
  color: white;
  text-align: center;
  max-width: 800px;
  margin-bottom: 3rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  animation: ${fadeInUp} 1s ease-out 0.2s both;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const ScrollIndicator = styled.div`
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  font-size: 2rem;
  animation: ${float} 2s ease-in-out infinite;
  cursor: pointer;
  z-index: 3;
`;

// Sección de bienvenida modificada (ahora separada del hero)
const WelcomeSection = styled.section`
  padding: 6rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><polygon fill="%23ffffff08" points="0,1000 1000,0 1000,1000"/></svg>');
    background-size: cover;
  }
`;

const ParticlesContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
`;

const Particle = styled.div<{ delay: number; duration: number; size: number }>`
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  animation: ${float} ${props => props.duration}s ease-in-out infinite;
  animation-delay: ${props => props.delay}s;
  top: ${Math.random() * 100}%;
  left: ${Math.random() * 100}%;
`;

const WelcomeContent = styled.div`
  z-index: 2;
  position: relative;
`;

const WelcomeTitle = styled.h2`
  font-size: 3.5rem;
  margin-bottom: 1rem;
  font-weight: 800;
  background: linear-gradient(45deg, #ffffff, #f0f0f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${fadeInUp} 1s ease-out;
  
  @media (max-width: 768px) {
    font-size: 2.2rem;
  }
`;

const WelcomeSubtitle = styled.p`
  font-size: 1.3rem;
  margin-bottom: 3rem;
  max-width: 800px;
  opacity: 0.9;
  animation: ${fadeInUp} 1s ease-out 0.2s both;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const WelcomeButtons = styled.div`
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
  animation: ${fadeInUp} 1s ease-out 0.4s both;
`;

const HeroButton = styled(Link)`
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  padding: 1rem 2rem;
  font-size: 1.1rem;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 600;
  cursor: pointer;
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
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
    background: rgba(255, 255, 255, 0.3);
  }
  
  &:hover::before {
    left: 100%;
  }
`;

const PrimaryButton = styled(HeroButton)`
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  border: none;
  
  &:hover {
    background: linear-gradient(135deg, #fee140 0%, #fa709a 100%);
  }
`;

// ... existing code ...
const FeaturesSection = styled.section`
  padding: 6rem 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  position: relative;
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--text-primary, #2d3748);
  font-weight: 800;
  animation: ${fadeInUp} 0.8s ease-out;
`;

const SectionSubtitle = styled.p`
  text-align: center;
  font-size: 1.2rem;
  color: var(--text-secondary, #4a5568);
  margin-bottom: 4rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  animation: ${fadeInUp} 0.8s ease-out 0.2s both;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const FeatureCard = styled.div`
  background: white;
  padding: 3rem 2rem;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
  animation: ${fadeInUp} 0.8s ease-out;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea, #764ba2);
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-15px);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  }
  
  &:hover::before {
    transform: scaleX(1);
  }
  
  &:nth-child(1) {
    animation-delay: 0.1s;
  }
  
  &:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  &:nth-child(3) {
    animation-delay: 0.3s;
  }
  
  &:nth-child(4) {
    animation-delay: 0.4s;
  }
`;

const FeatureIcon = styled.div`
  font-size: 3.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1.5rem;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: var(--text-primary, #2d3748);
  font-weight: 700;
`;

const FeatureDescription = styled.p`
  color: var(--text-secondary, #4a5568);
  line-height: 1.6;
  font-size: 1rem;
`;

const CategoriesSection = styled.section`
  padding: 6rem 2rem;
  background: white;
`;

const CategoriesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  max-width: 1000px;
  margin: 0 auto;
`;

const CategoryCard = styled.div`
  position: relative;
  height: 200px;
  border-radius: 20px;
  overflow: hidden;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  transition: all 0.4s ease;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  animation: ${fadeInUp} 0.8s ease-out;
  cursor: pointer;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,0,0,0.1));
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-10px) scale(1.02);
    box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
  }
  
  &:hover::before {
    opacity: 0.5;
  }
  
  &:nth-child(1) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    animation-delay: 0.1s;
  }
  
  &:nth-child(2) {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    animation-delay: 0.2s;
  }
  
  &:nth-child(3) {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    animation-delay: 0.3s;
  }
  
  &:nth-child(4) {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    animation-delay: 0.4s;
  }
`;

const CategoryTitle = styled.span`
  position: relative;
  z-index: 2;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
`;

const StatsSection = styled.section`
  padding: 6rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 3rem;
  max-width: 800px;
  margin: 0 auto;
`;

const StatCard = styled.div`
  animation: ${fadeInUp} 0.8s ease-out;
  
  &:nth-child(1) { animation-delay: 0.1s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.3s; }
  &:nth-child(4) { animation-delay: 0.4s; }
`;

const StatNumber = styled.div`
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const StatLabel = styled.div`
  font-size: 1.1rem;
  opacity: 0.9;
`;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [particles, setParticles] = useState<Array<{delay: number, duration: number, size: number}>>([]);

  useEffect(() => {
    // Generar partículas aleatorias
    const newParticles = Array.from({ length: 20 }, () => ({
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
      size: 4 + Math.random() * 8
    }));
    setParticles(newParticles);
  }, []);

  const handleCategoryClick = (category: string) => {
    navigate(`/products?category=${category}`);
  };

  const scrollToWelcome = () => {
    const welcomeSection = document.getElementById('welcome-section');
    if (welcomeSection) {
      welcomeSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <HomeContainer>
      <Navbar />
      
      {/* Nueva sección de video de introducción */}
      <VideoIntroSection>
        <VideoContainer>
          <IntroVideo 
            autoPlay 
            muted 
            loop 
            playsInline
          >
            {/* Aquí debes agregar la fuente de tu video */}
            <source src="/videos/ferremas-intro.mp4" type="video/mp4" />
            Tu navegador no soporta el elemento de video.
          </IntroVideo>
          
          <VideoOverlay>
            <VideoTitle>FERREMAS</VideoTitle>
            <VideoSubtitle>
              Tu socio de confianza en herramientas y materiales de construcción
            </VideoSubtitle>
          </VideoOverlay>
        </VideoContainer>
        
        <ScrollIndicator onClick={scrollToWelcome}>
          <FaArrowRight style={{ transform: 'rotate(90deg)' }} />
        </ScrollIndicator>
      </VideoIntroSection>

      {/* Sección de bienvenida movida aquí */}
      <WelcomeSection id="welcome-section">
        <ParticlesContainer>
          {particles.map((particle, index) => (
            <Particle
              key={index}
              delay={particle.delay}
              duration={particle.duration}
              size={particle.size}
            />
          ))}
        </ParticlesContainer>
        
        <WelcomeContent>
          <WelcomeTitle>Bienvenido a FERREMAS</WelcomeTitle>
          <WelcomeSubtitle>
            Tu tienda de confianza para todas las necesidades de ferretería. 
            Encuentra las mejores herramientas y materiales para tus proyectos.
          </WelcomeSubtitle>
          <WelcomeButtons>
            <PrimaryButton to="/products">
              <FaTools /> Ver Productos
            </PrimaryButton>
            <HeroButton to="/about">
              <FaPlay /> Conoce Más
            </HeroButton>
          </WelcomeButtons>
        </WelcomeContent>
      </WelcomeSection>

      <FeaturesSection>
        <SectionTitle>¿Por qué elegirnos?</SectionTitle>
        <SectionSubtitle>
          Ofrecemos la mejor experiencia en ferretería con productos de calidad y servicio excepcional
        </SectionSubtitle>
        
        <FeaturesGrid>
          <FeatureCard>
            <FeatureIcon>
              <FaTools />
            </FeatureIcon>
            <FeatureTitle>Herramientas Profesionales</FeatureTitle>
            <FeatureDescription>
              Contamos con las mejores marcas y herramientas profesionales para todos tus proyectos de construcción y reparación.
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>
              <FaShippingFast />
            </FeatureIcon>
            <FeatureTitle>Envío Rápido</FeatureTitle>
            <FeatureDescription>
              Entrega rápida y segura en todo el país. Recibe tus productos en tiempo récord con nuestro servicio de envío express.
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>
              <FaUserFriends />
            </FeatureIcon>
            <FeatureTitle>Atención Personalizada</FeatureTitle>
            <FeatureDescription>
              Nuestro equipo de expertos está siempre disponible para asesorarte y ayudarte a encontrar exactamente lo que necesitas.
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>
              <FaShieldAlt />
            </FeatureIcon>
            <FeatureTitle>Garantía de Calidad</FeatureTitle>
            <FeatureDescription>
              Todos nuestros productos cuentan con garantía de calidad y el respaldo de las mejores marcas del mercado.
            </FeatureDescription>
          </FeatureCard>
        </FeaturesGrid>
      </FeaturesSection>

      <CategoriesSection>
        <SectionTitle>Categorías Populares</SectionTitle>
        <SectionSubtitle>
          Explora nuestras categorías más populares y encuentra exactamente lo que buscas
        </SectionSubtitle>
        
        <CategoriesGrid>
          <CategoryCard onClick={() => handleCategoryClick('herramientas')}>
            <CategoryTitle>Herramientas</CategoryTitle>
          </CategoryCard>
          
          <CategoryCard onClick={() => handleCategoryClick('electricos')}>
            <CategoryTitle>Eléctricos</CategoryTitle>
          </CategoryCard>
          
          <CategoryCard onClick={() => handleCategoryClick('plomeria')}>
            <CategoryTitle>Plomería</CategoryTitle>
          </CategoryCard>
          
          <CategoryCard onClick={() => handleCategoryClick('pinturas')}>
            <CategoryTitle>Pinturas</CategoryTitle>
          </CategoryCard>
        </CategoriesGrid>
      </CategoriesSection>

      <StatsSection>
        <SectionTitle>Nuestros Números</SectionTitle>
        <StatsGrid>
          <StatCard>
            <StatNumber>10,000+</StatNumber>
            <StatLabel>Productos</StatLabel>
          </StatCard>
          
          <StatCard>
            <StatNumber>5,000+</StatNumber>
            <StatLabel>Clientes Satisfechos</StatLabel>
          </StatCard>
          
          <StatCard>
            <StatNumber>50+</StatNumber>
            <StatLabel>Marcas Reconocidas</StatLabel>
          </StatCard>
          
          <StatCard>
            <StatNumber>24/7</StatNumber>
            <StatLabel>Soporte</StatLabel>
          </StatCard>
        </StatsGrid>
      </StatsSection>
      
      <Footer />
    </HomeContainer>
  );
};

export default HomePage;