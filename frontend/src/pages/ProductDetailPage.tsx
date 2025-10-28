import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { FaShoppingCart, FaBolt, FaExpand, FaTimes, FaStar, FaTag } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { productService, cartService, promotionService } from '../services/api';
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

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
`;

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow-x: hidden;
`;

const ContentWrapper = styled.div`
  padding-top: 80px;
  min-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
`;

const ProductContainer = styled.div`
  flex: 1;
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const ProductCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 25px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  max-width: 1400px;
  width: 100%;
  animation: ${fadeInUp} 0.8s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 600px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ImageSection = styled.div`
  padding: 3rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  animation: ${slideInLeft} 0.8s ease-out;
  
  @media (max-width: 1024px) {
    padding: 2rem;
  }
`;

const MainImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 500px;
  border-radius: 15px;
  overflow: hidden;
  background: white;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  }
`;

const MainImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 20px;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const ImageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  ${MainImageContainer}:hover & {
    opacity: 1;
  }
`;

const ImageActions = styled.div`
  display: flex;
  gap: 1rem;
`;

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #333;
  font-size: 1.2rem;
  
  &:hover {
    background: white;
    transform: scale(1.1);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }
`;

const ThumbnailsContainer = styled.div`
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding: 0.5rem 0;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #667eea;
    border-radius: 2px;
  }
`;

const Thumbnail = styled.div<{ active: boolean }>`
  min-width: 100px;
  height: 100px;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  border: 3px solid ${props => props.active ? '#667eea' : 'transparent'};
  transition: all 0.3s ease;
  background: white;
  
  &:hover {
    border-color: #667eea;
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  }
`;

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const InfoSection = styled.div`
  padding: 3rem;
  animation: ${slideInRight} 0.8s ease-out;
  
  @media (max-width: 1024px) {
    padding: 2rem;
  }
`;

const ProductBadge = styled.div`
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 1rem;
  animation: ${float} 3s ease-in-out infinite;
`;

// Nuevo componente para la insignia de promoción
const PromotionBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #ff4e50 0%, #f9d423 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-left: 1rem;
  animation: ${pulse} 2s ease-in-out infinite;
  box-shadow: 0 5px 15px rgba(255, 78, 80, 0.3);
`;

const ProductTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  color: #2c3e50;
  margin-bottom: 1rem;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const ProductMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const RatingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RatingStars = styled.div`
  display: flex;
  gap: 0.2rem;
  color: #ffd700;
`;

const RatingText = styled.span`
  color: #666;
  font-size: 0.9rem;
`;

const StockBadge = styled.div<{ inStock: boolean }>`
  background: ${props => props.inStock ? '#27ae60' : '#e74c3c'};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 15px;
  font-size: 0.9rem;
  font-weight: 600;
  animation: ${props => props.inStock ? pulse : 'none'} 2s infinite;
`;

// Modificado para manejar precios con descuento
const PriceSection = styled.div`
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  padding: 2rem;
  border-radius: 20px;
  margin-bottom: 2rem;
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    animation: ${shimmer} 3s infinite;
  }
`;

// Componente para el precio original (tachado cuando hay promoción)
const OriginalPrice = styled.div<{ hasDiscount: boolean }>`
  font-size: ${props => props.hasDiscount ? '1.8rem' : '2.5rem'};
  font-weight: ${props => props.hasDiscount ? '600' : '800'};
  color: ${props => props.hasDiscount ? 'rgba(255, 255, 255, 0.7)' : 'white'};
  text-decoration: ${props => props.hasDiscount ? 'line-through' : 'none'};
  margin-bottom: ${props => props.hasDiscount ? '0.2rem' : '0.5rem'};
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

// Componente para el precio con descuento
const DiscountedPrice = styled.div`
  font-size: 2.5rem;
  font-weight: 800;
  color: white;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  animation: ${pulse} 2s ease-in-out infinite;
`;

const PriceUSD = styled.div`
  font-size: 2.5rem;
  font-weight: 800;
  color: white;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const PriceCLP = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.5rem;
`;

const PriceNote = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
`;

const QuantitySection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 15px;
`;

const QuantityLabel = styled.label`
  font-weight: 600;
  color: #2c3e50;
`;

const QuantityControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const QuantityButton = styled.button`
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: bold;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background: #5a6fd8;
    transform: scale(1.1);
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const QuantityInput = styled.input`
  width: 80px;
  height: 40px;
  text-align: center;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const PrimaryButton = styled.button`
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 15px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 15px 30px rgba(102, 126, 234, 0.4);
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const SecondaryButton = styled.button`
  flex: 1;
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 15px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 15px 30px rgba(250, 112, 154, 0.4);
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const TabsContainer = styled.div`
  background: #f8f9fa;
  border-radius: 15px;
  overflow: hidden;
`;

const TabsList = styled.div`
  display: flex;
  background: #e9ecef;
`;

const Tab = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 1rem;
  border: none;
  background: ${props => props.active ? 'white' : 'transparent'};
  color: ${props => props.active ? '#667eea' : '#666'};
  font-weight: ${props => props.active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 3px solid ${props => props.active ? '#667eea' : 'transparent'};
  
  &:hover {
    background: ${props => props.active ? 'white' : 'rgba(255, 255, 255, 0.5)'};
  }
`;

const TabContent = styled.div`
  padding: 2rem;
`;

const Description = styled.div`
  line-height: 1.8;
  color: #555;
  
  p {
    margin-bottom: 1rem;
  }
`;

const SpecificationsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const SpecRow = styled.tr`
  border-bottom: 1px solid #e1e8ed;
  
  &:last-child {
    border-bottom: none;
  }
`;

const SpecLabel = styled.td`
  padding: 1rem 0;
  font-weight: 600;
  color: #2c3e50;
  width: 40%;
`;

const SpecValue = styled.td`
  padding: 1rem 0;
  color: #555;
`;

const ReviewsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ReviewCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const ReviewHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const ReviewerAvatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1.2rem;
`;

const ReviewerInfo = styled.div`
  flex: 1;
`;

const ReviewerName = styled.div`
  font-weight: 600;
  color: #2c3e50;
`;

const ReviewDate = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const ReviewRating = styled.div`
  display: flex;
  gap: 0.2rem;
  color: #ffd700;
`;

const ReviewText = styled.p`
  line-height: 1.6;
  color: #555;
  margin: 0;
`;

const NoReviews = styled.div`
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 10px;
`;

const DeliverySelector = styled.div`
  margin: 1.5rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
`;

const DeliveryOption = styled.label<{ selected: boolean }>`
  display: flex;
  align-items: center;
  padding: 0.75rem;
  margin: 0.5rem 0;
  background: ${props => props.selected ? '#667eea' : '#ffffff'};
  color: ${props => props.selected ? '#ffffff' : '#2c3e50'};
  border: 2px solid ${props => props.selected ? '#667eea' : '#e9ecef'};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #667eea;
    background: ${props => props.selected ? '#667eea' : '#f8f9fa'};
  }
  
  input {
    margin-right: 0.75rem;
  }
`;

const DeliveryTitle = styled.h4`
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
`;

const CompanyInfo = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: #e8f4fd;
  border-radius: 6px;
  border-left: 4px solid #667eea;
`;

const CompanyTitle = styled.h5`
  margin: 0 0 0.75rem 0;
  color: #2c3e50;
  font-weight: 600;
`;

const CompanyDetail = styled.p`
  margin: 0.25rem 0;
  color: #5a6c7d;
  font-size: 0.9rem;
`;

// Nuevos estilos para el formulario de reseñas
const ReviewForm = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const ReviewFormTitle = styled.h3`
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
`;

const RatingSelector = styled.div`
  margin-bottom: 1.5rem;
`;

const RatingLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2c3e50;
`;

const StarRating = styled.div`
  display: flex;
  gap: 0.3rem;
`;

const StarButton = styled.button<{ active: boolean }>`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: ${props => props.active ? '#ffd700' : '#ddd'};
  cursor: pointer;
  transition: color 0.2s ease;
  
  &:hover {
    color: #ffd700;
  }
`;

const CommentSection = styled.div`
  margin-bottom: 1.5rem;
`;

const CommentTextarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 1rem;
  border: 2px solid #e1e8ed;
  border-radius: 10px;
  font-family: inherit;
  font-size: 1rem;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
  
  &::placeholder {
    color: #999;
  }
`;

const SubmitButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

// Modal para imagen expandida
const ImageModal = styled.div<{ show: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: ${props => props.show ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
`;

const ModalImage = styled.img`
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border-radius: 10px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 2rem;
  right: 2rem;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.5rem;
  color: #333;
  transition: all 0.3s ease;
  
  &:hover {
    background: white;
    transform: scale(1.1);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  
  a {
    color: #fa709a;
    text-decoration: none;
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    border: 1px solid #fa709a;
    border-radius: 20px;
    transition: all 0.3s ease;
    
    &:hover {
      background: #fa709a;
      color: white;
    }
  }
`;

// Interfaces
interface ProductImage {
  id: number;
  image_url: string;
  is_primary: boolean;
}

// Interfaz para promociones
interface Promotion {
  id: number;
  name: string;
  description: string;
  discount_percentage: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  price_clp?: number;
  stock: number;
  category: {
    id: number;
    name: string;
  };
  images?: ProductImage[];
  specifications?: { [key: string]: string };
  reviews?: Review[];
  average_rating?: number;
  review_count?: number;
  // Nuevos campos para promociones
  has_promotion?: boolean;
  discounted_price?: number;
  promotion?: Promotion;
}

interface Review {
  id: number;
  user: {
    first_name: string;
    last_name: string;
  };
  rating: number;
  comment: string;
  created_at: string;
}

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('description');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [dollarRate, setDollarRate] = useState(900);
  const [showImageModal, setShowImageModal] = useState(false);
  
  // Estados para el formulario de reseñas
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'envio' | 'retiro'>('envio');

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await productService.getProduct(parseInt(id));
        const productData = response.data;
        
        // Obtener promociones activas para este producto
        const promotionsResponse = await promotionService.getActivePromotions(parseInt(id));
        const activePromotions = promotionsResponse.data;
        
        // Aplicar promoción si existe
        if (activePromotions && activePromotions.length > 0) {
          const promotion = activePromotions[0]; // Tomamos la primera promoción activa
          const discountPercentage = promotion.discount_percentage;
          const discountedPrice = productData.price * (1 - discountPercentage / 100);
          
          setProduct({
            ...productData,
            has_promotion: true,
            discounted_price: parseFloat(discountedPrice.toFixed(2)),
            promotion: promotion
          });
        } else {
          setProduct({
            ...productData,
            has_promotion: false
          });
        }
      } catch (error: any) {
        console.error('Error al cargar producto:', error);
        setError('Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    const fetchDollarRate = async () => {
      try {
        const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
        const response = await fetch(`${apiBase}/exchange-rate/`);
        const data = await response.json();
        setDollarRate(data.rate);
      } catch (error) {
        console.error('Error al obtener tasa del dólar:', error);
      }
    };
  
    fetchDollarRate();
  }, []);
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const renderRatingStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} />);
    }

    if (hasHalfStar) {
      stars.push(<FaStar key="half" style={{ opacity: 0.5 }} />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaStar key={`empty-${i}`} style={{ opacity: 0.2 }} />);
    }

    return stars;
  };

  const getProductImages = (): string[] => {
    if (product?.images && product.images.length > 0) {
      return product.images.map(img => img.image_url);
    }
    return [
      'https://via.placeholder.com/500x500/667eea/ffffff?text=Foto+de+Referencia+1',
      'https://via.placeholder.com/500x500/764ba2/ffffff?text=Foto+de+Referencia+2', 
      'https://via.placeholder.com/500x500/fa709a/ffffff?text=Foto+de+Referencia+3'
    ];
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 0)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!product) return;

    try {
      setAddingToCart(true);
      // Modificado para incluir el ID de promoción si existe
      await cartService.addToCart(
        product.id, 
        quantity, 
        product.has_promotion && product.promotion ? product.promotion.id : undefined
      );
      alert('Producto añadido al carrito exitosamente');
    } catch (error: any) {
      console.error('Error al añadir al carrito:', error);
      alert('Error al añadir el producto al carrito');
    } finally {
      setAddingToCart(false);
    }
  };

  // Función corregida para "Comprar ahora" - redirige directamente al checkout
  const handleBuyNow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!product) return;

    try {
      setAddingToCart(true);
      // Modificado para incluir el ID de promoción si existe
      await cartService.addToCart(
        product.id, 
        quantity, 
        product.has_promotion && product.promotion ? product.promotion.id : undefined
      );
      navigate('/checkout');
    } catch (error: any) {
      console.error('Error al procesar compra:', error);
      alert('Error al procesar la compra');
      setAddingToCart(false);
    }
  };

  // Función para enviar nueva reseña
  const handleSubmitReview = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!product || newReviewRating === 0 || !newReviewComment.trim()) {
      alert('Por favor, selecciona una calificación y escribe un comentario.');
      return;
    }

    try {
      setSubmittingReview(true);
      
      // Aquí deberías hacer la llamada a la API para enviar la reseña
      // Por ahora simularemos la funcionalidad
      const newReview: Review = {
        id: Date.now(),
        user: {
          first_name: user.first_name || 'Usuario',
          last_name: user.last_name || 'Anónimo'
        },
        rating: newReviewRating,
        comment: newReviewComment,
        created_at: new Date().toISOString()
      };

      // Actualizar el producto con la nueva reseña
      setProduct(prev => {
        if (!prev) return prev;
        const updatedReviews = [...(prev.reviews || []), newReview];
        const totalRating = updatedReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / updatedReviews.length;
        
        return {
          ...prev,
          reviews: updatedReviews,
          review_count: updatedReviews.length,
          average_rating: averageRating
        };
      });

      // Limpiar el formulario
      setNewReviewRating(0);
      setNewReviewComment('');
      alert('¡Reseña enviada exitosamente!');
      
    } catch (error: any) {
      console.error('Error al enviar reseña:', error);
      alert('Error al enviar la reseña');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Función para calcular el porcentaje de descuento
  const calculateDiscountPercentage = (): string => {
    if (!product || !product.has_promotion || !product.promotion) return '';
    return `${product.promotion.discount_percentage}% OFF`;
  };

  if (loading) {
    return (
      <PageContainer>
        <Navbar />
        <ContentWrapper>
          <LoadingContainer>
            Cargando producto...
          </LoadingContainer>
        </ContentWrapper>
      </PageContainer>
    );
  }

  if (error || !product) {
    return (
      <PageContainer>
        <Navbar />
        <ContentWrapper>
          <ErrorContainer>
            <div>{error || 'Producto no encontrado'}</div>
            <a href="/products">Volver a productos</a>
          </ErrorContainer>
        </ContentWrapper>
      </PageContainer>
    );
  }

  const images = getProductImages();

  return (
    <PageContainer>
      <Navbar />
      <ContentWrapper>
        <ProductContainer>
          <ProductCard>
            <ProductGrid>
              <ImageSection>
                <MainImageContainer>
                  <MainImage 
                    src={images[activeImageIndex]} 
                    alt={product.name}
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/500x500/667eea/ffffff?text=Sin+Imagen';
                    }}
                  />
                  <ImageOverlay>
                    <ImageActions>
                      <ActionButton 
                        title="Expandir imagen"
                        onClick={() => setShowImageModal(true)}
                      >
                        <FaExpand />
                      </ActionButton>
                    </ImageActions>
                  </ImageOverlay>
                </MainImageContainer>
                
                <ThumbnailsContainer>
                  {images.map((image, index) => (
                    <Thumbnail 
                      key={index} 
                      active={index === activeImageIndex}
                      onClick={() => setActiveImageIndex(index)}
                    >
                      <ThumbnailImage 
                        src={image} 
                        alt={`${product.name} foto ${index + 1}`}
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/100x100?text=Sin+Imagen';
                        }}
                      />
                    </Thumbnail>
                  ))}
                </ThumbnailsContainer>
              </ImageSection>
              
              <InfoSection>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <ProductBadge>{product.category.name}</ProductBadge>
                  {product.has_promotion && (
                    <PromotionBadge>
                      <FaTag />
                      {calculateDiscountPercentage() || 'Oferta Especial'}
                    </PromotionBadge>
                  )}
                </div>
                
                <ProductTitle>{product.name}</ProductTitle>
                
                <ProductMeta>
                  <RatingContainer>
                    <RatingStars>
                      {renderRatingStars(product.average_rating || 0)}
                    </RatingStars>
                    <RatingText>
                      {(product.average_rating || 0).toFixed(1)} ({product.review_count || 0} reseñas)
                    </RatingText>
                  </RatingContainer>
                  
                  <StockBadge inStock={product.stock > 0}>
                    {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
                  </StockBadge>
                </ProductMeta>
                
                <PriceSection>
                  {product.has_promotion ? (
                    <>
                      <OriginalPrice hasDiscount={true}>${product.price.toFixed(2)} USD</OriginalPrice>
                      <DiscountedPrice>${product.discounted_price?.toFixed(2)} USD</DiscountedPrice>
                      <PriceCLP>
                        {formatPrice((product.discounted_price || product.price) * dollarRate)}
                      </PriceCLP>
                    </>
                  ) : (
                    <>
                      <OriginalPrice hasDiscount={false}>${product.price.toFixed(2)} USD</OriginalPrice>
                      <PriceCLP>
                        {formatPrice(product.price_clp || product.price * dollarRate)}
                      </PriceCLP>
                    </>
                  )}
                  <PriceNote>Precio incluye IVA. Tasa de cambio actualizada.</PriceNote>
                </PriceSection>
                
                <QuantitySection>
                  <QuantityLabel>Cantidad:</QuantityLabel>
                  <QuantityControls>
                    <QuantityButton 
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      -
                    </QuantityButton>
                    <QuantityInput 
                      type="number" 
                      value={quantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                      min="1"
                      max={product.stock}
                    />
                    <QuantityButton 
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= product.stock}
                    >
                      +
                    </QuantityButton>
                  </QuantityControls>
                </QuantitySection>
                
                <DeliverySelector>
                  <DeliveryTitle>🚚 Modalidad de Entrega</DeliveryTitle>
                  
                  <DeliveryOption 
                    selected={deliveryMethod === 'envio'}
                    onClick={() => setDeliveryMethod('envio')}
                  >
                    <input 
                      type="radio" 
                      name="delivery" 
                      value="envio" 
                      checked={deliveryMethod === 'envio'}
                      onChange={() => setDeliveryMethod('envio')}
                    />
                    <div>
                      <strong>📦 Envío a Domicilio</strong>
                      <br />
                      <small>Recibe tu pedido en la comodidad de tu hogar</small>
                    </div>
                  </DeliveryOption>
                  
                  <DeliveryOption 
                    selected={deliveryMethod === 'retiro'}
                    onClick={() => setDeliveryMethod('retiro')}
                  >
                    <input 
                      type="radio" 
                      name="delivery" 
                      value="retiro" 
                      checked={deliveryMethod === 'retiro'}
                      onChange={() => setDeliveryMethod('retiro')}
                    />
                    <div>
                      <strong>🏪 Retiro en Tienda</strong>
                      <br />
                      <small>Retira tu pedido en nuestra tienda física</small>
                    </div>
                  </DeliveryOption>
                  
                  {deliveryMethod === 'retiro' && (
                    <CompanyInfo>
                      <CompanyTitle>📍 Información de la Tienda</CompanyTitle>
                      <CompanyDetail><strong>Nombre:</strong> Ferremas - Ferretería Industrial</CompanyDetail>
                      <CompanyDetail><strong>Dirección:</strong> Av. Industrial 1234, Santiago, Chile</CompanyDetail>
                      <CompanyDetail><strong>Teléfono:</strong> +56 2 2345 6789</CompanyDetail>
                      <CompanyDetail><strong>Email:</strong> contacto@ferremas.cl</CompanyDetail>
                      <CompanyDetail><strong>Horarios:</strong> Lunes a Viernes 8:00 - 18:00, Sábados 9:00 - 14:00</CompanyDetail>
                    </CompanyInfo>
                  )}
                </DeliverySelector>
                
                <ActionButtons>
                  <PrimaryButton 
                    onClick={handleAddToCart}
                    disabled={product.stock === 0 || addingToCart}
                  >
                    <FaShoppingCart />
                    {addingToCart ? 'Añadiendo...' : 'Añadir al Carrito'}
                  </PrimaryButton>
                  
                  <SecondaryButton 
                    onClick={handleBuyNow}
                    disabled={product.stock === 0 || addingToCart}
                  >
                    <FaBolt />
                    Comprar Ahora
                  </SecondaryButton>
                </ActionButtons>
                
                <TabsContainer>
                  <TabsList>
                    <Tab 
                      active={activeTab === 'description'}
                      onClick={() => setActiveTab('description')}
                    >
                      Descripción
                    </Tab>
                    <Tab 
                      active={activeTab === 'specifications'}
                      onClick={() => setActiveTab('specifications')}
                    >
                      Especificaciones
                    </Tab>
                    <Tab 
                      active={activeTab === 'reviews'}
                      onClick={() => setActiveTab('reviews')}
                    >
                      Reseñas ({product.review_count || 0})
                    </Tab>
                  </TabsList>
                  
                  <TabContent>
                    {activeTab === 'description' && (
                      <Description>
                        <p>
                          {product.description || 'Descripción profesional del producto. Este artículo ha sido cuidadosamente seleccionado para ofrecerte la mejor calidad y rendimiento en su categoría.'}
                        </p>
                        <p>
                          Características destacadas que hacen de este producto una excelente opción para tus necesidades. Fabricado con materiales de alta calidad y diseñado para brindar durabilidad y eficiencia.
                        </p>
                        {product.has_promotion && product.promotion && (
                          <p style={{ fontWeight: 'bold', color: '#e74c3c' }}>
                            ¡Oferta especial! {product.promotion.description || `Aprovecha un ${product.promotion.discount_percentage}% de descuento por tiempo limitado.`}
                          </p>
                        )}
                        <p>
                          Ideal para uso profesional y doméstico, este producto cumple con los más altos estándares de calidad y seguridad del mercado.
                        </p>
                      </Description>
                    )}
                    
                    {activeTab === 'specifications' && (
                      <SpecificationsTable>
                        <tbody>
                          <SpecRow>
                            <SpecLabel>Categoría</SpecLabel>
                            <SpecValue>{product.category.name}</SpecValue>
                          </SpecRow>
                          <SpecRow>
                            <SpecLabel>Stock Disponible</SpecLabel>
                            <SpecValue>{product.stock} unidades</SpecValue>
                          </SpecRow>
                          <SpecRow>
                            <SpecLabel>Precio USD</SpecLabel>
                            <SpecValue>
                              {product.has_promotion ? (
                                <span>
                                  <span style={{ textDecoration: 'line-through', color: '#999' }}>${product.price.toFixed(2)}</span>
                                  {' '}
                                  <span style={{ fontWeight: 'bold', color: '#e74c3c' }}>${product.discounted_price?.toFixed(2)}</span>
                                </span>
                              ) : (
                                `$${product.price.toFixed(2)}`
                              )}
                            </SpecValue>
                          </SpecRow>
                          <SpecRow>
                            <SpecLabel>Precio CLP</SpecLabel>
                            <SpecValue>
                              {product.has_promotion ? (
                                <span>
                                  <span style={{ textDecoration: 'line-through', color: '#999' }}>
                                    {formatPrice(product.price_clp || product.price * dollarRate)}
                                  </span>
                                  {' '}
                                  <span style={{ fontWeight: 'bold', color: '#e74c3c' }}>
                                    {formatPrice((product.discounted_price || product.price) * dollarRate)}
                                  </span>
                                </span>
                              ) : (
                                formatPrice(product.price_clp || product.price * dollarRate)
                              )}
                            </SpecValue>
                          </SpecRow>
                          {product.has_promotion && product.promotion && (
                            <SpecRow>
                              <SpecLabel>Promoción</SpecLabel>
                              <SpecValue>
                                {product.promotion.name} - {product.promotion.discount_percentage}% de descuento
                              </SpecValue>
                            </SpecRow>
                          )}
                          {product.specifications && Object.entries(product.specifications).map(([key, value]) => (
                            <SpecRow key={key}>
                              <SpecLabel>{key}</SpecLabel>
                              <SpecValue>{value}</SpecValue>
                            </SpecRow>
                          ))}
                          <SpecRow>
                            <SpecLabel>Material</SpecLabel>
                            <SpecValue>Alta calidad</SpecValue>
                          </SpecRow>
                          <SpecRow>
                            <SpecLabel>Garantía</SpecLabel>
                            <SpecValue>12 meses</SpecValue>
                          </SpecRow>
                          <SpecRow>
                            <SpecLabel>Origen</SpecLabel>
                            <SpecValue>Importado</SpecValue>
                          </SpecRow>
                        </tbody>
                      </SpecificationsTable>
                    )}
                    
                    {activeTab === 'reviews' && (
                      <ReviewsSection>
                        {/* Formulario para nueva reseña */}
                        {user && (
                          <ReviewForm>
                            <ReviewFormTitle>Escribe tu reseña</ReviewFormTitle>
                            
                            <RatingSelector>
                              <RatingLabel>Calificación:</RatingLabel>
                              <StarRating>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <StarButton
                                    key={star}
                                    type="button"
                                    active={star <= newReviewRating}
                                    onClick={() => setNewReviewRating(star)}
                                  >
                                    <FaStar />
                                  </StarButton>
                                ))}
                              </StarRating>
                            </RatingSelector>
                            
                            <CommentSection>
                              <RatingLabel>Comentario:</RatingLabel>
                              <CommentTextarea
                                value={newReviewComment}
                                onChange={(e) => setNewReviewComment(e.target.value)}
                                placeholder="Comparte tu experiencia con este producto..."
                                maxLength={500}
                              />
                            </CommentSection>
                            
                            <SubmitButton
                              onClick={handleSubmitReview}
                              disabled={submittingReview || newReviewRating === 0 || !newReviewComment.trim()}
                            >
                              {submittingReview ? 'Enviando...' : 'Enviar Reseña'}
                            </SubmitButton>
                          </ReviewForm>
                        )}
                        
                        {/* Reseñas existentes */}
                        {product.reviews && product.reviews.length > 0 ? (
                          product.reviews.map((review) => (
                            <ReviewCard key={review.id}>
                              <ReviewHeader>
                                <ReviewerAvatar>
                                  {getInitials(review.user.first_name, review.user.last_name)}
                                </ReviewerAvatar>
                                <ReviewerInfo>
                                  <ReviewerName>
                                    {review.user.first_name} {review.user.last_name}
                                  </ReviewerName>
                                  <ReviewDate>
                                    {new Date(review.created_at).toLocaleDateString('es-CL')}
                                  </ReviewDate>
                                </ReviewerInfo>
                                <ReviewRating>
                                  {renderRatingStars(review.rating)}
                                </ReviewRating>
                              </ReviewHeader>
                              <ReviewText>{review.comment}</ReviewText>
                            </ReviewCard>
                          ))
                        ) : (
                          !user && (
                            <NoReviews>
                              Aún no hay reseñas para este producto. ¡Inicia sesión para ser el primero en dejar una reseña!
                            </NoReviews>
                          )
                        )}
                      </ReviewsSection>
                    )}
                  </TabContent>
                </TabsContainer>
              </InfoSection>
            </ProductGrid>
          </ProductCard>
        </ProductContainer>
        
        {/* Modal para imagen expandida */}
        <ImageModal show={showImageModal}>
          <CloseButton onClick={() => setShowImageModal(false)}>
            <FaTimes />
          </CloseButton>
          <ModalImage 
            src={images[activeImageIndex]} 
            alt={product.name}
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/800x800/667eea/ffffff?text=Sin+Imagen';
            }}
          />
        </ImageModal>
        
        <Footer />
      </ContentWrapper>
    </PageContainer>
  );
};

export default ProductDetailPage;
