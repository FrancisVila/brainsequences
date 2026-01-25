Enable HTTPS in production (Vercel provides this)
Add rate limiting to auth routes (5 attempts/15min)
Verify .env never committed; use secrets manager in production
Sanitize all user input before storing/rendering
Add security headers (CSP, X-Frame-Options)
Add CAPTCHA to signup 
Implement email verification