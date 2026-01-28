import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsNumber,
  Min,
  IsObject,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class RegisterTokenDto {
  @IsString()
  token: string;
}

export class UnregisterTokenDto {
  @IsString()
  token: string;
}

export interface LowStockProduct {
  id: string;
  name: string;
  quantity: number;
  reorderLevel: number;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, string>;
}

// Notification types
export enum NotificationType {
  LOW_STOCK = 'LOW_STOCK',
  SALE = 'SALE',
  PAYMENT = 'PAYMENT',
  SYSTEM = 'SYSTEM',
}

// Query DTO for fetching notifications
export class NotificationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isRead?: boolean;
}

// DTO for creating a notification
export class CreateNotificationDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  userId?: string;
}

// DTO for marking notifications as read
export class MarkAsReadDto {
  @IsArray()
  @IsString({ each: true })
  notificationIds: string[];
}
