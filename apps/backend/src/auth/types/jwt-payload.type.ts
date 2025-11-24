import type { User, OrgRole } from '@prisma/client';

/**
 * JWT Payload structure extracted from access tokens
 * This represents the user information stored in the JWT
 */
export interface JwtPayload {
  /** User ID */
  sub: string;

  /** User's email */
  email: string;

  /** Organization ID the user belongs to */
  orgId: string;

  /** User's role within the organization */
  role: OrgRole;

  /** Token issued at (Unix timestamp) */
  iat?: number;

  /** Token expires at (Unix timestamp) */
  exp?: number;
}

/**
 * Extended user object available in request after JWT authentication
 * This is what @CurrentUser() decorator returns
 * Includes full user data from database plus orgId and role from JWT
 */
export interface AuthenticatedUser extends User {
  /** Organization ID the user belongs to (from JWT) */
  orgId: string;

  /** User's role within the organization (from JWT) */
  role: OrgRole;
}
