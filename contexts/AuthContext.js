'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Avoid crashing on browsers with no session; Supabase can throw AuthSessionMissingError
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          // Ignore the common missing-session error; log anything else
          if (sessionError?.name !== 'AuthSessionMissingError') {
            console.error('Auth session error:', sessionError);
          }
          setUser(null);
          return;
        }

        if (!session?.user) {
          setUser(null);
          return;
        }

        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        if (error) {
          if (error?.name !== 'AuthSessionMissingError') {
            console.error('Auth error:', error);
          }
          setUser(null);
        } else {
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { data: null, error };
      }

      if (data?.user) {
        setUser(data.user);
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const signUp = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        return { error };
      }
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
