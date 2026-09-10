import { Global, Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { AuditLog } from './entities/audit-log.entity';
import { AuditContextService } from './audit-context.service';
import { AuditContextInterceptor } from './audit-context.interceptor';
import { AuditLogSubscriber } from './audit-logs.subscriber';
import { DataSource } from 'typeorm';
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditLogsController],
  providers: [
    AuditLogsService,
    AuditContextService,
    AuditContextInterceptor,
    AuditLogSubscriber,
  ],
  exports: [AuditLogsService, AuditContextService, AuditContextInterceptor],
})
export class AuditLogsModule implements OnModuleInit {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogSubscriber: AuditLogSubscriber,
  ) {}

  onModuleInit() {
    if (!this.dataSource.subscribers.includes(this.auditLogSubscriber)) {
      this.dataSource.subscribers.push(this.auditLogSubscriber);
    }
  }
}
