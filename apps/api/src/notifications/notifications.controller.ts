import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
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
}
