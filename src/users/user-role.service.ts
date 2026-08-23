import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserRole } from './user-role.entity';

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
}
