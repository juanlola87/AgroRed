import crypto from 'crypto';

declare global {
  var _agroSessionSecret: string | undefined;
}

function getSessionSecret(): string {
  const envSecret = process.env.SESSION_SECRET?.trim();
  if (envSecret) return envSecret;

  if (!global._agroSessionSecret) {
    global._agroSessionSecret = crypto.randomBytes(32).toString('hex');
  }
  return global._agroSessionSecret;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

export function verifyScryptPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  if (!salt || !keyHex) return false;

  const expectedBuffer = Buffer.from(keyHex, 'hex');
  const actualBuffer = crypto.scryptSync(password, salt, 64);
  if (expectedBuffer.length !== actualBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

export function verifyEnvPassword(password: string, expectedPassword: string): boolean {
  const actualDigest = crypto.createHash('sha256').update(password).digest();
  const expectedDigest = crypto.createHash('sha256').update(expectedPassword).digest();
  return crypto.timingSafeEqual(actualDigest, expectedDigest);
}

const TOKEN_PREFIX = 'agro.';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

export function issueAdminSessionToken(uid: string, email: string): string {
  const payload = {
    uid,
    email,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encodedPayload)
    .digest('base64url');

  return `${TOKEN_PREFIX}${encodedPayload}.${signature}`;
}

export function verifyAdminSessionToken(token: string): { uid: string; email: string } | null {
  if (!token.startsWith(TOKEN_PREFIX)) return null;

  const body = token.slice(TOKEN_PREFIX.length);
  const dotIndex = body.indexOf('.');
  if (dotIndex <= 0) return null;

  const encodedPayload = body.slice(0, dotIndex);
  const providedSig = body.slice(dotIndex + 1);
  if (!encodedPayload || !providedSig) return null;

  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encodedPayload)
    .digest('base64url');

  const providedBuf = Buffer.from(providedSig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (providedBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as {
      uid?: string;
      email?: string;
      exp?: number;
    };
    if (!parsed.uid || !parsed.email || typeof parsed.exp !== 'number') {
      return null;
    }
    if (Date.now() > parsed.exp) {
      return null;
    }
    return { uid: parsed.uid, email: parsed.email };
  } catch {
    return null;
  }
}
