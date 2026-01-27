import { IsString, IsOptional } from 'class-validator';

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
