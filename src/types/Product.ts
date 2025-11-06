export interface Product {
  id: number;
  ean: string;
  name: string;
  original_name?: string;
  brand: string;
  page?: string;
  url?: string;
  description?: string;
  category?: string;
  type?: string;
  variety?: string;
  image_filename?: string;
  image_url?: string | null;
  available?: boolean;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  ean: string;
  name: string;
  original_name?: string;
  brand: string;
  page?: string;
  url?: string;
  description?: string;
  category?: string;
  type?: string;
  variety?: string;
  image_filename?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
