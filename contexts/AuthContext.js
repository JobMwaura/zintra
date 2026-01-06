'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isSafari, isSafariPrivateMode, retryOperation } from '@/lib/safariCompat';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    console.log('🔹 AuthProvider: Initializing auth...');
    console.log('🔹 Browser: Safari=' + isSafari() + ', PrivateMode=' + isSafariPrivateMode());
    let isMounted = true;
    let loadingStarted = false;

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        loadingStarted = true;
        
        // Set a timeout to prevent hanging (longer for Safari)
        const timeoutMs = isSafari() ? 8000 : 5000;
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth initialization timeout')), timeoutMs)
        );

        const sessionPromise = (async () => {
          // Get initial session - with retry for Safari
          const getSessionWithRetry = async () => {
            if (isSafari()) {
              // Safari needs retry logic
              return await retryOperation(
                () => supabase.auth.getSession(),
                2,
                100
              );
            } else {
              return await supabase.auth.getSession();
            }
          };

          const result = await getSessionWithRetry();
          const { data: { session } } = result;
          
          console.log('🔹 AuthProvider: Session check complete', session?.user?.email || 'no user');
          
          if (isMounted) {
            if (session?.user) {
              setUser(session.user);
              console.log('✅ AuthProvider: User restored from session:', session.user.email);
            } else {
              setUser(null);
              console.log('✅ AuthProvider: No session found');
            }
          }
        })();

        await Promise.race([sessionPromise, timeoutPromise]);
      } catch (error) {
        console.error('🔹 AuthProvider: Error during initialization:', error.message);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted && loadingStarted) {
          setLoading(false);
          console.log('✅ AuthProvider: Loading complete');
        }
      }
    };

    // Start initialization
    initializeAuth();

    // Set up auth state listener
    console.log('🔹 AuthProvider: Setting up auth listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔹 AuthProvider: Auth state changed:', event, session?.user?.email || 'no user');
      
      if (isMounted) {
        if (session?.user) {
          setUser(session.user);
          console.log('✅ AuthProvider: Auth listener - user set:', session.user.email);
        } else {
          setUser(null);
          console.log('✅ AuthProvider: Auth listener - user cleared');
        }
        // Always ensure loading is false when auth state changes
        setLoading(false);
      }
    });

    // Cleanup
    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
        console.log('🔹 AuthProvider: Cleanup - unsubscribed from auth listener');
      }
    };
  }, [supabase]);

  const signIn = async (email, password) => {
    try {
      console.log('🔹 Signing in:', email);
      console.log('🔹 Supabase instance:', supabase ? '✓ exists' : '✗ missing');
      
      // Use retry logic for Safari
      const signInOperation = async () => {
        return await supabase.auth.signInWithPassword({
          email,
          password,
        });
      };

      const { data, error } = isSafari()
        ? await retryOperation(signInOperation, 2, 200)
        : await signInOperation();

      if (error) {
        console.error('❌ Sign in error:', error);
        console.error('❌ Error details:', { 
          message: error.message, 
          status: error.status,
          code: error.code 
        });
        return { data: null, error };
      }

      console.log('✓ Sign in successful');
      console.log('✓ User data:', { 
        id: data?.user?.id, 
        email: data?.user?.email,
        emailConfirmed: data?.user?.email_confirmed_at 
      });
      console.log('✓ Session data:', { 
        accessToken: data?.session?.access_token ? '✓ present' : '✗ missing',
        refreshToken: data?.session?.refresh_token ? '✓ present' : '✗ missing'
      });
      
      if (data?.user) {
        setUser(data.user);
        // CRITICAL: Ensure loading is false when user is set after sign in
        setLoading(false);
        console.log('✅ User set and loading set to false after sign in');
      }

      return { data, error: null };
    } catch (err) {
      console.error('❌ Sign in exception:', err);
      console.error('❌ Exception details:', err.message);
      return { data: null, error: err };
    }
  };

  const signUp = async (email, password) => {
    try {
      console.log('🔹 Signing up:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('❌ Sign up error:', error);
        return { data: null, error };
      }

      console.log('✓ Sign up successful');
      return { data, error: null };
    } catch (err) {
      console.error('❌ Sign up exception:', err);
      return { data: null, error: err };
    }
  };

  const logout = async () => {
    try {
      console.log('🔹 Logging out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        return { error };
      }
      console.log('✓ Logout successful');
      setUser(null);
      return { error: null };
    } catch (err) {
      console.error('Logout error:', err);
      return { error: err };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, logout }}>
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
