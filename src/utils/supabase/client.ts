import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Create a single instance of the Supabase client
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

// API client for server routes
export class ManMitraAPI {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    this.baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-042525e0`;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    };
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    try {
      // Merge headers properly, prioritizing custom headers from options
      const mergedHeaders = { ...this.headers };
      if (options.headers) {
        Object.assign(mergedHeaders, options.headers);
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: mergedHeaders
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Authentication methods
  async register(userData: {
    email: string;
    password: string;
    name: string;
    role?: string;
    institution?: string;
  }) {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async getProfile(accessToken: string) {
    if (!accessToken) {
      throw new Error('No access token provided for profile request');
    }
    
    console.log('Fetching profile with token:', accessToken.substring(0, 20) + '...');
    
    return this.makeRequest('/auth/profile', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
  }

  async updatePrivacySettings(accessToken: string, consents: Record<string, boolean>) {
    return this.makeRequest('/auth/privacy', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ consents })
    });
  }

  // Chat methods
  async startChatSession(data: {
    topic: string;
    language?: string;
    anonymous?: boolean;
  }, accessToken?: string) {
    const headers = accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {};
    return this.makeRequest('/chat/start', {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
  }

  async sendMessage(sessionId: string, message: string, sender: 'user' | 'bestie' = 'user', accessToken?: string) {
    const headers = accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {};
    return this.makeRequest(`/chat/${sessionId}/message`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, sender })
    });
  }

  async getChatHistory(sessionId: string, accessToken?: string) {
    const headers = accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {};
    return this.makeRequest(`/chat/${sessionId}`, { headers });
  }

  // Counselor methods
  async getCounselors(specialty?: string, date?: string) {
    const params = new URLSearchParams();
    if (specialty) params.append('specialty', specialty);
    if (date) params.append('date', date);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.makeRequest(`/counselors${query}`);
  }

  async bookAppointment(accessToken: string, appointmentData: {
    counselor_id: string;
    date: string;
    time: string;
    topic: string;
    share_chat_summary?: boolean;
    chat_session_id?: string;
  }) {
    return this.makeRequest('/appointments/book', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify(appointmentData)
    });
  }

  async getAppointments(accessToken: string) {
    return this.makeRequest('/appointments', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
  }

  // Mood tracking methods
  async submitMoodAssessment(accessToken: string, assessmentData: {
    phq9_scores: number[];
    gad7_scores: number[];
    notes?: string;
  }) {
    return this.makeRequest('/mood/submit', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify(assessmentData)
    });
  }

  // Admin methods
  async getAnalytics(accessToken: string) {
    return this.makeRequest('/admin/analytics', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
  }

  // Counselor crisis management
  async getCrisisAlerts(accessToken: string) {
    return this.makeRequest('/counselor/alerts', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
  }

  async handleCrisisAlert(accessToken: string, alertId: string, action: string, notes?: string) {
    return this.makeRequest(`/counselor/alerts/${alertId}/handle`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ action, notes })
    });
  }
}

export const api = new ManMitraAPI();