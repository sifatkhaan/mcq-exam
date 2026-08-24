import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Organization } from './entities/organizations.entity';
import { Repository } from 'typeorm';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationMember } from './entities/organization-member.entity';
import { CreateMemberDto } from './dto/create-member.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly repository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private readonly memberRepository: Repository<OrganizationMember>,
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

  async getMembers(organization_id: number) {
    return await this.memberRepository.find({
      where: {
        organization_id,
        status: 'ACTIVE',
      },
    });
  }

  async removeMember(id: number) {
    await this.memberRepository.update(id, {
      status: 'INACTIVE',
    });

    return {
      message: 'Member Removed Successfully',
    };
  }

  async getUserOrganization(user_id: number) {
    return await this.memberRepository.findOne({
      where: {
        user_id,
        status: 'ACTIVE',
      },
    });
  }
}
