import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Pricing unit type
export const pricingUnitOptions = ['PIECE', 'KG', 'G', 'PER_100G'] as const;
export type PricingUnit = typeof pricingUnitOptions[number];

// Product schemas - use string inputs, convert on submit
export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  barcode: z.string().optional(),
  description: z.string().optional(),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Price must be a non-negative number'),
  cost: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Cost must be a non-negative number'),
  categoryId: z.string().optional(),
  reorderLevel: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number.isInteger(Number(val)), 'Reorder level must be a non-negative integer'),
  initialStock: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Initial stock must be a non-negative number'),
  isWeightBased: z.boolean().optional().default(false),
  pricingUnit: z.enum(pricingUnitOptions).optional().default('PIECE'),
});

export type CreateProductFormData = z.infer<typeof createProductSchema>;

// Converted product data for API submission
export interface CreateProductPayload {
  name: string;
  barcode?: string;
  description?: string;
  price: number;
  cost: number;
  categoryId?: string;
  reorderLevel: number;
  initialStock: number;
  isWeightBased?: boolean;
  pricingUnit?: PricingUnit;
}

export function convertProductFormData(data: CreateProductFormData): CreateProductPayload {
  return {
    name: data.name,
    barcode: data.barcode || undefined,
    description: data.description,
    price: Number(data.price),
    cost: Number(data.cost),
    categoryId: data.categoryId,
    reorderLevel: Number(data.reorderLevel),
    initialStock: Number(data.initialStock),
    isWeightBased: data.isWeightBased,
    pricingUnit: data.isWeightBased ? data.pricingUnit : 'PIECE',
  };
}

// Update product schema (no initialStock)
export const updateProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Price must be a non-negative number'),
  cost: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Cost must be a non-negative number'),
  categoryId: z.string().optional(),
  reorderLevel: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number.isInteger(Number(val)), 'Reorder level must be a non-negative integer'),
  isWeightBased: z.boolean().optional().default(false),
  pricingUnit: z.enum(pricingUnitOptions).optional().default('PIECE'),
});

export type UpdateProductFormData = z.infer<typeof updateProductSchema>;

export interface UpdateProductPayload {
  name: string;
  description?: string;
  price: number;
  cost: number;
  categoryId?: string;
  reorderLevel: number;
  isWeightBased?: boolean;
  pricingUnit?: PricingUnit;
}

export function convertUpdateProductFormData(data: UpdateProductFormData): UpdateProductPayload {
  return {
    name: data.name,
    description: data.description,
    price: Number(data.price),
    cost: Number(data.cost),
    categoryId: data.categoryId,
    reorderLevel: Number(data.reorderLevel),
    isWeightBased: data.isWeightBased,
    pricingUnit: data.isWeightBased ? data.pricingUnit : 'PIECE',
  };
}

// Payment schemas
export const recordPaymentSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Amount must be a positive number'),
  description: z.string().optional(),
});

export type RecordPaymentFormData = z.infer<typeof recordPaymentSchema>;

// Sale schemas
export const createSaleSchema = z.object({
  customerId: z.string().optional(),
  paymentType: z.enum(['CASH', 'CREDIT']),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
    })
  ).min(1, 'At least one item is required'),
});

export type CreateSaleFormData = z.infer<typeof createSaleSchema>;

// Expense schemas
export const createExpenseSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Amount must be a positive number'),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
});

export type CreateExpenseFormData = z.infer<typeof createExpenseSchema>;

// Inventory schemas
export const restockSchema = z.object({
  quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Quantity must be a positive number'),
  notes: z.string().optional(),
});

export type RestockFormData = z.infer<typeof restockSchema>;

export const adjustInventorySchema = z.object({
  quantity: z.string().refine((val) => !isNaN(Number(val)), 'Quantity must be a number'),
  isAbsolute: z.boolean(),
  reason: z.string().optional(),
});

export type AdjustInventoryFormData = z.infer<typeof adjustInventorySchema>;

// Category schemas
export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
