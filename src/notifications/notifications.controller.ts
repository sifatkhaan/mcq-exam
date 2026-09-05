import { Controller, Get, Patch, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

type AuthenticatedRequest = Request & {
  user: {
    id: number;
    organization_id: number;
  };
};

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getMyNotifications(@Req() req: AuthenticatedRequest) {
    return this.notificationsService.getMyNotifications(
      req.user.id,
      req.user.organization_id,
    );
  }
  @Get('unread-count')
  getUnreadCount(@Req() req: AuthenticatedRequest) {
    return this.notificationsService.getUnreadCount(
      req.user.id,
      req.user.organization_id,
    );
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id') id: string,

    @Req() req: AuthenticatedRequest,
  ) {
    return this.notificationsService.markAsRead(Number(id), req.user.id);
  }

  @Patch('read-all')
  markAllAsRead(@Req() req: AuthenticatedRequest) {
    return this.notificationsService.markAllAsRead(
      req.user.id,
      req.user.organization_id,
    );
  }
}
