import {
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  ObjectLiteral,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditContextService } from './audit-context.service';
@EventSubscriber()
export class AuditLogSubscriber implements EntitySubscriberInterface<ObjectLiteral> {
  private readonly previousEntities = new WeakMap<
    object,
    Record<string, unknown> | null
  >();
  constructor(private readonly auditContextService: AuditContextService) {}
  listenTo() {
    return Object;
  }
  private getEntityType(
    event:
      | InsertEvent<ObjectLiteral>
      | UpdateEvent<ObjectLiteral>
      | RemoveEvent<ObjectLiteral>,
  ): string {
    return (
      event.metadata.tableName?.toUpperCase() ??
      event.metadata.name?.toUpperCase() ??
      'UNKNOWN'
    );
  }
  private getRecord(entity: unknown): Record<string, unknown> | null {
    if (!entity || typeof entity !== 'object') {
      return null;
    }
    return entity as Record<string, unknown>;
  }
  private parseEntityId(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);

      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private getEntityId(entity: unknown): number | null {
    const record = this.getRecord(entity);
    if (!record) {
      return null;
    }
    const id = this.parseEntityId(record.id);
    if (id !== null) {
      return id;
    }
    const constructorName = (entity as { constructor?: { name?: string } })
      .constructor?.name;

    if (!constructorName) {
      return null;
    }
    return this.parseEntityId(record[`${constructorName}_id`]);
  }

  private getEventEntityId(event: UpdateEvent<ObjectLiteral>): number | null {
    const eventWithId = event as UpdateEvent<ObjectLiteral> & {
      entityId?: unknown;
    };

    const entityId = eventWithId.entityId;
    if (entityId === null || entityId === undefined) {
      return null;
    }

    if (typeof entityId === 'number' || typeof entityId === 'string') {
      return this.parseEntityId(entityId);
    }

    if (typeof entityId === 'object') {
      const values = Object.values(entityId as Record<string, unknown>);
      if (values.length === 1) {
        return this.parseEntityId(values[0]);
      }
      const primaryColumn = event.metadata.primaryColumns?.[0];
      if (primaryColumn) {
        const primaryValue = (entityId as Record<string, unknown>)[
          primaryColumn.propertyName
        ];
        return this.parseEntityId(primaryValue);
      }
    }
    return null;
  }
  private getUpdateEntityId(event: UpdateEvent<ObjectLiteral>): number | null {
    return (
      this.getEventEntityId(event) ??
      this.getEntityId(event.entity) ??
      this.getEntityId(event.databaseEntity)
    );
  }
  private isAuditLog(
    event:
      | InsertEvent<ObjectLiteral>
      | UpdateEvent<ObjectLiteral>
      | RemoveEvent<ObjectLiteral>,
  ): boolean {
    return event.metadata.target === AuditLog;
  }
  private shouldSkipAudit(event?: {
    queryRunner?: { data?: Record<string, unknown> };
  }): boolean {
    return event?.queryRunner?.data?.skipAudit === true;
  }

  private sanitizeRecord(entity: unknown): Record<string, unknown> | null {
    const record = this.getRecord(entity);

    if (!record) {
      return null;
    }
    const sanitized: Record<string, unknown> = {
      ...record,
    };
    const sensitiveFields = [
      'password',
      'password_hash',
      'refresh_token',
      'access_token',
      'token',
      'secret',
    ];

    for (const field of sensitiveFields) {
      delete sanitized[field];
    }
    return sanitized;
  }

  private stringify(entity: unknown): string | null {
    const sanitized = this.sanitizeRecord(entity);

    if (!sanitized) {
      return null;
    }

    try {
      return JSON.stringify(sanitized);
    } catch {
      return null;
    }
  }

  async beforeUpdate(event: UpdateEvent<ObjectLiteral>): Promise<void> {
    if (this.isAuditLog(event) || this.shouldSkipAudit(event)) {
      return;
    }

    if (event.entity && typeof event.entity === 'object') {
      if (event.databaseEntity) {
        this.previousEntities.set(
          event.entity,
          this.sanitizeRecord(event.databaseEntity),
        );

        return;
      }
      const entityId = this.getUpdateEntityId(event);
      if (!entityId) {
        return;
      }

      const primaryColumn = event.metadata.primaryColumns?.[0];
      if (!primaryColumn) {
        return;
      }
      const repository = event.manager.getRepository(event.metadata.target);
      const oldEntity = await repository.findOne({
        where: {
          [primaryColumn.propertyName]: entityId,
        },
      });
      this.previousEntities.set(event.entity, this.sanitizeRecord(oldEntity));
    }
  }

  async afterInsert(event: InsertEvent<ObjectLiteral>): Promise<void> {
    if (this.isAuditLog(event) || this.shouldSkipAudit(event)) {
      return;
    }
    const context = this.auditContextService.get();
    await event.manager.getRepository(AuditLog).insert({
      organization_id: context.organizationId,
      user_id: context.userId,
      action: 'CREATE',
      entity_type: this.getEntityType(event),
      entity_id: this.getEntityId(event.entity),
      old_values: null,
      new_values: this.stringify(event.entity),
      ip_address: context.ipAddress,
      user_agent: context.userAgent,
    });
  }

  async afterUpdate(event: UpdateEvent<ObjectLiteral>): Promise<void> {
    if (this.isAuditLog(event) || this.shouldSkipAudit(event)) {
      return;
    }
    const context = this.auditContextService.get();
    const entityId = this.getUpdateEntityId(event);

    if (!entityId) {
      return;
    }

    let oldEntity: Record<string, unknown> | null = null;
    if (event.entity && typeof event.entity === 'object') {
      oldEntity = this.previousEntities.get(event.entity) ?? null;
    }

    if (!oldEntity && event.databaseEntity) {
      oldEntity = this.sanitizeRecord(event.databaseEntity);
    }

    let newEntity: Record<string, unknown> | null = null;
    const primaryColumn = event.metadata.primaryColumns?.[0];

    if (primaryColumn) {
      const repository = event.manager.getRepository(event.metadata.target);
      const fetchedEntity = await repository.findOne({
        where: {
          [primaryColumn.propertyName]: entityId,
        },
      });

      newEntity = this.sanitizeRecord(fetchedEntity);
    }

    if (!newEntity) {
      newEntity = this.sanitizeRecord(event.entity);
    }
    await event.manager.getRepository(AuditLog).insert({
      organization_id: context.organizationId,
      user_id: context.userId,
      action: 'UPDATE',
      entity_type: this.getEntityType(event),
      entity_id: entityId,
      old_values: oldEntity ? JSON.stringify(oldEntity) : null,
      new_values: newEntity ? JSON.stringify(newEntity) : null,
      ip_address: context.ipAddress,
      user_agent: context.userAgent,
    });

    if (event.entity && typeof event.entity === 'object') {
      this.previousEntities.delete(event.entity);
    }
  }
  async afterRemove(event: RemoveEvent<ObjectLiteral>): Promise<void> {
    if (this.isAuditLog(event) || this.shouldSkipAudit(event)) {
      return;
    }
    const context = this.auditContextService.get();
    const entity = event.databaseEntity ?? event.entity;
    await event.manager.getRepository(AuditLog).insert({
      organization_id: context.organizationId,
      user_id: context.userId,
      action: 'DELETE',
      entity_type: this.getEntityType(event),
      entity_id: this.getEntityId(entity),
      old_values: this.stringify(entity),
      new_values: null,
      ip_address: context.ipAddress,
      user_agent: context.userAgent,
    });
  }
}
