import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrgRole } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check for required roles on both handler and class level
    const requiredRoles = this.reflector.getAllAndOverride<OrgRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are specified, allow access for any authenticated user
    // NOTE: This assumes JwtAuthGuard is applied before RolesGuard
    // For sensitive operations, always explicitly specify required roles
    if (!requiredRoles) {
      const handler = context.getHandler().name;
      const controller = context.getClass().name;
      this.logger.warn(
        `No roles specified for ${controller}.${handler} - accessible to all authenticated users. ` +
        `Consider adding @Roles() decorator for better security.`
      );
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Ensure user exists and has a role
    if (!user || !user.role) {
      throw new ForbiddenException('User role information is missing');
    }

    // Check if user's role is in the list of required roles
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      this.logger.warn(
        `Access denied for user ${user.id} with role ${user.role}. ` +
        `Required roles: ${requiredRoles.join(', ')}`
      );
      throw new ForbiddenException(
        `Insufficient permissions. Required role: ${requiredRoles.join(' or ')}`
      );
    }

    return true;
  }
}

export const ROLES_KEY = 'roles';
