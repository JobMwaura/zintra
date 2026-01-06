'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    console.log('🔹 AuthProvider: Initializing auth...');
    let isMounted = true;
    let loadingStarted = false;

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        loadingStarted = true;
        // Set a timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth initialization timeout')), 5000)
        );

        const sessionPromise = (async () => {
          // Get initial session
          const { data: { session } } = await supabase.auth.getSession();
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        return { data: null, error };
      }

      console.log('✓ Sign in successful, user:', data.user?.email);
      if (data?.user) {
        setUser(data.user);
        // CRITICAL: Ensure loading is false when user is set after sign in
        setLoading(false);
        console.log('✅ User set and loading set to false after sign in');
      }

      return { data, error: null };
    } catch (err) {
      console.error('❌ Sign in exception:', err);
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
