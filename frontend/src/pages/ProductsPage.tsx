import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { FaSearch, FaShoppingCart, FaHeart, FaEye, FaArrowLeft, FaArrowRight, FaStar, FaStarHalfAlt, FaRegStar, FaTools, FaShippingFast, FaUserFriends, FaShieldAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { productService, categoryService, cartService, promotionService } from '../services/api';
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

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
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
// ... resto del código

// Interfaces
interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  stock: number;
  category: {
    id: number;
    name: string;
  };
  images?: Array<{ image_url: string }>;
  average_rating?: number;
  review_count?: number;
  has_promotion?: boolean;
  discounted_price?: number;
  promotion?: {
    id: number;
    name: string;
    promotion_type: string;
    discount_percentage?: number;
    discount_amount?: number;
  };
}

interface Promotion {
  id: number;
  name: string;
  description: string;
  promotion_type: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'free_shipping';
  status: 'active';
  discount_percentage?: number;
  discount_amount?: number;
  applicable_products?: number[];
  applicable_categories?: number[];
}

// Styled Components


const HomeContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const HeroSection = styled.section`
  position: relative;
  height: 50vh;
  min-height: 400px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
`;

const ParticlesContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const Particle = styled.div<{ delay: number, duration: number, size: number }>`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  top: ${() => Math.random() * 100}%;
  left: ${() => Math.random() * 100}%;
  animation: ${float} ${props => props.duration}s ease-in-out infinite;
  animation-delay: ${props => props.delay}s;
`;

const HeroContent = styled.div`
  text-align: center;
  color: white;
  z-index: 1;
  padding: 0 2rem;
`;

const HeroTitle = styled.h1`
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  animation: ${fadeInUp} 0.8s ease-out;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.2rem;
  max-width: 600px;
  margin: 0 auto;
  opacity: 0.9;
  animation: ${fadeInUp} 0.8s ease-out 0.2s both;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const MainSection = styled.section`
  flex: 1;
  padding: 4rem 2rem;
  background: #f8f9fa;
  
  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }
`;

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const FiltersSection = styled.div`
  margin-bottom: 3rem;
  animation: ${fadeInUp} 0.8s ease-out;
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
`;

const SearchIcon = styled(FaSearch)`
  position: absolute;
  top: 50%;
  left: 1rem;
  transform: translateY(-50%);
  color: #667eea;
  font-size: 1.2rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.25);
  }
`;

const FilterSelect = styled.select`
  width: 100%;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1rem;
  appearance: none;
  background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 15l-4.243-4.243 1.415-1.414L12 12.172l2.828-2.829 1.415 1.414z" fill="%23667eea"/></svg>');
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1.5em;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.25);
  }
`;

const SortSelect = styled(FilterSelect)`
  // Heredamos los estilos de FilterSelect
`;

const ProductsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const ProductCard = styled.div`
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  animation: ${fadeInUp} 0.8s ease-out both;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  
  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }
`;

const ProductImageContainer = styled.div`
  position: relative;
  padding-top: 75%;
  overflow: hidden;
  background: #f8f9fa;
`;

const ProductImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 1rem;
  transition: transform 0.5s ease;
  
  ${ProductCard}:hover & {
    transform: scale(1.05);
  }
`;

const ProductActions = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  opacity: 0;
  transform: translateX(20px);
  transition: all 0.4s ease;
  
  ${ProductCard}:hover & {
    opacity: 1;
    transform: translateX(0);
  }
`;

const ActionButton = styled.button`
  width: 45px;
  height: 45px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  color: #667eea;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(15px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  
  &:hover {
    background: #667eea;
    color: white;
    transform: scale(1.1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ProductInfo = styled.div`
  padding: 2rem;
`;

const ProductCategory = styled.div`
  color: #667eea;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 0.8rem;
`;

const ProductName = styled.h3`
  font-size: 1.4rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 1rem;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ProductDescription = styled.p`
  color: #4a5568;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ProductRating = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1.5rem;
`;

const RatingStars = styled.div`
  display: flex;
  gap: 0.2rem;
  color: #ffd700;
  font-size: 1.1rem;
`;

const RatingText = styled.span`
  color: #4a5568;
  font-size: 0.9rem;
  font-weight: 500;
`;

const ProductFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
`;

const ProductPrice = styled.div`
  color: #4CAF50;
  font-size: 1.6rem;
  font-weight: 800;
`;

const OriginalPrice = styled.div`
  color: #999;
  font-size: 1.1rem;
  font-weight: 500;
  text-decoration: line-through;
  margin-bottom: 0.3rem;
`;

const PromotionBadge = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  z-index: 2;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
  animation: ${float} 3s ease-in-out infinite;
`;

const ViewButton = styled(Link)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.8rem 1.8rem;
  border-radius: 25px;
  text-decoration: none;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
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
    box-shadow: 0 15px 35px rgba(102, 126, 234, 0.3);
  }
  
  &:hover::before {
    left: 100%;
  }
`;

// Estados de carga y error
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #4a5568;
`;

const LoadingSpinner = styled.div`
  width: 60px;
  height: 60px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 2rem;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #e53e3e;
  text-align: center;
`;

const ErrorText = styled.div`
  font-size: 1.2rem;
  margin-bottom: 2rem;
`;

const RetryButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 35px rgba(102, 126, 234, 0.3);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  color: #4a5568;
  padding: 4rem 2rem;
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 2rem;
  animation: ${float} 3s ease-in-out infinite;
`;

const EmptyText = styled.div`
  font-size: 1.2rem;
  opacity: 0.8;
`;

// Paginación mejorada
const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 4rem;
`;

const PaginationButton = styled.button<{ active?: boolean }>`
  padding: 0.8rem 1.2rem;
  border: 2px solid ${props => props.active ? '#667eea' : '#e2e8f0'};
  border-radius: 10px;
  background: ${props => props.active ? 
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
    'white'
  };
  color: ${props => props.active ? 'white' : '#4a5568'};
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  
  &:hover {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

// Sección de características (inspirada en HomePage)
const FeaturesSection = styled.section`
  padding: 6rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: 3rem;
  margin-bottom: 1rem;
  font-weight: 800;
  animation: ${fadeInUp} 0.8s ease-out;
`;

const SectionSubtitle = styled.p`
  text-align: center;
  font-size: 1.2rem;
  margin-bottom: 4rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  opacity: 0.9;
  animation: ${fadeInUp} 0.8s ease-out 0.2s both;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  max-width: 1000px;
  margin: 0 auto;
`;

const FeatureCard = styled.div`
  text-align: center;
  padding: 2rem;
  animation: ${fadeInUp} 0.8s ease-out;
  
  &:nth-child(1) { animation-delay: 0.1s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.3s; }
  &:nth-child(4) { animation-delay: 0.4s; }
`;

const FeatureIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1.5rem;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const FeatureTitle = styled.h3`
  font-size: 1.3rem;
  margin-bottom: 1rem;
  font-weight: 700;
`;

const FeatureDescription = styled.p`
  opacity: 0.9;
  line-height: 1.6;
`;

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [particles, setParticles] = useState<Array<{delay: number, duration: number, size: number}>>([]);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  
  const itemsPerPage = 12;

  // Generar partículas para el efecto visual
  useEffect(() => {
    const newParticles = Array.from({ length: 15 }, () => ({
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
      size: 4 + Math.random() * 8
    }));
    setParticles(newParticles);
  }, []);

  // Función para obtener promociones activas
  const fetchActivePromotions = useCallback(async () => {
    try {
      const response = await promotionService.getActivePromotions();
      setPromotions(response.data);
    } catch (error: any) {
      console.error('Error al cargar promociones:', error);
      setPromotions([]);
    }
  }, []);

  // Función para aplicar promociones a los productos
  const applyPromotionsToProducts = useCallback((productList: Product[]) => {
    if (promotions.length === 0) return productList;

    return productList.map(product => {
      // Buscar promociones aplicables a este producto
      const applicablePromotions = promotions.filter(promotion => {
        // Verificar si la promoción aplica directamente al producto
        const appliesToProduct = promotion.applicable_products?.includes(product.id);
        // Verificar si la promoción aplica a la categoría del producto
        const appliesToCategory = promotion.applicable_categories?.includes(product.category.id);
        return appliesToProduct || appliesToCategory;
      });

      if (applicablePromotions.length === 0) return product;

      // Usar la primera promoción aplicable (podría mejorarse para usar la mejor)
      const promotion = applicablePromotions[0];
      let discountedPrice = product.price;

      // Calcular el precio con descuento según el tipo de promoción
      if (promotion.promotion_type === 'percentage' && promotion.discount_percentage) {
        discountedPrice = product.price * (1 - (promotion.discount_percentage / 100));
      } else if (promotion.promotion_type === 'fixed_amount' && promotion.discount_amount) {
        discountedPrice = Math.max(0, product.price - promotion.discount_amount);
      }

      return {
        ...product,
        has_promotion: true,
        discounted_price: discountedPrice,
        promotion: {
          id: promotion.id,
          name: promotion.name,
          promotion_type: promotion.promotion_type,
          discount_percentage: promotion.discount_percentage,
          discount_amount: promotion.discount_amount
        }
      };
    });
  }, [promotions]);

  // Función optimizada para obtener productos
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page: currentPage,
        page_size: itemsPerPage,
      };
      
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      if (selectedCategory) {
        const selectedCategoryObj = categories.find(cat => cat.id.toString() === selectedCategory);
        if (selectedCategoryObj) {
          params.category = selectedCategoryObj.name;
        }
      }
      
      if (sortBy) {
        params.ordering = sortBy;
      }
      
      const response = await productService.getProducts(params);
      const data = response.data;
      
      if (data.results) {
        // Aplicar promociones a los productos
        const productsWithPromotions = applyPromotionsToProducts(data.results);
        setProducts(productsWithPromotions);
        setTotalPages(Math.ceil(data.count / itemsPerPage));
      } else {
        const productsWithPromotions = applyPromotionsToProducts(Array.isArray(data) ? data : []);
        setProducts(productsWithPromotions);
        setTotalPages(1);
      }
    } catch (error: any) {
      console.error('Error al cargar productos:', error);
      setError('Error al cargar los productos. Por favor, intenta nuevamente.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedCategory, sortBy, categories, applyPromotionsToProducts]);

  // Función para obtener categorías
  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoryService.getCategories();
      setCategories(response.data.results || response.data || []);
    } catch (error: any) {
      console.error('Error al cargar categorías:', error);
      setCategories([]);
    }
  }, []);

  // Efectos
  useEffect(() => {
    fetchCategories();
    fetchActivePromotions();
  }, [fetchCategories, fetchActivePromotions]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Funciones de manejo de eventos
  const handleAddToCart = async (productId: number) => {
    if (!user) {
      toast.info('Debes iniciar sesión para agregar productos al carrito');
      navigate('/login');
      return;
    }

    try {
      setAddingToCart(productId);
      // Buscar si el producto tiene una promoción
      const product = products.find(p => p.id === productId);
      if (product?.has_promotion && product.promotion) {
        // Si tiene promoción, enviar el ID de la promoción
        await cartService.addToCart(productId, 1, product.promotion.id);
      } else {
        await cartService.addToCart(productId, 1);
      }
      toast.success('Producto agregado al carrito exitosamente');
    } catch (error: any) {
      console.error('Error al agregar al carrito:', error);
      toast.error('Error al agregar el producto al carrito');
    } finally {
      setAddingToCart(null);
    }
  };

  const renderRatingStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} />);
    }
    
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} />);
    }
    
    return stars;
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationButton
          key={i}
          active={i === currentPage}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </PaginationButton>
      );
    }

    return (
      <PaginationContainer>
        <PaginationButton
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <FaArrowLeft />
        </PaginationButton>
        
        {startPage > 1 && (
          <>
            <PaginationButton onClick={() => handlePageChange(1)}>1</PaginationButton>
            {startPage > 2 && <span style={{ color: '#4a5568' }}>...</span>}
          </>
        )}
        
        {pages}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span style={{ color: '#4a5568' }}>...</span>}
            <PaginationButton onClick={() => handlePageChange(totalPages)}>
              {totalPages}
            </PaginationButton>
          </>
        )}
        
        <PaginationButton
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <FaArrowRight />
        </PaginationButton>
      </PaginationContainer>
    );
  };

  if (loading) {
    return (
      <HomeContainer>
        <Navbar />
        <HeroSection>
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
          <HeroContent>
            <LoadingContainer>
              <LoadingSpinner />
              <LoadingText>Cargando productos...</LoadingText>
            </LoadingContainer>
          </HeroContent>
        </HeroSection>
        <Footer />
      </HomeContainer>
    );
  }

  if (error) {
    return (
      <HomeContainer>
        <Navbar />
        <HeroSection>
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
          <HeroContent>
            <ErrorContainer>
              <ErrorText>{error}</ErrorText>
              <RetryButton onClick={() => {
                setError(null);
                fetchProducts();
              }}>
                Reintentar
              </RetryButton>
            </ErrorContainer>
          </HeroContent>
        </HeroSection>
        <Footer />
      </HomeContainer>
    );
  }

  return (
    <HomeContainer>
      <Navbar />
      
      {/* Sección Hero */}
      <HeroSection>
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
        
        <HeroContent>
          <HeroTitle>Nuestros Productos</HeroTitle>
          <HeroSubtitle>
            Descubre nuestra amplia gama de herramientas y materiales de construcción
            de la más alta calidad para todos tus proyectos.
          </HeroSubtitle>
        </HeroContent>
      </HeroSection>

      {/* Sección Principal */}
      <MainSection>
        <ContentContainer>
          {/* Filtros */}
          <FiltersSection>
            <FiltersGrid>
              <SearchContainer>
                <SearchIcon />
                <SearchInput
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </SearchContainer>
              
              <FilterSelect value={selectedCategory} onChange={handleCategoryChange}>
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </FilterSelect>
              
              <SortSelect value={sortBy} onChange={handleSortChange}>
                <option value="name">Ordenar por nombre</option>
                <option value="price">Precio: menor a mayor</option>
                <option value="-price">Precio: mayor a menor</option>
                <option value="-average_rating">Mejor valorados</option>
                <option value="-created_at">Más recientes</option>
              </SortSelect>
            </FiltersGrid>
          </FiltersSection>

          {/* Grid de Productos */}
          {products.length === 0 ? (
            <EmptyState>
              <EmptyIcon>📦</EmptyIcon>
              <EmptyText>
                {searchTerm || selectedCategory 
                  ? 'No se encontraron productos que coincidan con tu búsqueda.'
                  : 'No hay productos disponibles en este momento.'
                }
              </EmptyText>
            </EmptyState>
          ) : (
            <>
              <ProductsGrid>
                {products.map((product, index) => (
                  <ProductCard key={product.id} style={{ animationDelay: `${index * 0.1}s` }}>
                    {product.has_promotion && (
                      <PromotionBadge>
                        {product.promotion?.promotion_type === 'percentage' 
                          ? `${product.promotion.discount_percentage}% OFF` 
                          : 'Oferta Especial'}
                      </PromotionBadge>
                    )}
                    <ProductImageContainer>
                      <ProductImage
                        src={product.images?.[0]?.image_url || 'https://via.placeholder.com/300x250/667eea/ffffff?text=Sin+Imagen'}
                        alt={product.name}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/300x250/667eea/ffffff?text=Sin+Imagen';
                        }}
                      />
                      
                      <ProductActions>
                        <ActionButton
                          onClick={() => handleAddToCart(product.id)}
                          disabled={product.stock === 0 || addingToCart === product.id}
                          title="Agregar al carrito"
                        >
                          {addingToCart === product.id ? '...' : <FaShoppingCart />}
                        </ActionButton>
                        <ActionButton title="Agregar a favoritos">
                          <FaHeart />
                        </ActionButton>
                      </ProductActions>
                    </ProductImageContainer>
                    
                    <ProductInfo>
                      <ProductCategory>{product.category.name}</ProductCategory>
                      <ProductName>{product.name}</ProductName>
                      <ProductDescription>{product.description}</ProductDescription>
                      
                      {product.average_rating && (
                        <ProductRating>
                          <RatingStars>
                            {renderRatingStars(product.average_rating)}
                          </RatingStars>
                          <RatingText>
                            {product.average_rating.toFixed(1)} ({product.review_count || 0} reseñas)
                          </RatingText>
                        </ProductRating>
                      )}
                      
                      <ProductFooter>
                        <div>
                          {product.has_promotion && product.discounted_price !== undefined && (
                            <>
                              <OriginalPrice>{formatPrice(product.price)}</OriginalPrice>
                              <ProductPrice>{formatPrice(product.discounted_price)}</ProductPrice>
                            </>
                          ) || (
                            <ProductPrice>{formatPrice(product.price)}</ProductPrice>
                          )}
                        </div>
                        <ViewButton to={`/products/${product.id}`}>
                          <FaEye />
                          Ver Detalles
                        </ViewButton>
                      </ProductFooter>
                    </ProductInfo>
                  </ProductCard>
                ))}
              </ProductsGrid>
              
              {renderPagination()}
            </>
          )}
        </ContentContainer>
      </MainSection>

      {/* Sección de Características */}
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
              Contamos con las mejores marcas y herramientas profesionales para todos tus proyectos.
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>
              <FaShippingFast />
            </FeatureIcon>
            <FeatureTitle>Envío Rápido</FeatureTitle>
            <FeatureDescription>
              Entrega rápida y segura en todo el país. Recibe tus productos en tiempo récord.
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>
              <FaUserFriends />
            </FeatureIcon>
            <FeatureTitle>Atención Personalizada</FeatureTitle>
            <FeatureDescription>
              Nuestro equipo de expertos está siempre disponible para asesorarte.
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>
              <FaShieldAlt />
            </FeatureIcon>
            <FeatureTitle>Garantía de Calidad</FeatureTitle>
            <FeatureDescription>
              Todos nuestros productos cuentan con garantía de calidad y el respaldo de las mejores marcas.
            </FeatureDescription>
          </FeatureCard>
        </FeaturesGrid>
      </FeaturesSection>
      
      <Footer />
    </HomeContainer>
  );
};

export default ProductsPage;