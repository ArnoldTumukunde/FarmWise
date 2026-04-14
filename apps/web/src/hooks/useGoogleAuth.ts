import { useEffect, useCallback, useRef } from 'react';
import { fetchApi } from '@/lib/api';

const GOOGLE_CLIENT_ID = '734919431238-grkippnk46k710affqmq54eaquegt1jb.apps.googleusercontent.com';

interface GoogleAuthResult {
  accessToken: string;
  user: { id: string; role: string };
}

/**
 * Hook that loads Google Identity Services and returns a trigger function.
 * When the user clicks "Continue with Google", call `triggerGoogleAuth()`.
 */
export function useGoogleAuth(onSuccess: (result: GoogleAuthResult) => void, onError: (err: string) => void) {
  const callbackRef = useRef(onSuccess);
  const errorRef = useRef(onError);
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
      errorRef.current('Google sign-in is still loading. Please try again.');
      return;
    }

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

    google.accounts.id.prompt((notification: any) => {
      // If One Tap is dismissed or unavailable, fall back to the popup flow
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        google.accounts.oauth2.initCodeClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile',
          ux_mode: 'popup',
          callback: () => {
            // The ID token flow above handles everything
          },
        });
        // Use the button-based popup instead
        google.accounts.id.renderButton(
          document.createElement('div'), // hidden element
          { type: 'standard' }
        );
        // Trigger the standard sign-in popup
        google.accounts.id.prompt();
      }
    });
  }, []);

  return { triggerGoogleAuth };
}
