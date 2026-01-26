import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AccountingService } from './accounting.service';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseQueryDto,
  CreateSupplierPaymentDto,
  UpdateSupplierPaymentDto,
  SupplierPaymentQueryDto,
  ReportQueryDto,
} from './dto/accounting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('accounting')
@UseGuards(JwtAuthGuard)
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  // ==================== DASHBOARD ====================

  @Get('dashboard')
  async getDashboardSummary() {
    return this.accountingService.getDashboardSummary();
  }

  // ==================== EXPENSES ====================

  @Post('expenses')
  async createExpense(@Body() dto: CreateExpenseDto) {
    const expense = await this.accountingService.createExpense(dto);
    return { data: expense };
  }

  @Get('expenses')
  async findAllExpenses(@Query() query: ExpenseQueryDto) {
    return this.accountingService.findAllExpenses(query);
  }

  @Get('expenses/categories')
  async getExpenseCategories() {
    return this.accountingService.getExpenseCategories();
  }

  @Get('expenses/:id')
  async findExpenseById(@Param('id', ParseUUIDPipe) id: string) {
    const expense = await this.accountingService.findExpenseById(id);
    return { data: expense };
  }

  @Put('expenses/:id')
  async updateExpense(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseDto
  ) {
    const expense = await this.accountingService.updateExpense(id, dto);
    return { data: expense };
  }

  @Delete('expenses/:id')
  async deleteExpense(@Param('id', ParseUUIDPipe) id: string) {
    return this.accountingService.deleteExpense(id);
  }

  // ==================== SUPPLIER PAYMENTS ====================

  @Post('supplier-payments')
  async createSupplierPayment(@Body() dto: CreateSupplierPaymentDto) {
    const payment = await this.accountingService.createSupplierPayment(dto);
    return { data: payment };
  }

  @Get('supplier-payments')
  async findAllSupplierPayments(@Query() query: SupplierPaymentQueryDto) {
    return this.accountingService.findAllSupplierPayments(query);
  }

  @Get('supplier-payments/:id')
  async findSupplierPaymentById(@Param('id', ParseUUIDPipe) id: string) {
    const payment = await this.accountingService.findSupplierPaymentById(id);
    return { data: payment };
  }

  @Put('supplier-payments/:id')
  async updateSupplierPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierPaymentDto
  ) {
    const payment = await this.accountingService.updateSupplierPayment(id, dto);
    return { data: payment };
  }

  @Post('supplier-payments/:id/mark-paid')
  async markSupplierPaymentPaid(@Param('id', ParseUUIDPipe) id: string) {
    const payment = await this.accountingService.markSupplierPaymentPaid(id);
    return { data: payment };
  }

  @Delete('supplier-payments/:id')
  async deleteSupplierPayment(@Param('id', ParseUUIDPipe) id: string) {
    return this.accountingService.deleteSupplierPayment(id);
  }

  // ==================== REPORTS ====================

  @Get('reports/profit-loss')
  async getProfitLossReport(@Query() query: ReportQueryDto) {
    return this.accountingService.getProfitLossReport(query);
  }

  @Get('reports/sales')
  async getSalesReport(@Query() query: ReportQueryDto) {
    return this.accountingService.getSalesReport(query);
  }

  @Get('reports/receivables')
  async getAccountsReceivable() {
    return this.accountingService.getAccountsReceivable();
  }

  @Get('reports/payables')
  async getAccountsPayable() {
    return this.accountingService.getAccountsPayable();
  }
}
