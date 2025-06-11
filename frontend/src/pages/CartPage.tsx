import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { FaTrash, FaPlus, FaMinus, FaShoppingCart } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import { cartService, exchangeRateService } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface CartItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    price_clp?: number;
    images?: {
      id: number;
      image_url: string;
      alt_text: string;
      is_primary: boolean;
      order: number;
    }[];
  };
  quantity: number;
}

interface Cart {
  id: number;
  items: CartItem[];
  total: number;
}

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
`;

const CartContainer = styled.div`
  max-width: 1400px;
  margin: 2rem auto;
  padding: 0 2rem;
  animation: ${fadeIn} 0.6s ease-out;
  flex: 1;
`;

const Title = styled.h1`
  color: white;
  font-size: 3rem;
  margin-bottom: 3rem;
  text-align: center;
  font-weight: 800;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  letter-spacing: -1px;
  
  @media (max-width: 768px) {
    font-size: 2.2rem;
    margin-bottom: 2rem;
  }
`;

const CartContent = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 3rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const CartItemsSection = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: ${slideIn} 0.6s ease-out;
`;

const CartItemCard = styled.div`
  display: flex;
  align-items: center;
  padding: 2rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
    border-radius: 16px;
    margin: 0 -1.5rem;
    padding: 2rem 1.5rem;
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem 0;
  }
`;

const ProductImage = styled.img`
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 16px;
  margin-right: 1.5rem;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
  
  @media (max-width: 768px) {
    width: 80px;
    height: 80px;
    margin-right: 0;
  }
`;

const ProductInfo = styled.div`
  flex: 1;
  margin-right: 1.5rem;
  
  @media (max-width: 768px) {
    margin-right: 0;
    width: 100%;
  }
`;

const ProductName = styled.h3`
  color: #2c3e50;
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 0.8rem;
  line-height: 1.4;
`;

const PriceContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const ProductPriceUSD = styled.p`
  color: #7f8c8d;
  font-size: 0.95rem;
  margin: 0;
  font-weight: 500;
`;

const ProductPriceCLP = styled.p`
  color: #e74c3c;
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
`;

const QuantityControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-right: 1.5rem;
  background: rgba(52, 152, 219, 0.1);
  padding: 0.5rem;
  border-radius: 12px;
  
  @media (max-width: 768px) {
    margin-right: 0;
  }
`;

const QuantityButton = styled.button`
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.9rem;
  
  &:hover {
    background: linear-gradient(135deg, #2980b9, #1f5f8b);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(52, 152, 219, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background: #bdc3c7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const QuantityDisplay = styled.span`
  min-width: 50px;
  text-align: center;
  font-weight: 700;
  color: #2c3e50;
  font-size: 1.1rem;
`;

const ItemTotal = styled.div`
  font-weight: 700;
  color: #2c3e50;
  font-size: 1.2rem;
  margin-right: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  text-align: right;
  
  @media (max-width: 768px) {
    margin-right: 0;
    text-align: left;
  }
`;

const ItemTotalUSD = styled.span`
  color: #7f8c8d;
  font-size: 0.95rem;
  font-weight: 500;
`;

const ItemTotalCLP = styled.span`
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 800;
`;

const RemoveButton = styled.button`
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  border: none;
  padding: 0.8rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background: linear-gradient(135deg, #c0392b, #a93226);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(231, 76, 60, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const SummarySection = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  height: fit-content;
  position: sticky;
  top: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: ${slideIn} 0.6s ease-out 0.2s both;
`;

const SummaryTitle = styled.h2`
  color: #2c3e50;
  margin-bottom: 2rem;
  font-size: 1.8rem;
  font-weight: 700;
  text-align: center;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.2rem;
  padding: 0.8rem 0;
  font-size: 1.1rem;
  
  &.total {
    border-top: 2px solid rgba(52, 152, 219, 0.2);
    padding-top: 1.5rem;
    margin-top: 1.5rem;
    font-weight: 800;
    font-size: 1.4rem;
    color: #e74c3c;
  }
`;

const CheckoutButton = styled(Link)`
  display: block;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  text-decoration: none;
  padding: 1.2rem 2rem;
  border-radius: 16px;
  text-align: center;
  font-weight: 700;
  font-size: 1.2rem;
  margin-top: 2rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 35px rgba(231, 76, 60, 0.4);
    background: linear-gradient(135deg, #c0392b, #a93226);
  }
  
  &:active {
    transform: translateY(-1px);
  }
`;

const ContinueShoppingButton = styled(Link)`
  display: block;
  background: linear-gradient(135deg, #95a5a6, #7f8c8d);
  color: white;
  text-decoration: none;
  padding: 1rem 2rem;
  border-radius: 16px;
  text-align: center;
  font-weight: 600;
  margin-top: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background: linear-gradient(135deg, #7f8c8d, #6c7b7d);
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(149, 165, 166, 0.3);
  }
`;

const ClearCartButton = styled.button`
  background: none;
  border: none;
  color: #e74c3c;
  font-weight: 600;
  cursor: pointer;
  padding: 1rem 0;
  margin-top: 1.5rem;
  transition: all 0.3s ease;
  font-size: 1rem;
  
  &:hover {
    color: #c0392b;
    text-decoration: underline;
    transform: translateX(5px);
  }
`;

const EmptyCartContainer = styled.div`
  text-align: center;
  padding: 5rem 2rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  animation: ${fadeIn} 0.6s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const EmptyCartIcon = styled.div`
  font-size: 5rem;
  color: #bdc3c7;
  margin-bottom: 2rem;
  animation: ${fadeIn} 0.8s ease-out 0.2s both;
`;

const EmptyCartTitle = styled.h2`
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-size: 2.2rem;
  font-weight: 700;
`;

const EmptyCartText = styled.p`
  color: #7f8c8d;
  margin-bottom: 3rem;
  font-size: 1.2rem;
  line-height: 1.6;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
`;

const LoadingSpinner = styled.div`
  width: 60px;
  height: 60px;
  border: 4px solid rgba(52, 152, 219, 0.2);
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 2rem;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 600;
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const ErrorMessage = styled.p`
  color: #e74c3c;
  margin-bottom: 2rem;
  font-size: 1.2rem;
  font-weight: 600;
`;

const RetryButton = styled.button`
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background: linear-gradient(135deg, #2980b9, #1f5f8b);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(52, 152, 219, 0.3);
  }
`;

const CartPage: React.FC = () => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const [dollarRate, setDollarRate] = useState<number>(850);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadCart();
    loadExchangeRate();
  }, [user, navigate]);

  const loadExchangeRate = async () => {
    try {
      const response = await exchangeRateService.getCurrentRate();
      setDollarRate(response.data?.rate || 850);
    } catch (error) {
      console.error('Error loading exchange rate:', error);
      setDollarRate(850);
    }
  };

  const loadCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const cartData = await cartService.getCart();
      setCart(cartData.data);
    } catch (error) {
      console.error('Error loading cart:', error);
      setError('Error al cargar el carrito');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      setUpdating(itemId);
      await cartService.updateCartItem(itemId, newQuantity);
      await loadCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      setError('Error al actualizar la cantidad');
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      setUpdating(itemId);
      await cartService.removeFromCart(itemId);
      await loadCart();
    } catch (error) {
      console.error('Error removing item:', error);
      setError('Error al eliminar el producto');
    } finally {
      setUpdating(null);
    }
  };

  const clearCart = async () => {
    if (!window.confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      return;
    }
    
    try {
      await cartService.clearCart();
      await loadCart();
    } catch (error) {
      console.error('Error clearing cart:', error);
      setError('Error al vaciar el carrito');
    }
  };

  const calculateTotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const calculateTotalCLP = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => {
      const priceCLP = item.product.price_clp || (item.product.price * dollarRate);
      return total + (priceCLP * item.quantity);
    }, 0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <PageContainer>
        <Navbar />
        <CartContainer>
          <LoadingContainer>
            <LoadingSpinner />
            <LoadingText>Cargando carrito...</LoadingText>
          </LoadingContainer>
        </CartContainer>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Navbar />
        <CartContainer>
          <ErrorContainer>
            <ErrorMessage>{error}</ErrorMessage>
            <RetryButton onClick={loadCart}>
              Reintentar
            </RetryButton>
          </ErrorContainer>
        </CartContainer>
      </PageContainer>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <PageContainer>
        <Navbar />
        <CartContainer>
          <EmptyCartContainer>
            <EmptyCartIcon>
              <FaShoppingCart />
            </EmptyCartIcon>
            <EmptyCartTitle>Tu carrito está vacío</EmptyCartTitle>
            <EmptyCartText>¡Agrega algunos productos para comenzar!</EmptyCartText>
            <CheckoutButton to="/products">
              Ver Productos
            </CheckoutButton>
          </EmptyCartContainer>
        </CartContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Navbar />
      <CartContainer>
        <Title>Carrito de Compras</Title>
        
        <CartContent>
          <CartItemsSection>
            {cart.items.map((item) => {
              const priceCLP = item.product.price_clp || (item.product.price * dollarRate);
              const totalCLP = priceCLP * item.quantity;
              const totalUSD = item.product.price * item.quantity;
              
              return (
                <CartItemCard key={item.id}>
                  <ProductImage 
                    src={item.product.images?.[0]?.image_url || '/api/placeholder/100/100'} 
                    alt={item.product.name}
                  />
                  
                  <ProductInfo>
                    <ProductName>{item.product.name}</ProductName>
                    <PriceContainer>
                      <ProductPriceUSD>${item.product.price.toFixed(2)} USD</ProductPriceUSD>
                      <ProductPriceCLP>{formatPrice(priceCLP)}</ProductPriceCLP>
                    </PriceContainer>
                  </ProductInfo>
                  
                  <QuantityControls>
                    <QuantityButton 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1 || updating === item.id}
                    >
                      <FaMinus />
                    </QuantityButton>
                    <QuantityDisplay>{item.quantity}</QuantityDisplay>
                    <QuantityButton 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={updating === item.id}
                    >
                      <FaPlus />
                    </QuantityButton>
                  </QuantityControls>
                  
                  <ItemTotal>
                    <ItemTotalUSD>${totalUSD.toFixed(2)} USD</ItemTotalUSD>
                    <ItemTotalCLP>{formatPrice(totalCLP)}</ItemTotalCLP>
                  </ItemTotal>
                  
                  <RemoveButton 
                    onClick={() => removeItem(item.id)}
                    disabled={updating === item.id}
                  >
                    <FaTrash />
                  </RemoveButton>
                </CartItemCard>
              );
            })}
            
            <ClearCartButton onClick={clearCart}>
              Vaciar Carrito
            </ClearCartButton>
          </CartItemsSection>
          
          <SummarySection>
            <SummaryTitle>Resumen del Pedido</SummaryTitle>
            
            <SummaryRow>
              <span>Subtotal (USD):</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </SummaryRow>
            <SummaryRow>
              <span>Subtotal (CLP):</span>
              <span>{formatPrice(calculateTotalCLP())}</span>
            </SummaryRow>
            <SummaryRow>
              <span>Envío:</span>
              <span>Gratis</span>
            </SummaryRow>
            <SummaryRow className="total">
              <span>Total:</span>
              <span>{formatPrice(calculateTotalCLP())}</span>
            </SummaryRow>
            
            <CheckoutButton to="/checkout">
              Proceder al Pago
            </CheckoutButton>
            
            <ContinueShoppingButton to="/products">
              Seguir Comprando
            </ContinueShoppingButton>
          </SummarySection>
        </CartContent>
      </CartContainer>
    </PageContainer>
  );
};

export default CartPage;