import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
}

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
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    // Mock profile data
    if (user) {
      setProfile({
        id: user.id,
        email: user.email,
        name: 'Demo User',
        role: 'student',
        privacy_consents: {
          share_chat_history: true,
          crisis_escalation: true,
          analytics_participation: false
        }
      });
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile();
    }
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Mock authentication - accept any email/password
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser = {
        id: '1',
        email: email
      };
      
      setUser(mockUser);
      await fetchProfile();
      
      return {};
    } catch (error) {
      console.error('Mock sign in error:', error);
      return { error: 'An error occurred during sign in' };
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
      
      // Mock sign up - just simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Auto sign in after sign up
      return await signIn(userData.email, userData.password);
      
    } catch (error) {
      console.error('Mock sign up error:', error);
      return { error: 'Failed to create account. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Mock sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePrivacySettings = async (consents: Record<string, boolean>) => {
    try {
      if (!user) {
        return { error: 'User not authenticated' };
      }

      // Mock update - just update local state
      if (profile) {
        setProfile({
          ...profile,
          privacy_consents: {
            share_chat_history: consents.share_chat_history ?? profile.privacy_consents?.share_chat_history ?? false,
            crisis_escalation: consents.crisis_escalation ?? profile.privacy_consents?.crisis_escalation ?? false,
            analytics_participation: consents.analytics_participation ?? profile.privacy_consents?.analytics_participation ?? false
          }
        });
      }
      
      return {};
    } catch (error) {
      console.error('Mock privacy settings update error:', error);
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