import type { Request, Response, NextFunction } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../lib/firebase-admin.ts';
import { verifyAdminSessionToken } from '../lib/admin-auth.ts';
import { type AdminPermission, hasPermission } from '../lib/permissions.ts';
import { getOrCreateUser, getUserByUid } from '../db/users.ts';

export interface DbUser {
  id: number;
  uid: string;
  email: string;
  displayName: string | null;
  role: string;
  permissions: string[];
  isActive: boolean;
  isOwner: boolean;
}

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: DbUser;
}

async function resolveAuthenticatedUser(token: string): Promise<{
  firebaseUser?: DecodedIdToken;
  dbUser: DbUser;
} | null> {
  if (token.startsWith('agro.')) {
    const verified = verifyAdminSessionToken(token);
    if (!verified) return null;

    const dbUser = await getUserByUid(verified.uid);
    if (!dbUser || dbUser.role !== 'admin' || !dbUser.isActive) return null;

    return { dbUser };
  }

  const decodedToken = await adminAuth.verifyIdToken(token);
  const email = decodedToken.email || `${decodedToken.uid}@firebase.local`;
  const dbUser = await getOrCreateUser(decodedToken.uid, email, decodedToken.name);

  return { firebaseUser: decodedToken, dbUser };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const resolved = await resolveAuthenticatedUser(token);
    if (!resolved) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    if (!resolved.dbUser.isActive) {
      return res.status(403).json({ error: 'Esta cuenta de administrador está desactivada.' });
    }

    req.user = resolved.firebaseUser;
    req.dbUser = resolved.dbUser;
    next();
  } catch (error) {
    console.error('Error verifying authentication token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const resolved = await resolveAuthenticatedUser(token);
    if (resolved && resolved.dbUser.isActive) {
      req.user = resolved.firebaseUser;
      req.dbUser = resolved.dbUser;
    }
  } catch {
    // Proceed unauthenticated if optional token is invalid or expired
  }
  next();
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.dbUser || req.dbUser.role !== 'admin' || !req.dbUser.isActive) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

export const requirePermission = (permission: AdminPermission) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!hasPermission(req.dbUser, permission)) {
      return res.status(403).json({
        error: 'No tienes permiso para realizar esta acción.',
      });
    }
    next();
  };
};
