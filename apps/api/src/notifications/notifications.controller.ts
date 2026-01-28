import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  Get,
  Put,
  Query,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import {
  RegisterTokenDto,
  UnregisterTokenDto,
  NotificationQueryDto,
  MarkAsReadDto,
} from './dto/notifications.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ============================================
  // Static routes MUST come before parameterized routes
  // ============================================

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  async getUnreadCount(@Request() req: { user: { userId: string } }) {
    return this.notificationsService.getUnreadCount(req.user.userId);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus() {
    return this.notificationsService.getStatus();
  }

  @Put('read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(
    @Body() dto: MarkAsReadDto,
    @Request() req: { user: { userId: string } }
  ) {
    return this.notificationsService.markAsRead(
      dto.notificationIds,
      req.user.userId
    );
  }

  @Put('read-all')
  @UseGuards(JwtAuthGuard)
  async markAllAsRead(@Request() req: { user: { userId: string } }) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard)
  async registerToken(
    @Body() dto: RegisterTokenDto,
    @Request() req: { user: { userId: string } }
  ) {
    return this.notificationsService.registerToken(dto.token, req.user.userId);
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

  @Delete('unregister')
  @UseGuards(JwtAuthGuard)
  async unregisterToken(@Body() dto: UnregisterTokenDto) {
    return this.notificationsService.unregisterToken(dto.token);
  }

  // ============================================
  // Base route (no path)
  // ============================================

  @Get()
  @UseGuards(JwtAuthGuard)
  async getNotifications(
    @Query() query: NotificationQueryDto,
    @Request() req: { user: { userId: string } }
  ) {
    return this.notificationsService.getNotifications(query, req.user.userId);
  }

  // ============================================
  // Parameterized routes MUST come last
  // ============================================

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteNotification(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } }
  ) {
    return this.notificationsService.deleteNotification(id, req.user.userId);
  }
}
