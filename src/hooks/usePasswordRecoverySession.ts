import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

/** True when the user arrived via a valid password-recovery link and has a session. */
export function usePasswordRecoverySession(active: boolean) {
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    if (!active) {
      setReady(false);
      setHasSession(false);
      return;
    }

    const checkSession = () => {
      void supabase.auth.getSession().then(({ data }) => {
        setHasSession(Boolean(data.session));
        setReady(true);
      });
    };

    checkSession();
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        checkSession();
      }
    });

    return () => subscription.unsubscribe();
  }, [active]);

  return { ready, hasSession };
}
