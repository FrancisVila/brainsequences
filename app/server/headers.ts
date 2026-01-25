/**
 * Security headers for the application
 * Helps protect against XSS, clickjacking, and other common attacks
 */

export function getSecurityHeaders(): HeadersInit {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    // Content Security Policy - prevents XSS attacks
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.hcaptcha.com https://hcaptcha.com", // unsafe-inline/eval needed for React/Vite in dev
      "style-src 'self' 'unsafe-inline' https://hcaptcha.com", // unsafe-inline needed for styled components
      "img-src 'self' data: https: blob:", // data: for inline images, https: for external images
      "font-src 'self' data:",
      "connect-src 'self' https://hcaptcha.com", // API calls
      "frame-src 'self' https://hcaptcha.com https://newassets.hcaptcha.com",
      "frame-ancestors 'none'", // Prevent clickjacking
    ].join('; '),
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Enable browser XSS protection
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // HSTS - force HTTPS (only in production)
    ...(isDevelopment ? {} : {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    }),
    
    // Permissions policy - restrict browser features
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  };
}
