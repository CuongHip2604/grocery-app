import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsMongoId,
  IsArray,
  ValidateNested,
  IsEnum,
  Min,
  IsInt,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentType } from '@prisma/client';

export class CreateSaleItemDto {
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateSaleDto {
  @IsMongoId()
  @IsOptional()
  customerId?: string;

  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];

  @IsString()
  @IsOptional()
  syncId?: string; // For offline sync
}

export class SalesQueryDto {
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsMongoId()
  @IsOptional()
  customerId?: string;

  @IsEnum(PaymentType)
  @IsOptional()
  paymentType?: PaymentType;

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

export class DailySummaryQueryDto {
  @IsDateString()
  @IsOptional()
  date?: string; // Defaults to today
}
