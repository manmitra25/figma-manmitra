import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, api } from '../../utils/supabase/client';
import { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'counselor' | 'admin';
  institution?: string;
  privacy_consents?: {
    share_chat_history: boolean;
    crisis_escalation: boolean;
    analytics_participation: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (userData: {
    email: string;
    password: string;
    name: string;
    role?: string;
    institution?: string;
  }) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updatePrivacySettings: (consents: Record<string, boolean>) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (accessToken: string) => {
    try {
      if (!accessToken) {
        console.warn('No access token provided for profile fetch');
        setProfile(null);
        return;
      }
      
      const profileData = await api.getProfile(accessToken);
      setProfile(profileData);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      // If profile fetch fails, user might not be fully registered yet
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await fetchProfile(session.access_token);
      }
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        } else if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.access_token);
        }
      } catch (error) {
        console.error('Session initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (session?.user && session?.access_token) {
          setUser(session.user);
          // Only fetch profile for non-anonymous users and after successful sign up
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await fetchProfile(session.access_token);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Sign in error:', error.message);
        return { error: error.message };
      }

      if (data.session?.access_token) {
        await fetchProfile(data.session.access_token);
      }

      return {};
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      return { error: 'An unexpected error occurred during sign in' };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (userData: {
    email: string;
    password: string;
    name: string;
    role?: string;
    institution?: string;
  }) => {
    try {
      setLoading(true);
      
      // Register user via our API (which handles user creation and profile setup)
      const result = await api.register(userData);
      
      if (result.error) {
        return { error: result.error };
      }

      // Wait a moment for user creation to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Now sign in the user
      const signInResult = await signIn(userData.email, userData.password);
      
      // If sign in is successful, wait a bit more and try to fetch profile
      if (!signInResult.error) {
        setTimeout(async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            await fetchProfile(session.access_token);
          }
        }, 2000);
      }
      
      return signInResult;
      
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: 'Failed to create account. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
      }
      
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Unexpected sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePrivacySettings = async (consents: Record<string, boolean>) => {
    try {
      if (!user) {
        return { error: 'User not authenticated' };
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { error: 'No valid session' };
      }

      await api.updatePrivacySettings(session.access_token, consents);
      
      // Refresh profile to get updated consents
      await fetchProfile(session.access_token);
      
      return {};
    } catch (error) {
      console.error('Privacy settings update error:', error);
      return { error: 'Failed to update privacy settings' };
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updatePrivacySettings,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}