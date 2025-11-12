import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { apiClient } from '../services/api';

interface Category {
  id: number;
  name: string;
  description: string;
}

interface ProductImage {
  id?: number;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  order?: number;
}

interface Product {
  id?: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: Category;
  images?: ProductImage[];
  featured: boolean;
  brand?: string;
  model?: string;
  warranty?: string;
}

interface Return {
  id?: number;
  return_number?: string;
  order?: number;
  customer?: number;
  reason: string;
  description?: string;
  status: 'solicitada' | 'aprobada' | 'rechazada' | 'procesando' | 'completada';
  requested_at?: string;
  // Campos adicionales para mostrar en la tabla
  date?: string;
  customer_name?: string;
  product_name?: string;
  quantity?: number;
  // Campos para el formulario del warehouse
  product_id?: number;
}

interface InventoryReport {
  id?: number;
  report_type: string;
  generated_date: string;
  total_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  total_value: number;
}

interface StockMovement {
  id?: number;
  product_id: number;
  product_name?: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  date: string;
  user: string;
}

interface ProductForm {
  name: string;
  description: string;
  price: number;
  stock: number;
  category_id: number;
  featured: boolean;
  brand: string;
  model: string;
  warranty: string;
  imageUrls: string[];
}

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  max-width: 100vw;
  overflow-x: hidden;
`;

const MainContent = styled.main`
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 0;
`;

const DashboardContainer = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(102, 126, 234, 0.1);
`;

const Title = styled.h1`
  font-size: 2.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 800;
  margin: 0;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e0e0e0;
  flex-wrap: wrap;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 0.75rem 1.25rem;
  border: none;
  background: ${props => props.active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent'};
  color: ${props => props.active ? 'white' : '#667eea'};
  border-radius: 10px 10px 0 0;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(102, 126, 234, 0.1)'};
  }
`;

const ContentSection = styled.div`
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
`;

const StatNumber = styled.div`
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 1rem;
  opacity: 0.9;
`;

const FormContainer = styled.div`
  background: #f8f9fa;
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' | 'success' }>`
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  ${props => {
    switch (props.variant) {
      case 'danger':
        return `
          background: #dc3545;
          color: white;
          &:hover { background: #c82333; }
        `;
      case 'secondary':
        return `
          background: #6c757d;
          color: white;
          &:hover { background: #5a6268; }
        `;
      case 'success':
        return `
          background: #28a745;
          color: white;
          &:hover { background: #218838; }
        `;
      default:
        return `
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          &:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4); }
        `;
    }
  }}
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`;

const TableHeader = styled.th`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
`;

const TableCell = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  vertical-align: middle;
`;

const TableRow = styled.tr`
  &:hover {
    background: #f8f9fa;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const SmallButton = styled.button<{ variant?: 'edit' | 'delete' | 'view' | 'approve' | 'reject' }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  ${props => {
    switch (props.variant) {
      case 'delete':
      case 'reject':
        return `
          background: #dc3545;
          color: white;
          &:hover { background: #c82333; transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); }
        `;
      case 'view':
        return `
          background: #17a2b8;
          color: white;
          &:hover { background: #138496; transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); }
        `;
      case 'approve':
        return `
          background: #28a745;
          color: white;
          &:hover { background: #218838; transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); }
        `;
      default:
        return `
          background: #667eea;
          color: white;
          &:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); }
        `;
    }
  }}
`;

const Modal = styled.div<{ show: boolean }>`
  display: ${props => props.show ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 15px;
  padding: 2rem;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  width: 90%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2rem;
  color: #667eea;
`;

const ErrorContainer = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const SuccessContainer = styled.div`
  background: #d4edda;
  color: #155724;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const WarehouseDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [reports, setReports] = useState<InventoryReport[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Modals
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Forms
  const [returnForm, setReturnForm] = useState<Return>({
    product_id: 0,
    quantity: 0,
    reason: '',
    status: 'solicitada',
    date: new Date().toISOString().split('T')[0],
    customer_name: ''
  });
  
  const [stockForm, setStockForm] = useState<StockMovement>({
    product_id: 0,
    movement_type: 'in',
    quantity: 0,
    reason: '',
    date: new Date().toISOString().split('T')[0],
    user: 'Bodeguero'
  });
  
  const [productForm, setProductForm] = useState<ProductForm>({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category_id: 0,
    featured: false,
    brand: '',
    model: '',
    warranty: '',
    imageUrls: []
  });
  
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadProducts(),
        loadCategories(),
        loadReturns(),
        loadReports(),
        loadStockMovements()
      ]);
    } catch (err) {
      console.error('Error initializing dashboard:', err);
      setError('Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await apiClient.get('/products/');
      setProducts(response.data.results || response.data);
    } catch (err) {
      console.error('Error loading products:', err);
      throw err;
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiClient.get('/categories/');
      setCategories(response.data.results || response.data);
    } catch (err) {
      console.error('Error loading categories:', err);
      throw err;
    }
  };

  const loadReturns = async () => {
    try {
      const response = await apiClient.get('/returns/returns/');
      setReturns(response.data.results || response.data);
    } catch (err) {
      console.error('Error loading returns:', err);
      // No lanzar error si no existe el endpoint
    }
  };

  const loadReports = async () => {
    try {
      const response = await apiClient.get('/reports/');
      setReports(response.data.results || response.data);
    } catch (err) {
      console.error('Error loading reports:', err);
      // No lanzar error si no existe el endpoint
    }
  };

  const loadStockMovements = async () => {
    try {
      // Since /api/stock-movements/ doesn't exist, we'll use local data
      // or derive stock movements from other sources
      const mockStockMovements: StockMovement[] = [
        {
          id: 1,
          product_id: 1,
          movement_type: 'in',
          quantity: 50,
          reason: 'Restock',
          date: new Date().toISOString().split('T')[0],
          user: 'Warehouse Manager'
        },
        {
          id: 2,
          product_id: 2,
          movement_type: 'out',
          quantity: 10,
          reason: 'Sale',
          date: new Date().toISOString().split('T')[0],
          user: 'Warehouse Manager'
        }
      ];
      setStockMovements(mockStockMovements);
    } catch (err) {
      console.error('Error loading stock movements:', err);
      setStockMovements([]);
    }
  };
  
  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Obtener el usuario actual del contexto de autenticación
      const currentUser = await apiClient.get('/auth/user/');
      
      // Crear una orden temporal o usar una existente
      let orderId;
      try {
        // Intentar obtener una orden existente del usuario
        const ordersResponse = await apiClient.get('/orders/');
        if (ordersResponse.data.length > 0) {
          orderId = ordersResponse.data[0].id;
        } else {
          // Si no hay órdenes, crear una temporal para el warehouse
          const tempOrder = await apiClient.post('/orders/', {
            status: 'completed',
            total_amount: 0,
            items: []
          });
          orderId = tempOrder.data.id;
        }
      } catch (err) {
        throw new Error('No se pudo obtener o crear una orden válida');
      }
  
      const returnData = {
        order: orderId,
        customer: currentUser.data.id,
        reason: returnForm.reason || 'defectuoso',
        description: `Devolución registrada desde warehouse - Producto: ${returnForm.product_id}, Cantidad: ${returnForm.quantity}, Motivo: ${returnForm.reason}`,
        status: 'solicitada'
      };
      
      const response = await apiClient.post('/returns/returns/', returnData);
      
      setSuccess('Devolución registrada exitosamente');
      await loadReturns();
      resetReturnForm();
      setShowReturnModal(false);
    } catch (err: any) {
      console.error('Error registering return:', err);
      setError('Error al registrar la devolución: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleStockMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const product = products.find(p => p.id === stockForm.product_id);
      
      if (product) {
        let newStock = product.stock;
        if (stockForm.movement_type === 'in') {
          newStock += stockForm.quantity;
        } else if (stockForm.movement_type === 'out') {
          newStock -= stockForm.quantity;
        } else {
          newStock = stockForm.quantity; // adjustment
        }
        
        // Actualizar el stock del producto
        await apiClient.patch(`/products/${product.id}/`, { stock: Math.max(0, newStock) });
        
        // Registrar el movimiento de stock
        const newMovement: StockMovement = {
          id: Date.now(),
          product_id: product.id!,
          product_name: product.name,
          movement_type: stockForm.movement_type,
          quantity: stockForm.quantity,
          reason: stockForm.reason,
          date: stockForm.date,
          user: stockForm.user
        };
        setStockMovements(prev => [newMovement, ...prev]);
      }
      
      setSuccess('Movimiento de stock registrado exitosamente');
      await loadProducts();
      resetStockForm();
      setShowStockModal(false);
    } catch (err: any) {
      console.error('Error registering stock movement:', err);
      setError('Error al registrar el movimiento: ' + (err.response?.data?.detail || err.message));
    }
  };

  const generateInventoryReport = async () => {
    try {
      // Usar endpoint dedicado del backend para generar reporte de inventario
      await apiClient.post('/reports/generate_inventory_report/', {});
      setSuccess('Reporte de inventario generado exitosamente');
      await loadReports();
    } catch (err: any) {
      console.error('Error generating report:', err);
      const msg = err.response?.data?.error || err.response?.data?.detail || err.message;
      // Fallback local si el backend no tiene tipos de reporte configurados
      if (typeof msg === 'string' && msg.toLowerCase().includes('tipo de reporte no encontrado')) {
        const lowStockProducts = products.filter(p => p.stock < 10);
        const outOfStockProducts = products.filter(p => p.stock === 0);
        const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

        const mockReport: InventoryReport = {
          id: Date.now(),
          report_type: 'inventario',
          generated_date: new Date().toISOString(),
          total_products: products.length,
          low_stock_products: lowStockProducts.length,
          out_of_stock_products: outOfStockProducts.length,
          total_value: totalValue
        };
        setReports(prev => [mockReport, ...prev]);
        setSuccess('Reporte de inventario generado exitosamente');
        return;
      }
      setError('Error al generar el reporte: ' + msg);
    }
  };

  const handleReturnStatusChange = async (returnId: number, status: 'aprobada' | 'rechazada') => {
    try {
      await apiClient.patch(`/returns/returns/${returnId}/`, { status });
      
      if (status === 'aprobada') {
        // Si se aprueba la devolución, aumentar el stock
        const returnItem = returns.find(r => r.id === returnId);
        if (returnItem && returnItem.product_id && returnItem.quantity) {
          const product = products.find(p => p.id === returnItem.product_id);
          if (product) {
            await apiClient.patch(`/products/${product.id}/`, { 
              stock: product.stock + returnItem.quantity 
            });
          }
        }
      }
      
      setSuccess(`Devolución ${status === 'aprobada' ? 'aprobada' : 'rechazada'} exitosamente`);
      await Promise.all([loadReturns(), loadProducts()]);
    } catch (err: any) {
      console.error('Error updating return status:', err);
      setError('Error al actualizar el estado de la devolución');
    }
  };

  const resetReturnForm = () => {
    setReturnForm({
      product_id: 0,
      quantity: 0,
      reason: '',
      status: 'solicitada',
      date: new Date().toISOString().split('T')[0],
      customer_name: ''
    });
  };

  const resetStockForm = () => {
    setStockForm({
      product_id: 0,
      movement_type: 'in',
      quantity: 0,
      reason: '',
      date: new Date().toISOString().split('T')[0],
      user: 'Bodeguero'
    });
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: 0,
      stock: 0,
      category_id: 0,
      featured: false,
      brand: '',
      model: '',
      warranty: '',
      imageUrls: []
    });
    setNewImageUrl('');
    setEditingProduct(null);
  };

  const handleCreateProduct = () => {
    resetProductForm();
    setShowProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category_id: product.category.id,
      featured: product.featured,
      brand: product.brand || '',
      model: product.model || '',
      warranty: product.warranty || '',
      imageUrls: product.images ? product.images.map(img => img.image_url) : []
    });
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleAddImageUrl = () => {
    if (newImageUrl.trim() && !productForm.imageUrls.includes(newImageUrl.trim())) {
      setProductForm({
        ...productForm,
        imageUrls: [...productForm.imageUrls, newImageUrl.trim()]
      });
      setNewImageUrl('');
    }
  };

  const handleRemoveImageUrl = (index: number) => {
    setProductForm({
      ...productForm,
      imageUrls: productForm.imageUrls.filter((_, i) => i !== index)
    });
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productData = {
        name: productForm.name,
        description: productForm.description,
        price: productForm.price,
        stock: productForm.stock,
        category_id: productForm.category_id,
        featured: productForm.featured,
        brand: productForm.brand,
        model: productForm.model,
        warranty: productForm.warranty,
        images: productForm.imageUrls.map(url => ({
          image_url: url,
          is_primary: false,
          alt_text: productForm.name
        }))
      };
      
      if (editingProduct) {
        await apiClient.put(`/products/${editingProduct.id}/`, productData);
        setSuccess('Producto actualizado exitosamente');
      } else {
        await apiClient.post('/products/', productData);
        setSuccess('Producto creado exitosamente');
      }
      
      await loadProducts();
      setShowProductModal(false);
      resetProductForm();
    } catch (err: any) {
      console.error('Error al guardar producto:', err);
      setError('Error al guardar el producto');
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await apiClient.delete(`/products/${productId}/`);
        setSuccess('Producto eliminado exitosamente');
        await loadProducts();
      } catch (err: any) {
        console.error('Error al eliminar producto:', err);
        setError('Error al eliminar el producto');
      }
    }
  };



  // Estadísticas
  const lowStockProducts = products.filter(product => product.stock < 10);
  const outOfStockProducts = products.filter(product => product.stock === 0);
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const totalValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);
  const pendingReturns = returns.filter(r => r.status === 'solicitada').length;

  // Limpiar mensajes después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (loading) {
    return (
      <PageContainer>
        <Navbar />
        <MainContent>
          <LoadingContainer>
            Cargando dashboard del bodeguero...
          </LoadingContainer>
        </MainContent>
        <Footer />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Navbar />
      <MainContent>
        <DashboardContainer>
          <Header>
            <Title>Dashboard de Bodeguero</Title>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button onClick={() => setShowStockModal(true)}>
                Movimiento de Stock
              </Button>
              <Button onClick={() => setShowReturnModal(true)}>
                Registrar Devolución
              </Button>
            </div>
          </Header>

          {error && (
            <ErrorContainer>
              {error}
            </ErrorContainer>
          )}

          {success && (
            <SuccessContainer>
              {success}
            </SuccessContainer>
          )}

          <TabContainer>
            <Tab 
              active={activeTab === 'overview'} 
              onClick={() => setActiveTab('overview')}
            >
              📊 Resumen
            </Tab>
            <Tab 
              active={activeTab === 'inventory'} 
              onClick={() => setActiveTab('inventory')}
            >
              📦 Organizar Inventario
            </Tab>
            <Tab 
              active={activeTab === 'stock'} 
              onClick={() => setActiveTab('stock')}
            >
              📈 Control de Stock
            </Tab>
            <Tab 
              active={activeTab === 'returns'} 
              onClick={() => setActiveTab('returns')}
            >
              🔄 Devoluciones
            </Tab>
            <Tab 
              active={activeTab === 'reports'} 
              onClick={() => setActiveTab('reports')}
            >
              📋 Reportes
            </Tab>
            <Tab 
              active={activeTab === 'products'} 
              onClick={() => setActiveTab('products')}
            >
              🛠️ Gestión de Productos
            </Tab>
          </TabContainer>

          <ContentSection>
            {activeTab === 'overview' && (
              <>
                <h3>📊 Estadísticas del Inventario</h3>
                <StatsGrid>
                  <StatCard>
                    <StatNumber>{totalProducts}</StatNumber>
                    <StatLabel>Total Productos</StatLabel>
                  </StatCard>
                  <StatCard>
                    <StatNumber>{totalStock}</StatNumber>
                    <StatLabel>Stock Total</StatLabel>
                  </StatCard>
                  <StatCard>
                    <StatNumber>{lowStockProducts.length}</StatNumber>
                    <StatLabel>Stock Bajo (&lt;10)</StatLabel>
                  </StatCard>
                  <StatCard>
                    <StatNumber>{outOfStockProducts.length}</StatNumber>
                    <StatLabel>Sin Stock</StatLabel>
                  </StatCard>
                  <StatCard>
                    <StatNumber>${totalValue.toLocaleString()}</StatNumber>
                    <StatLabel>Valor Total Inventario</StatLabel>
                  </StatCard>
                  <StatCard>
                    <StatNumber>{pendingReturns}</StatNumber>
                    <StatLabel>Devoluciones Pendientes</StatLabel>
                  </StatCard>
                </StatsGrid>

                {lowStockProducts.length > 0 && (
                  <>
                    <h3 style={{ color: '#dc3545', marginBottom: '1rem' }}>⚠️ Productos con Stock Bajo</h3>
                    <Table>
                      <thead>
                        <tr>
                          <TableHeader>Producto</TableHeader>
                          <TableHeader>Stock Actual</TableHeader>
                          <TableHeader>Categoría</TableHeader>
                          <TableHeader>Valor</TableHeader>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStockProducts.map(product => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <strong>{product.name}</strong>
                              {product.brand && <div style={{ fontSize: '0.8rem', color: '#666' }}>{product.brand}</div>}
                            </TableCell>
                            <TableCell>
                              <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
                                {product.stock}
                              </span>
                            </TableCell>
                            <TableCell>{product.category.name}</TableCell>
                            <TableCell>${(product.price * product.stock).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </tbody>
                    </Table>
                  </>
                )}
              </>
            )}

            {activeTab === 'inventory' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h3>📦 Organizar Inventario</h3>
                  <Button onClick={generateInventoryReport}>
                    Generar Reporte
                  </Button>
                </div>
                
                <Table>
                  <thead>
                    <tr>
                      <TableHeader>Producto</TableHeader>
                      <TableHeader>Categoría</TableHeader>
                      <TableHeader>Stock</TableHeader>
                      <TableHeader>Precio</TableHeader>
                      <TableHeader>Valor Total</TableHeader>
                      <TableHeader>Estado</TableHeader>
                      <TableHeader>Acciones</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <strong>{product.name}</strong>
                            {product.brand && <div style={{ fontSize: '0.8rem', color: '#666' }}>{product.brand} - {product.model}</div>}
                          </div>
                        </TableCell>
                        <TableCell>{product.category.name}</TableCell>
                        <TableCell>
                          <span style={{ 
                            color: product.stock === 0 ? '#dc3545' : product.stock < 10 ? '#ffc107' : '#28a745',
                            fontWeight: 'bold'
                          }}>
                            {product.stock}
                          </span>
                        </TableCell>
                        <TableCell>${product.price.toLocaleString()}</TableCell>
                        <TableCell>${(product.price * product.stock).toLocaleString()}</TableCell>
                        <TableCell>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            background: product.stock === 0 ? '#dc3545' : product.stock < 10 ? '#ffc107' : '#28a745',
                            color: 'white'
                          }}>
                            {product.stock === 0 ? 'Sin Stock' : product.stock < 10 ? 'Stock Bajo' : 'Disponible'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <ActionButtons>
                            <SmallButton
                              onClick={() => {
                                setStockForm({
                                  ...stockForm,
                                  product_id: product.id!,
                                  movement_type: 'in'
                                });
                                setShowStockModal(true);
                              }}
                            >
                              Reabastecer
                            </SmallButton>
                          </ActionButtons>
                        </TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </Table>
              </>
            )}

            {activeTab === 'stock' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h3>📈 Control de Stock</h3>
                  <Button onClick={() => setShowStockModal(true)}>
                    Nuevo Movimiento
                  </Button>
                </div>
                
                <h4>Movimientos Recientes</h4>
                <Table>
                  <thead>
                    <tr>
                      <TableHeader>Fecha</TableHeader>
                      <TableHeader>Producto</TableHeader>
                      <TableHeader>Tipo</TableHeader>
                      <TableHeader>Cantidad</TableHeader>
                      <TableHeader>Motivo</TableHeader>
                      <TableHeader>Usuario</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    {stockMovements.slice(0, 20).map(movement => (
                      <TableRow key={movement.id}>
                        <TableCell>{new Date(movement.date).toLocaleDateString()}</TableCell>
                        <TableCell>{movement.product_name}</TableCell>
                        <TableCell>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            background: movement.movement_type === 'in' ? '#28a745' : movement.movement_type === 'out' ? '#dc3545' : '#ffc107',
                            color: 'white'
                          }}>
                            {movement.movement_type === 'in' ? 'Entrada' : movement.movement_type === 'out' ? 'Salida' : 'Ajuste'}
                          </span>
                        </TableCell>
                        <TableCell>{movement.quantity}</TableCell>
                        <TableCell>{movement.reason}</TableCell>
                        <TableCell>{movement.user}</TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </Table>
              </>
            )}

            {activeTab === 'returns' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h3>🔄 Gestión de Devoluciones</h3>
                  <Button onClick={() => setShowReturnModal(true)}>
                    Registrar Devolución
                  </Button>
                </div>
                
                <Table>
                  <thead>
                    <tr>
                      <TableHeader>Fecha</TableHeader>
                      <TableHeader>Cliente</TableHeader>
                      <TableHeader>Producto</TableHeader>
                      <TableHeader>Cantidad</TableHeader>
                      <TableHeader>Motivo</TableHeader>
                      <TableHeader>Estado</TableHeader>
                      <TableHeader>Acciones</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    {returns.map(returnItem => (
                      <TableRow key={returnItem.id}>
                        <TableCell>{returnItem.date ? new Date(returnItem.date).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>{returnItem.customer_name}</TableCell>
                        <TableCell>{returnItem.product_name}</TableCell>
                        <TableCell>{returnItem.quantity}</TableCell>
                        <TableCell>{returnItem.reason}</TableCell>
                        <TableCell>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            background: returnItem.status === 'aprobada' ? '#28a745' : returnItem.status === 'rechazada' ? '#dc3545' : '#ffc107',
                            color: 'white'
                          }}>
                            {returnItem.status === 'aprobada' ? 'Aprobada' : returnItem.status === 'rechazada' ? 'Rechazada' : 'Pendiente'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {returnItem.status === 'solicitada' && (
                            <ActionButtons>
                              <SmallButton
                                variant="approve"
                                onClick={() => handleReturnStatusChange(returnItem.id!, 'aprobada')}
                              >
                                Aprobar
                              </SmallButton>
                              <SmallButton
                                variant="reject"
                                onClick={() => handleReturnStatusChange(returnItem.id!, 'rechazada')}
                              >
                                Rechazar
                              </SmallButton>
                            </ActionButtons>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </Table>
              </>
            )}

            {activeTab === 'reports' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h3>📋 Reportes de Inventario</h3>
                  <Button onClick={generateInventoryReport}>
                    Generar Nuevo Reporte
                  </Button>
                </div>
                
                <Table>
                  <thead>
                    <tr>
                      <TableHeader>Fecha</TableHeader>
                      <TableHeader>Tipo</TableHeader>
                      <TableHeader>Total Productos</TableHeader>
                      <TableHeader>Stock Bajo</TableHeader>
                      <TableHeader>Sin Stock</TableHeader>
                      <TableHeader>Valor Total</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(report => (
                      <TableRow key={report.id}>
                        <TableCell>{new Date(report.generated_date).toLocaleDateString()}</TableCell>
                        <TableCell>Resumen de Inventario</TableCell>
                        <TableCell>{report.total_products}</TableCell>
                        <TableCell>{report.low_stock_products}</TableCell>
                        <TableCell>{report.out_of_stock_products}</TableCell>
                        <TableCell>${report.total_value.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </Table>
              </>
            )}

            {activeTab === 'products' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h3>🛠️ Gestión de Productos</h3>
                  <Button onClick={handleCreateProduct}>
                    ➕ Crear Nuevo Producto
                  </Button>
                </div>
                
                <Table>
                  <thead>
                    <tr>
                      <TableHeader>Producto</TableHeader>
                      <TableHeader>Categoría</TableHeader>
                      <TableHeader>Precio</TableHeader>
                      <TableHeader>Stock</TableHeader>
                      <TableHeader>Estado</TableHeader>
                      <TableHeader>Acciones</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <strong>{product.name}</strong>
                            {product.brand && (
                              <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                {product.brand} - {product.model}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{product.category.name}</TableCell>
                        <TableCell>${product.price.toLocaleString()}</TableCell>
                        <TableCell>
                          <span style={{ 
                            color: product.stock === 0 ? '#dc3545' : product.stock < 10 ? '#ffc107' : '#28a745',
                            fontWeight: 'bold'
                          }}>
                            {product.stock}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            background: product.featured ? '#667eea' : '#6c757d',
                            color: 'white'
                          }}>
                            {product.featured ? 'Destacado' : 'Normal'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <ActionButtons>
                            <SmallButton
                              variant="edit"
                              onClick={() => handleEditProduct(product)}
                            >
                              ✏️ Editar
                            </SmallButton>
                            <SmallButton
                              variant="delete"
                              onClick={() => handleDeleteProduct(product.id!)}
                            >
                              🗑️ Eliminar
                            </SmallButton>
                          </ActionButtons>
                        </TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </Table>
              </>
            )}
          </ContentSection>
        </DashboardContainer>
      </MainContent>
      <Footer />

      {/* Modal para Registrar Devolución */}
      <Modal show={showReturnModal}>
        <ModalContent>
          <h2>🔄 Registrar Devolución</h2>
          
          <form onSubmit={handleReturnSubmit}>
            <FormGrid>
              <FormGroup>
                <Label>Producto</Label>
                <Select
                  value={returnForm.product_id}
                  onChange={(e) => setReturnForm({...returnForm, product_id: parseInt(e.target.value)})}
                  required
                >
                  <option value={0}>Seleccionar producto</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} (Stock: {product.stock})
                    </option>
                  ))}
                </Select>
              </FormGroup>
              
              <FormGroup>
                <Label>Nombre del Cliente</Label>
                <Input
                  type="text"
                  value={returnForm.customer_name}
                  onChange={(e) => setReturnForm({...returnForm, customer_name: e.target.value})}
                  required
                  placeholder="Nombre completo del cliente"
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="1"
                  value={returnForm.quantity}
                  onChange={(e) => setReturnForm({...returnForm, quantity: parseInt(e.target.value)})}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={returnForm.date}
                  onChange={(e) => setReturnForm({...returnForm, date: e.target.value})}
                  required
                />
              </FormGroup>
            </FormGrid>
            
            <FormGroup>
              <Label>Motivo de la Devolución</Label>
              <TextArea
                value={returnForm.reason}
                onChange={(e) => setReturnForm({...returnForm, reason: e.target.value})}
                placeholder="Describe el motivo de la devolución"
                required
              />
            </FormGroup>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  resetReturnForm();
                  setShowReturnModal(false);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Registrar Devolución
              </Button>
            </div>
          </form>
        </ModalContent>
      </Modal>

      {/* Modal para Movimiento de Stock */}
      <Modal show={showStockModal}>
        <ModalContent>
          <h2>📈 Registrar Movimiento de Stock</h2>
          
          <form onSubmit={handleStockMovement}>
            <FormGrid>
              <FormGroup>
                <Label>Producto</Label>
                <Select
                  value={stockForm.product_id}
                  onChange={(e) => setStockForm({...stockForm, product_id: parseInt(e.target.value)})}
                  required
                >
                  <option value={0}>Seleccionar producto</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} (Stock actual: {product.stock})
                    </option>
                  ))}
                </Select>
              </FormGroup>
              
              <FormGroup>
                <Label>Tipo de Movimiento</Label>
                <Select
                  value={stockForm.movement_type}
                  onChange={(e) => setStockForm({...stockForm, movement_type: e.target.value as 'in' | 'out' | 'adjustment'})}
                  required
                >
                  <option value="in">Entrada (Agregar Stock)</option>
                  <option value="out">Salida (Reducir Stock)</option>
                  <option value="adjustment">Ajuste (Establecer Stock)</option>
                </Select>
              </FormGroup>
              
              <FormGroup>
                <Label>
                  {stockForm.movement_type === 'adjustment' ? 'Nuevo Stock' : 'Cantidad'}
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={stockForm.quantity}
                  onChange={(e) => setStockForm({...stockForm, quantity: parseInt(e.target.value)})}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={stockForm.date}
                  onChange={(e) => setStockForm({...stockForm, date: e.target.value})}
                  required
                />
              </FormGroup>
            </FormGrid>
            
            <FormGroup>
              <Label>Motivo</Label>
              <TextArea
                value={stockForm.reason}
                onChange={(e) => setStockForm({...stockForm, reason: e.target.value})}
                placeholder="Describe el motivo del movimiento"
                required
              />
            </FormGroup>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  resetStockForm();
                  setShowStockModal(false);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Registrar Movimiento
              </Button>
            </div>
          </form>
        </ModalContent>
      </Modal>

      {/* Modal para Crear/Editar Producto */}
      <Modal show={showProductModal}>
        <ModalContent style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
          <h2>{editingProduct ? '✏️ Editar Producto' : '➕ Crear Nuevo Producto'}</h2>
          
          <form onSubmit={handleProductSubmit}>
            <FormGrid>
              <FormGroup>
                <Label>Nombre del Producto *</Label>
                <Input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  placeholder="Nombre del producto"
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Categoría *</Label>
                <Select
                  value={productForm.category_id}
                  onChange={(e) => setProductForm({...productForm, category_id: parseInt(e.target.value)})}
                  required
                >
                  <option value={0}>Seleccionar categoría</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </FormGroup>
              
              <FormGroup>
                <Label>Precio (USD) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.price}
                  onChange={(e) => setProductForm({...productForm, price: parseFloat(e.target.value)})}
                  placeholder="0.00"
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Stock Inicial *</Label>
                <Input
                  type="number"
                  min="0"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({...productForm, stock: parseInt(e.target.value)})}
                  placeholder="0"
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Marca</Label>
                <Input
                  type="text"
                  value={productForm.brand}
                  onChange={(e) => setProductForm({...productForm, brand: e.target.value})}
                  placeholder="Marca del producto"
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Modelo</Label>
                <Input
                  type="text"
                  value={productForm.model}
                  onChange={(e) => setProductForm({...productForm, model: e.target.value})}
                  placeholder="Modelo del producto"
                />
              </FormGroup>
            </FormGrid>
            
            <FormGroup>
              <Label>Descripción *</Label>
              <TextArea
                value={productForm.description}
                onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                placeholder="Descripción detallada del producto"
                rows={4}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Garantía</Label>
              <Input
                type="text"
                value={productForm.warranty}
                onChange={(e) => setProductForm({...productForm, warranty: e.target.value})}
                placeholder="Ej: 12 meses, 2 años"
              />
            </FormGroup>
            
            <FormGroup>
              <Label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={productForm.featured}
                  onChange={(e) => setProductForm({...productForm, featured: e.target.checked})}
                />
                Producto Destacado
              </Label>
            </FormGroup>
            
            <FormGroup>
              <Label>Imágenes del Producto</Label>
              
              {/* Mostrar imágenes existentes */}
              {productForm.imageUrls.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Imágenes actuales:</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {productForm.imageUrls.map((imageUrl, index) => (
                      <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                        <img 
                          src={imageUrl} 
                          alt={`Producto ${index + 1}`}
                          style={{ 
                            width: '80px', 
                            height: '80px', 
                            objectFit: 'cover', 
                            borderRadius: '4px',
                            border: '2px solid #ddd'
                          }}
                          onError={(e) => {
                            e.currentTarget.style.border = '2px solid #dc3545';
                            e.currentTarget.alt = 'Error al cargar imagen';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImageUrl(index)}
                          style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ×
                        </button>
                        {index === 0 && (
                          <div style={{
                            position: 'absolute',
                            bottom: '-5px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#28a745',
                            color: 'white',
                            fontSize: '10px',
                            padding: '2px 4px',
                            borderRadius: '2px'
                          }}>
                            Principal
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Input para agregar nueva URL */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <Label>Agregar URL de Imagen</Label>
                  <Input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleAddImageUrl}
                  disabled={!newImageUrl.trim()}
                  style={{ marginBottom: 0, height: 'fit-content' }}
                >
                  Agregar
                </Button>
              </div>
              
              <small style={{ color: '#666', fontSize: '0.8rem' }}>
                Ingresa URLs válidas de imágenes. La primera imagen será la principal.
              </small>
            </FormGroup>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  resetProductForm();
                  setShowProductModal(false);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
              </Button>
            </div>
          </form>
        </ModalContent>
      </Modal>
    </PageContainer>
  );
};

export default WarehouseDashboardPage;
