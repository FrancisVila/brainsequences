/**
 * Rate limiting utilities to prevent brute-force attacks and spam
 * Uses in-memory storage (for production, consider Redis)
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Store for rate limit tracking
const authLimits = new Map<string, RateLimitEntry>();
const inviteLimits = new Map<string, RateLimitEntry>();
const sequenceLimits = new Map<string, RateLimitEntry>();

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of authLimits.entries()) {
    if (entry.resetAt < now) authLimits.delete(key);
  }
  for (const [key, entry] of inviteLimits.entries()) {
    if (entry.resetAt < now) inviteLimits.delete(key);
  }
  for (const [key, entry] of sequenceLimits.entries()) {
    if (entry.resetAt < now) sequenceLimits.delete(key);
  }
}, 60000); // Clean every minute

/**
 * Get client IP from request
 */
function getClientIP(request: Request): string {
  // Check various headers for IP (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback to a placeholder (in real deployment, server should provide this)
  return 'unknown';
}

/**
 * Check rate limit and update counter
 */
function checkLimit(
  store: Map<string, RateLimitEntry>,
  key: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);
  
  if (!entry || entry.resetAt < now) {
    // No entry or expired, create new
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxAttempts - 1, resetAt };
  }
  
  if (entry.count >= maxAttempts) {
    // Limit exceeded
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  
  // Increment counter
  entry.count++;
  return { allowed: true, remaining: maxAttempts - entry.count, resetAt: entry.resetAt };
}

/**
 * Rate limit for authentication routes (login/signup)
 * Limit: 5 attempts per 15 minutes per IP
 */
export async function rateLimitAuth(request: Request): Promise<Response | null> {
  const ip = getClientIP(request);
  const result = checkLimit(authLimits, ip, 5, 15 * 60 * 1000);
  
  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return new Response(
      JSON.stringify({ 
        error: 'Too many authentication attempts. Please try again later.',
        retryAfter 
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
        },
      }
    );
  }
  
  return null; // Allow request
}

/**
 * Rate limit for invitation emails
 * Limit: 10 invitations per hour per user
 */
export async function rateLimitInvite(userId: number): Promise<Response | null> {
  const key = `user-${userId}`;
  const result = checkLimit(inviteLimits, key, 10, 60 * 60 * 1000);
  
  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return new Response(
      JSON.stringify({ 
        error: 'Too many invitations sent. Please try again later.',
        retryAfter 
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
        },
      }
    );
  }
  
  return null; // Allow request
}

/**
 * Rate limit for sequence creation
 * Limit: 20 sequences per hour per user
 */
export async function rateLimitSequenceCreate(userId: number): Promise<Response | null> {
  const key = `user-${userId}`;
  const result = checkLimit(sequenceLimits, key, 20, 60 * 60 * 1000);
  
  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return new Response(
      JSON.stringify({ 
        error: 'Too many sequences created. Please try again later.',
        retryAfter 
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
        },
      }
    );
  }
  
  return null; // Allow request
}
