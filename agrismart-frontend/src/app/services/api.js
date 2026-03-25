import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:1212';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('agrismart_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — auto logout on 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthRequest = url.includes('/api/auth/');
    if (status === 401 && !isAuthRequest && localStorage.getItem('agrismart_token')) {
      localStorage.removeItem('agrismart_token');
      localStorage.removeItem('agrismart_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth Service ─────────────────────────────────────
export const authService = {
  login:    (data) => apiClient.post('/api/auth/login', data),
  register: (data) => apiClient.post('/api/auth/signup', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// ── User Service ─────────────────────────────────────
export const userService = {
  getProfile:         () =>     apiClient.get('/api/users/me'),
  updateProfile:      (data) => apiClient.patch('/api/users/me', data),
  uploadProfileImage: (data) => apiClient.patch('/api/users/upload-profile', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// ── Crop Service ─────────────────────────────────────
export const cropService = {
  getAllCrops:  ()         => apiClient.get('/api/crops'),
  getCropById: (id)        => apiClient.get(`/api/crops/${id}`),
  createCrop:  (data)      => apiClient.post('/api/crops', data),
  updateCrop:  (id, data)  => apiClient.put(`/api/crops/${id}`, data),
  deleteCrop:  (id)        => apiClient.delete(`/api/crops/${id}`),
};

// ── Order Service ─────────────────────────────────────
export const orderService = {
  getAllOrders:      ()           => apiClient.get('/api/orders'),
  getOrderById:     (id)          => apiClient.get(`/api/orders/${id}`),
  createOrder:      (data)        => apiClient.post('/api/orders', data),
  updateOrderStatus:(id, status)  => apiClient.patch(`/api/orders/${id}/status`, { status }),
};

// ── Shipment Service ──────────────────────────────────
export const shipmentService = {
  getAllShipments:      ()         => apiClient.get('/api/shipments'),
  getShipmentById:     (id)        => apiClient.get(`/api/shipments/${id}`),
  updateShipmentStatus:(id, data)  => apiClient.patch(`/api/shipments/${id}/status`, data),
};

// ── Weather Service ───────────────────────────────────
export const weatherService = {
  getCurrentWeather: (lat, lng) => apiClient.get('/api/weather/current', { params: { lat, lng } }),
  getLatestWeather:  ()          => apiClient.get('/api/weather/latest'),
};

// ── Weather Advice (AI) — used in WeatherPage ─────────
// NOTE: calls backend which then calls Groq
export const fetchWeatherAdvice = async ({
  temperature, humidity, rainfall, windSpeed,
  condition, location, crops, season
}) => {
  const response = await apiClient.post('/api/weather/advice', {
    temperature, humidity, rainfall, windSpeed,
    condition, location, crops, season,
  });
  return response.data;
};

// ── Price Service ─────────────────────────────────────
// FIX: was using undefined `api` — now correctly uses apiClient
export const priceService = {
  getLatestPrices: (filter, limit) =>
    apiClient.get('/api/prices', { params: { filter, limit } }),

  predictPrice: (data) =>
    apiClient.post('/api/prices/predict', data),
};

// ── Disease Detection Service ─────────────────────────
export const diseaseService = {
  detectDisease:      (data) => apiClient.post('/api/disease/detect', data),
  getDiseaseHistory:  ()      => apiClient.get('/api/disease/my'),
};

// ── Chatbot Service ───────────────────────────────────
export const chatbotService = {
  ask: (message) => apiClient.post('/api/chatbot/ask', { message }),
};

export default apiClient;