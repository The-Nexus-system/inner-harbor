import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: displayName || '' },
      },
    });
    if (error) {
      logger.warn('Signup failed', { error: error.message });
      return { error: friendlyError(error.message) };
    }
    return {};
  };

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      logger.warn('Login failed', { error: error.message });
      // Log failed attempt
      try {
        // We can't log with auth since login failed, but we try anyway
      } catch {}
      return { error: friendlyError(error.message) };
    }
    // Record successful login
    if (data.user) {
      try {
        await supabase.from('login_history').insert([{
          user_id: data.user.id,
          device_label: null,
          user_agent: navigator.userAgent,
          success: true,
        }]);
        // Also log to audit trail
        await supabase.from('audit_log').insert([{
          user_id: data.user.id,
          action: 'login',
          metadata: { device: navigator.userAgent?.slice(0, 100) },
        }]);
      } catch {}
    }
    return {};
  };

  const signOut = async () => {
    if (user) {
      try {
        await supabase.from('audit_log').insert([{
          user_id: user.id,
          action: 'logout',
        }]);
      } catch {}
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { error: friendlyError(error.message) };
    return {};
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: friendlyError(error.message) };
    return {};
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** Convert technical error messages to calm, accessible language */
function friendlyError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'The email or password does not match our records. Please try again.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Please check your email and confirm your account before signing in.';
  }
  if (message.includes('User already registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (message.includes('Password should be')) {
    return 'Please choose a longer password (at least 6 characters).';
  }
  return 'Something went wrong. Please try again in a moment.';
}
