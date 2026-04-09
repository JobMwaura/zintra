'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isSafari, retryOperation } from '@/lib/safariCompat';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const timeoutMs = isSafari() ? 8000 : 5000;
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth initialization timeout')), timeoutMs)
        );

        const sessionPromise = (async () => {
          const getSession = isSafari()
            ? () => retryOperation(() => supabase.auth.getSession(), 2, 100)
            : () => supabase.auth.getSession();

          const { data: { session } } = await getSession();
          
          if (isMounted) {
            setUser(session?.user ?? null);
          }
        })();

        await Promise.race([sessionPromise, timeoutPromise]);
      } catch (error) {
        console.error('AuthProvider: Init error:', error.message);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [supabase]);

  const signIn = useCallback(async (email, password) => {
    try {
      const signInOp = () => supabase.auth.signInWithPassword({ email, password });

      const { data, error } = isSafari()
        ? await retryOperation(signInOp, 2, 200)
        : await signInOp();

      if (error) return { data: null, error };

      if (data?.user) {
        setUser(data.user);
        setLoading(false);
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }, [supabase]);

  const signUp = useCallback(async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { data: null, error };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }, [supabase]);

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) return { error };
      setUser(null);
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  }, [supabase]);

  // Memoize context value to prevent unnecessary re-renders of all consumers
  const value = useMemo(() => ({
    user, loading, signIn, signUp, logout
  }), [user, loading, signIn, signUp, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
