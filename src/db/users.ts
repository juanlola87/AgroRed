import { asc, eq, sql } from 'drizzle-orm';
import { db } from './index.ts';
import { adminCredentials, users } from './schema.ts';
import { ALL_PERMISSIONS, type AdminPermission } from '../lib/permissions.ts';

export function getConfiguredAdminEmail(): string {
  return (process.env.ADMIN_EMAIL || 'juanpablo020787@gmail.com').trim().toLowerCase();
}

function isInitialAdminEmail(email: string): boolean {
  return email.trim().toLowerCase() === getConfiguredAdminEmail();
}

export async function getOrCreateUser(uid: string, email: string, displayName?: string | null) {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const isOwnerAdmin = isInitialAdminEmail(normalizedEmail);

    // 1. Check if this UID already exists
    const existingByUid = await db
      .select()
      .from(users)
      .where(eq(users.uid, uid))
      .limit(1);

    if (existingByUid.length > 0) {
      const current = existingByUid[0];
      const result = await db
        .update(users)
        .set({
          email: normalizedEmail,
          displayName: displayName ?? current.displayName,
          updatedAt: new Date(),
          ...(isOwnerAdmin
            ? {
                role: 'admin',
                isOwner: true,
                isActive: true,
                permissions: ALL_PERMISSIONS,
              }
            : {}),
        })
        .where(eq(users.id, current.id))
        .returning();
      return result[0];
    }

    // 2. Check if an admin account was pre-created for this email (e.g. via Team Management before Google login)
    const existingByEmail = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = ${normalizedEmail}`)
      .limit(1);

    if (existingByEmail.length > 0) {
      const current = existingByEmail[0];
      const nextUid = current.uid.startsWith('admin:') && !uid.startsWith('admin:') ? uid : current.uid;
      const result = await db
        .update(users)
        .set({
          uid: nextUid,
          email: normalizedEmail,
          displayName: displayName ?? current.displayName,
          updatedAt: new Date(),
          ...(isOwnerAdmin
            ? {
                role: 'admin',
                isOwner: true,
                isActive: true,
                permissions: ALL_PERMISSIONS,
              }
            : {}),
        })
        .where(eq(users.id, current.id))
        .returning();
      return result[0];
    }

    // 3. Insert new user
    const result = await db
      .insert(users)
      .values({
        uid,
        email: normalizedEmail,
        displayName: displayName ?? null,
        role: isOwnerAdmin ? 'admin' : 'customer',
        isOwner: isOwnerAdmin,
        isActive: true,
        permissions: isOwnerAdmin ? ALL_PERMISSIONS : [],
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: normalizedEmail,
          displayName: displayName ?? null,
          updatedAt: new Date(),
          ...(isOwnerAdmin
            ? {
                role: 'admin',
                isOwner: true,
                isActive: true,
                permissions: ALL_PERMISSIONS,
              }
            : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Failed to synchronize user account.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return result[0] ?? null;
  } catch (error) {
    console.error('Database query failed in getUserByUid:', error);
    throw new Error('Failed to fetch user account.', { cause: error });
  }
}

export async function getUserByEmail(email: string) {
  try {
    const normalized = email.trim().toLowerCase();
    const result = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = ${normalized}`)
      .limit(1);
    return result[0] ?? null;
  } catch (error) {
    console.error('Database query failed in getUserByEmail:', error);
    throw new Error('Failed to fetch user account.', { cause: error });
  }
}

export async function getAdminCredentialByEmail(email: string) {
  try {
    const normalized = email.trim().toLowerCase();
    const rows = await db
      .select()
      .from(adminCredentials)
      .where(eq(adminCredentials.email, normalized))
      .limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database query failed in getAdminCredentialByEmail:', error);
    throw new Error('Failed to verify admin credentials.', { cause: error });
  }
}

export async function claimAdminCredential(email: string, passwordHash: string) {
  try {
    const normalized = email.trim().toLowerCase();
    return await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: adminCredentials.id })
        .from(adminCredentials)
        .where(eq(adminCredentials.email, normalized))
        .limit(1);

      if (existing.length > 0) {
        return null;
      }

      const inserted = await tx
        .insert(adminCredentials)
        .values({
          email: normalized,
          passwordHash,
        })
        .onConflictDoNothing({ target: adminCredentials.email })
        .returning();

      return inserted[0] ?? null;
    });
  } catch (error) {
    console.error('Database query failed in claimAdminCredential:', error);
    throw new Error('Failed to save admin credentials.', { cause: error });
  }
}

export async function listAdminUsers() {
  try {
    return await db
      .select({
        id: users.id,
        uid: users.uid,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        permissions: users.permissions,
        isActive: users.isActive,
        isOwner: users.isOwner,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.role, 'admin'))
      .orderBy(asc(users.id));
  } catch (error) {
    console.error('Database query failed in listAdminUsers:', error);
    throw new Error('Failed to load admin users.', { cause: error });
  }
}

export async function createAdminUser(input: {
  email: string;
  displayName: string;
  permissions: AdminPermission[];
  passwordHash: string;
}) {
  try {
    const normalizedEmail = input.email.trim().toLowerCase();
    const isOwnerAdmin = isInitialAdminEmail(normalizedEmail);

    return await db.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(users)
        .where(sql`LOWER(${users.email}) = ${normalizedEmail}`)
        .limit(1);

      let userRecord;
      if (existing.length > 0) {
        const updated = await tx
          .update(users)
          .set({
            email: normalizedEmail,
            displayName: input.displayName,
            role: 'admin',
            permissions: isOwnerAdmin ? ALL_PERMISSIONS : input.permissions,
            isActive: true,
            isOwner: isOwnerAdmin ? true : existing[0].isOwner,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existing[0].id))
          .returning();
        userRecord = updated[0];
      } else {
        const inserted = await tx
          .insert(users)
          .values({
            uid: `admin:${normalizedEmail}`,
            email: normalizedEmail,
            displayName: input.displayName,
            role: 'admin',
            permissions: isOwnerAdmin ? ALL_PERMISSIONS : input.permissions,
            isActive: true,
            isOwner: isOwnerAdmin,
          })
          .returning();
        userRecord = inserted[0];
      }

      await tx
        .insert(adminCredentials)
        .values({
          email: normalizedEmail,
          passwordHash: input.passwordHash,
        })
        .onConflictDoUpdate({
          target: adminCredentials.email,
          set: {
            passwordHash: input.passwordHash,
            updatedAt: new Date(),
          },
        });

      return userRecord;
    });
  } catch (error) {
    console.error('Database query failed in createAdminUser:', error);
    throw new Error('Failed to create admin user.', { cause: error });
  }
}

export async function updateAdminUser(
  id: number,
  input: {
    displayName: string;
    permissions: AdminPermission[];
    isActive: boolean;
    passwordHash?: string | null;
  }
) {
  try {
    return await db.transaction(async (tx) => {
      const existing = await tx.select().from(users).where(eq(users.id, id)).limit(1);
      if (existing.length === 0 || existing[0].role !== 'admin') {
        return null;
      }

      const target = existing[0];
      const nextPermissions = target.isOwner ? ALL_PERMISSIONS : input.permissions;
      const nextActive = target.isOwner ? true : input.isActive;

      const updated = await tx
        .update(users)
        .set({
          displayName: input.displayName,
          permissions: nextPermissions,
          isActive: nextActive,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

      if (input.passwordHash) {
        await tx
          .insert(adminCredentials)
          .values({
            email: target.email.toLowerCase(),
            passwordHash: input.passwordHash,
          })
          .onConflictDoUpdate({
            target: adminCredentials.email,
            set: {
              passwordHash: input.passwordHash,
              updatedAt: new Date(),
            },
          });
      }

      return updated[0];
    });
  } catch (error) {
    console.error('Database query failed in updateAdminUser:', error);
    throw new Error('Failed to update admin user.', { cause: error });
  }
}

export async function deleteAdminUser(id: number) {
  try {
    return await db.transaction(async (tx) => {
      const existing = await tx.select().from(users).where(eq(users.id, id)).limit(1);
      if (existing.length === 0 || existing[0].role !== 'admin') {
        return { status: 'not_found' as const };
      }

      const target = existing[0];
      if (target.isOwner || isInitialAdminEmail(target.email)) {
        return { status: 'protected' as const };
      }

      await tx.delete(adminCredentials).where(eq(adminCredentials.email, target.email.toLowerCase()));
      await tx.delete(users).where(eq(users.id, id));
      return { status: 'deleted' as const, deletedId: id };
    });
  } catch (error) {
    console.error('Database query failed in deleteAdminUser:', error);
    throw new Error('Failed to delete admin user.', { cause: error });
  }
}
