import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Request } from 'express';

import { Observable } from 'rxjs';

import { AuditContextService } from './audit-context.service';

interface AuditRequestUser {
  id?: number | string;
  user_id?: number | string;
  organization_id?: number | string;
}

type AuditRequest = Request & {
  user?: AuditRequestUser;
};

@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  constructor(private readonly auditContextService: AuditContextService) {}

  private parseNumber(value: number | string | undefined): number | null {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsedValue = Number(value);

      return Number.isFinite(parsedValue) ? parsedValue : null;
    }

    return null;
  }

  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuditRequest>();

    const user = request.user;

    const userAgent = request.headers['user-agent'];

    return new Observable((subscriber) => {
      this.auditContextService.run(
        {
          userId: this.parseNumber(user?.id ?? user?.user_id),

          organizationId: this.parseNumber(user?.organization_id),

          ipAddress: request.ip ?? request.socket.remoteAddress ?? null,

          userAgent: typeof userAgent === 'string' ? userAgent : null,
        },

        () => {
          const subscription = next.handle().subscribe({
            next: (value) => subscriber.next(value),

            error: (error) => subscriber.error(error),

            complete: () => subscriber.complete(),
          });

          return subscription;
        },
      );
    });
  }
}
