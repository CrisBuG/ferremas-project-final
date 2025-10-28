import axios from 'axios';

// Configuración base de Axios
let API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
// Normaliza para asegurar que incluya el prefijo '/api' en producción
if (!API_BASE_URL.endsWith('/api')) {
  API_BASE_URL = API_BASE_URL.replace(/\/$/, '') + '/api';
}
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // IMPORTANTE: Esto permite el envío de cookies de sesión
});

// Interceptor para agregar CSRF token, JWT token y manejar FormData
apiClient.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    
    // Obtener CSRF token si es necesario
    try {
      const csrfResponse = await fetch(`${API_BASE_URL}/auth/csrf/`, {
        credentials: 'include'
      });
      const csrfData = await csrfResponse.json();
      if (csrfData.csrfToken) {
        config.headers['X-CSRFToken'] = csrfData.csrfToken;
      }
    } catch (error) {
      console.log('No se pudo obtener CSRF token:', error);
    }

    // Si los datos son FormData, eliminar el Content-Type para que el navegador lo establezca automáticamente
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// Interceptor para manejar respuestas - MODIFICADO para evitar bucles
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
  if (error.response?.status === 401) {
    // No redirigir automáticamente si estamos en páginas de pago simulado
    // o si ya estamos en login
    const currentPath = window.location.pathname;
    const isPaymentSimulationPage = 
      error.config?.url?.includes('/simulate-confirmation/') ||
      error.config?.url?.includes('/payments/transbank/simulation/');
    
    if (!currentPath.includes('/login') && !isPaymentSimulationPage) {
      window.location.href = '/login';
    }
  }
  return Promise.reject(error);
}

);


// Auth Service - CORREGIDO para usar endpoints correctos
export const authService = {
  login: (email: string, password: string) => 
    apiClient.post('/auth/login/', { email, password }),
  
  googleAuth: (token: string) => 
    apiClient.post('/auth/google/', { token }),
  
  register: (userData: any) => 
    apiClient.post('/users/', userData),
  
  logout: () => 
    apiClient.post('/auth/logout/'), // Usar endpoint de logout del backend
  
  getCurrentUser: () => 
    apiClient.get('/auth/user/'),
  
  syncAuth0User: (userData: any) => 
    apiClient.post('/auth/sync_auth0_user/', userData),
};

// User Service
export const userService = {
  getProfile: () => apiClient.get('/auth/user/'),
  updateProfile: (profileData: any) => {
    // Si profileData es FormData, usar directamente con PATCH
    if (profileData instanceof FormData) {
      return apiClient.patch('/auth/update_profile/', profileData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    // Si no es FormData, usar como JSON normal con PATCH
    return apiClient.patch('/auth/update_profile/', profileData);
  },
  getUsers: () => apiClient.get('/users/'),
  createUser: (userData: any) => apiClient.post('/users/', userData),
  updateUser: (id: number, userData: any) => apiClient.put(`/users/${id}/`, userData),
  deleteUser: (id: number) => apiClient.delete(`/users/${id}/`),
  
  register: (userData: any) => apiClient.post('/users/', userData),
  getCurrentUser: () => apiClient.get('/auth/user/'),
  syncAuth0User: (userData: any) => apiClient.post('/auth/sync_auth0_user/', userData),
  changePassword: (passwordData: { current_password: string; new_password: string }) => 
    apiClient.post('/users/change_password/', passwordData),
  
  getMyOrders: () => apiClient.get('/orders/get_orders/'),
};

// Product Service
export const productService = {
  getProducts: (params?: any) => apiClient.get('/products/', { params }),
  getProduct: (id: number) => apiClient.get(`/products/${id}/`),
  getProductsByCategory: (categoryId: number) => apiClient.get(`/products/?category=${categoryId}`),
  createProduct: (productData: any) => apiClient.post('/products/', productData),
  updateProduct: (id: number, productData: any) => apiClient.put(`/products/${id}/`, productData),
  deleteProduct: (id: number) => apiClient.delete(`/products/${id}/`),
  searchProducts: (query: string) => apiClient.get(`/products/search/?q=${query}`),
  addReview: (productId: number, reviewData: any) => 
    apiClient.post(`/products/${productId}/add_review/`, reviewData),
  getReviews: (productId: number) => apiClient.get(`/products/${productId}/reviews/`),
};

// Category Service
export const categoryService = {
  getCategories: () => apiClient.get('/categories/'),
  getCategory: (id: number) => apiClient.get(`/categories/${id}/`),
  createCategory: (categoryData: any) => apiClient.post('/categories/', categoryData),
  updateCategory: (id: number, categoryData: any) => apiClient.put(`/categories/${id}/`, categoryData),
  deleteCategory: (id: number) => apiClient.delete(`/categories/${id}/`),
};



// Cart Service - CORREGIDO para usar endpoints correctos y añadir soporte para promociones
export const cartService = {
  getCart: () => apiClient.get('/cart/get_cart/'),
  addToCart: (productId: number, quantity: number, promotionId?: number) => {
    const data: any = { product_id: productId, quantity };
    if (promotionId) {
      data.promotion_id = promotionId;
    }
    return apiClient.post('/cart/add_item/', data);
  },
  updateCartItem: (itemId: number, quantity: number) => 
    apiClient.patch('/cart/update_item/', { cart_item_id: itemId, quantity }),
  removeFromCart: (itemId: number) => 
    apiClient.delete('/cart/remove_item/', { data: { cart_item_id: itemId } }),
  clearCart: () => apiClient.delete('/cart/clear_cart/'),
};



// Order Service - CORRECTED to match backend endpoints
export const orderService = {
  createOrder: (orderData: any) => apiClient.post('/orders/create_order/', orderData),  // Changed from create_from_cart to create_order
  createFromCart: (orderData: any) => apiClient.post('/orders/create_order/', orderData),  // Changed from create_from_cart to create_order
  getOrders: () => apiClient.get('/orders/get_orders/'),  // Changed to get_orders
  getOrder: (id: number) => apiClient.get(`/orders/${id}/`),
  updateOrderStatus: (id: number, status: string) => 
    apiClient.patch(`/orders/${id}/`, { status }),
  getMyOrders: () => apiClient.get('/orders/get_orders/'),  // Changed from my to get_orders
};

// Payment Service
export const paymentService = {
  createPayment: (paymentData: any) => apiClient.post('/payments/create/', paymentData),
  confirmPayment: (paymentData: any) => apiClient.post('/payments/confirm/', paymentData),
  getPaymentStatus: (transactionId: string) => 
    apiClient.get(`/payments/status/${transactionId}/`),
};

// Transbank Service
export const transbankService = {
  createTransaction: (transactionData: any) => apiClient.post('/payments/transbank/create/', transactionData),
  confirmTransaction: (token: string) => apiClient.post('/payments/transbank/confirm/', { token }),
  getTransactionStatus: (token: string) => apiClient.get(`/payments/transbank/status/${token}/`),
  
  // Funciones para simulación - USAR LAS URLs CORRECTAS
  createSimulationTransaction: (transactionData: any) => 
    apiClient.post('/payment/simulate/', transactionData), // Cambiar URL
  confirmSimulationTransaction: (token: string) => 
    apiClient.post('/payments/transbank/confirm/', { token_ws: token }),
  getSimulationTransactionStatus: (token: string) => 
    apiClient.get(`/payments/transbank/status/${token}/`),
  
  // Funciones para integración con dinero ficticio
  createIntegrationTransaction: (transactionData: any) => 
    apiClient.post('/payments/transbank/integration/create/', transactionData),
  confirmIntegrationTransaction: (token: string) => 
    apiClient.post('/payments/transbank/integration/confirm/', { token_ws: token }),
};

// Exchange Rate Service
export const exchangeRateService = {
  getExchangeRate: () => apiClient.get('/exchange-rate/'),
  getCurrentRate: () => apiClient.get('/exchange-rate/'),
};

// EXPORTAR apiClient
export { apiClient };

export default apiClient;



// Cliente específico para pagos simulados (sin interceptor de redirección)
export const paymentApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Solo agregar el interceptor de request para incluir el token
paymentApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// Promotion Service
export const promotionService = {
  getPromotions: () => apiClient.get('/promotions/promotions/'),
  getActivePromotions: (productId?: number) => {
    const url = productId 
      ? `/promotions/promotions/active_promotions/?product_id=${productId}`
      : '/promotions/promotions/active_promotions/';
    return apiClient.get(url);
  },
  getPromotion: (id: number) => apiClient.get(`/promotions/promotions/${id}/`),
  createPromotion: (promotionData: any) => apiClient.post('/promotions/promotions/', promotionData),
  updatePromotion: (id: number, promotionData: any) => apiClient.put(`/promotions/promotions/${id}/`, promotionData),
  deletePromotion: (id: number) => apiClient.delete(`/promotions/promotions/${id}/`),
  activatePromotion: (id: number) => apiClient.post(`/promotions/promotions/${id}/activate/`),
  pausePromotion: (id: number) => apiClient.post(`/promotions/promotions/${id}/pause/`),
};

// Agregar al final del archivo
export const returnsService = {
  getReturns: () => apiClient.get('/returns/returns/'),
  createReturn: (returnData: any) => apiClient.post('/returns/returns/create_return/', returnData),
  getReturnById: (id: number) => apiClient.get(`/returns/returns/${id}/`),
};

// Coupon Service
export const couponService = {
  validate: (code: string) => apiClient.post('/promotions/coupons/validate_coupon/', { code }),
  apply: (code: string, cartTotal: number) => apiClient.post('/promotions/coupons/apply_coupon/', { code, order_total: cartTotal }),
};
  

