'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    console.log('🔹 AuthProvider mounted, checking initial session...');
    
    const checkUser = async () => {
      try {
        // Avoid crashing on browsers with no session; Supabase can throw AuthSessionMissingError
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          // Ignore the common missing-session error; log anything else
          if (sessionError?.name !== 'AuthSessionMissingError') {
            console.error('Auth session error:', sessionError);
          }
          console.log('✓ No active session');
          setUser(null);
          return;
        }

        if (!session?.user) {
          console.log('✓ No active session');
          setUser(null);
          return;
        }

        console.log('✓ Found active session, user:', session.user.email);
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        if (error) {
          if (error?.name !== 'AuthSessionMissingError') {
            console.error('Auth error:', error);
          }
          setUser(null);
        } else {
          console.log('✓ Auth user confirmed:', currentUser.email);
          setUser(currentUser);
        }
      } catch (err) {
        if (err?.name !== 'AuthSessionMissingError') {
          console.error('Error checking user:', err);
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Subscribe to auth state changes (this handles session persistence across page loads)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔹 Auth state changed:', event);
        if (session?.user) {
          console.log('✓ Session restored/updated for:', session.user.email);
          setUser(session.user);
        } else {
          console.log('✓ Session cleared');
          setUser(null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

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
