import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Organization } from './entities/organizations.entity';
import { Repository } from 'typeorm';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationMember } from './entities/organization-member.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { UserRoleService } from '../users/user-role.service';
import * as bcrypt from 'bcrypt';

type StudentRow = {
  id: number;
  username: string;
  email: string;
  phone: string;
};
type OrganizationUser = {
  id: number;
  organization_id: number;
  role: string;
};

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly repository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private readonly memberRepository: Repository<OrganizationMember>,
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly userRoleService: UserRoleService,
  ) {}

  async create(dto: CreateOrganizationDto, userId: number) {
    const existingOrganization = await this.repository.findOne({
      where: {
        code: dto.code,
      },
    });

    if (existingOrganization) {
      throw new ConflictException('Organization code already exists');
    }
    const organization = this.repository.create({
      ...dto,
      created_by: userId,
      status: 'ACTIVE',
      is_deleted: false,
    });
    return await this.repository.save(organization);
  }

  async findAll() {
    return await this.repository.find({
      where: {
        is_deleted: false,
      },
      order: {
        created_at: 'DESC',
      },
    });
  }

  async findOne(id: number) {
    return await this.repository.findOne({
      where: {
        id,
        is_deleted: false,
      },
    });
  }

  async findByCode(code: string) {
    return await this.repository.findOne({
      where: {
        code,
        status: 'ACTIVE',
        is_deleted: false,
      },
    });
  }

  async update(id: number, dto: UpdateOrganizationDto, userId: number) {
    const organization = await this.findOne(id);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (dto.code && dto.code !== organization.code) {
      const existingOrganization = await this.repository.findOne({
        where: {
          code: dto.code,
        },
      });

      if (existingOrganization) {
        throw new ConflictException('Organization code already exists');
      }
    }

    await this.repository.update(id, {
      ...dto,
      updated_by: userId,
    });

    return this.findOne(id);
  }

  async remove(id: number, userId: number) {
    const organization = await this.findOne(id);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    await this.repository.update(id, {
      is_deleted: true,
      status: 'INACTIVE',
      deleted_by: userId,
      deleted_at: new Date(),
    });

    return {
      message: 'Organization Deleted Successfully',
    };
  }

  async addMember(dto: CreateMemberDto, createBy: number) {
    const member = this.memberRepository.create({
      organization_id: dto.organization_id,
      user_id: dto.user_id,
      role_id: dto.role_id,
      status: 'ACTIVE',
      created_by: createBy,
    });

    return await this.memberRepository.save(member);
  }

  async createAdmin(
    organizationId: number,
    dto: CreateAdminDto,
    createdBy: number,
  ) {
    const organization = await this.findOne(organizationId);
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    const adminRole = await this.rolesService.findByCode('ADMIN');
    if (!adminRole) {
      throw new NotFoundException('Admin role not found');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      username: dto.name,
      email: dto.email,
      phone: dto.phone ?? null,
      password_hash: hashedPassword,
      status: 'ACTIVE',
    });

    await this.userRoleService.assignRole(user.id, adminRole.id);
    await this.addMember(
      {
        organization_id: organization.id,
        user_id: user.id,
        role_id: adminRole.id,
      },
      createdBy,
    );

    return {
      message: 'Admin created successfully',
      user: {
        id: user.id,
        name: user.username,
        email: user.email,
        phone: user.phone,
        role: adminRole.name,
        organization_id: organization.id,
      },
    };
  }

  async getMembers(organization_id: number) {
    return await this.memberRepository.find({
      where: {
        organization_id,
        status: 'ACTIVE',
      },
    });
  }

  async getStudents(organization_id: number) {
    return await this.memberRepository
      .createQueryBuilder('om')
      .innerJoin(User, 'u', 'u.id = om.user_id')
      .where('om.organization_id = :organization_id', {
        organization_id,
      })
      .andWhere('om.status = :memberStatus', {
        memberStatus: 'ACTIVE',
      })
      .andWhere('om.role_id = :roleId', {
        roleId: 5,
      })
      .andWhere('u.status = :userStatus', {
        userStatus: 'ACTIVE',
      })
      .select([
        'u.id AS id',
        'u.username AS name',
        'u.email AS email',
        'u.phone AS phone',
      ])
      .getRawMany<StudentRow>();
  }

  async removeMember(id: number) {
    await this.memberRepository.update(id, {
      status: 'INACTIVE',
    });
    return {
      message: 'Member Removed Successfully',
    };
  }

  async getUserOrganization(user_id: number, organization_id?: number) {
    const where: any = {
      user_id,
      status: 'ACTIVE',
    };
    if (organization_id !== undefined) {
      where.organization_id = organization_id;
    }
    return await this.memberRepository.findOne({
      where,
    });
  }

  async getMembersForUser(organizationId: number, user: OrganizationUser) {
    if (
      user.role !== 'SUPER_ADMIN' &&
      user.organization_id !== organizationId
    ) {
      throw new ForbiddenException('You cannot access another organization');
    }
    return await this.getMembers(organizationId);
  }

  async getMyMembers(user: OrganizationUser) {
    if (!user.organization_id) {
      throw new ForbiddenException('User is not assigned to an organization');
    }
    return await this.getMembers(user.organization_id);
  }

  async getStudentsForUser(organizationId: number, user: OrganizationUser) {
    if (
      user.role !== 'SUPER_ADMIN' &&
      user.organization_id !== organizationId
    ) {
      throw new ForbiddenException('You cannot access another organization');
    }

    return await this.getStudents(organizationId);
  }

  async getMyStudents(user: OrganizationUser) {
    if (!user.organization_id) {
      throw new ForbiddenException('User is not assigned to an organization');
    }

    return await this.getStudents(user.organization_id);
  }

  async addMemberForUser(
    organizationId: number,
    dto: CreateMemberDto,
    user: OrganizationUser,
  ) {
    if (
      user.role !== 'SUPER_ADMIN' &&
      user.organization_id !== organizationId
    ) {
      throw new ForbiddenException('You cannot manage another organization');
    }

    const studentRole = await this.rolesService.findByCode('STUDENT');

    if (!studentRole) {
      throw new NotFoundException('Student role not found');
    }

    if (user.role === 'ADMIN' && dto.role_id !== studentRole.id) {
      throw new ForbiddenException('Admins can only manage students');
    }

    if (dto.organization_id !== organizationId) {
      throw new ForbiddenException('Invalid organization');
    }
    const organization = await this.findOne(organizationId);
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    const existingMember = await this.memberRepository.findOne({
      where: {
        organization_id: organizationId,
        user_id: dto.user_id,
        status: 'ACTIVE',
      },
    });

    if (existingMember) {
      throw new ConflictException(
        'User is already a member of this organization',
      );
    }
    return await this.addMember(dto, user.id);
  }

  async addMyStudent(dto: CreateMemberDto, user: OrganizationUser) {
    if (!user.organization_id) {
      throw new ForbiddenException('User is not assigned to an organization');
    }
    const studentRole = await this.rolesService.findByCode('STUDENT');
    if (!studentRole) {
      throw new NotFoundException('Student role not found');
    }

    return await this.addMemberForUser(
      user.organization_id,
      {
        ...dto,
        organization_id: user.organization_id,
        role_id: studentRole.id,
      },
      user,
    );
  }

  async removeMemberForUser(
    organizationId: number,
    memberId: number,
    user: OrganizationUser,
  ) {
    if (
      user.role !== 'SUPER_ADMIN' &&
      user.organization_id !== organizationId
    ) {
      throw new ForbiddenException('You cannot manage another organization');
    }

    const member = await this.memberRepository.findOne({
      where: {
        id: memberId,
        organization_id: organizationId,
        status: 'ACTIVE',
      },
    });

    if (!member) {
      throw new NotFoundException('Organization member not found');
    }

    if (user.role === 'ADMIN') {
      const studentRole = await this.rolesService.findByCode('STUDENT');
      if (!studentRole || member.role_id !== studentRole.id) {
        throw new ForbiddenException('Admins can only manage students');
      }
    }
    return await this.removeMember(memberId);
  }
  async removeMyMember(memberId: number, user: OrganizationUser) {
    if (!user.organization_id) {
      throw new ForbiddenException('User is not assigned to an organization');
    }

    return await this.removeMemberForUser(user.organization_id, memberId, user);
  }
}
