import { useEffect, useRef, useState } from 'react';
import HCaptchaLib from '@hcaptcha/react-hcaptcha';

interface HCaptchaProps {
  sitekey: string;
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
}

/**
 * HCaptcha component wrapper
 * Provides bot protection for forms
 * Client-side only - won't render during SSR
 */
export default function HCaptcha({ sitekey, onVerify, onError, onExpire }: HCaptchaProps) {
  const captchaRef = useRef<HCaptchaLib>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Only render on client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleVerify = (token: string) => {
    setError(null);
    onVerify(token);
  };

  const handleError = (err: string) => {
    const errorMessage = 'CAPTCHA verification failed. Please try again.';
    setError(errorMessage);
    if (onError) {
      onError(errorMessage);
    }
  };

  const handleExpire = () => {
    setError('CAPTCHA expired. Please verify again.');
    if (onExpire) {
      onExpire();
    }
    // Reset the captcha
    captchaRef.current?.resetCaptcha();
  };

  // Don't render during SSR
  if (!isMounted) {
    return <div style={{ height: '78px' }} />; // Placeholder to prevent layout shift
  }

  if (!sitekey) {
    return (
      <p style={{ color: '#dc3545', fontSize: '14px' }}>
        CAPTCHA is not configured. Please contact support.
      </p>
    );
  }

  return (
    <div>
      <HCaptchaLib
        ref={captchaRef}
        sitekey={sitekey}
        onVerify={handleVerify}
        onError={handleError}
        onExpire={handleExpire}
      />
      {error && (
        <p style={{ color: '#dc3545', marginTop: '8px', fontSize: '14px' }}>
          {error}
        </p>
      )}
    </div>
  );
}
