import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CreateMemberDto } from './dto/create-member.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';

type AuthenticatedRequest = Request & {
  user: {
    id: number;
    role: string;
    organization_id: number;
  };
};

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @Roles('SUPER_ADMIN')
  async create(
    @Body() dto: CreateOrganizationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return await this.organizationsService.create(dto, req.user.id);
  }

  @Get()
  @Roles('SUPER_ADMIN')
  async findAll() {
    return await this.organizationsService.findAll();
  }

  @Get(':id')
  @Roles('SUPER_ADMIN')
  async findOne(@Param('id') id: string) {
    return await this.organizationsService.findOne(Number(id));
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return await this.organizationsService.update(Number(id), dto, req.user.id);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return await this.organizationsService.remove(Number(id), req.user.id);
  }

  @Post(':id/admins')
  @Roles('SUPER_ADMIN')
  async createAdmin(
    @Param('id') id: string,
    @Body() dto: CreateAdminDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return await this.organizationsService.createAdmin(
      Number(id),
      dto,
      req.user.id,
    );
  }

  @Get(':organizationId/members')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getMembers(
    @Param('organizationId') organizationId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return await this.organizationsService.getMembersForUser(
      Number(organizationId),
      req.user,
    );
  }

  @Post(':organizationId/members')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async addMember(
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateMemberDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return await this.organizationsService.addMemberForUser(
      Number(organizationId),
      dto,
      req.user,
    );
  }

  @Delete(':organizationId/members/:memberId')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async removeMember(
    @Param('organizationId') organizationId: string,
    @Param('memberId') memberId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return await this.organizationsService.removeMemberForUser(
      Number(organizationId),
      Number(memberId),
      req.user,
    );
  }

  @Get(':organizationId/students')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getStudents(
    @Param('organizationId') organizationId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return await this.organizationsService.getStudentsForUser(
      Number(organizationId),
      req.user,
    );
  }
}
