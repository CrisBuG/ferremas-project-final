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
  alt_text: string;
  is_primary: boolean;
  order: number;
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
}

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 1rem 2rem;
  border: none;
  background: ${props => props.active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent'};
  color: ${props => props.active ? 'white' : '#667eea'};
  border-radius: 10px 10px 0 0;
  font-weight: 600;
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
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
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
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.75rem 1.5rem;
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
      default:
        return `
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          &:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4); }
        `;
    }
  }}
`;

const ProductTable = styled.table`
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
`;

const SmallButton = styled.button<{ variant?: 'edit' | 'delete' | 'view' }>`
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
        return `
          background: #dc3545;
          color: white;
          &:hover { background: #c82333; }
        `;
      case 'view':
        return `
          background: #17a2b8;
          color: white;
          &:hover { background: #138496; }
        `;
      default:
        return `
          background: #28a745;
          color: white;
          &:hover { background: #218838; }
        `;
    }
  }}
`;

const ImagePreview = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 1rem;
`;

const ImageItem = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e0e0e0;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #c82333;
  }
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

const WarehouseDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category_id: 0,
    featured: false,
    brand: '',
    model: '',
    warranty: ''
  });
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadProducts(),
        loadCategories()
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

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productData = {
        ...productForm,
        images: productImages.map((img, index) => ({
          image_url: img.image_url,
          alt_text: img.alt_text || productForm.name,
          is_primary: index === 0,
          order: index
        }))
      };

      let response;
      if (editingProduct) {
        response = await apiClient.put(`/products/${editingProduct.id}/`, productData);
      } else {
        response = await apiClient.post('/products/', productData);
      }

      console.log('Producto guardado:', response.data);
      await loadProducts();
      resetForm();
      setShowProductModal(false);
    } catch (err: any) {
      console.error('Error saving product:', err);
      if (err.response?.data) {
        console.error('Error details:', err.response.data);
      }
      setError('Error al guardar el producto: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await apiClient.delete(`/products/${productId}/`);
        await loadProducts();
      } catch (err) {
        console.error('Error deleting product:', err);
        setError('Error al eliminar el producto');
      }
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category_id: product.category.id,
      featured: product.featured,
      brand: product.brand || '',
      model: product.model || '',
      warranty: product.warranty || ''
    });
    
    setProductImages(product.images?.map(img => ({
      image_url: img.image_url,
      alt_text: img.alt_text,
      is_primary: img.is_primary,
      order: img.order
    })) || []);
    
    setShowProductModal(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: 0,
      stock: 0,
      category_id: 0,
      featured: false,
      brand: '',
      model: '',
      warranty: ''
    });
    setProductImages([]);
    setNewImageUrl('');
  };

  const addImage = () => {
    if (newImageUrl.trim()) {
      const newImage: ProductImage = {
        image_url: newImageUrl.trim(),
        alt_text: productForm.name || 'Imagen del producto',
        is_primary: productImages.length === 0,
        order: productImages.length
      };
      setProductImages([...productImages, newImage]);
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = productImages.filter((_, i) => i !== index);
    // Si eliminamos la imagen principal, hacer que la primera sea principal
    if (updatedImages.length > 0 && productImages[index].is_primary) {
      updatedImages[0].is_primary = true;
    }
    setProductImages(updatedImages);
  };

  const setPrimaryImage = (index: number) => {
    const updatedImages = productImages.map((img, i) => ({
      ...img,
      is_primary: i === index
    }));
    setProductImages(updatedImages);
  };

  const updateStock = async (productId: number, newStock: number) => {
    try {
      await apiClient.patch(`/products/${productId}/`, { stock: newStock });
      await loadProducts();
    } catch (err) {
      console.error('Error updating stock:', err);
      setError('Error al actualizar el stock');
    }
  };

  const lowStockProducts = products.filter(product => product.stock < 10);
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const featuredProducts = products.filter(product => product.featured).length;

  if (loading) {
    return (
      <PageContainer>
        <Navbar />
        <MainContent>
          <LoadingContainer>
            Cargando dashboard...
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
            <Button onClick={() => setShowProductModal(true)}>
              Agregar Producto
            </Button>
          </Header>

          {error && (
            <ErrorContainer>
              {error}
            </ErrorContainer>
          )}

          <TabContainer>
            <Tab 
              active={activeTab === 'overview'} 
              onClick={() => setActiveTab('overview')}
            >
              Resumen
            </Tab>
            <Tab 
              active={activeTab === 'products'} 
              onClick={() => setActiveTab('products')}
            >
              Gestión de Productos
            </Tab>
            <Tab 
              active={activeTab === 'stock'} 
              onClick={() => setActiveTab('stock')}
            >
              Control de Stock
            </Tab>
          </TabContainer>

          <ContentSection>
            {activeTab === 'overview' && (
              <>
                <h3>Estadísticas Generales</h3>
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
                    <StatLabel>Stock Bajo</StatLabel>
                  </StatCard>
                  <StatCard>
                    <StatNumber>{featuredProducts}</StatNumber>
                    <StatLabel>Productos Destacados</StatLabel>
                  </StatCard>
                </StatsGrid>

                {lowStockProducts.length > 0 && (
                  <>
                    <h3 style={{ color: '#dc3545', marginBottom: '1rem' }}>⚠️ Productos con Stock Bajo</h3>
                    <ProductTable>
                      <thead>
                        <tr>
                          <TableHeader>Producto</TableHeader>
                          <TableHeader>Stock Actual</TableHeader>
                          <TableHeader>Categoría</TableHeader>
                          <TableHeader>Acciones</TableHeader>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStockProducts.map(product => (
                          <TableRow key={product.id}>
                            <TableCell>{product.name}</TableCell>
                            <TableCell>
                              <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
                                {product.stock}
                              </span>
                            </TableCell>
                            <TableCell>{product.category.name}</TableCell>
                            <TableCell>
                              <ActionButtons>
                                <SmallButton
                                  variant="edit"
                                  onClick={() => handleEditProduct(product)}
                                >
                                  Editar
                                </SmallButton>
                              </ActionButtons>
                            </TableCell>
                          </TableRow>
                        ))}
                      </tbody>
                    </ProductTable>
                  </>
                )}
              </>
            )}

            {activeTab === 'products' && (
              <>
                <h3>Gestión de Productos</h3>
                <ProductTable>
                  <thead>
                    <tr>
                      <TableHeader>Nombre</TableHeader>
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
                            {product.featured && (
                              <span style={{
                                background: '#ffc107',
                                color: '#212529',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                marginLeft: '8px'
                              }}>
                                DESTACADO
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{product.category.name}</TableCell>
                        <TableCell>${product.price}</TableCell>
                        <TableCell>
                          <span style={{ 
                            color: product.stock < 10 ? '#dc3545' : '#28a745',
                            fontWeight: 'bold'
                          }}>
                            {product.stock}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span style={{
                            color: product.stock > 0 ? '#28a745' : '#dc3545',
                            fontWeight: 'bold'
                          }}>
                            {product.stock > 0 ? 'Disponible' : 'Agotado'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <ActionButtons>
                            <SmallButton
                              variant="edit"
                              onClick={() => handleEditProduct(product)}
                            >
                              Editar
                            </SmallButton>
                            <SmallButton
                              variant="delete"
                              onClick={() => handleDeleteProduct(product.id!)}
                            >
                              Eliminar
                            </SmallButton>
                          </ActionButtons>
                        </TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </ProductTable>
              </>
            )}

            {activeTab === 'stock' && (
              <>
                <h3>Control de Stock</h3>
                <ProductTable>
                  <thead>
                    <tr>
                      <TableHeader>Producto</TableHeader>
                      <TableHeader>Stock Actual</TableHeader>
                      <TableHeader>Nuevo Stock</TableHeader>
                      <TableHeader>Acciones</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <TableRow key={product.id}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>
                          <span style={{ 
                            color: product.stock < 10 ? '#dc3545' : '#28a745',
                            fontWeight: 'bold'
                          }}>
                            {product.stock}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            defaultValue={product.stock}
                            id={`stock-${product.id}`}
                            style={{ width: '100px' }}
                          />
                        </TableCell>
                        <TableCell>
                          <SmallButton
                            onClick={() => {
                              const input = document.getElementById(`stock-${product.id}`) as HTMLInputElement;
                              const newStock = parseInt(input.value);
                              if (!isNaN(newStock) && newStock >= 0) {
                                updateStock(product.id!, newStock);
                              }
                            }}
                          >
                            Actualizar
                          </SmallButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </ProductTable>
              </>
            )}
          </ContentSection>
        </DashboardContainer>
      </MainContent>
      <Footer />

      {/* Modal para agregar/editar producto */}
      <Modal show={showProductModal}>
        <ModalContent>
          <h2>{editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h2>
          
          <form onSubmit={handleProductSubmit}>
            <FormGrid>
              <FormGroup>
                <Label>Nombre del Producto</Label>
                <Input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Categoría</Label>
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
                <Label>Precio</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.price}
                  onChange={(e) => setProductForm({...productForm, price: parseFloat(e.target.value)})}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Stock</Label>
                <Input
                  type="number"
                  min="0"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({...productForm, stock: parseInt(e.target.value)})}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Marca</Label>
                <Input
                  type="text"
                  value={productForm.brand}
                  onChange={(e) => setProductForm({...productForm, brand: e.target.value})}
                  placeholder="Ej: Phillips"
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Modelo</Label>
                <Input
                  type="text"
                  value={productForm.model}
                  onChange={(e) => setProductForm({...productForm, model: e.target.value})}
                  placeholder="Ej: HD7546"
                />
              </FormGroup>
            </FormGrid>
            
            <FormGroup>
              <Label>Descripción</Label>
              <TextArea
                value={productForm.description}
                onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                placeholder="Descripción detallada del producto"
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Garantía</Label>
              <Input
                type="text"
                value={productForm.warranty}
                onChange={(e) => setProductForm({...productForm, warranty: e.target.value})}
                placeholder="Ej: 12 meses"
              />
            </FormGroup>
            
            <FormGroup>
              <Label>
                <input
                  type="checkbox"
                  checked={productForm.featured}
                  onChange={(e) => setProductForm({...productForm, featured: e.target.checked})}
                  style={{ marginRight: '0.5rem' }}
                />
                Producto Destacado
              </Label>
            </FormGroup>

            {/* Gestión de Imágenes */}
            <FormContainer>
              <h3>Imágenes del Producto</h3>
              <FormGrid>
                <FormGroup>
                  <Label>URL de Imagen</Label>
                  <Input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>&nbsp;</Label>
                  <Button type="button" onClick={addImage} disabled={!newImageUrl.trim()}>
                    Agregar Imagen
                  </Button>
                </FormGroup>
              </FormGrid>
              
              {productImages.length > 0 && (
                <>
                  <p style={{ marginTop: '1rem', color: '#666' }}>
                    Haz clic en "Principal" para establecer la imagen principal del producto.
                  </p>
                  <ImagePreview>
                    {productImages.map((image, index) => (
                      <ImageItem key={index}>
                        <PreviewImage 
                          src={image.image_url} 
                          alt={image.alt_text}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/100x100?text=Error';
                          }}
                        />
                        <RemoveImageButton onClick={() => removeImage(index)}>
                          ×
                        </RemoveImageButton>
                        {image.is_primary && (
                          <div style={{
                            position: 'absolute',
                            bottom: '5px',
                            left: '5px',
                            background: '#28a745',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px'
                          }}>
                            Principal
                          </div>
                        )}
                        {!image.is_primary && (
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(index)}
                            style={{
                              position: 'absolute',
                              bottom: '5px',
                              left: '5px',
                              background: '#007bff',
                              color: 'white',
                              border: 'none',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              cursor: 'pointer'
                            }}
                          >
                            Principal
                          </button>
                        )}
                      </ImageItem>
                    ))}
                  </ImagePreview>
                </>
              )}
            </FormContainer>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  resetForm();
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