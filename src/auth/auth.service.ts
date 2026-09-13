import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { RolesService } from '../roles/roles.service';
import { UserRoleService } from '../users/user-role.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { OrganizationsService } from '../organizations/organizations.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly rolesService: RolesService,
    private readonly userRoleService: UserRoleService,
    private readonly organizationService: OrganizationsService,
  ) {}

  async register(dto: RegisterDto, organizationCode: string) {
    const organization =
      await this.organizationService.findByCode(organizationCode);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const existingUser = await this.userService.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const studentRole = await this.rolesService.findByCode('STUDENT');

    if (!studentRole) {
      throw new NotFoundException('Student role not found');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.userService.create({
      username: dto.name,
      email: dto.email,
      phone: dto.phone ?? null,
      password_hash: hashedPassword,
      status: 'ACTIVE',
    });

    await this.userRoleService.assignRole(user.id, studentRole.id);

    await this.organizationService.addMember(
      {
        organization_id: organization.id,
        user_id: user.id,
        role_id: studentRole.id,
      },
      user.id,
    );

    return {
      message: 'User Registered Successfully',
      user: {
        id: user.id,
        name: user.username,
        email: user.email,
        organization_id: organization.id,
        role: studentRole.name,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userRole = await this.userRoleService.getUserRole(user.id);

    const organizationMember =
      await this.organizationService.getUserOrganization(user.id);

    const payload = {
      sub: user.id,
      email: user.email,
      role: userRole?.name,
      organization_id: organizationMember?.organization_id,
    };

    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      user: {
        id: user.id,
        name: user.username,
        email: user.email,
        role: userRole?.name,
        organization_id: organizationMember?.organization_id,
      },
    };
  }

  async loginByOrganization(
    email: string,
    password: string,
    organizationCode: string,
  ) {
    const organization =
      await this.organizationService.findByCode(organizationCode);

    if (!organization) {
      throw new UnauthorizedException('Invalid organization');
    }

    const user = await this.userService.findByEmail(email);

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const organizationMember =
      await this.organizationService.getUserOrganization(
        user.id,
        organization.id,
      );

    if (!organizationMember) {
      throw new UnauthorizedException(
        'User does not belong to this organization',
      );
    }

    const userRole = await this.userRoleService.getUserRole(
      user.id,
      organization.id,
    );

    if (!userRole) {
      throw new UnauthorizedException(
        'User role not found for this organization',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: userRole.name,
      organization_id: organization.id,
    };

    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      user: {
        id: user.id,
        name: user.username,
        email: user.email,
        role: userRole.name,
        organization_id: organization.id,
      },
    };
  }
}
