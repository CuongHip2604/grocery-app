import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ParseObjectIdPipe } from '../common/pipes/parse-objectid.pipe';
import { SalesService } from './sales.service';
import { CreateSaleDto, SalesQueryDto, DailySummaryQueryDto } from './dto/sales.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  async createSale(@Body() dto: CreateSaleDto) {
    const sale = await this.salesService.createSale(dto);
    return { data: sale };
  }

  @Get()
  async findAllSales(@Query() query: SalesQueryDto) {
    return this.salesService.findAllSales(query);
  }

  @Get('today')
  async getTodaysSales() {
    return this.salesService.getTodaysSales();
  }

  @Get('summary')
  async getDailySummary(@Query() query: DailySummaryQueryDto) {
    return this.salesService.getDailySummary(query.date);
  }

  @Get(':id')
  async findSaleById(@Param('id', ParseObjectIdPipe) id: string) {
    const sale = await this.salesService.findSaleById(id);
    return { data: sale };
  }

  @Post(':id/void')
  async voidSale(@Param('id', ParseObjectIdPipe) id: string) {
    const sale = await this.salesService.voidSale(id);
    return { data: sale };
  }
}
