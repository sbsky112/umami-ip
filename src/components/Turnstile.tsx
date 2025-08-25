'use client';

import { useEffect, useRef, useState } from 'react';

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  onLoadError?: () => void;
  className?: string;
  reset?: boolean;
  lazyRender?: boolean;
  shouldRender?: boolean;
}

export function Turnstile({
  siteKey,
  onVerify,
  onExpire,
  onError,
  onLoadError,
  className = '',
  reset = false,
  lazyRender = false,
  shouldRender = true,
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Global script loading management - only load when shouldRender is true
  useEffect(() => {
    if (!siteKey || (lazyRender && !shouldRender)) return;

    // Check if Turnstile is already available
    if (window.turnstile) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already loading or loaded
    const existingScript = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
    if (existingScript) {
      // Script is already loading or loaded, wait for it
      const checkTurnstile = setInterval(() => {
        if (window.turnstile) {
          setIsLoaded(true);
          clearInterval(checkTurnstile);
        }
      }, 100);
      return;
    }

    // Load the script
    const loadScript = () => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        setIsLoaded(true);
        setError(null);
      };
      
      script.onerror = () => {
        if (retryCount < 3) {
          // Retry loading
          setRetryCount(prev => prev + 1);
          setTimeout(loadScript, 1000 * (retryCount + 1));
        } else {
          setError('Unable to load verification service. Please check your internet connection.');
          onLoadError?.();
        }
      };

      document.head.appendChild(script);
    };

    loadScript();

    return () => {
      // Don't remove the script as it might be used by other instances
    };
  }, [siteKey, lazyRender, shouldRender, retryCount, onLoadError]);

  // Widget rendering and management
  useEffect(() => {
    if (!isLoaded || !siteKey || !containerRef.current || !window.turnstile) {
      return;
    }

    // If lazy render is enabled and shouldRender is false, don't render
    if (lazyRender && !shouldRender) {
      // Clear any existing widget
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // Ignore errors when removing
        }
        widgetIdRef.current = null;
        setIsVerified(false);
      }
      // Safely clear container
      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      }
      return;
    }

    // If already verified and not resetting, don't re-render
    if (isVerified && !reset) {
      return;
    }

    try {
      // Remove existing widget if any
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // Ignore errors when removing
        }
        widgetIdRef.current = null;
      }

      // Safely clear container
      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      }

      // Render the widget
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          setIsVerified(true);
          onVerify(token);
        },
        'expired-callback': () => {
          setIsVerified(false);
          onExpire?.();
        },
        'error-callback': () => {
          setIsVerified(false);
          onError?.();
        },
        theme: 'auto',
      });
    } catch (err) {
      setError('Failed to initialize verification widget');
    }
  }, [isLoaded, siteKey, reset, shouldRender, lazyRender, onVerify, onExpire, onError]);

  if (error) {
    return (
      <div 
        className={className}
        style={{ 
          minHeight: '65px',
          padding: '10px',
          border: '1px solid #dc3545',
          borderRadius: '4px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          fontSize: '14px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <div>{error}</div>
        {retryCount < 3 && (
          <button 
            onClick={() => {
              setRetryCount(0);
              setError(null);
            }}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={className}
      style={{ 
        minHeight: '65px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {!isLoaded && (
        <div style={{ color: '#666', fontSize: '14px' }}>
          Loading verification...
        </div>
      )}
      {lazyRender && !shouldRender && isLoaded && (
        <div style={{ color: '#666', fontSize: '14px' }}>
          Click login to verify
        </div>
      )}
    </div>
  );
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, params: any) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string | undefined;
    };
  }
}

export default Turnstile;