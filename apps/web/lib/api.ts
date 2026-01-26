import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Use relative URLs in browser (goes through Next.js proxy), absolute URL on server
const API_BASE = typeof window !== 'undefined'
  ? '' // Browser: use relative URLs (proxied through Next.js)
  : (process.env.API_URL || 'http://localhost:3001');

class ApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor(baseUrl: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - check token expiry BEFORE making request
    // All requests wait here if token needs refresh
    this.client.interceptors.request.use(async (config) => {
      if (typeof window === 'undefined') {
        return config;
      }

      // Skip token check for auth endpoints
      if (config.url?.includes('/auth/login') || config.url?.includes('/auth/refresh')) {
        return config;
      }

      // Get valid token (refreshes if needed, all requests share same refresh)
      try {
        const token = await this.getValidToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // If refresh fails, proceed anyway - response interceptor will handle 401
      }

      return config;
    });

    // Response interceptor - handle 401 as fallback (shouldn't happen normally)
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<{ message?: string }>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && typeof window !== 'undefined') {
          // Don't retry refresh or login requests
          if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/login')) {
            this.clearTokensAndRedirect();
            return Promise.reject(error);
          }

          // If already retried, give up
          if (originalRequest._retry) {
            this.clearTokensAndRedirect();
            return Promise.reject(error);
          }

          originalRequest._retry = true;

          try {
            // Force refresh and retry
            const newToken = await this.forceRefresh();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch {
            this.clearTokensAndRedirect();
            return Promise.reject(error);
          }
        }

        const message = error.response?.data?.message || error.message || 'Request failed';
        return Promise.reject(new Error(message));
      }
    );
  }

  // Get a valid token - refreshes if expired
  // Multiple concurrent calls will share the same refresh promise
  private async getValidToken(): Promise<string | null> {
    const accessToken = localStorage.getItem('accessToken');
    const tokenExpiry = localStorage.getItem('tokenExpiry');

    if (!accessToken) {
      return null;
    }

    // Check if token is expired or will expire soon (within 5 seconds)
    const now = Date.now();
    const expiryTime = tokenExpiry ? parseInt(tokenExpiry, 10) : 0;
    const isExpired = expiryTime > 0 && now >= expiryTime - 5000;

    if (!isExpired) {
      return accessToken;
    }

    // Token expired - need to refresh
    // All concurrent requests will wait on the same promise
    return this.forceRefresh();
  }

  // Force a token refresh
  // Multiple calls share the same refresh promise (only 1 refresh API call)
  private forceRefresh(): Promise<string> {
    // If refresh is already in progress, return existing promise
    // This ensures all concurrent requests wait on the same refresh
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Create new refresh promise
    this.refreshPromise = this.doRefreshToken()
      .then((token) => {
        return token;
      })
      .catch((error) => {
        throw error;
      })
      .finally(() => {
        // Clear promise so next refresh can happen
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  private async doRefreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const { data } = await axios.post<{ accessToken: string; expiresIn: number }>(
      '/api/auth/refresh',
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    );

    // Store new token and calculate expiry time
    localStorage.setItem('accessToken', data.accessToken);
    const expiryTime = Date.now() + data.expiresIn * 1000;
    localStorage.setItem('tokenExpiry', expiryTime.toString());

    return data.accessToken;
  }

  private clearTokensAndRedirect(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiry');
    window.location.href = '/login';
  }

  // Auth
  async login(email: string, password: string) {
    const { data } = await this.client.post<{
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    }>('/api/auth/login', { email, password });
    return data;
  }

  async getMe() {
    const { data } = await this.client.get<{ data: { id: string; email: string } }>('/api/auth/me');
    return data;
  }

  // Products
  async getProducts(params?: Record<string, string>) {
    const { data } = await this.client.get<{ data: Product[]; meta: Meta }>('/api/products', { params });
    return data;
  }

  async getProductByBarcode(barcode: string) {
    const { data } = await this.client.get<{ data: Product }>(`/api/products/barcode/${barcode}`);
    return data;
  }

  async getProductById(id: string) {
    const { data } = await this.client.get<{ data: Product }>(`/api/products/${id}`);
    return data;
  }

  async createProduct(productData: CreateProductInput) {
    const { data } = await this.client.post<{ data: Product }>('/api/products', productData);
    return data;
  }

  async updateProduct(id: string, productData: Partial<CreateProductInput>) {
    const { data } = await this.client.put<{ data: Product }>(`/api/products/${id}`, productData);
    return data;
  }

  async deleteProduct(id: string) {
    const { data } = await this.client.delete<{ message: string }>(`/api/products/${id}`);
    return data;
  }

  async getLowStockProducts() {
    const { data } = await this.client.get<{ data: Product[]; meta: { total: number } }>('/api/products/low-stock');
    return data;
  }

  async bulkImportProducts(products: BulkProductInput[]) {
    const { data } = await this.client.post<{ data: BulkImportResult }>('/api/products/bulk-import', { products });
    return data;
  }

  async importExcel(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await this.client.post<{ data: BulkImportResult }>('/api/products/import-excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  }

  // Categories
  async getCategories() {
    const { data } = await this.client.get<{ data: Category[] }>('/api/categories');
    return data;
  }

  async createCategory(categoryData: CreateCategoryInput) {
    const { data } = await this.client.post<{ data: Category }>('/api/categories', categoryData);
    return data;
  }

  async updateCategory(id: string, categoryData: Partial<CreateCategoryInput>) {
    const { data } = await this.client.put<{ data: Category }>(`/api/categories/${id}`, categoryData);
    return data;
  }

  async deleteCategory(id: string) {
    const { data } = await this.client.delete<{ message: string }>(`/api/categories/${id}`);
    return data;
  }

  // Sales
  async createSale(saleData: CreateSaleInput) {
    const { data } = await this.client.post<{ data: Sale }>('/api/sales', saleData);
    return data;
  }

  async getSales(params?: Record<string, string>) {
    const { data } = await this.client.get<{ data: Sale[]; meta: Meta }>('/api/sales', { params });
    return data;
  }

  async getTodaysSales() {
    const { data } = await this.client.get<{ data: Sale[]; meta: { total: number } }>('/api/sales/today');
    return data;
  }

  async getDailySummary(date?: string) {
    const { data } = await this.client.get<{ data: DailySummary }>('/api/sales/summary', {
      params: date ? { date } : undefined,
    });
    return data;
  }

  async voidSale(id: string) {
    const { data } = await this.client.post<{ data: Sale }>(`/api/sales/${id}/void`);
    return data;
  }

  // Customers
  async getCustomers(params?: Record<string, string>) {
    const { data } = await this.client.get<{ data: Customer[]; meta: Meta }>('/api/customers', { params });
    return data;
  }

  async searchCustomers(q: string) {
    const { data } = await this.client.get<{ data: Customer[] }>('/api/customers/search', { params: { q } });
    return data;
  }

  async createCustomer(customerData: CreateCustomerInput) {
    const { data } = await this.client.post<{ data: Customer }>('/api/customers', customerData);
    return data;
  }

  async getCustomerById(id: string) {
    const { data } = await this.client.get<{ data: Customer }>(`/api/customers/${id}`);
    return data;
  }

  async getCustomerLedger(id: string) {
    const { data } = await this.client.get<{ data: CustomerLedger; meta: LedgerMeta }>(`/api/customers/${id}/ledger`);
    return data;
  }

  async recordPayment(customerId: string, amount: number, description?: string) {
    const { data } = await this.client.post<{ data: PaymentResult }>(`/api/customers/${customerId}/payments`, {
      amount,
      description,
    });
    return data;
  }

  async getDebtors() {
    const { data } = await this.client.get<{ data: DebtorsReport }>('/api/customers/debtors');
    return data;
  }

  // Inventory
  async getInventory(params?: Record<string, string>) {
    const { data } = await this.client.get<{ data: InventoryItem[]; meta: InventoryMeta }>('/api/inventory', { params });
    return data;
  }

  async getInventorySummary() {
    const { data } = await this.client.get<{ data: InventorySummary }>('/api/inventory/summary');
    return data;
  }

  async getInventoryLowStock() {
    const { data } = await this.client.get<{ data: LowStockReport }>('/api/inventory/low-stock');
    return data;
  }

  async restockProduct(productId: string, quantity: number, notes?: string) {
    const { data } = await this.client.post<{ data: RestockResult }>(`/api/inventory/product/${productId}/restock`, {
      quantity,
      notes,
    });
    return data;
  }

  async adjustInventory(productId: string, quantity: number, isAbsolute?: boolean, reason?: string) {
    const { data } = await this.client.put<{ data: AdjustResult }>(`/api/inventory/product/${productId}/adjust`, {
      quantity,
      isAbsolute,
      reason,
    });
    return data;
  }

  // Accounting
  async getDashboard() {
    const { data } = await this.client.get<{ data: DashboardData }>('/api/accounting/dashboard');
    return data;
  }

  async getExpenses(params?: Record<string, string>) {
    const { data } = await this.client.get<{ data: Expense[]; meta: ExpenseMeta }>('/api/accounting/expenses', { params });
    return data;
  }

  async createExpense(expenseData: CreateExpenseInput) {
    const { data } = await this.client.post<{ data: Expense }>('/api/accounting/expenses', expenseData);
    return data;
  }

  async getProfitLoss(startDate: string, endDate: string) {
    const { data } = await this.client.get<{ data: ProfitLossReport }>('/api/accounting/reports/profit-loss', {
      params: { startDate, endDate },
    });
    return data;
  }

  async getSalesReport(startDate: string, endDate: string) {
    const { data } = await this.client.get<{ data: SalesReport }>('/api/accounting/reports/sales', {
      params: { startDate, endDate },
    });
    return data;
  }

  async getReceivables() {
    const { data } = await this.client.get<{ data: ReceivablesReport }>('/api/accounting/reports/receivables');
    return data;
  }

  async getPayables() {
    const { data } = await this.client.get<{ data: PayablesReport }>('/api/accounting/reports/payables');
    return data;
  }
}

export const api = new ApiClient(API_BASE);

// Types
export interface Meta {
  total: number;
  page: number;
  limit: number;
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  categoryId?: string;
  category?: Category;
  reorderLevel: number;
  isCustomLabel: boolean;
  inventory?: { quantity: number };
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  productCount?: number;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  cost: number;
  categoryId?: string;
  reorderLevel?: number;
  initialStock?: number;
}

export interface BulkProductInput {
  name: string;
  description?: string;
  price: number;
  cost: number;
  reorderLevel?: number;
  initialStock?: number;
}

export interface BulkImportResult {
  success: number;
  failed: number;
  errors: { row: number; name: string; error: string }[];
}

export interface Sale {
  id: string;
  customerId?: string;
  customer?: { id: string; name: string; phone?: string };
  totalAmount: number;
  paymentType: 'CASH' | 'CREDIT';
  status: 'COMPLETED' | 'VOIDED';
  items: SaleItem[];
  createdAt: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  product?: { id: string; name: string; barcode: string };
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CreateSaleInput {
  customerId?: string;
  paymentType: 'CASH' | 'CREDIT';
  items: { productId: string; quantity: number }[];
}

export interface DailySummary {
  date: string;
  totalAmount: number;
  orderCount: number;
  cashAmount: number;
  creditAmount: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  balance: number;
  createdAt: string;
}

export interface CreateCustomerInput {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface CustomerLedger {
  customer: Customer;
  entries: LedgerEntry[];
}

export interface LedgerEntry {
  id: string;
  type: 'CHARGE' | 'PAYMENT';
  amount: number;
  balance: number;
  description?: string;
  createdAt: string;
}

export interface LedgerMeta extends Meta {
  currentBalance: number;
}

export interface PaymentResult {
  id: string;
  amount: number;
  previousBalance: number;
  newBalance: number;
}

export interface DebtorsReport {
  totalOutstanding: number;
  customerCount: number;
  customers: (Customer & { lastActivity?: string })[];
}

export interface InventoryItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  value: number;
  retailValue: number;
  isLowStock: boolean;
  lastUpdated: string;
}

export interface InventoryMeta extends Meta {
  totalValue: number;
  totalRetailValue: number;
  potentialProfit: number;
  lowStockCount: number;
}

export interface InventorySummary {
  totalSKUs: number;
  totalQuantity: number;
  totalValue: number;
  totalRetailValue: number;
  potentialProfit: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoryBreakdown: { name: string; quantity: number; value: number }[];
}

export interface LowStockReport {
  count: number;
  totalEstimatedRestockCost: number;
  items: LowStockItem[];
}

export interface LowStockItem {
  productId: string;
  product: Product;
  currentQuantity: number;
  reorderLevel: number;
  deficit: number;
  suggestedReorder: number;
  estimatedCost: number;
}

export interface RestockResult {
  previousQuantity: number;
  restocked: number;
  newQuantity: number;
}

export interface AdjustResult {
  previousQuantity: number;
  adjustment: number;
  newQuantity: number;
}

export interface DashboardData {
  today: { sales: number; revenue: number };
  receivables: { total: number; customerCount: number };
  payables: { total: number; paymentCount: number };
  inventory: { lowStockCount: number };
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description?: string;
  date: string;
  createdAt: string;
}

export interface ExpenseMeta extends Meta {
  totalAmount: number;
}

export interface CreateExpenseInput {
  category: string;
  amount: number;
  description?: string;
  date: string;
}

export interface ProfitLossReport {
  period: { startDate: string; endDate: string };
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  grossMargin: number;
  expenses: number;
  expensesByCategory: { category: string; amount: number }[];
  netProfit: number;
  netMargin: number;
  salesCount: number;
}

export interface SalesReport {
  period: { startDate: string; endDate: string };
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  cashSales: { count: number; amount: number };
  creditSales: { count: number; amount: number };
  dailySummary: DailySummary[];
  topProducts: { product: Product; quantity: number; revenue: number }[];
}

export interface ReceivablesReport {
  totalReceivable: number;
  customerCount: number;
  customers: { customer: { id: string; name: string; phone?: string }; balance: number }[];
}

export interface PayablesReport {
  totalPayable: number;
  paymentCount: number;
  payments: SupplierPayment[];
}

export interface SupplierPayment {
  id: string;
  supplierName: string;
  amount: number;
  description?: string;
  dueDate?: string;
  paidDate?: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
}
