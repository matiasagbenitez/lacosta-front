import axios from 'axios';
import { Product, ProductFormData, ApiResponse } from '../types/Product';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const productApi = {
  // Obtener todos los productos
  getAll: async (filters?: { 
    brand?: string; 
    category?: string; 
    search?: string;
    available?: string;
    page?: number;
    limit?: number;
  }): Promise<{ products: Product[]; pagination?: ApiResponse<Product[]>['pagination'] }> => {
    const params = new URLSearchParams();
    if (filters?.brand && filters.brand !== 'all') params.append('brand', filters.brand);
    if (filters?.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters?.available && filters.available !== 'all') params.append('available', filters.available);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await api.get<ApiResponse<Product[]>>(`/products?${params.toString()}`);
    return {
      products: response.data.data || [],
      pagination: response.data.pagination
    };
  },

  // Obtener producto por ID
  getById: async (id: number): Promise<Product> => {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    if (!response.data.data) {
      throw new Error('Producto no encontrado');
    }
    return response.data.data;
  },

  // Crear producto
  create: async (productData: ProductFormData): Promise<Product> => {
    const response = await api.post<ApiResponse<Product>>('/products', productData);
    if (!response.data.data) {
      throw new Error(response.data.message || 'Error al crear producto');
    }
    return response.data.data;
  },

  // Actualizar producto
  update: async (id: number, productData: ProductFormData): Promise<Product> => {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, productData);
    if (!response.data.data) {
      throw new Error(response.data.message || 'Error al actualizar producto');
    }
    return response.data.data;
  },

  // Eliminar producto
  delete: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  // Obtener marcas
  getBrands: async (): Promise<string[]> => {
    const response = await api.get<ApiResponse<string[]>>('/brands');
    return response.data.data || [];
  },

  // Obtener categorías
  getCategories: async (): Promise<string[]> => {
    const response = await api.get<ApiResponse<string[]>>('/categories');
    return response.data.data || [];
  },

  // Toggle disponibilidad del producto
  toggleAvailability: async (id: number): Promise<Product> => {
    const response = await api.patch<ApiResponse<Product>>(`/products/${id}/toggle-availability`);
    if (!response.data.data) {
      throw new Error(response.data.message || 'Error al cambiar disponibilidad');
    }
    return response.data.data;
  },

  // Actualizar comentarios del producto
  updateComments: async (id: number, comments: string): Promise<Product> => {
    const response = await api.patch<ApiResponse<Product>>(`/products/${id}/comments`, { comments });
    if (!response.data.data) {
      throw new Error(response.data.message || 'Error al actualizar comentarios');
    }
    return response.data.data;
  },
};

export default api;
