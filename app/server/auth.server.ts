import { redirect } from 'react-router';
import bcrypt from 'bcryptjs';
import { db } from './drizzle.server';
import { users, sessions } from '../../drizzle/schema';
import { eq, lt } from 'drizzle-orm';
import crypto from 'crypto';

// Session cookie name
const SESSION_COOKIE = 'session_id';

// Session duration: 90 days in milliseconds
const SESSION_DURATION = 90 * 24 * 60 * 60 * 1000;

// Password validation regex: at least 8 characters, contains letters and numbers
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

/**
 * Validate password meets requirements
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  if (!PASSWORD_REGEX.test(password)) {
    return { valid: false, error: 'Password must contain both letters and numbers' };
  }
  return { valid: true };
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a secure random session ID
 */
function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a new session for a user
 */
export async function createSession(userId: number): Promise<string> {
  const sessionId = generateSessionId();
  const now = Date.now();
  const expiresAt = now + SESSION_DURATION;

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
    lastActivityAt: now,
  });

  return sessionId;
}

/**
 * Get user from session ID, returns null if session is invalid or expired
 */
export async function getUserFromSession(sessionId: string | undefined) {
  if (!sessionId) return null;

  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: {
      user: true,
    },
  });

  if (!session) return null;

  const now = Date.now();
  
  // Check if session has expired (90 days of inactivity)
  if (session.lastActivityAt + SESSION_DURATION < now) {
    // Delete expired session
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return null;
  }

  // Update last activity timestamp
  await db.update(sessions)
    .set({ lastActivityAt: now })
    .where(eq(sessions.id, sessionId));

  return session.user;
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

/**
 * Get session ID from request cookies
 */
export function getSessionIdFromRequest(request: Request): string | undefined {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return undefined;

  const cookies = cookieHeader.split(';').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith(`${SESSION_COOKIE}=`));
  
  return sessionCookie?.split('=')[1];
}

/**
 * Create a session cookie header
 */
export function createSessionCookie(sessionId: string): string {
  const isProduction = process.env.NODE_ENV === 'production';
  // HttpOnly prevents JavaScript access, Secure for HTTPS, SameSite for CSRF protection
  const secure = isProduction ? '; Secure' : '';
  return `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=${SESSION_DURATION / 1000}`;
}

/**
 * Create a cookie header to clear the session
 */
export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/**
 * Middleware to require authentication
 * Use in loaders/actions to ensure user is logged in
 */
export async function requireAuth(request: Request) {
  const sessionId = getSessionIdFromRequest(request);
  const user = await getUserFromSession(sessionId);
  
  if (!user) {
    throw redirect('/login');
  }
  
  return user;
}

/**
 * Middleware to require specific role
 */
export async function requireRole(request: Request, role: 'admin' | 'user') {
  const user = await requireAuth(request);
  
  if (user.role !== role && user.role !== 'admin') {
    throw new Response('Forbidden', { status: 403 });
  }
  
  return user;
}

/**
 * Get current user without redirecting (returns null if not authenticated)
 */
export async function getCurrentUser(request: Request) {
  const sessionId = getSessionIdFromRequest(request);
  return getUserFromSession(sessionId);
}

/**
 * Check if this is the first user (for auto-admin assignment)
 */
export async function isFirstUser(): Promise<boolean> {
  const userCount = await db.select({ count: users.id }).from(users);
  return userCount.length === 0;
}

/**
 * Create a new user
 */
export async function createUser(email: string, password: string, role: 'user' | 'admin' = 'user') {
  const passwordHash = await hashPassword(password);
  
  const [user] = await db.insert(users).values({
    email,
    passwordHash,
    role,
  }).returning();
  
  return user;
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: eq(users.email, email),
  });
}

/**
 * Middleware to require verified email
 */
export async function requireVerifiedEmail(request: Request) {
  const user = await requireAuth(request);
  
  if (!user.emailVerified) {
    throw redirect('/verify-email?required=true');
  }
  
  return user;
}

/**
 * Invalidate all sessions for a user (e.g., after password change)
 */
export async function invalidateUserSessions(userId: number): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/**
 * Clean up expired sessions (utility function for maintenance)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const cutoff = Date.now() - SESSION_DURATION;
  const result = await db.delete(sessions).where(lt(sessions.lastActivityAt, cutoff));
  return result.changes;
}
