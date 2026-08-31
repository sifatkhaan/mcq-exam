import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

type AuthenticatedUser = {
  id: number;
  email: string;
  role?: string;
};
type RequestWithUser = Request & {
  user?: AuthenticatedUser;
};
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const role = request.user?.role;

    if (typeof role !== 'string') {
      return false;
    }

    return requiredRoles.includes(role);
  }
}
