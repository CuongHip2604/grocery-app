// ============================================
// Enums (matching Prisma schema)
// ============================================

export enum PaymentType {
  CASH = 'CASH',
  CREDIT = 'CREDIT',
}

export enum SaleStatus {
  COMPLETED = 'COMPLETED',
  VOIDED = 'VOIDED',
}

export enum SyncStatus {
  PENDING = 'PENDING',
  SYNCED = 'SYNCED',
  FAILED = 'FAILED',
}

export enum CreditEntryType {
  CHARGE = 'CHARGE',
  PAYMENT = 'PAYMENT',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// ============================================
// Auth Types
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string; // user id
  email: string;
  iat?: number;
  exp?: number;
}

// ============================================
// Product Types
// ============================================

export interface Category {
  id: string;
  name: string;
  description?: string;
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
  inventory?: Inventory;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  barcode: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  categoryId?: string;
  reorderLevel?: number;
  isCustomLabel?: boolean;
  initialStock?: number;
}

export interface UpdateProductRequest {
  barcode?: string;
  name?: string;
  description?: string;
  price?: number;
  cost?: number;
  categoryId?: string;
  reorderLevel?: number;
  isCustomLabel?: boolean;
}

// ============================================
// Inventory Types
// ============================================

export interface Inventory {
  id: string;
  productId: string;
  quantity: number;
  lastUpdated: string;
}

export interface InventoryWithProduct extends Inventory {
  product: Product;
}

export interface AdjustInventoryRequest {
  quantity: number; // New quantity or adjustment amount
  isAbsolute?: boolean; // true = set to quantity, false = add/subtract
  reason?: string;
}

// ============================================
// Customer Types
// ============================================

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  balance?: number; // Computed field: total outstanding
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

// ============================================
// Credit Ledger Types
// ============================================

export interface CreditLedgerEntry {
  id: string;
  customerId: string;
  saleId?: string;
  type: CreditEntryType;
  amount: number;
  balance: number;
  description?: string;
  createdAt: string;
}

export interface RecordPaymentRequest {
  amount: number;
  description?: string;
}

// ============================================
// Sale Types
// ============================================

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  customerId?: string;
  customer?: Customer;
  totalAmount: number;
  paymentType: PaymentType;
  status: SaleStatus;
  syncStatus: SyncStatus;
  syncId?: string;
  items: SaleItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleItemRequest {
  productId: string;
  quantity: number;
}

export interface CreateSaleRequest {
  customerId?: string;
  paymentType: PaymentType;
  items: CreateSaleItemRequest[];
  syncId?: string; // For offline sync
}

// ============================================
// Report Types
// ============================================

export interface DailySalesSummary {
  date: string;
  totalAmount: number;
  orderCount: number;
  cashAmount: number;
  creditAmount: number;
}

export interface SalesReport {
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalOrders: number;
  dailySummaries: DailySalesSummary[];
  topProducts: Array<{
    product: Product;
    quantity: number;
    revenue: number;
  }>;
}

export interface InventoryReport {
  totalValue: number;
  totalSKUs: number;
  lowStockCount: number;
  items: Array<{
    product: Product;
    quantity: number;
    value: number;
  }>;
}

export interface ProfitLossReport {
  startDate: string;
  endDate: string;
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
}

export interface CustomerDebtsReport {
  totalOutstanding: number;
  customerCount: number;
  customers: Array<{
    customer: Customer;
    balance: number;
    lastActivity: string;
  }>;
}

// ============================================
// Expense Types
// ============================================

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description?: string;
  date: string;
  createdAt: string;
}

export interface CreateExpenseRequest {
  category: string;
  amount: number;
  description?: string;
  date: string;
}

// ============================================
// Supplier Payment Types
// ============================================

export interface SupplierPayment {
  id: string;
  supplierName: string;
  amount: number;
  description?: string;
  dueDate?: string;
  paidDate?: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface CreateSupplierPaymentRequest {
  supplierName: string;
  amount: number;
  description?: string;
  dueDate?: string;
}

// ============================================
// Sync Types (for offline support)
// ============================================

export interface SyncPushRequest {
  sales: CreateSaleRequest[];
  inventoryAdjustments: Array<{
    productId: string;
    adjustment: AdjustInventoryRequest;
  }>;
  customers: CreateCustomerRequest[];
}

export interface SyncPushResponse {
  syncedSales: string[]; // IDs of synced sales
  syncedCustomers: string[]; // IDs of synced customers
  errors: Array<{
    type: string;
    syncId?: string;
    error: string;
  }>;
}

export interface SyncPullResponse {
  products: Product[];
  customers: Customer[];
  lastSyncTimestamp: string;
}
