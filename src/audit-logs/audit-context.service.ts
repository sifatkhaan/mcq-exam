import { Injectable } from '@nestjs/common';

import { AsyncLocalStorage } from 'async_hooks';

export interface AuditContext {
  userId: number | null;

  organizationId: number | null;

  ipAddress: string | null;

  userAgent: string | null;

  skipAudit?: boolean;
}

@Injectable()
export class AuditContextService {
  private readonly storage = new AsyncLocalStorage<AuditContext>();

  run<T>(context: AuditContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  get(): AuditContext {
    return (
      this.storage.getStore() ?? {
        userId: null,
        organizationId: null,
        ipAddress: null,
        userAgent: null,
        skipAudit: false,
      }
    );
  }

  runWithoutAudit<T>(callback: () => T): T {
    const current = this.get();

    return this.storage.run(
      {
        ...current,
        skipAudit: true,
      },
      callback,
    );
  }
}
