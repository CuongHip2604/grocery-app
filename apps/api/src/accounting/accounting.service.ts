import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseQueryDto,
  CreateSupplierPaymentDto,
  UpdateSupplierPaymentDto,
  SupplierPaymentQueryDto,
  ReportQueryDto,
} from './dto/accounting.dto';
import { PaymentStatus, SaleStatus, PaymentType } from '@prisma/client';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  // ==================== EXPENSES ====================

  async createExpense(dto: CreateExpenseDto) {
    const expense = await this.prisma.expense.create({
      data: {
        category: dto.category,
        amount: dto.amount,
        description: dto.description,
        date: new Date(dto.date),
      },
    });

    return this.transformExpense(expense);
  }

  async findAllExpenses(query: ExpenseQueryDto) {
    const { category, startDate, endDate, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (category) {
      where.category = category;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        (where.date as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (where.date as Record<string, Date>).lte = end;
      }
    }

    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.expense.count({ where }),
    ]);

    const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      data: expenses.map((e) => this.transformExpense(e)),
      meta: {
        total,
        page,
        limit,
        totalAmount: Math.round(totalAmount * 100) / 100,
      },
    };
  }

  async findExpenseById(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return this.transformExpense(expense);
  }

  async updateExpense(id: string, dto: UpdateExpenseDto) {
    const existing = await this.prisma.expense.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Expense not found');
    }

    const expense = await this.prisma.expense.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
    });

    return this.transformExpense(expense);
  }

  async deleteExpense(id: string) {
    const existing = await this.prisma.expense.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Expense not found');
    }

    await this.prisma.expense.delete({
      where: { id },
    });

    return { message: 'Expense deleted successfully' };
  }

  async getExpenseCategories() {
    const expenses = await this.prisma.expense.groupBy({
      by: ['category'],
      _sum: { amount: true },
      _count: true,
    });

    return {
      data: expenses.map((e) => ({
        category: e.category,
        totalAmount: Number(e._sum.amount) || 0,
        count: e._count,
      })),
    };
  }

  // ==================== SUPPLIER PAYMENTS ====================

  async createSupplierPayment(dto: CreateSupplierPaymentDto) {
    const payment = await this.prisma.supplierPayment.create({
      data: {
        supplierName: dto.supplierName,
        amount: dto.amount,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        status: PaymentStatus.PENDING,
      },
    });

    return this.transformSupplierPayment(payment);
  }

  async findAllSupplierPayments(query: SupplierPaymentQueryDto) {
    const { supplierName, status, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (supplierName) {
      where.supplierName = { contains: supplierName, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }

    const [payments, total] = await Promise.all([
      this.prisma.supplierPayment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supplierPayment.count({ where }),
    ]);

    const totalPending = payments
      .filter((p) => p.status === PaymentStatus.PENDING)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      data: payments.map((p) => this.transformSupplierPayment(p)),
      meta: {
        total,
        page,
        limit,
        totalPending: Math.round(totalPending * 100) / 100,
      },
    };
  }

  async findSupplierPaymentById(id: string) {
    const payment = await this.prisma.supplierPayment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Supplier payment not found');
    }

    return this.transformSupplierPayment(payment);
  }

  async updateSupplierPayment(id: string, dto: UpdateSupplierPaymentDto) {
    const existing = await this.prisma.supplierPayment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Supplier payment not found');
    }

    const payment = await this.prisma.supplierPayment.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        paidDate: dto.paidDate ? new Date(dto.paidDate) : undefined,
      },
    });

    return this.transformSupplierPayment(payment);
  }

  async markSupplierPaymentPaid(id: string) {
    const existing = await this.prisma.supplierPayment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Supplier payment not found');
    }

    const payment = await this.prisma.supplierPayment.update({
      where: { id },
      data: {
        status: PaymentStatus.PAID,
        paidDate: new Date(),
      },
    });

    return this.transformSupplierPayment(payment);
  }

  async deleteSupplierPayment(id: string) {
    const existing = await this.prisma.supplierPayment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Supplier payment not found');
    }

    await this.prisma.supplierPayment.delete({
      where: { id },
    });

    return { message: 'Supplier payment deleted successfully' };
  }

  // ==================== REPORTS ====================

  async getProfitLossReport(query: ReportQueryDto) {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    endDate.setHours(23, 59, 59, 999);

    // Get completed sales in period
    const sales = await this.prisma.sale.findMany({
      where: {
        status: SaleStatus.COMPLETED,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Calculate revenue and COGS
    let revenue = 0;
    let costOfGoodsSold = 0;

    for (const sale of sales) {
      revenue += Number(sale.totalAmount);
      for (const item of sale.items) {
        costOfGoodsSold += Number(item.product.cost) * item.quantity;
      }
    }

    const grossProfit = revenue - costOfGoodsSold;

    // Get expenses in period
    const expenses = await this.prisma.expense.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // Group expenses by category
    const expensesByCategory: Record<string, number> = {};
    for (const expense of expenses) {
      if (!expensesByCategory[expense.category]) {
        expensesByCategory[expense.category] = 0;
      }
      expensesByCategory[expense.category] += Number(expense.amount);
    }

    const netProfit = grossProfit - totalExpenses;

    return {
      data: {
        period: {
          startDate: query.startDate,
          endDate: query.endDate,
        },
        revenue: Math.round(revenue * 100) / 100,
        costOfGoodsSold: Math.round(costOfGoodsSold * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        grossMargin: revenue > 0 ? Math.round((grossProfit / revenue) * 10000) / 100 : 0,
        expenses: Math.round(totalExpenses * 100) / 100,
        expensesByCategory: Object.entries(expensesByCategory).map(([category, amount]) => ({
          category,
          amount: Math.round(amount * 100) / 100,
        })),
        netProfit: Math.round(netProfit * 100) / 100,
        netMargin: revenue > 0 ? Math.round((netProfit / revenue) * 10000) / 100 : 0,
        salesCount: sales.length,
      },
    };
  }

  async getSalesReport(query: ReportQueryDto) {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    endDate.setHours(23, 59, 59, 999);

    const sales = await this.prisma.sale.findMany({
      where: {
        status: SaleStatus.COMPLETED,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });

    // Calculate totals
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const cashSales = sales.filter((s) => s.paymentType === PaymentType.CASH);
    const creditSales = sales.filter((s) => s.paymentType === PaymentType.CREDIT);

    // Daily breakdown
    const dailySales: Record<string, { date: string; amount: number; count: number; cash: number; credit: number }> = {};

    for (const sale of sales) {
      const dateKey = sale.createdAt.toISOString().split('T')[0];
      if (!dailySales[dateKey]) {
        dailySales[dateKey] = { date: dateKey, amount: 0, count: 0, cash: 0, credit: 0 };
      }
      dailySales[dateKey].amount += Number(sale.totalAmount);
      dailySales[dateKey].count++;
      if (sale.paymentType === PaymentType.CASH) {
        dailySales[dateKey].cash += Number(sale.totalAmount);
      } else {
        dailySales[dateKey].credit += Number(sale.totalAmount);
      }
    }

    // Top selling products
    const productSales: Record<string, { product: { id: string; name: string; barcode: string }; quantity: number; revenue: number }> = {};

    for (const sale of sales) {
      for (const item of sale.items) {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            product: {
              id: item.product.id,
              name: item.product.name,
              barcode: item.product.barcode,
            },
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += Number(item.subtotal);
      }
    }

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      data: {
        period: {
          startDate: query.startDate,
          endDate: query.endDate,
        },
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders: sales.length,
        averageOrderValue: sales.length > 0 ? Math.round((totalRevenue / sales.length) * 100) / 100 : 0,
        cashSales: {
          count: cashSales.length,
          amount: Math.round(cashSales.reduce((sum, s) => sum + Number(s.totalAmount), 0) * 100) / 100,
        },
        creditSales: {
          count: creditSales.length,
          amount: Math.round(creditSales.reduce((sum, s) => sum + Number(s.totalAmount), 0) * 100) / 100,
        },
        dailySummary: Object.values(dailySales)
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((d) => ({
            ...d,
            amount: Math.round(d.amount * 100) / 100,
            cash: Math.round(d.cash * 100) / 100,
            credit: Math.round(d.credit * 100) / 100,
          })),
        topProducts: topProducts.map((p) => ({
          ...p,
          revenue: Math.round(p.revenue * 100) / 100,
        })),
      },
    };
  }

  async getAccountsReceivable() {
    // Get all customers with outstanding balances
    const customers = await this.prisma.customer.findMany();

    const customersWithBalances = await Promise.all(
      customers.map(async (customer) => {
        const lastEntry = await this.prisma.creditLedger.findFirst({
          where: { customerId: customer.id },
          orderBy: { createdAt: 'desc' },
        });

        const balance = lastEntry ? Number(lastEntry.balance) : 0;

        return {
          customer: {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
          },
          balance,
        };
      })
    );

    const debtors = customersWithBalances.filter((c) => c.balance > 0);
    const totalReceivable = debtors.reduce((sum, c) => sum + c.balance, 0);

    return {
      data: {
        totalReceivable: Math.round(totalReceivable * 100) / 100,
        customerCount: debtors.length,
        customers: debtors.sort((a, b) => b.balance - a.balance),
      },
    };
  }

  async getAccountsPayable() {
    const pendingPayments = await this.prisma.supplierPayment.findMany({
      where: {
        status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] },
      },
      orderBy: { dueDate: 'asc' },
    });

    const totalPayable = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Check for overdue payments and update status
    const today = new Date();
    for (const payment of pendingPayments) {
      if (payment.dueDate && payment.dueDate < today && payment.status === PaymentStatus.PENDING) {
        await this.prisma.supplierPayment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.OVERDUE },
        });
        payment.status = PaymentStatus.OVERDUE;
      }
    }

    return {
      data: {
        totalPayable: Math.round(totalPayable * 100) / 100,
        paymentCount: pendingPayments.length,
        payments: pendingPayments.map((p) => this.transformSupplierPayment(p)),
      },
    };
  }

  async getDashboardSummary() {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Today's sales
    const todaysSales = await this.prisma.sale.findMany({
      where: {
        status: SaleStatus.COMPLETED,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const todaysRevenue = todaysSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);

    // Outstanding receivables
    const receivables = await this.getAccountsReceivable();

    // Outstanding payables
    const payables = await this.getAccountsPayable();

    // Low stock count
    const products = await this.prisma.product.findMany({
      include: { inventory: true },
    });
    const lowStockCount = products.filter(
      (p) => (p.inventory?.quantity || 0) <= p.reorderLevel
    ).length;

    return {
      data: {
        today: {
          sales: todaysSales.length,
          revenue: Math.round(todaysRevenue * 100) / 100,
        },
        receivables: {
          total: receivables.data.totalReceivable,
          customerCount: receivables.data.customerCount,
        },
        payables: {
          total: payables.data.totalPayable,
          paymentCount: payables.data.paymentCount,
        },
        inventory: {
          lowStockCount,
        },
      },
    };
  }

  // ==================== HELPERS ====================

  private transformExpense(expense: {
    id: string;
    category: string;
    amount: unknown;
    description: string | null;
    date: Date;
    createdAt: Date;
  }) {
    return {
      id: expense.id,
      category: expense.category,
      amount: Number(expense.amount),
      description: expense.description,
      date: expense.date.toISOString().split('T')[0],
      createdAt: expense.createdAt.toISOString(),
    };
  }

  private transformSupplierPayment(payment: {
    id: string;
    supplierName: string;
    amount: unknown;
    description: string | null;
    dueDate: Date | null;
    paidDate: Date | null;
    status: PaymentStatus;
    createdAt: Date;
  }) {
    return {
      id: payment.id,
      supplierName: payment.supplierName,
      amount: Number(payment.amount),
      description: payment.description,
      dueDate: payment.dueDate?.toISOString().split('T')[0] || null,
      paidDate: payment.paidDate?.toISOString().split('T')[0] || null,
      status: payment.status,
      createdAt: payment.createdAt.toISOString(),
    };
  }
}
