import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Profile, UserRole } from '../types/database';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SEED_PROFILES } from '../services/seedData';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  role: UserRole;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password?: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const LOCAL_STORAGE_SESSION_KEY = 'findit_campus_auth_session';
const LOCAL_STORAGE_USERS_KEY = 'findit_campus_registered_users';

interface StoredUser {
  profile: Profile;
  passwordHash: string; // Simulated stored password hash
}

// Initial default registered campus credentials for development/testing
const DEFAULT_STORED_USERS: StoredUser[] = [
  {
    profile: SEED_PROFILES[0], // Alex Rivera (student)
    passwordHash: 'Password123!',
  },
  {
    profile: SEED_PROFILES[1], // Samantha Chen (student)
    passwordHash: 'Password123!',
  },
  {
    profile: SEED_PROFILES[2], // Officer Dave Miller (admin)
    passwordHash: 'AdminSecure2026!',
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize Registered Users Table in localStorage if empty
  const getRegisteredUsers = (): StoredUser[] => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(DEFAULT_STORED_USERS));
    return DEFAULT_STORED_USERS;
  };

  // Initialize Auth State on App Startup
  useEffect(() => {
    const initAuth = async () => {
      if (isSupabaseConfigured()) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
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
        } catch (err) {
          console.warn('Supabase auth session fetch error:', err);
          setUser(null);
          setProfile(null);
        }
      } else {
        // Restore persistent session from localStorage if user previously logged in
        try {
          const savedSession = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
          if (savedSession) {
            const parsed = JSON.parse(savedSession);
            if (parsed?.user && parsed?.profile) {
              setUser(parsed.user);
              setProfile(parsed.profile);
            } else {
              setUser(null);
              setProfile(null);
            }
          } else {
            // User starts as Guest (Not logged in)
            setUser(null);
            setProfile(null);
          }
        } catch {
          setUser(null);
          setProfile(null);
        }
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

  // Real Login Handler
  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const cleanPassword = password?.trim() || '';

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid campus email address.' };
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    if (isSupabaseConfigured()) {
      try {
        const { error, data } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: cleanPassword,
        });
        if (error) return { success: false, error: error.message };
        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email || trimmedEmail });
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    } else {
      // Local authentication check with password verification
      const registeredUsers = getRegisteredUsers();
      const matched = registeredUsers.find(u => u.profile.email.toLowerCase() === trimmedEmail);

      if (!matched) {
        return { success: false, error: 'Account not found with this email. Please check your email or sign up.' };
      }

      if (matched.passwordHash !== cleanPassword) {
        return { success: false, error: 'Incorrect password. Please try again.' };
      }

      const activeUser = { id: matched.profile.id, email: matched.profile.email };
      setUser(activeUser);
      setProfile(matched.profile);

      // Persist session to localStorage
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify({
        user: activeUser,
        profile: matched.profile,
      }));

      return { success: true };
    }
  };

  // Real Signup Handler
  const signup = async (email: string, password?: string, displayName?: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const cleanPassword = password?.trim() || '';
    const cleanName = displayName?.trim() || trimmedEmail.split('@')[0];

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid campus email address.' };
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }
    if (!cleanName) {
      return { success: false, error: 'Please enter your full name.' };
    }

    if (isSupabaseConfigured()) {
      try {
        const { error, data } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: cleanPassword,
          options: {
            data: {
              display_name: cleanName,
              role: 'student', // Strict role assignment: students cannot self-assign admin
            },
          },
        });
        if (error) return { success: false, error: error.message };
        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email || trimmedEmail });
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    } else {
      const registeredUsers = getRegisteredUsers();
      const existing = registeredUsers.find(u => u.profile.email.toLowerCase() === trimmedEmail);
      if (existing) {
        return { success: false, error: 'An account with this email already exists. Please sign in.' };
      }

      const newProfile: Profile = {
        id: `usr-student-${Date.now()}`,
        email: trimmedEmail,
        display_name: cleanName,
        role: 'student', // New signups are strictly students
        avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        created_at: new Date().toISOString(),
      };

      const newUserEntry: StoredUser = {
        profile: newProfile,
        passwordHash: cleanPassword,
      };

      const updatedUsers = [...registeredUsers, newUserEntry];
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(updatedUsers));

      const activeUser = { id: newProfile.id, email: newProfile.email };
      setUser(activeUser);
      setProfile(newProfile);

      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify({
        user: activeUser,
        profile: newProfile,
      }));

      return { success: true };
    }
  };

  // Logout Handler
  const logout = async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    setUser(null);
    setProfile(null);
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
        isLoading,
        login,
        signup,
        logout,
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
