import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, CreateProductInput, CreateSaleInput, CreateExpenseInput, BulkProductInput, BulkCategoryInput, CreateCategoryInput, CreateCustomerInput } from './api';

// Query keys
export const queryKeys = {
  dashboard: ['dashboard'] as const,
  products: (params?: Record<string, string>) => ['products', params] as const,
  product: (id: string) => ['products', id] as const,
  productByBarcode: (barcode: string) => ['products', 'barcode', barcode] as const,
  categories: ['categories'] as const,
  customers: (params?: Record<string, string>) => ['customers', params] as const,
  customer: (id: string) => ['customers', id] as const,
  customerLedger: (id: string) => ['customers', id, 'ledger'] as const,
  debtors: ['debtors'] as const,
  inventory: (params?: Record<string, string>) => ['inventory', params] as const,
  inventorySummary: ['inventory', 'summary'] as const,
  sales: (params?: Record<string, string>) => ['sales', params] as const,
  salesReport: (startDate: string, endDate: string) => ['reports', 'sales', startDate, endDate] as const,
  profitLoss: (startDate: string, endDate: string) => ['reports', 'profit-loss', startDate, endDate] as const,
  expenses: (params?: Record<string, string>) => ['expenses', params] as const,
};

// Dashboard
export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => api.getDashboard(),
  });
}

// Products
export function useProducts(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.products(params),
    queryFn: () => api.getProducts(params),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => api.getProductById(id),
    enabled: !!id,
  });
}

export function useProductByBarcode(barcode: string) {
  return useQuery({
    queryKey: queryKeys.productByBarcode(barcode),
    queryFn: () => api.getProductByBarcode(barcode),
    enabled: !!barcode,
    retry: false,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductInput) => api.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventorySummary });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateProductInput> }) =>
      api.updateProduct(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.product(variables.id) });
    },
  });
}

export function useBulkImportProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (products: BulkProductInput[]) => api.bulkImportProducts(products),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useImportExcel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => api.importExcel(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Categories
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => api.getCategories(),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryInput) => api.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCategoryInput> }) =>
      api.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useBulkImportCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categories: BulkCategoryInput[]) => api.bulkImportCategories(categories),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

// Customers
export function useCustomers(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.customers(params),
    queryFn: () => api.getCustomers(params),
  });
}

export function useCustomerLedger(id: string) {
  return useQuery({
    queryKey: queryKeys.customerLedger(id),
    queryFn: () => api.getCustomerLedger(id),
    enabled: !!id,
  });
}

export function useSearchCustomers(query: string) {
  return useQuery({
    queryKey: ['customers', 'search', query],
    queryFn: () => api.searchCustomers(query),
    enabled: query.length >= 2,
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      customerId,
      amount,
      description,
    }: {
      customerId: string;
      amount: number;
      description?: string;
    }) => api.recordPayment(customerId, amount, description),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customerLedger(variables.customerId) });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useDebtors() {
  return useQuery({
    queryKey: queryKeys.debtors,
    queryFn: () => api.getDebtors(),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCustomerInput) => api.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// Inventory
export function useInventory(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.inventory(params),
    queryFn: () => api.getInventory(params),
  });
}

export function useInventorySummary() {
  return useQuery({
    queryKey: queryKeys.inventorySummary,
    queryFn: () => api.getInventorySummary(),
  });
}

export function useRestockProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      quantity,
      notes,
    }: {
      productId: string;
      quantity: number;
      notes?: string;
    }) => api.restockProduct(productId, quantity, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useAdjustInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      quantity,
      isAbsolute,
      reason,
    }: {
      productId: string;
      quantity: number;
      isAbsolute?: boolean;
      reason?: string;
    }) => api.adjustInventory(productId, quantity, isAbsolute, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

// Sales
export function useSales(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.sales(params),
    queryFn: () => api.getSales(params),
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSaleInput) => api.createSale(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useVoidSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.voidSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

// Reports
export function useSalesReport(startDate: string, endDate: string) {
  return useQuery({
    queryKey: queryKeys.salesReport(startDate, endDate),
    queryFn: () => api.getSalesReport(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function useProfitLoss(startDate: string, endDate: string) {
  return useQuery({
    queryKey: queryKeys.profitLoss(startDate, endDate),
    queryFn: () => api.getProfitLoss(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

// Expenses
export function useExpenses(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.expenses(params),
    queryFn: () => api.getExpenses(params),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExpenseInput) => api.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
