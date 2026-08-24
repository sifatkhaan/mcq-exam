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
import { OrganizationsService } from 'src/organizations/organizations.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly rolesService: RolesService,
    private readonly userRoleService: UserRoleService,
    private readonly organizationService: OrganizationsService,
  ) {}
  async register(dto: RegisterDto) {
    const existingUser = await this.userService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.userService.create({
      username: dto.name,
      email: dto.email,
      phone: dto.phone,
      password_hash: hashedPassword,
      status: 'ACTIVE',
    });
    const role = await this.rolesService.findByCode('ADMIN');
    if (!role) {
      throw new NotFoundException('Default user role not found');
    }

    await this.userRoleService.assignRole(user.id, role.id);

    return {
      message: 'User Registered Successfully',
      user: {
        id: user.id,
        name: user.username,
        email: user.email,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
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
      },
    };
  }
}
