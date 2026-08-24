import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Organization } from './entities/organizations.entity';
import { Repository } from 'typeorm';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly repository: Repository<Organization>,
  ) {}

  async create(dto: CreateOrganizationDto, userId: number) {
    const organization = this.repository.create({
      ...dto,
      created_by: userId,
      status: 'ACTIVE',
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
      where: { id, is_deleted: false },
    });
  }

  async update(id: number, dto: UpdateOrganizationDto, userId: number) {
    await this.repository.update(id, {
      ...dto,
      updated_by: userId,
    });
    return this.findOne(id);
  }

  async remove(id: number, userId: number) {
    await this.repository.update(id, {
      is_deleted: true,
      deleted_by: userId,
      deleted_at: new Date(),
    });

    return {
      message: 'Organization Deleted Successfully',
    };
  }
}
