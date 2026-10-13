import { Profile } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const DEMO_USER_KEY = 'aiprompts_demo_user_v1';

export interface AuthState {
  user: {
    id: string;
    email: string;
  } | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

export const authService = {
  // Get initial state
  async getCurrentState(): Promise<AuthState> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user) {
          return this.getEmptyState();
        }

        const user = {
          id: session.user.id,
          email: session.user.email || '',
        };

        // Query profiles table for role
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const profile: Profile = profileData || {
          id: user.id,
          display_name: session.user.email?.split('@')[0] || 'Criador',
          role: 'user',
          email: user.email,
          created_at: new Date().toISOString(),
        };

        return {
          user,
          profile,
          isAuthenticated: true,
          isAdmin: profile.role === 'admin',
          isLoading: false,
        };
      } catch (err) {
        console.warn('Error fetching Supabase session:', err);
        return this.getEmptyState();
      }
    }

    // Check demo user in localStorage
    try {
      const stored = localStorage.getItem(DEMO_USER_KEY);
      if (stored) {
        const demoUser = JSON.parse(stored);
        return {
          user: { id: demoUser.id, email: demoUser.email },
          profile: demoUser,
          isAuthenticated: true,
          isAdmin: demoUser.role === 'admin',
          isLoading: false,
        };
      }
    } catch {
      // Ignore
    }

    return this.getEmptyState();
  },

  getEmptyState(): AuthState {
    return {
      user: null,
      profile: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
    };
  },

  // Sign in with email/password
  async signIn(email: string, password?: string): Promise<{ success: boolean; error?: string; profile?: Profile }> {
    if (isSupabaseConfigured() && supabase) {
      if (!password) {
        return { success: false, error: 'Senha é obrigatória para autenticação com Supabase.' };
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { success: false, error: error.message };
      }
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      const profile: Profile = profileData || {
        id: data.user.id,
        display_name: email.split('@')[0],
        role: 'user',
        email,
        created_at: new Date().toISOString(),
      };

      return { success: true, profile };
    }

    // Local simulated login for testing without credentials
    const isMockAdmin = email.toLowerCase().includes('admin') || email === 'viorpratas@gmail.com';
    const profile: Profile = {
      id: 'demo-user-' + Math.random().toString(36).substring(2, 9),
      display_name: isMockAdmin ? 'Administrador AI Prompts' : email.split('@')[0],
      role: isMockAdmin ? 'admin' : 'user',
      email,
      created_at: new Date().toISOString(),
    };

    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: profile }));
    return { success: true, profile };
  },

  // Quick switch for demo testing
  setDemoModeRole(role: 'admin' | 'user' | 'visitor'): AuthState {
    if (role === 'visitor') {
      localStorage.removeItem(DEMO_USER_KEY);
      window.dispatchEvent(new CustomEvent('auth-changed', { detail: null }));
      return this.getEmptyState();
    }

    const profile: Profile = {
      id: role === 'admin' ? 'demo-admin-id' : 'demo-user-id',
      display_name: role === 'admin' ? 'Curador Chefe (Admin)' : 'Fotógrafo Convidado',
      role: role === 'admin' ? 'admin' : 'user',
      email: role === 'admin' ? 'admin@aiprompts.com' : 'user@aiprompts.com',
      avatar_url: role === 'admin' 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      created_at: new Date().toISOString(),
    };

    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: profile }));

    return {
      user: { id: profile.id, email: profile.email || '' },
      profile,
      isAuthenticated: true,
      isAdmin: role === 'admin',
      isLoading: false,
    };
  },

  // Sign out
  async signOut(): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(DEMO_USER_KEY);
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: null }));
  }
};
