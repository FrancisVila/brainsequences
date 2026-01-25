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
 */
export function HCaptcha({ sitekey, onVerify, onError, onExpire }: HCaptchaProps) {
  const captchaRef = useRef<HCaptchaLib>(null);
  const [error, setError] = useState<string | null>(null);

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
