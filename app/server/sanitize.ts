/**
 * Input sanitization utilities to prevent XSS attacks
 * Uses DOMPurify for HTML sanitization
 */

import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create a JSDOM window for server-side DOMPurify
const window = new JSDOM('').window;
const purify = DOMPurify(window as unknown as Window);

// Configure DOMPurify
purify.setConfig({
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
});

interface SanitizeOptions {
  maxLength?: number;
  allowHTML?: boolean;
}

interface SanitizeResult {
  sanitized: string;
  valid: boolean;
  error?: string;
}

/**
 * Sanitize user input
 * - Removes/escapes dangerous HTML
 * - Enforces max length
 * - Trims whitespace
 */
export function sanitizeInput(
  input: string | null | undefined,
  options: SanitizeOptions = {}
): SanitizeResult {
  const { maxLength, allowHTML = false } = options;
  
  // Handle null/undefined
  if (input === null || input === undefined) {
    return { sanitized: '', valid: true };
  }
  
  // Convert to string and trim
  let sanitized = String(input).trim();
  
  // Check max length before sanitization
  if (maxLength && sanitized.length > maxLength) {
    return {
      sanitized: '',
      valid: false,
      error: `Input exceeds maximum length of ${maxLength} characters`,
    };
  }
  
  // Sanitize HTML if allowed, otherwise strip all tags
  if (allowHTML) {
    sanitized = purify.sanitize(sanitized);
  } else {
    // Strip all HTML tags for plain text fields
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }
  
  return { sanitized, valid: true };
}

/**
 * Sanitize sequence/step title (plain text, max 200 chars)
 */
export function sanitizeTitle(title: string | null | undefined): SanitizeResult {
  return sanitizeInput(title, { maxLength: 200, allowHTML: false });
}

/**
 * Sanitize sequence/step description (allows basic HTML, max 5000 chars)
 */
export function sanitizeDescription(description: string | null | undefined): SanitizeResult {
  return sanitizeInput(description, { maxLength: 5000, allowHTML: true });
}

/**
 * Sanitize email (basic validation)
 */
export function sanitizeEmail(email: string | null | undefined): SanitizeResult {
  const sanitized = String(email || '').trim().toLowerCase();
  
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(sanitized)) {
    return {
      sanitized: '',
      valid: false,
      error: 'Invalid email format',
    };
  }
  
  if (sanitized.length > 254) { // RFC 5321
    return {
      sanitized: '',
      valid: false,
      error: 'Email address too long',
    };
  }
  
  return { sanitized, valid: true };
}
