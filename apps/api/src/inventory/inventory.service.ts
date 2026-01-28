import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdjustInventoryDto,
  RestockDto,
  InventoryQueryDto,
} from './dto/inventory.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  async findAll(query: InventoryQueryDto) {
    const {
      search,
      categoryId,
      lowStockOnly,
      lowStock, // Alias for lowStockOnly
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 50,
    } = query;
    const filterLowStock = lowStockOnly || lowStock; // Support both parameter names
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

    // Get all products with inventory
    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: true,
        inventory: true,
      },
      orderBy: sortBy === 'name' ? { name: sortOrder } : undefined,
    });

    // Transform and calculate values
    let inventoryItems = products.map((product) => {
      const quantity = product.inventory?.quantity || 0;
      const cost = Number(product.cost);
      const price = Number(product.price);

      return {
        id: product.inventory?.id || null,
        productId: product.id,
        product: {
          id: product.id,
          barcode: product.barcode,
          name: product.name,
          price,
          cost,
          categoryId: product.categoryId,
          category: product.category
            ? {
                id: product.category.id,
                name: product.category.name,
              }
            : null,
          reorderLevel: product.reorderLevel,
        },
        quantity,
        value: quantity * cost,
        retailValue: quantity * price,
        isLowStock: quantity <= product.reorderLevel,
        lastUpdated: product.inventory?.lastUpdated?.toISOString() || null,
      };
    });

    // Filter low stock if requested
    if (filterLowStock) {
      inventoryItems = inventoryItems.filter((item) => item.isLowStock);
    }

    // Sort by quantity or value if requested
    if (sortBy === 'quantity') {
      inventoryItems.sort((a, b) =>
        sortOrder === 'asc' ? a.quantity - b.quantity : b.quantity - a.quantity
      );
    } else if (sortBy === 'value') {
      inventoryItems.sort((a, b) =>
        sortOrder === 'asc' ? a.value - b.value : b.value - a.value
      );
    }

    // Paginate
    const total = inventoryItems.length;
    const paginatedItems = inventoryItems.slice(skip, skip + limit);

    // Calculate totals
    const totalValue = inventoryItems.reduce((sum, item) => sum + item.value, 0);
    const totalRetailValue = inventoryItems.reduce(
      (sum, item) => sum + item.retailValue,
      0
    );
    const lowStockCount = inventoryItems.filter((item) => item.isLowStock).length;

    return {
      data: paginatedItems,
      meta: {
        total,
        page,
        limit,
        totalValue: Math.round(totalValue * 100) / 100,
        totalRetailValue: Math.round(totalRetailValue * 100) / 100,
        potentialProfit: Math.round((totalRetailValue - totalValue) * 100) / 100,
        lowStockCount,
      },
    };
  }

  async getByProductId(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        inventory: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const quantity = product.inventory?.quantity || 0;
    const cost = Number(product.cost);
    const price = Number(product.price);

    return {
      data: {
        id: product.inventory?.id || null,
        productId: product.id,
        product: {
          id: product.id,
          barcode: product.barcode,
          name: product.name,
          price,
          cost,
          categoryId: product.categoryId,
          category: product.category
            ? {
                id: product.category.id,
                name: product.category.name,
              }
            : null,
          reorderLevel: product.reorderLevel,
        },
        quantity,
        value: quantity * cost,
        retailValue: quantity * price,
        isLowStock: quantity <= product.reorderLevel,
        lastUpdated: product.inventory?.lastUpdated?.toISOString() || null,
      },
    };
  }

  async adjustInventory(productId: string, dto: AdjustInventoryDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { inventory: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const currentQuantity = product.inventory?.quantity || 0;
    let newQuantity: number;

    if (dto.isAbsolute) {
      // Set to absolute value
      newQuantity = dto.quantity;
    } else {
      // Add/subtract from current
      newQuantity = currentQuantity + dto.quantity;
    }

    if (newQuantity < 0) {
      throw new BadRequestException('Inventory cannot be negative');
    }

    // Update or create inventory record
    const inventory = await this.prisma.inventory.upsert({
      where: { productId },
      update: {
        quantity: newQuantity,
        lastUpdated: new Date(),
      },
      create: {
        productId,
        quantity: newQuantity,
      },
    });

    const cost = Number(product.cost);
    const price = Number(product.price);
    const isLowStock = newQuantity <= product.reorderLevel;

    // Send low stock notification if quantity dropped below reorder level
    if (isLowStock && newQuantity < currentQuantity) {
      this.notificationsService
        .sendLowStockNotification([
          {
            id: product.id,
            name: product.name,
            quantity: newQuantity,
            reorderLevel: product.reorderLevel,
          },
        ])
        .catch(() => {
          // Log but don't fail the operation
        });
    }

    return {
      data: {
        id: inventory.id,
        productId: product.id,
        product: {
          id: product.id,
          barcode: product.barcode,
          name: product.name,
        },
        previousQuantity: currentQuantity,
        adjustment: dto.isAbsolute ? newQuantity - currentQuantity : dto.quantity,
        newQuantity,
        reason: dto.reason || null,
        value: newQuantity * cost,
        retailValue: newQuantity * price,
        isLowStock,
        lastUpdated: inventory.lastUpdated.toISOString(),
      },
    };
  }

  async restock(productId: string, dto: RestockDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { inventory: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const currentQuantity = product.inventory?.quantity || 0;
    const newQuantity = currentQuantity + dto.quantity;

    const inventory = await this.prisma.inventory.upsert({
      where: { productId },
      update: {
        quantity: newQuantity,
        lastUpdated: new Date(),
      },
      create: {
        productId,
        quantity: newQuantity,
      },
    });

    const cost = Number(product.cost);
    const price = Number(product.price);

    return {
      data: {
        id: inventory.id,
        productId: product.id,
        product: {
          id: product.id,
          barcode: product.barcode,
          name: product.name,
        },
        previousQuantity: currentQuantity,
        restocked: dto.quantity,
        newQuantity,
        notes: dto.notes || null,
        value: newQuantity * cost,
        retailValue: newQuantity * price,
        isLowStock: newQuantity <= product.reorderLevel,
        lastUpdated: inventory.lastUpdated.toISOString(),
      },
    };
  }

  async getLowStock() {
    const products = await this.prisma.product.findMany({
      include: {
        category: true,
        inventory: true,
      },
    });

    const lowStockItems = products
      .filter((product) => {
        const quantity = product.inventory?.quantity || 0;
        return quantity <= product.reorderLevel;
      })
      .map((product) => {
        const quantity = product.inventory?.quantity || 0;
        const cost = Number(product.cost);
        const deficit = product.reorderLevel - quantity + 1; // How many to order to get above reorder level

        return {
          productId: product.id,
          product: {
            id: product.id,
            barcode: product.barcode,
            name: product.name,
            price: Number(product.price),
            cost,
            categoryId: product.categoryId,
            category: product.category
              ? {
                  id: product.category.id,
                  name: product.category.name,
                }
              : null,
            reorderLevel: product.reorderLevel,
          },
          currentQuantity: quantity,
          reorderLevel: product.reorderLevel,
          deficit: Math.max(0, deficit),
          suggestedReorder: Math.max(deficit, product.reorderLevel), // Reorder at least reorder level
          estimatedCost: Math.max(deficit, product.reorderLevel) * cost,
        };
      })
      .sort((a, b) => a.currentQuantity - b.currentQuantity); // Most critical first

    const totalEstimatedCost = lowStockItems.reduce(
      (sum, item) => sum + item.estimatedCost,
      0
    );

    return {
      data: {
        count: lowStockItems.length,
        totalEstimatedRestockCost: Math.round(totalEstimatedCost * 100) / 100,
        items: lowStockItems,
      },
    };
  }

  async getSummary() {
    const products = await this.prisma.product.findMany({
      include: {
        category: true,
        inventory: true,
      },
    });

    let totalQuantity = 0;
    let totalValue = 0;
    let totalRetailValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const categoryBreakdown: Record<
      string,
      { name: string; quantity: number; value: number; count: number }
    > = {};

    for (const product of products) {
      const quantity = product.inventory?.quantity || 0;
      const cost = Number(product.cost);
      const value = quantity * cost;
      const retailValue = quantity * Number(product.price);

      totalQuantity += quantity;
      totalValue += value;
      totalRetailValue += retailValue;

      if (quantity <= product.reorderLevel) {
        lowStockCount++;
      }
      if (quantity === 0) {
        outOfStockCount++;
      }

      // Category breakdown
      const categoryName = product.category?.name || 'Uncategorized';
      const categoryId = product.categoryId || 'uncategorized';

      if (!categoryBreakdown[categoryId]) {
        categoryBreakdown[categoryId] = {
          name: categoryName,
          quantity: 0,
          value: 0,
          count: 0,
        };
      }
      categoryBreakdown[categoryId].quantity += quantity;
      categoryBreakdown[categoryId].value += value;
      categoryBreakdown[categoryId].count++;
    }

    return {
      data: {
        totalSKUs: products.length,
        totalQuantity,
        totalValue: Math.round(totalValue * 100) / 100,
        totalRetailValue: Math.round(totalRetailValue * 100) / 100,
        potentialProfit: Math.round((totalRetailValue - totalValue) * 100) / 100,
        lowStockCount,
        outOfStockCount,
        categoryBreakdown: Object.values(categoryBreakdown).map((cat) => ({
          ...cat,
          value: Math.round(cat.value * 100) / 100,
        })),
      },
    };
  }
}
