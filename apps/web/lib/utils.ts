import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
}

export type PricingUnit = 'PIECE' | 'KG' | 'G' | 'PER_100G';

export function getPricingUnitLabel(unit: PricingUnit): string {
  switch (unit) {
    case 'KG':
      return 'kg';
    case 'G':
      return 'g';
    case 'PER_100G':
      return '100g';
    case 'PIECE':
    default:
      return 'cái';
  }
}

export function formatPriceWithUnit(price: number, pricingUnit: PricingUnit): string {
  const formattedPrice = formatCurrency(price);
  return `${formattedPrice}/${getPricingUnitLabel(pricingUnit)}`;
}

export function formatWeight(weightInKg: number): string {
  if (weightInKg >= 1) {
    return `${weightInKg.toFixed(3)}kg`;
  }
  // Convert to grams for display if less than 1kg
  const grams = weightInKg * 1000;
  return `${grams.toFixed(0)}g`;
}

export function calculateWeightBasedPrice(
  unitPrice: number,
  pricingUnit: PricingUnit,
  quantityInKg: number
): number {
  switch (pricingUnit) {
    case 'KG':
      return unitPrice * quantityInKg;
    case 'G':
      return unitPrice * (quantityInKg * 1000);
    case 'PER_100G':
      return unitPrice * (quantityInKg * 10);
    case 'PIECE':
    default:
      return unitPrice * quantityInKg;
  }
}
