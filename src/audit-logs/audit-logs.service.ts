import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async create(params: {
    organizationId?: number | null;
    userId?: number | null;
    action: string;
    entityType: string;
    entityId?: number | null;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const auditLog = this.auditLogRepository.create({
      organization_id: params.organizationId ?? null,
      user_id: params.userId ?? null,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      old_values:
        params.oldValues !== undefined
          ? JSON.stringify(params.oldValues)
          : null,
      new_values:
        params.newValues !== undefined
          ? JSON.stringify(params.newValues)
          : null,
      ip_address: params.ipAddress ?? null,
      user_agent: params.userAgent ?? null,
    });

    return this.auditLogRepository.save(auditLog);
  }

  async findAll(organizationId: number) {
    return this.auditLogRepository.find({
      where: {
        organization_id: organizationId,
      },

      order: {
        created_at: 'DESC',
      },
    });
  }
}
