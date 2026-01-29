import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto, SalesQueryDto } from './dto/sales.dto';
import { PaymentType, SaleStatus, CreditEntryType, PricingUnit } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { LowStockProduct } from '../notifications/dto/notifications.dto';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  async createSale(dto: CreateSaleDto) {
    const { customerId, paymentType, items, syncId } = dto;

    // Check for duplicate syncId (offline sync)
    if (syncId) {
      const existing = await this.prisma.sale.findFirst({
        where: { syncId },
      });
      if (existing) {
        throw new ConflictException('Sale with this syncId already exists');
      }
    }

    // Validate customer if credit sale
    if (paymentType === PaymentType.CREDIT && !customerId) {
      throw new BadRequestException('Customer is required for credit sales');
    }

    if (customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
      });
      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
    }

    // Validate products and calculate totals
    const productIds = items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { inventory: true },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException('One or more products not found');
    }

    // Check inventory availability
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product?.inventory || product.inventory.quantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product: ${product?.name || item.productId}`
        );
      }
    }

    // Calculate sale items with prices (handles weight-based products)
    const saleItems = items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const unitPrice = Number(product.price);
      let subtotal: number;

      if (product.isWeightBased) {
        // For weight-based products, quantity is in kg
        const quantityInKg = item.quantity;
        switch (product.pricingUnit) {
          case PricingUnit.KG:
            subtotal = unitPrice * quantityInKg;
            break;
          case PricingUnit.G:
            subtotal = unitPrice * (quantityInKg * 1000);
            break;
          case PricingUnit.PER_100G:
            subtotal = unitPrice * (quantityInKg * 10);
            break;
          default:
            subtotal = unitPrice * quantityInKg;
        }
      } else {
        // Regular products: quantity * price
        subtotal = unitPrice * item.quantity;
      }

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        subtotal,
      };
    });

    const totalAmount = saleItems.reduce((sum, item) => sum + item.subtotal, 0);

    // Create sale with transaction
    const sale = await this.prisma.$transaction(async (tx) => {
      // Create the sale
      const newSale = await tx.sale.create({
        data: {
          customerId,
          paymentType,
          totalAmount,
          syncId,
          items: {
            create: saleItems,
          },
        },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Update inventory for each item
      for (const item of items) {
        await tx.inventory.update({
          where: {
            productId: item.productId,
          },
          data: {
            quantity: {
              decrement: item.quantity,
            },
            lastUpdated: new Date(),
          },
        });
      }

      // If credit sale, create credit ledger entry
      if (paymentType === PaymentType.CREDIT && customerId) {
        // Get current balance
        const lastEntry = await tx.creditLedger.findFirst({
          where: { customerId },
          orderBy: { createdAt: 'desc' },
        });

        const currentBalance = lastEntry ? Number(lastEntry.balance) : 0;
        const newBalance = currentBalance + totalAmount;

        await tx.creditLedger.create({
          data: {
            customerId,
            saleId: newSale.id,
            type: CreditEntryType.CHARGE,
            amount: totalAmount,
            balance: newBalance,
            description: `Sale #${newSale.id.slice(0, 8)}`,
          },
        });
      }

      return newSale;
    });

    // Check for low stock products after the sale
    this.checkAndNotifyLowStock(items.map((item) => item.productId)).catch(
      () => {
        // Log but don't fail the operation
      }
    );

    return this.transformSale(sale);
  }

  private async checkAndNotifyLowStock(productIds: string[]) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { inventory: true },
    });

    const lowStockProducts: LowStockProduct[] = products
      .filter((product) => {
        const quantity = product.inventory?.quantity || 0;
        return quantity <= product.reorderLevel;
      })
      .map((product) => ({
        id: product.id,
        name: product.name,
        quantity: product.inventory?.quantity || 0,
        reorderLevel: product.reorderLevel,
      }));

    if (lowStockProducts.length > 0) {
      await this.notificationsService.sendLowStockNotification(lowStockProducts);
    }
  }

  async findAllSales(query: SalesQueryDto) {
    const { startDate, endDate, customerId, paymentType, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      status: SaleStatus.COMPLETED,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, Date>).lte = end;
      }
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (paymentType) {
      where.paymentType = paymentType;
    }

    const [sales, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      data: sales.map((s) => this.transformSale(s)),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async findSaleById(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    return this.transformSale(sale);
  }

  async voidSale(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    if (sale.status === SaleStatus.VOIDED) {
      throw new BadRequestException('Sale is already voided');
    }

    // Void sale with transaction
    const voidedSale = await this.prisma.$transaction(async (tx) => {
      // Update sale status
      const updated = await tx.sale.update({
        where: { id },
        data: { status: SaleStatus.VOIDED },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Restore inventory for each item
      for (const item of sale.items) {
        await tx.inventory.update({
          where: {
            productId: item.productId,
          },
          data: {
            quantity: {
              increment: item.quantity,
            },
            lastUpdated: new Date(),
          },
        });
      }

      // If credit sale, reverse the credit ledger entry
      if (sale.paymentType === PaymentType.CREDIT && sale.customerId) {
        // Get current balance
        const lastEntry = await tx.creditLedger.findFirst({
          where: { customerId: sale.customerId },
          orderBy: { createdAt: 'desc' },
        });

        const currentBalance = lastEntry ? Number(lastEntry.balance) : 0;
        const newBalance = currentBalance - Number(sale.totalAmount);

        await tx.creditLedger.create({
          data: {
            customerId: sale.customerId,
            saleId: sale.id,
            type: CreditEntryType.PAYMENT, // Reversal treated as payment
            amount: Number(sale.totalAmount),
            balance: newBalance,
            description: `Voided sale #${sale.id.slice(0, 8)}`,
          },
        });
      }

      return updated;
    });

    return this.transformSale(voidedSale);
  }

  async getDailySummary(date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await this.prisma.sale.findMany({
      where: {
        status: SaleStatus.COMPLETED,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const totalAmount = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const cashAmount = sales
      .filter((s) => s.paymentType === PaymentType.CASH)
      .reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const creditAmount = sales
      .filter((s) => s.paymentType === PaymentType.CREDIT)
      .reduce((sum, s) => sum + Number(s.totalAmount), 0);

    return {
      data: {
        date: startOfDay.toISOString().split('T')[0],
        totalAmount,
        orderCount: sales.length,
        cashAmount,
        creditAmount,
      },
    };
  }

  async getTodaysSales() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sales = await this.prisma.sale.findMany({
      where: {
        status: SaleStatus.COMPLETED,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: sales.map((s) => this.transformSale(s)),
      meta: { total: sales.length },
    };
  }

  private transformSale(sale: {
    id: string;
    customerId: string | null;
    totalAmount: unknown;
    paymentType: PaymentType;
    status: SaleStatus;
    syncId: string | null;
    createdAt: Date;
    updatedAt: Date;
    customer?: { id: string; name: string; phone: string | null } | null;
    items: Array<{
      id: string;
      saleId: string;
      productId: string;
      quantity: number;
      unitPrice: unknown;
      subtotal: unknown;
      product?: {
        id: string;
        name: string;
        barcode: string;
        isWeightBased?: boolean;
        pricingUnit?: PricingUnit;
      } | null;
    }>;
  }) {
    return {
      id: sale.id,
      customerId: sale.customerId,
      customer: sale.customer
        ? {
            id: sale.customer.id,
            name: sale.customer.name,
            phone: sale.customer.phone,
          }
        : null,
      totalAmount: Number(sale.totalAmount),
      paymentType: sale.paymentType,
      status: sale.status,
      syncId: sale.syncId,
      items: sale.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        product: item.product
          ? {
              id: item.product.id,
              name: item.product.name,
              barcode: item.product.barcode,
              isWeightBased: item.product.isWeightBased ?? false,
              pricingUnit: item.product.pricingUnit ?? PricingUnit.PIECE,
            }
          : null,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
      })),
      createdAt: sale.createdAt.toISOString(),
      updatedAt: sale.updatedAt.toISOString(),
    };
  }
}
