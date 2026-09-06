import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Subject } from './entities/subject.entity';
import { Repository } from 'typeorm';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private readonly repository: Repository<Subject>,
  ) {}

  // async create(dto: CreateSubjectDto, userId: number) {
  //   const subject = this.repository.create({
  //     ...dto,
  //     created_by: userId,
  //     status: 'ACTIVE',
  //   });
  //   return await this.repository.save(subject);
  // }

  async create(
    dto: CreateSubjectDto,
    userId: number,
    userOrganizationId: number | undefined,
    role: string[] = [],
  ) {
    const isSuperAdmin = role.includes('SUPER_ADMIN');
    let organizationId: number;
    if (isSuperAdmin) {
      if (!dto.organization_id) {
        throw new BadRequestException(
          'Organization is required for SUPER_ADMIN',
        );
      }

      organizationId = dto.organization_id;
    } else {
      if (!userOrganizationId) {
        throw new BadRequestException('User organization not found');
      }
      organizationId = userOrganizationId;
    }

    const subject = this.repository.create({
      organization_id: organizationId,
      name: dto.name,
      code: dto.code,
      description: dto.description,
      created_by: userId,
      status: 'ACTIVE',
    });

    return await this.repository.save(subject);
  }
  async findAll(organization_id: number) {
    if (!organization_id) {
      throw new BadRequestException('Organization is required');
    }
    return await this.repository.find({
      where: {
        organization_id,
        is_deleted: false,
      },
      order: {
        created_at: 'DESC',
      },
    });
  }

  async findOne(id: number, organization_id: number) {
    const subject = await this.repository.findOne({
      where: {
        id,
        organization_id,
        is_deleted: false,
      },
    });
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
    return subject;
  }

  async update(
    id: number,
    dto: UpdateSubjectDto,
    userId: number,
    organization_id: number,
  ) {
    await this.repository.update(
      {
        id,
        organization_id,
      },
      {
        ...dto,
        updated_by: userId,
      },
    );
    return this.findOne(id, organization_id);
  }

  async remove(id: number, userId: number, organization_id: number) {
    await this.repository.update(
      {
        id,
        organization_id,
      },
      {
        is_deleted: true,
        deleted_by: userId,
        deleted_at: new Date(),
      },
    );
    return {
      message: 'Subject deleted successfully',
    };
  }
}
