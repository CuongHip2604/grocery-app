import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsMongoId,
  Min,
  IsInt,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PricingUnit } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cost: number;

  @IsMongoId()
  @IsOptional()
  categoryId?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  reorderLevel?: number;

  @IsBoolean()
  @IsOptional()
  isCustomLabel?: boolean;

  @IsBoolean()
  @IsOptional()
  isWeightBased?: boolean;

  @IsEnum(PricingUnit)
  @IsOptional()
  pricingUnit?: PricingUnit;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsOptional()
  @Min(0)
  initialStock?: number;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  price?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  cost?: number;

  @IsMongoId()
  @IsOptional()
  categoryId?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  reorderLevel?: number;

  @IsBoolean()
  @IsOptional()
  isCustomLabel?: boolean;

  @IsBoolean()
  @IsOptional()
  isWeightBased?: boolean;

  @IsEnum(PricingUnit)
  @IsOptional()
  pricingUnit?: PricingUnit;
}

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class BulkCreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  barcode: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cost: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  reorderLevel?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  initialStock?: number;
}

export class BulkImportDto {
  products: BulkCreateProductDto[];
}

export class BulkCreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class BulkImportCategoryDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkCreateCategoryDto)
  categories: BulkCreateCategoryDto[];
}

export class ProductQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsMongoId()
  @IsOptional()
  categoryId?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  lowStock?: boolean;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  limit?: number = 20;
}
