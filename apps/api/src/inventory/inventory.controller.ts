import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  AdjustInventoryDto,
  RestockDto,
  InventoryQueryDto,
} from './dto/inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async findAll(@Query() query: InventoryQueryDto) {
    return this.inventoryService.findAll(query);
  }

  @Get('summary')
  async getSummary() {
    return this.inventoryService.getSummary();
  }

  @Get('low-stock')
  async getLowStock() {
    return this.inventoryService.getLowStock();
  }

  @Get('product/:productId')
  async getByProductId(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.inventoryService.getByProductId(productId);
  }

  @Put('product/:productId/adjust')
  async adjustInventory(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: AdjustInventoryDto
  ) {
    return this.inventoryService.adjustInventory(productId, dto);
  }

  @Post('product/:productId/restock')
  async restock(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: RestockDto
  ) {
    return this.inventoryService.restock(productId, dto);
  }
}
