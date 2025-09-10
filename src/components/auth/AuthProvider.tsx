import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
interface User {
  id: string;
  email: string;
  created_at: string;
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

// Mock data storage
const USERS_KEY = 'manmitra_users';
const CURRENT_USER_KEY = 'manmitra_current_user';
const PROFILES_KEY = 'manmitra_profiles';

// Helper functions for local storage
const getStoredUsers = (): Record<string, { email: string; password: string; id: string; created_at: string }> => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : {};
};

const getStoredProfiles = (): Record<string, UserProfile> => {
  const profiles = localStorage.getItem(PROFILES_KEY);
  return profiles ? JSON.parse(profiles) : {};
};

const saveUsers = (users: Record<string, any>) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const saveProfiles = (profiles: Record<string, UserProfile>) => {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
};

const getCurrentUser = (): User | null => {
  const user = localStorage.getItem(CURRENT_USER_KEY);
  return user ? JSON.parse(user) : null;
};

const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

const generateId = () => Math.random().toString(36).substr(2, 9);

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

  const fetchProfile = async (userId: string) => {
    try {
      const profiles = getStoredProfiles();
      const userProfile = profiles[userId];
      setProfile(userProfile || null);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Get current user from localStorage
    const getInitialUser = async () => {
      try {
        const currentUser = getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          await fetchProfile(currentUser.id);
        }
      } catch (error) {
        console.error('Session initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const users = getStoredUsers();
      const userRecord = Object.values(users).find(u => u.email === email);
      
      if (!userRecord || userRecord.password !== password) {
        return { error: 'Invalid email or password' };
      }

      const user: User = {
        id: userRecord.id,
        email: userRecord.email,
        created_at: userRecord.created_at
      };
      
      setUser(user);
      setCurrentUser(user);
      await fetchProfile(user.id);

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
      
      const users = getStoredUsers();
      const existingUser = Object.values(users).find(u => u.email === userData.email);
      
      if (existingUser) {
        return { error: 'User with this email already exists' };
      }
      
      const userId = generateId();
      const now = new Date().toISOString();
      
      // Create user record
      const newUser = {
        id: userId,
        email: userData.email,
        password: userData.password,
        created_at: now
      };
      
      // Create profile record
      const newProfile: UserProfile = {
        id: userId,
        email: userData.email,
        name: userData.name,
        role: (userData.role as 'student' | 'counselor' | 'admin') || 'student',
        institution: userData.institution,
        privacy_consents: {
          share_chat_history: false,
          crisis_escalation: true,
          analytics_participation: false
        }
      };
      
      // Save to storage
      users[userId] = newUser;
      saveUsers(users);
      
      const profiles = getStoredProfiles();
      profiles[userId] = newProfile;
      saveProfiles(profiles);
      
      // Automatically sign in the user
      const signInResult = await signIn(userData.email, userData.password);
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
      setCurrentUser(null);
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
      if (!user || !profile) {
        return { error: 'User not authenticated' };
      }

      const profiles = getStoredProfiles();
      const updatedProfile = {
        ...profiles[user.id],
        privacy_consents: {
          ...profiles[user.id]?.privacy_consents,
          ...consents
        }
      };
      
      profiles[user.id] = updatedProfile;
      saveProfiles(profiles);
      
      // Refresh profile
      await fetchProfile(user.id);
      
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