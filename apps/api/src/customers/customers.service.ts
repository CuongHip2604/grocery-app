import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  RecordPaymentDto,
  CustomerQueryDto,
  LedgerQueryDto,
} from './dto/customers.dto';
import { CreditEntryType } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  // ==================== CUSTOMERS ====================

  async createCustomer(dto: CreateCustomerDto) {
    // Check phone uniqueness if provided
    if (dto.phone) {
      const existing = await this.prisma.customer.findFirst({
        where: { phone: dto.phone },
      });
      if (existing) {
        throw new ConflictException('Customer with this phone already exists');
      }
    }

    const customer = await this.prisma.customer.create({
      data: dto,
    });

    return this.transformCustomer(customer, 0);
  }

  async findAllCustomers(query: CustomerQueryDto) {
    const { search, hasBalance, sortBy = 'balance', page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const customers = await this.prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    // Calculate balances for each customer
    const customersWithBalances = await Promise.all(
      customers.map(async (customer) => {
        const balance = await this.getCustomerBalance(customer.id);
        return this.transformCustomer(customer, balance);
      })
    );

    // Filter by balance if requested
    let filteredCustomers = customersWithBalances;
    if (hasBalance === true) {
      filteredCustomers = customersWithBalances.filter((c) => c.balance > 0);
    } else if (hasBalance === false) {
      filteredCustomers = customersWithBalances.filter((c) => c.balance === 0);
    }

    // Sort by balance (highest first) or name
    if (sortBy === 'balance') {
      filteredCustomers.sort((a, b) => b.balance - a.balance);
    } else {
      filteredCustomers.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Apply pagination after sorting
    const total = filteredCustomers.length;
    const paginatedCustomers = filteredCustomers.slice(skip, skip + limit);

    return {
      data: paginatedCustomers,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async findCustomerById(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const balance = await this.getCustomerBalance(id);
    return this.transformCustomer(customer, balance);
  }

  async searchCustomers(search: string) {
    const customers = await this.prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      },
      take: 10,
      orderBy: { name: 'asc' },
    });

    const customersWithBalances = await Promise.all(
      customers.map(async (customer) => {
        const balance = await this.getCustomerBalance(customer.id);
        return this.transformCustomer(customer, balance);
      })
    );

    return { data: customersWithBalances };
  }

  async updateCustomer(id: string, dto: UpdateCustomerDto) {
    const existing = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Customer not found');
    }

    // Check phone uniqueness if being updated
    if (dto.phone && dto.phone !== existing.phone) {
      const phoneExists = await this.prisma.customer.findFirst({
        where: { phone: dto.phone },
      });
      if (phoneExists) {
        throw new ConflictException('Customer with this phone already exists');
      }
    }

    const customer = await this.prisma.customer.update({
      where: { id },
      data: dto,
    });

    const balance = await this.getCustomerBalance(id);
    return this.transformCustomer(customer, balance);
  }

  async deleteCustomer(id: string) {
    const existing = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Customer not found');
    }

    // Check if customer has any sales or credit entries
    const salesCount = await this.prisma.sale.count({
      where: { customerId: id },
    });

    if (salesCount > 0) {
      throw new ConflictException(
        'Cannot delete customer with associated sales'
      );
    }

    await this.prisma.customer.delete({
      where: { id },
    });

    return { message: 'Customer deleted successfully' };
  }

  // ==================== CREDIT LEDGER ====================

  async getCustomerLedger(customerId: string, query: LedgerQueryDto) {
    const { page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const [entries, total] = await Promise.all([
      this.prisma.creditLedger.findMany({
        where: { customerId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sale: {
            select: {
              id: true,
              totalAmount: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.creditLedger.count({ where: { customerId } }),
    ]);

    const balance = await this.getCustomerBalance(customerId);

    return {
      data: {
        customer: this.transformCustomer(customer, balance),
        entries: entries.map((entry) => ({
          id: entry.id,
          type: entry.type,
          amount: Number(entry.amount),
          balance: Number(entry.balance),
          description: entry.description,
          saleId: entry.saleId,
          sale: entry.sale
            ? {
                id: entry.sale.id,
                totalAmount: Number(entry.sale.totalAmount),
                createdAt: entry.sale.createdAt.toISOString(),
              }
            : null,
          createdAt: entry.createdAt.toISOString(),
        })),
      },
      meta: {
        total,
        page,
        limit,
        currentBalance: balance,
      },
    };
  }

  async recordPayment(customerId: string, dto: RecordPaymentDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const currentBalance = await this.getCustomerBalance(customerId);

    if (currentBalance <= 0) {
      throw new BadRequestException('Customer has no outstanding balance');
    }

    if (dto.amount > currentBalance) {
      throw new BadRequestException(
        `Payment amount ($${dto.amount}) exceeds outstanding balance ($${currentBalance})`
      );
    }

    const newBalance = currentBalance - dto.amount;

    const entry = await this.prisma.creditLedger.create({
      data: {
        customerId,
        type: CreditEntryType.PAYMENT,
        amount: dto.amount,
        balance: newBalance,
        description: dto.description || 'Payment received',
      },
    });

    return {
      data: {
        id: entry.id,
        type: entry.type,
        amount: Number(entry.amount),
        previousBalance: currentBalance,
        newBalance: Number(entry.balance),
        description: entry.description,
        createdAt: entry.createdAt.toISOString(),
      },
    };
  }

  // ==================== REPORTS ====================

  async getCustomersWithDebt() {
    const customers = await this.prisma.customer.findMany({
      orderBy: { name: 'asc' },
    });

    const customersWithBalances = await Promise.all(
      customers.map(async (customer) => {
        const balance = await this.getCustomerBalance(customer.id);
        const lastActivity = await this.getLastActivity(customer.id);
        return {
          ...this.transformCustomer(customer, balance),
          lastActivity,
        };
      })
    );

    const debtors = customersWithBalances.filter((c) => c.balance > 0);
    const totalOutstanding = debtors.reduce((sum, c) => sum + c.balance, 0);

    return {
      data: {
        totalOutstanding,
        customerCount: debtors.length,
        customers: debtors.sort((a, b) => b.balance - a.balance),
      },
    };
  }

  // ==================== HELPERS ====================

  private async getCustomerBalance(customerId: string): Promise<number> {
    const lastEntry = await this.prisma.creditLedger.findFirst({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });

    return lastEntry ? Number(lastEntry.balance) : 0;
  }

  private async getLastActivity(customerId: string): Promise<string | null> {
    const lastEntry = await this.prisma.creditLedger.findFirst({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });

    return lastEntry ? lastEntry.createdAt.toISOString() : null;
  }

  private transformCustomer(
    customer: {
      id: string;
      name: string;
      phone: string | null;
      email: string | null;
      address: string | null;
      notes: string | null;
      createdAt: Date;
      updatedAt: Date;
    },
    balance: number
  ) {
    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      notes: customer.notes,
      balance,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
  }
}
