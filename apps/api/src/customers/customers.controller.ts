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
import { CustomersService } from './customers.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  RecordPaymentDto,
  CustomerQueryDto,
  LedgerQueryDto,
} from './dto/customers.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  async createCustomer(@Body() dto: CreateCustomerDto) {
    const customer = await this.customersService.createCustomer(dto);
    return { data: customer };
  }

  @Get()
  async findAllCustomers(@Query() query: CustomerQueryDto) {
    return this.customersService.findAllCustomers(query);
  }

  @Get('search')
  async searchCustomers(@Query('q') search: string) {
    return this.customersService.searchCustomers(search || '');
  }

  @Get('debtors')
  async getCustomersWithDebt() {
    return this.customersService.getCustomersWithDebt();
  }

  @Get(':id')
  async findCustomerById(@Param('id', ParseUUIDPipe) id: string) {
    const customer = await this.customersService.findCustomerById(id);
    return { data: customer };
  }

  @Put(':id')
  async updateCustomer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto
  ) {
    const customer = await this.customersService.updateCustomer(id, dto);
    return { data: customer };
  }

  @Delete(':id')
  async deleteCustomer(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.deleteCustomer(id);
  }

  // ==================== CREDIT LEDGER ====================

  @Get(':id/ledger')
  async getCustomerLedger(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: LedgerQueryDto
  ) {
    return this.customersService.getCustomerLedger(id, query);
  }

  @Post(':id/payments')
  async recordPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordPaymentDto
  ) {
    return this.customersService.recordPayment(id, dto);
  }
}
