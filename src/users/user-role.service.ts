import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from './user-role.entity';
import { Role } from '../roles/role.entity';
import { OrganizationMember } from '../organizations/entities/organization-member.entity';

@Injectable()
export class UserRoleService {
  constructor(
    @InjectRepository(UserRole)
    private readonly repository: Repository<UserRole>,
  ) {}

  async assignRole(user_id: number, role_id: number) {
    const userRole = this.repository.create({
      user_id,
      role_id,
    });

    return await this.repository.save(userRole);
  }

  async findUserRoles(user_id: number) {
    return await this.repository.find({
      where: {
        user_id,
      },
    });
  }

  async getUserRole(user_id: number, organization_id?: number) {
    if (organization_id === undefined) {
      const result = await this.repository.findOne({
        where: {
          user_id,
        },
        relations: ['role'],
      });

      return result?.role;
    }

    const result = await this.repository
      .createQueryBuilder('ur')
      .innerJoin(
        OrganizationMember,
        'om',
        'om.user_id = ur.user_id AND om.role_id = ur.role_id',
      )
      .innerJoin(Role, 'r', 'r.id = ur.role_id')
      .where('ur.user_id = :userId', {
        userId: user_id,
      })
      .andWhere('om.organization_id = :organizationId', {
        organizationId: organization_id,
      })
      .andWhere('om.status = :memberStatus', {
        memberStatus: 'ACTIVE',
      })
      .andWhere('r.name != :superAdminRole', {
        superAdminRole: 'SUPER_ADMIN',
      })
      .select(['r.id AS id', 'r.name AS name'])
      .getRawOne<{ id: number; name: string }>();

    return result ?? null;
  }
}
