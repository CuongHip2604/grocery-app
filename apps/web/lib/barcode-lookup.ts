import axios from 'axios';

export interface BarcodeLookupResult {
  barcode: string;
  name: string;
  description?: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
}

/**
 * Lookup product information from Open Food Facts API
 * This is a free API that doesn't require authentication
 */
export async function lookupBarcode(barcode: string): Promise<BarcodeLookupResult | null> {
  try {
    // Open Food Facts API
    const response = await axios.get(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { timeout: 10000 }
    );

    if (response.data.status === 1 && response.data.product) {
      const product = response.data.product;

      return {
        barcode: barcode,
        name: product.product_name || product.product_name_en || '',
        description: product.generic_name || product.generic_name_en || '',
        brand: product.brands || '',
        category: product.categories?.split(',')[0]?.trim() || '',
        imageUrl: product.image_front_small_url || product.image_url || '',
      };
    }

    // If not found in Open Food Facts, try UPC Item DB (backup)
    return await lookupUPCItemDB(barcode);
  } catch (error) {
    console.error('Barcode lookup failed:', error);
    // Try backup API
    return await lookupUPCItemDB(barcode);
  }
}

/**
 * Backup lookup using UPC Item DB
 */
async function lookupUPCItemDB(barcode: string): Promise<BarcodeLookupResult | null> {
  try {
    const response = await axios.get(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`,
      { timeout: 10000 }
    );

    if (response.data.items && response.data.items.length > 0) {
      const item = response.data.items[0];

      return {
        barcode: barcode,
        name: item.title || '',
        description: item.description || '',
        brand: item.brand || '',
        category: item.category || '',
        imageUrl: item.images?.[0] || '',
      };
    }

    return null;
  } catch {
    return null;
  }
}
