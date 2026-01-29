import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsInt,
  Min,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AdjustInventoryDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  quantity: number; // Positive or negative adjustment, or absolute value

  @IsBoolean()
  @IsOptional()
  isAbsolute?: boolean = false; // true = set to quantity, false = add/subtract

  @IsString()
  @IsOptional()
  reason?: string;
}

export class RestockDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class InventoryQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsMongoId()
  @IsOptional()
  categoryId?: string;

  @Type(() => Boolean)
  @IsOptional()
  lowStockOnly?: boolean;

  @Type(() => Boolean)
  @IsOptional()
  lowStock?: boolean; // Alias for lowStockOnly

  @IsString()
  @IsOptional()
  sortBy?: 'name' | 'quantity' | 'value' = 'name';

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'asc';

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  limit?: number = 50;
}
