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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

interface UploadedFileType {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  ProductQueryDto,
  BulkImportDto,
} from './dto/products.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ==================== PRODUCTS ====================

  @Post()
  async createProduct(@Body() dto: CreateProductDto) {
    const product = await this.productsService.createProduct(dto);
    return { data: product };
  }

  @Post('bulk-import')
  async bulkImportProducts(@Body() dto: BulkImportDto) {
    const result = await this.productsService.bulkImportProducts(dto.products);
    return { data: result };
  }

  @Post('import-excel')
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(@UploadedFile() file: UploadedFileType) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Only Excel files (.xlsx, .xls) are allowed');
    }

    const result = await this.productsService.importFromExcel(file.buffer);
    return { data: result };
  }

  @Get()
  async findAllProducts(@Query() query: ProductQueryDto) {
    return this.productsService.findAllProducts(query);
  }

  @Get('low-stock')
  async getLowStockProducts() {
    return this.productsService.getLowStockProducts();
  }

  @Get('barcode/:barcode')
  async findByBarcode(@Param('barcode') barcode: string) {
    const product = await this.productsService.findProductByBarcode(barcode);
    return { data: product };
  }

  @Get(':id')
  async findProductById(@Param('id', ParseUUIDPipe) id: string) {
    const product = await this.productsService.findProductById(id);
    return { data: product };
  }

  @Put(':id')
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto
  ) {
    const product = await this.productsService.updateProduct(id, dto);
    return { data: product };
  }

  @Delete(':id')
  async deleteProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.deleteProduct(id);
  }
}

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async createCategory(@Body() dto: CreateCategoryDto) {
    const category = await this.productsService.createCategory(dto);
    return { data: category };
  }

  @Get()
  async findAllCategories() {
    return this.productsService.findAllCategories();
  }

  @Get(':id')
  async findCategoryById(@Param('id', ParseUUIDPipe) id: string) {
    const category = await this.productsService.findCategoryById(id);
    return { data: category };
  }

  @Put(':id')
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto
  ) {
    const category = await this.productsService.updateCategory(id, dto);
    return { data: category };
  }

  @Delete(':id')
  async deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.deleteCategory(id);
  }
}
