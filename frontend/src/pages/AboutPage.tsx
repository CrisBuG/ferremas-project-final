import React from 'react';
import styled, { keyframes } from 'styled-components';
import { FaTools, FaShieldAlt, FaTruck, FaUsers, FaAward, FaHandshake, FaIndustry, FaCog } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Animaciones
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

// Styled Components
const AboutContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const HeroSection = styled.section`
  padding: 120px 0 80px;
  text-align: center;
  color: white;
  animation: ${fadeInUp} 1s ease-out;
`;

const HeroTitle = styled.h1`
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.3rem;
  margin-bottom: 2rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
  opacity: 0.9;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
    padding: 0 20px;
  }
`;

const ContentSection = styled.section`
  background: white;
  padding: 80px 0;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  color: #2c3e50;
  text-align: center;
  margin-bottom: 3rem;
  font-weight: 700;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const ValuesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
`;

const ValueCard = styled.div`
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  animation: ${fadeInUp} 0.8s ease-out;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  }
`;

const ValueIcon = styled.div`
  font-size: 3rem;
  color: #667eea;
  margin-bottom: 1rem;
`;

const ValueTitle = styled.h3`
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 1rem;
  font-weight: 600;
`;

const ValueDescription = styled.p`
  color: #6c757d;
  line-height: 1.6;
  font-size: 1rem;
`;

const StorySection = styled.section`
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 80px 0;
`;

const StoryContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const StoryText = styled.div`
  animation: ${slideInLeft} 1s ease-out;
  
  @media (max-width: 768px) {
    animation: ${fadeInUp} 1s ease-out;
  }
`;

const StoryImage = styled.div`
  animation: ${slideInRight} 1s ease-out;
  
  @media (max-width: 768px) {
    animation: ${fadeInUp} 1s ease-out;
  }
`;

const StoryTitle = styled.h3`
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-weight: 600;
`;

const StoryParagraph = styled.p`
  color: #6c757d;
  line-height: 1.8;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
`;

const ImagePlaceholder = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  height: 400px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 4rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
`;

const StatsSection = styled.section`
  background: #2c3e50;
  color: white;
  padding: 80px 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  text-align: center;
`;

const StatCard = styled.div`
  animation: ${fadeInUp} 1s ease-out;
`;

const StatNumber = styled.div`
  font-size: 3rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 1.1rem;
  opacity: 0.9;
`;

const TeamSection = styled.section`
  background: white;
  padding: 80px 0;
`;

const TeamGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
`;

const TeamCard = styled.div`
  text-align: center;
  animation: ${fadeInUp} 0.8s ease-out;
`;

const TeamImage = styled.div`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 3rem;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
`;

const TeamName = styled.h4`
  font-size: 1.3rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-weight: 600;
`;

const TeamRole = styled.p`
  color: #667eea;
  font-weight: 500;
  margin-bottom: 1rem;
`;

const TeamDescription = styled.p`
  color: #6c757d;
  line-height: 1.6;
  font-size: 0.95rem;
`;

const AboutPage: React.FC = () => {
  return (
    <AboutContainer>
      <Navbar />
      
      <HeroSection>
        <Container>
          <HeroTitle>Acerca de FERREMAS</HeroTitle>
          <HeroSubtitle>
            Somos líderes en el suministro de herramientas y materiales de ferretería, 
            comprometidos con la calidad, innovación y excelencia en el servicio desde hace más de 25 años.
          </HeroSubtitle>
        </Container>
      </HeroSection>

      <ContentSection>
        <Container>
          <SectionTitle>Nuestros Valores</SectionTitle>
          <ValuesGrid>
            <ValueCard>
              <ValueIcon><FaShieldAlt /></ValueIcon>
              <ValueTitle>Calidad Garantizada</ValueTitle>
              <ValueDescription>
                Ofrecemos productos de las mejores marcas con garantía completa, 
                asegurando durabilidad y rendimiento excepcional en cada herramienta.
              </ValueDescription>
            </ValueCard>
            
            <ValueCard>
              <ValueIcon><FaTruck /></ValueIcon>
              <ValueTitle>Entrega Rápida</ValueTitle>
              <ValueDescription>
                Sistema de distribución eficiente que garantiza entregas puntuales 
                en todo el territorio nacional, con seguimiento en tiempo real.
              </ValueDescription>
            </ValueCard>
            
            <ValueCard>
              <ValueIcon><FaUsers /></ValueIcon>
              <ValueTitle>Atención Personalizada</ValueTitle>
              <ValueDescription>
                Equipo de expertos disponible para asesorarte en la selección 
                de herramientas adecuadas para cada proyecto específico.
              </ValueDescription>
            </ValueCard>
            
            <ValueCard>
              <ValueIcon><FaAward /></ValueIcon>
              <ValueTitle>Experiencia Comprobada</ValueTitle>
              <ValueDescription>
                Más de 25 años en el mercado nos respaldan, con miles de 
                clientes satisfechos y proyectos exitosos completados.
              </ValueDescription>
            </ValueCard>
            
            <ValueCard>
              <ValueIcon><FaHandshake /></ValueIcon>
              <ValueTitle>Confianza y Transparencia</ValueTitle>
              <ValueDescription>
                Relaciones comerciales basadas en la honestidad, precios justos 
                y comunicación clara en cada transacción.
              </ValueDescription>
            </ValueCard>
            
            <ValueCard>
              <ValueIcon><FaCog /></ValueIcon>
              <ValueTitle>Innovación Continua</ValueTitle>
              <ValueDescription>
                Constantemente actualizamos nuestro catálogo con las últimas 
                tecnologías y herramientas más avanzadas del mercado.
              </ValueDescription>
            </ValueCard>
          </ValuesGrid>
        </Container>
      </ContentSection>

      <StorySection>
        <Container>
          <StoryContent>
            <StoryText>
              <StoryTitle>Nuestra Historia</StoryTitle>
              <StoryParagraph>
                FERREMAS nació en 1998 como un pequeño negocio familiar con la visión 
                de proporcionar herramientas de calidad a precios accesibles. Comenzamos 
                con un local de 50 metros cuadrados y un catálogo de 200 productos.
              </StoryParagraph>
              <StoryParagraph>
                A lo largo de los años, hemos crecido hasta convertirnos en una de las 
                ferreterías más reconocidas del país, con más de 15,000 productos en 
                nuestro catálogo y presencia en las principales ciudades.
              </StoryParagraph>
              <StoryParagraph>
                Nuestro compromiso con la excelencia nos ha llevado a establecer 
                alianzas estratégicas con las mejores marcas internacionales, 
                garantizando siempre la mejor calidad para nuestros clientes.
              </StoryParagraph>
            </StoryText>
            
            <StoryImage>
              <ImagePlaceholder>
                <FaIndustry />
              </ImagePlaceholder>
            </StoryImage>
          </StoryContent>
        </Container>
      </StorySection>

      <StatsSection>
        <Container>
          <SectionTitle style={{ color: 'white', marginBottom: '3rem' }}>Nuestros Logros</SectionTitle>
          <StatsGrid>
            <StatCard>
              <StatNumber>25+</StatNumber>
              <StatLabel>Años de Experiencia</StatLabel>
            </StatCard>
            
            <StatCard>
              <StatNumber>15,000+</StatNumber>
              <StatLabel>Productos en Catálogo</StatLabel>
            </StatCard>
            
            <StatCard>
              <StatNumber>50,000+</StatNumber>
              <StatLabel>Clientes Satisfechos</StatLabel>
            </StatCard>
            
            <StatCard>
              <StatNumber>12</StatNumber>
              <StatLabel>Sucursales Nacionales</StatLabel>
            </StatCard>
            
            <StatCard>
              <StatNumber>98%</StatNumber>
              <StatLabel>Satisfacción del Cliente</StatLabel>
            </StatCard>
          </StatsGrid>
        </Container>
      </StatsSection>

      <TeamSection>
        <Container>
          <SectionTitle>Nuestro Equipo</SectionTitle>
          <TeamGrid>
            <TeamCard>
              <TeamImage><FaUsers /></TeamImage>
              <TeamName>Carlos Mendoza</TeamName>
              <TeamRole>Director General</TeamRole>
              <TeamDescription>
                Fundador de FERREMAS con más de 30 años de experiencia en el sector. 
                Visionario y líder comprometido con la excelencia operacional.
              </TeamDescription>
            </TeamCard>
            
            <TeamCard>
              <TeamImage><FaUsers /></TeamImage>
              <TeamName>Ana García</TeamName>
              <TeamRole>Gerente de Operaciones</TeamRole>
              <TeamDescription>
                Especialista en logística y cadena de suministro. Responsable de 
                optimizar nuestros procesos de distribución y atención al cliente.
              </TeamDescription>
            </TeamCard>
            
            <TeamCard>
              <TeamImage><FaUsers /></TeamImage>
              <TeamName>Roberto Silva</TeamName>
              <TeamRole>Jefe de Ventas</TeamRole>
              <TeamDescription>
                Experto en herramientas industriales con 15 años de experiencia. 
                Lidera nuestro equipo de asesores técnicos especializados.
              </TeamDescription>
            </TeamCard>
            
            <TeamCard>
              <TeamImage><FaUsers /></TeamImage>
              <TeamName>María López</TeamName>
              <TeamRole>Directora de Calidad</TeamRole>
              <TeamDescription>
                Ingeniera industrial especializada en control de calidad. 
                Garantiza que todos nuestros productos cumplan los más altos estándares.
              </TeamDescription>
            </TeamCard>
          </TeamGrid>
        </Container>
      </TeamSection>

      <Footer />
    </AboutContainer>
  );
};

export default AboutPage;