import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Profile, UserRole } from '../types/database';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SEED_PROFILES } from '../services/seedData';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  role: UserRole;
  isAdmin: boolean;
  isDemoMode: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password?: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchDemoUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isDemoMode = !isSupabaseConfigured();

  // Initialize Auth
  useEffect(() => {
    const initAuth = async () => {
      if (isSupabaseConfigured()) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser({ id: session.user.id, email: session.user.email || '' });
            // Fetch profile
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileData) {
              setProfile(profileData);
            }
          }
        } catch (err) {
          console.warn('Supabase auth session fetch error:', err);
        }
      } else {
        // Default to Student 1 (Alex Rivera) in demo mode
        const defaultProfile = SEED_PROFILES[0];
        setUser({ id: defaultProfile.id, email: defaultProfile.email });
        setProfile(defaultProfile);
      }
      setIsLoading(false);
    };

    initAuth();

    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email || '' });
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (profileData) {
            setProfile(profileData);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: password || 'TestPassword123!',
        });
        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    } else {
      // Demo authentication lookup
      const found = SEED_PROFILES.find(p => p.email.toLowerCase() === email.toLowerCase());
      if (found) {
        setUser({ id: found.id, email: found.email });
        setProfile(found);
        return { success: true };
      }
      // Create ad-hoc demo student profile
      const newDemoProfile: Profile = {
        id: `usr-demo-${Date.now()}`,
        email,
        display_name: email.split('@')[0],
        role: 'student', // Never allows user to self-assign admin
        created_at: new Date().toISOString(),
      };
      setUser({ id: newDemoProfile.id, email: newDemoProfile.email });
      setProfile(newDemoProfile);
      return { success: true };
    }
  };

  const signup = async (email: string, password?: string, displayName?: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password: password || 'TestPassword123!',
          options: {
            data: {
              display_name: displayName || email.split('@')[0],
              role: 'student', // Security requirement: Always 'student' by default
            },
          },
        });
        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    } else {
      const newProfile: Profile = {
        id: `usr-demo-${Date.now()}`,
        email,
        display_name: displayName || email.split('@')[0],
        role: 'student',
        created_at: new Date().toISOString(),
      };
      setUser({ id: newProfile.id, email: newProfile.email });
      setProfile(newProfile);
      return { success: true };
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
  };

  const switchDemoUser = (userId: string) => {
    const target = SEED_PROFILES.find(p => p.id === userId);
    if (target) {
      setUser({ id: target.id, email: target.email });
      setProfile(target);
    }
  };

  const role: UserRole = profile?.role || 'student';
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAdmin,
        isDemoMode,
        isLoading,
        login,
        signup,
        logout,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
