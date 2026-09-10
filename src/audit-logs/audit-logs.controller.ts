import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { AuditLogsService } from './audit-logs.service';
import { PaginationDto } from 'common/pagination/pagination.dto';

type AuthenticatedRequest = Request & {
  user: {
    id: number;
    organization_id: number;
  };
};

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}
  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query() pagination: PaginationDto,
  ) {
    return this.auditLogsService.findAll(req.user.organization_id, pagination);
  }
}
