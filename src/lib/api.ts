// Local API client to replace Supabase for offline mode
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Database types (same as supabase.ts)
export interface Product {
  id: number
  name: string
  description: string
  price: number
  quantity: number
  category: string
  barcode?: string
  low_stock_threshold: number
  cost_price?: number
  selling_price?: number
  brand?: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: number
  order_number: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  status: string
  total_amount: number
  subtotal_amount: number
  pos_charge: number
  payment_mode: 'cash' | 'pos'
  tax_amount: number
  order_date: string
  notes?: string
  items?: OrderItem[]
  // Payment tracking fields
  amount_paid?: number
  amount_due?: number
  payment_status?: 'paid' | 'partial' | 'unpaid'
}

export interface OrderItem {
  id?: number
  order_id?: number
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface User {
  id: number
  username: string
  email: string
  role: string
  created_at: string
}

// API Client class
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, retries = 3): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Use AbortController to add a request timeout and improve reliability
        const controller = new AbortController()
        const timeout = (options as any)?.timeout || 10000 // default 10s
        const id = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          signal: controller.signal as any
        });
        clearTimeout(id)

        if (!response.ok) {
          let errorMessage = `HTTP error! status: ${response.status}`;
          try {
            const error = await response.json();
            errorMessage = error.error || error.message || errorMessage;
          } catch {
            // If response is not JSON, use status text
            errorMessage = response.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        // Handle empty responses
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const text = await response.text();
          return text ? JSON.parse(text) : ({} as T);
        }
        
        return response.json();
      } catch (error) {
        const isNetworkError = 
          (error && (error as any).name === 'AbortError') ||
          (error instanceof TypeError && error.message.includes('fetch')) ||
          (error instanceof TypeError && error.message.includes('Failed to fetch'));
        
        if (isNetworkError && attempt < retries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          console.log(`API request failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Handle network errors on final attempt
        if (error && (error as any).name === 'AbortError') {
          throw new Error('Network timeout: request took too long. Please check your connection or server status.')
        }
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error('Network error: Unable to connect to server. Please ensure the server is running on localhost:5000');
        }
        // Re-throw other errors
        throw error;
      }
    }
    
    // This should never be reached, but TypeScript needs it
    throw new Error('Request failed after all retries');
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return this.request<Product[]>('/products');
  }

  async getProduct(id: number): Promise<Product> {
    return this.request<Product>(`/products/${id}`);
  }

  async createProduct(product: Partial<Product>): Promise<Product> {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: number, product: Partial<Product>): Promise<Product> {
    return this.request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  async deleteProduct(id: number): Promise<void> {
    return this.request<void>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return this.request<Order[]>('/orders');
  }

  async getOrder(id: number): Promise<Order> {
    return this.request<Order>(`/orders/${id}`);
  }

  async createOrder(order: Partial<Order>): Promise<Order> {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    return this.request<Order>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Users
  async login(email: string, password: string): Promise<User> {
    return this.request<User>('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(username: string, email: string, password: string): Promise<User> {
    return this.request<User>('/users/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  // Dashboard
  async getDashboardStats(): Promise<{
    totalOrders: number
    totalRevenue: number
    totalProducts: number
    lowStockCount: number
  }> {
    return this.request('/dashboard/stats');
  }

  // Customers
  async getCustomers(): Promise<any[]> {
    return this.request('/customers');
  }
}

// Create and export a singleton instance
export const api = new ApiClient();

// Supabase-like interface for compatibility
export const supabase = {
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        single: async () => {
          if (table === 'users') {
            // This is a login query - use api.login() instead
            throw new Error('Use api.login() instead');
          }
          throw new Error('Not implemented');
        },
        then: async (callback: (result: any) => any) => {
          // Handle different table queries
          if (table === 'products') {
            const data = await api.getProducts();
            return callback({ data, error: null });
          }
          if (table === 'orders') {
            const data = await api.getOrders();
            return callback({ data, error: null });
          }
          return callback({ data: null, error: new Error('Table not found') });
        },
      }),
      order: (column: string, options?: { ascending?: boolean }) => ({
        then: async (callback: (result: any) => any) => {
          if (table === 'products') {
            const data = await api.getProducts();
            return callback({ data, error: null });
          }
          if (table === 'orders') {
            const data = await api.getOrders();
            return callback({ data, error: null });
          }
          return callback({ data: null, error: new Error('Table not found') });
        },
      }),
      then: async (callback: (result: any) => any) => {
        if (table === 'products') {
          const data = await api.getProducts();
          return callback({ data, error: null });
        }
        if (table === 'orders') {
          const data = await api.getOrders();
          return callback({ data, error: null });
        }
        if (table === 'users') {
          return callback({ data: null, error: new Error('Use api methods instead') });
        }
        return callback({ data: null, error: new Error('Table not found') });
      },
    }),
    insert: (data: any) => ({
      select: (columns?: string) => ({
        single: async () => {
          if (table === 'users') {
            const user = await api.register(data.username, data.email, data.password);
            return { data: user, error: null };
          }
          if (table === 'products') {
            const product = await api.createProduct(data);
            return { data: product, error: null };
          }
          if (table === 'orders') {
            const order = await api.createOrder(data);
            return { data: order, error: null };
          }
          return { data: null, error: new Error('Table not found') };
        },
        then: async (callback: (result: any) => any) => {
          if (table === 'order_items') {
            // Order items are handled in order creation
            return callback({ data: null, error: null });
          }
          return callback({ data: null, error: new Error('Use single() for inserts') });
        },
      }),
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        then: async (callback: (result: any) => any) => {
          if (table === 'orders' && column === 'id') {
            if (data.status) {
              const order = await api.updateOrderStatus(value, data.status);
              return callback({ data: [order], error: null });
            }
          }
          if (table === 'products' && column === 'id') {
            const product = await api.updateProduct(value, data);
            return callback({ data: [product], error: null });
          }
          return callback({ data: null, error: new Error('Update not implemented') });
        },
      }),
    }),
    delete: () => ({
      eq: (column: string, value: any) => ({
        then: async (callback: (result: any) => any) => {
          if (table === 'products' && column === 'id') {
            await api.deleteProduct(value);
            return callback({ data: null, error: null });
          }
          return callback({ data: null, error: new Error('Delete not implemented') });
        },
      }),
    }),
  }),
};
