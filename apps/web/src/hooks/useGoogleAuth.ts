import { useEffect, useCallback, useRef } from 'react';
import { fetchApi } from '@/lib/api';

const GOOGLE_CLIENT_ID = '734919431238-grkippnk46k710affqmq54eaquegt1jb.apps.googleusercontent.com';

interface GoogleAuthResult {
  accessToken: string;
  user: { id: string; role: 'FARMER' | 'INSTRUCTOR' | 'ADMIN' };
}

/**
 * Hook that loads Google Identity Services and returns a trigger function.
 * Uses the standard sign-in button (rendered invisibly) for maximum compatibility
 * with ad blockers and browser extensions.
 */
export function useGoogleAuth(onSuccess: (result: GoogleAuthResult) => void, onError: (err: string) => void) {
  const callbackRef = useRef(onSuccess);
  const errorRef = useRef(onError);
  const initializedRef = useRef(false);
  const hiddenBtnRef = useRef<HTMLDivElement | null>(null);

  callbackRef.current = onSuccess;
  errorRef.current = onError;

  useEffect(() => {
    // Load Google Identity Services script if not already loaded
    if (document.getElementById('google-gsi-script')) return;

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  const triggerGoogleAuth = useCallback(() => {
    const google = (window as any).google;
    if (!google?.accounts?.id) {
      errorRef.current('Google sign-in is still loading. Please try again in a moment.');
      return;
    }

    // Initialize with callback for credential response
    if (!initializedRef.current) {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: { credential: string }) => {
          try {
            const res = await fetchApi('/auth/google', {
              method: 'POST',
              body: JSON.stringify({ idToken: response.credential }),
            });
            callbackRef.current(res);
          } catch (err: any) {
            errorRef.current(err.message || 'Google sign-in failed');
          }
        },
      });
      initializedRef.current = true;
    }

    // Create a hidden container for the Google button and click it
    if (!hiddenBtnRef.current) {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      document.body.appendChild(container);
      hiddenBtnRef.current = container;
    }

    // Render Google's official button (it handles popup/redirect reliably)
    google.accounts.id.renderButton(hiddenBtnRef.current, {
      type: 'standard',
      size: 'large',
      width: 300,
    });

    // Click the rendered Google button to open the account chooser
    const googleBtn = hiddenBtnRef.current.querySelector('[role="button"]') as HTMLElement
      || hiddenBtnRef.current.querySelector('div[style]') as HTMLElement
      || hiddenBtnRef.current.firstElementChild as HTMLElement;

    if (googleBtn) {
      googleBtn.click();
    } else {
      // Fallback: try One Tap prompt
      google.accounts.id.prompt();
    }
  }, []);

  return { triggerGoogleAuth };
}
