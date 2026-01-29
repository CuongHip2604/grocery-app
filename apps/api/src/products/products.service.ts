import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingUnit } from '@prisma/client';
import * as XLSX from 'xlsx';
import {
  CreateProductDto,
  UpdateProductDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  ProductQueryDto,
  BulkCreateProductDto,
  BulkCreateCategoryDto,
} from './dto/products.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // ==================== PRODUCTS ====================

  async createProduct(dto: CreateProductDto) {
    // Use provided barcode or auto-generate one
    const barcode = dto.barcode || this.generateBarcode();

    // Check if barcode already exists
    if (dto.barcode) {
      const existing = await this.prisma.product.findUnique({
        where: { barcode: dto.barcode },
      });
      if (existing) {
        throw new ConflictException(`Product with barcode "${dto.barcode}" already exists`);
      }
    }

    const { initialStock, barcode: _, ...productData } = dto;

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        barcode,
        inventory: {
          create: {
            quantity: initialStock || 0,
          },
        },
      },
      include: {
        category: true,
        inventory: true,
      },
    });

    return this.transformProduct(product);
  }

  async findAllProducts(query: ProductQueryDto) {
    const { search, categoryId, lowStock, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    // lowStock filtering is done in memory after fetching (MongoDB doesn't support comparing fields directly)

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          inventory: true,
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    // Filter low stock in memory if needed (Prisma doesn't support comparing columns directly)
    let filteredProducts = products;
    if (lowStock) {
      filteredProducts = products.filter(
        (p) => p.inventory && p.inventory.quantity <= p.reorderLevel
      );
    }

    return {
      data: filteredProducts.map((p) => this.transformProduct(p)),
      meta: {
        total: lowStock ? filteredProducts.length : total,
        page,
        limit,
      },
    };
  }

  async findProductById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        inventory: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.transformProduct(product);
  }

  async findProductByBarcode(barcode: string) {
    // Trim and normalize the barcode
    const normalizedBarcode = barcode.trim();

    const product = await this.prisma.product.findUnique({
      where: { barcode: normalizedBarcode },
      include: {
        category: true,
        inventory: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with barcode "${normalizedBarcode}" not found`);
    }

    return this.transformProduct(product);
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    // Check if product exists
    const existing = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: dto,
      include: {
        category: true,
        inventory: true,
      },
    });

    return this.transformProduct(product);
  }

  async deleteProduct(id: string) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return { message: 'Product deleted successfully' };
  }

  async getLowStockProducts() {
    const products = await this.prisma.product.findMany({
      include: {
        category: true,
        inventory: true,
      },
    });

    const lowStockProducts = products.filter(
      (p) => p.inventory && p.inventory.quantity <= p.reorderLevel
    );

    return {
      data: lowStockProducts.map((p) => this.transformProduct(p)),
      meta: { total: lowStockProducts.length },
    };
  }

  async bulkImportProducts(products: BulkCreateProductDto[]) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as { row: number; name: string; error: string }[],
    };

    for (let i = 0; i < products.length; i++) {
      const dto = products[i];
      try {
        const barcode = dto.barcode.trim();

        // Check if barcode already exists
        const existing = await this.prisma.product.findUnique({
          where: { barcode },
        });
        if (existing) {
          throw new Error(`Barcode "${barcode}" đã tồn tại`);
        }

        const { initialStock, barcode: _, ...productData } = dto;

        await this.prisma.product.create({
          data: {
            ...productData,
            barcode,
            reorderLevel: dto.reorderLevel || 10,
            inventory: {
              create: {
                quantity: initialStock || 0,
              },
            },
          },
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          name: dto.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  async importFromExcel(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

    if (rows.length === 0) {
      throw new BadRequestException('File Excel phải có ít nhất một dòng dữ liệu');
    }

    // Find column names (case-insensitive matching)
    const findColumn = (row: Record<string, unknown>, ...names: string[]): unknown => {
      for (const key of Object.keys(row)) {
        const lowerKey = key.toLowerCase();
        if (names.some(n => lowerKey.includes(n))) {
          return row[key];
        }
      }
      return undefined;
    };

    // Check required columns
    const firstRow = rows[0];
    const hasName = findColumn(firstRow, 'name', 'tên') !== undefined;
    const hasBarcode = findColumn(firstRow, 'barcode', 'mã vạch', 'mavach') !== undefined;
    const hasPrice = findColumn(firstRow, 'price', 'giá bán', 'giaban') !== undefined;
    const hasCost = findColumn(firstRow, 'cost', 'giá nhập', 'gianhap') !== undefined;

    if (!hasName || !hasBarcode || !hasPrice || !hasCost) {
      throw new BadRequestException('Thiếu cột bắt buộc: name, barcode, price, cost');
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as { row: number; name: string; error: string }[],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // Excel rows start at 1, plus header

      try {
        const name = String(findColumn(row, 'name', 'tên') || '').trim();
        const barcodeVal = findColumn(row, 'barcode', 'mã vạch', 'mavach');
        const priceVal = findColumn(row, 'price', 'giá bán', 'giaban');
        const costVal = findColumn(row, 'cost', 'giá nhập', 'gianhap');
        const description = String(findColumn(row, 'description', 'mô tả', 'mota') || '').trim();
        const reorderLevelVal = findColumn(row, 'reorder', 'mức đặt');
        const initialStockVal = findColumn(row, 'stock', 'tồn kho', 'tonkho');

        // Validation
        if (!name) {
          throw new Error('Tên là bắt buộc');
        }

        const barcode = barcodeVal ? String(barcodeVal).trim() : '';
        if (!barcode) {
          throw new Error('Mã vạch là bắt buộc');
        }

        const price = typeof priceVal === 'number' ? priceVal : parseFloat(String(priceVal));
        if (isNaN(price) || price < 0) {
          throw new Error('Giá bán không hợp lệ');
        }

        const cost = typeof costVal === 'number' ? costVal : parseFloat(String(costVal));
        if (isNaN(cost) || cost < 0) {
          throw new Error('Giá nhập không hợp lệ');
        }

        let reorderLevel = 10;
        if (reorderLevelVal !== undefined && reorderLevelVal !== '') {
          reorderLevel = typeof reorderLevelVal === 'number' ? reorderLevelVal : parseInt(String(reorderLevelVal), 10);
          if (isNaN(reorderLevel) || reorderLevel < 0) reorderLevel = 10;
        }

        let initialStock = 0;
        if (initialStockVal !== undefined && initialStockVal !== '') {
          initialStock = typeof initialStockVal === 'number' ? initialStockVal : parseInt(String(initialStockVal), 10);
          if (isNaN(initialStock) || initialStock < 0) initialStock = 0;
        }

        // Check if barcode already exists
        const existing = await this.prisma.product.findUnique({
          where: { barcode },
        });
        if (existing) {
          throw new Error(`Barcode "${barcode}" đã tồn tại`);
        }

        await this.prisma.product.create({
          data: {
            name,
            description: description || null,
            price,
            cost,
            barcode,
            reorderLevel,
            inventory: {
              create: {
                quantity: initialStock,
              },
            },
          },
        });

        results.success++;
      } catch (error) {
        results.failed++;
        const name = String(findColumn(row, 'name', 'tên') || 'Unknown');
        results.errors.push({
          row: rowNumber,
          name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  private generateBarcode(): string {
    // Generate a unique barcode: timestamp + random digits
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `AUTO${timestamp}${random}`;
  }

  // ==================== CATEGORIES ====================

  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    return this.prisma.category.create({
      data: dto,
    });
  }

  async findAllCategories() {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return {
      data: categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        productCount: c._count.products,
      })),
    };
  }

  async findCategoryById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      productCount: category._count.products,
    };
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    if (dto.name && dto.name !== existing.name) {
      const nameExists = await this.prisma.category.findUnique({
        where: { name: dto.name },
      });

      if (nameExists) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCategory(id: string) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    if (existing._count.products > 0) {
      throw new ConflictException(
        'Cannot delete category with associated products'
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { message: 'Category deleted successfully' };
  }

  async bulkImportCategories(categories: BulkCreateCategoryDto[]) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as { row: number; name: string; error: string }[],
    };

    for (let i = 0; i < categories.length; i++) {
      const dto = categories[i];
      try {
        // Check if category with same name exists
        const existing = await this.prisma.category.findUnique({
          where: { name: dto.name },
        });

        if (existing) {
          throw new Error(`Category "${dto.name}" already exists`);
        }

        await this.prisma.category.create({
          data: {
            name: dto.name,
            description: dto.description || null,
          },
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          name: dto.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  // ==================== HELPERS ====================

  private transformProduct(product: {
    id: string;
    barcode: string;
    name: string;
    description: string | null;
    price: unknown;
    cost: unknown;
    categoryId: string | null;
    reorderLevel: number;
    isCustomLabel: boolean;
    isWeightBased: boolean;
    pricingUnit: PricingUnit;
    createdAt: Date;
    updatedAt: Date;
    category?: { id: string; name: string; description: string | null } | null;
    inventory?: { id: string; productId: string; quantity: number; lastUpdated: Date } | null;
  }) {
    return {
      id: product.id,
      barcode: product.barcode,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      cost: Number(product.cost),
      categoryId: product.categoryId,
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
            description: product.category.description,
          }
        : null,
      reorderLevel: product.reorderLevel,
      isCustomLabel: product.isCustomLabel,
      isWeightBased: product.isWeightBased,
      pricingUnit: product.pricingUnit,
      inventory: product.inventory
        ? {
            id: product.inventory.id,
            productId: product.inventory.productId,
            quantity: product.inventory.quantity,
            lastUpdated: product.inventory.lastUpdated.toISOString(),
          }
        : null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }
}
