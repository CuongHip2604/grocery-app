import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { RegisterTokenDto, UnregisterTokenDto } from './dto/notifications.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard)
  async registerToken(
    @Body() dto: RegisterTokenDto,
    @Request() req: { user: { userId: string } }
  ) {
    return this.notificationsService.registerToken(dto.token, req.user.userId);
  }

  @Delete('unregister')
  @UseGuards(JwtAuthGuard)
  async unregisterToken(@Body() dto: UnregisterTokenDto) {
    return this.notificationsService.unregisterToken(dto.token);
  }

  @Post('test')
  @UseGuards(JwtAuthGuard)
  async sendTestNotification() {
    return this.notificationsService.sendNotification({
      title: 'Test thông báo',
      body: 'Đây là thông báo test từ hệ thống',
      icon: '/icon-192.png',
      data: { url: '/inventory' },
    });
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus() {
    return this.notificationsService.getStatus();
  }
}
