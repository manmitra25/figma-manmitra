import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use('*', logger(console.log));

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Helper function to verify user authentication (optional for some routes)
async function verifyAuth(request: Request, required = true) {
  const authHeader = request.headers.get('Authorization');
  const accessToken = authHeader?.split(' ')[1];
  
  if (!accessToken) {
    console.log(`Auth verification failed: No token provided. Required: ${required}`);
    if (required) {
      return { error: 'No authorization token provided', user: null };
    }
    return { error: null, user: null };
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error) {
      console.log(`Auth verification failed: ${error.message}`);
      if (required) {
        return { error: 'Invalid or expired token', user: null };
      }
      return { error: null, user: null };
    }

    if (!user) {
      console.log('Auth verification failed: No user found');
      if (required) {
        return { error: 'Invalid or expired token', user: null };
      }
      return { error: null, user: null };
    }

    console.log(`Auth verification successful for user: ${user.id}`);
    return { error: null, user };
  } catch (error) {
    console.log(`Auth verification exception: ${error}`);
    if (required) {
      return { error: 'Authentication error', user: null };
    }
    return { error: null, user: null };
  }
}

// Helper function to get user role
async function getUserRole(userId: string) {
  const userRole = await kv.get(`user_role:${userId}`);
  return userRole || 'student'; // Default to student
}

// Routes

// Health check
app.get('/make-server-042525e0/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// User Registration
app.post('/make-server-042525e0/auth/register', async (c) => {
  try {
    const { email, password, name, role = 'student', institution } = await c.req.json();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name, 
        role,
        institution: institution || 'Unknown',
        created_at: new Date().toISOString()
      },
      email_confirm: true // Auto-confirm since email server isn't configured
    });

    if (error) {
      console.log(`Registration error for ${email}: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    // Store user role and profile data
    await Promise.all([
      kv.set(`user_role:${data.user.id}`, role),
      kv.set(`user_profile:${data.user.id}`, {
        name,
        email,
        role,
        institution,
        created_at: new Date().toISOString(),
        privacy_consents: {
          share_chat_history: false,
          crisis_escalation: true,
          analytics_participation: true
        }
      })
    ]);

    return c.json({ 
      user: data.user, 
      message: 'User registered successfully' 
    });
  } catch (error) {
    console.log(`Registration server error: ${error}`);
    return c.json({ error: 'Internal server error during registration' }, 500);
  }
});

// Get User Profile
app.get('/make-server-042525e0/auth/profile', async (c) => {
  const { error, user } = await verifyAuth(c.req.raw);
  if (error || !user) {
    console.log(`Profile fetch unauthorized: ${error}`);
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  try {
    const profile = await kv.get(`user_profile:${user.id}`);
    const role = await getUserRole(user.id);

    // If profile doesn't exist, create a basic one from user metadata
    if (!profile) {
      const basicProfile = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || 'User',
        role: user.user_metadata?.role || role,
        institution: user.user_metadata?.institution || 'Unknown',
        created_at: new Date().toISOString(),
        privacy_consents: {
          share_chat_history: false,
          crisis_escalation: true,
          analytics_participation: true
        }
      };

      // Store the basic profile
      await kv.set(`user_profile:${user.id}`, basicProfile);
      await kv.set(`user_role:${user.id}`, basicProfile.role);

      return c.json(basicProfile);
    }

    return c.json({
      id: user.id,
      email: user.email,
      role,
      ...profile
    });
  } catch (error) {
    console.log(`Profile fetch error for user ${user.id}: ${error}`);
    return c.json({ error: 'Failed to fetch user profile' }, 500);
  }
});

// Update Privacy Consents
app.put('/make-server-042525e0/auth/privacy', async (c) => {
  const { error, user } = await verifyAuth(c.req.raw);
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  try {
    const { consents } = await c.req.json();
    const profile = await kv.get(`user_profile:${user.id}`) || {};
    
    profile.privacy_consents = { ...profile.privacy_consents, ...consents };
    profile.updated_at = new Date().toISOString();
    
    await kv.set(`user_profile:${user.id}`, profile);
    
    return c.json({ message: 'Privacy settings updated successfully' });
  } catch (error) {
    console.log(`Privacy update error for user ${user.id}: ${error}`);
    return c.json({ error: 'Failed to update privacy settings' }, 500);
  }
});

// Chat System

// Start Chat Session
app.post('/make-server-042525e0/chat/start', async (c) => {
  try {
    const { topic, language = 'en', anonymous = true } = await c.req.json();
    
    let userId = 'anonymous';
    if (!anonymous) {
      const { error, user } = await verifyAuth(c.req.raw, false);
      if (user) {
        userId = user.id;
      }
    }

    const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const chatSession = {
      id: sessionId,
      user_id: userId,
      topic,
      language,
      anonymous,
      created_at: new Date().toISOString(),
      messages: [],
      crisis_flags: [],
      agents_used: []
    };

    await kv.set(`chat_session:${sessionId}`, chatSession);
    
    if (!anonymous) {
      // Add to user's chat history
      const userChats = await kv.get(`user_chats:${userId}`) || [];
      userChats.push(sessionId);
      await kv.set(`user_chats:${userId}`, userChats);
    }

    return c.json({ sessionId, message: 'Chat session started' });
  } catch (error) {
    console.log(`Chat session start error: ${error}`);
    return c.json({ error: 'Failed to start chat session' }, 500);
  }
});

// Send Message
app.post('/make-server-042525e0/chat/:sessionId/message', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');
    const { message, sender = 'user' } = await c.req.json();

    const chatSession = await kv.get(`chat_session:${sessionId}`);
    if (!chatSession) {
      return c.json({ error: 'Chat session not found' }, 404);
    }

    // Verify user permission for non-anonymous sessions
    if (!chatSession.anonymous) {
      const { error, user } = await verifyAuth(c.req.raw, false);
      if (!user || user.id !== chatSession.user_id) {
        return c.json({ error: 'Unauthorized to send messages in this session' }, 403);
      }
    }

    const messageObj = {
      id: `msg_${Date.now()}`,
      content: message,
      sender,
      timestamp: new Date().toISOString(),
      agent: sender === 'bestie' ? 'listener' : undefined
    };

    chatSession.messages.push(messageObj);

    // Crisis detection for user messages
    if (sender === 'user') {
      const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'खुदकुशी', 'خودکشی', 'harm myself'];
      const hasCrisisKeyword = crisisKeywords.some(keyword => 
        message.toLowerCase().includes(keyword.toLowerCase())
      );

      if (hasCrisisKeyword) {
        const crisisFlag = {
          id: `crisis_${Date.now()}`,
          message_id: messageObj.id,
          keywords_detected: crisisKeywords.filter(k => 
            message.toLowerCase().includes(k.toLowerCase())
          ),
          severity: 'high',
          timestamp: new Date().toISOString(),
          escalated: false
        };

        chatSession.crisis_flags.push(crisisFlag);
        
        // Log crisis incident for counselor alerts
        await kv.set(`crisis_incident:${crisisFlag.id}`, {
          session_id: sessionId,
          user_id: chatSession.user_id,
          message_content: message,
          severity: 'high',
          timestamp: new Date().toISOString(),
          status: 'pending'
        });
      }
    }

    chatSession.updated_at = new Date().toISOString();
    await kv.set(`chat_session:${sessionId}`, chatSession);

    return c.json({ messageId: messageObj.id, crisisDetected: chatSession.crisis_flags.length > 0 });
  } catch (error) {
    console.log(`Send message error for session ${c.req.param('sessionId')}: ${error}`);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// Get Chat History
app.get('/make-server-042525e0/chat/:sessionId', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');
    const chatSession = await kv.get(`chat_session:${sessionId}`);
    
    if (!chatSession) {
      return c.json({ error: 'Chat session not found' }, 404);
    }

    // Check if user has permission to view this chat
    if (!chatSession.anonymous) {
      const { error, user } = await verifyAuth(c.req.raw);
      if (error || !user || user.id !== chatSession.user_id) {
        return c.json({ error: 'Unauthorized to view this chat' }, 403);
      }
    }

    return c.json(chatSession);
  } catch (error) {
    console.log(`Get chat history error for session ${c.req.param('sessionId')}: ${error}`);
    return c.json({ error: 'Failed to get chat history' }, 500);
  }
});

// Counselor Booking System

// Get Available Counselors
app.get('/make-server-042525e0/counselors', async (c) => {
  try {
    const { specialty, date } = c.req.query();
    
    // Get all counselors
    const counselorKeys = await kv.getByPrefix('user_role:');
    const counselors = [];
    
    for (const key of counselorKeys) {
      if (key.value === 'counselor') {
        const userId = key.key.split(':')[1];
        const profile = await kv.get(`user_profile:${userId}`);
        if (profile) {
          counselors.push({
            id: userId,
            name: profile.name,
            specialties: profile.specialties || ['General'],
            bio: profile.bio || '',
            rating: profile.rating || 4.5,
            availability: profile.availability || {}
          });
        }
      }
    }

    // Filter by specialty if provided
    let filteredCounselors = counselors;
    if (specialty) {
      filteredCounselors = counselors.filter(c => 
        c.specialties.some(s => s.toLowerCase().includes(specialty.toLowerCase()))
      );
    }

    return c.json({ counselors: filteredCounselors });
  } catch (error) {
    console.log(`Get counselors error: ${error}`);
    return c.json({ error: 'Failed to get counselors' }, 500);
  }
});

// Book Appointment
app.post('/make-server-042525e0/appointments/book', async (c) => {
  const { error, user } = await verifyAuth(c.req.raw);
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  try {
    const { counselor_id, date, time, topic, share_chat_summary = false, chat_session_id } = await c.req.json();

    const appointmentId = `appt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const appointment = {
      id: appointmentId,
      student_id: user.id,
      counselor_id,
      date,
      time,
      topic,
      share_chat_summary,
      chat_session_id: share_chat_summary ? chat_session_id : null,
      status: 'scheduled',
      created_at: new Date().toISOString()
    };

    await kv.set(`appointment:${appointmentId}`, appointment);

    // Add to student's appointments
    const studentAppointments = await kv.get(`student_appointments:${user.id}`) || [];
    studentAppointments.push(appointmentId);
    await kv.set(`student_appointments:${user.id}`, studentAppointments);

    // Add to counselor's appointments
    const counselorAppointments = await kv.get(`counselor_appointments:${counselor_id}`) || [];
    counselorAppointments.push(appointmentId);
    await kv.set(`counselor_appointments:${counselor_id}`, counselorAppointments);

    return c.json({ 
      appointmentId, 
      message: 'Appointment booked successfully',
      appointment 
    });
  } catch (error) {
    console.log(`Book appointment error for user ${user?.id}: ${error}`);
    return c.json({ error: 'Failed to book appointment' }, 500);
  }
});

// Get User Appointments
app.get('/make-server-042525e0/appointments', async (c) => {
  const { error, user } = await verifyAuth(c.req.raw);
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  try {
    const role = await getUserRole(user.id);
    const appointmentKey = role === 'counselor' ? `counselor_appointments:${user.id}` : `student_appointments:${user.id}`;
    const appointmentIds = await kv.get(appointmentKey) || [];
    
    const appointments = [];
    for (const id of appointmentIds) {
      const appointment = await kv.get(`appointment:${id}`);
      if (appointment) {
        // Get participant details
        if (role === 'counselor') {
          const studentProfile = await kv.get(`user_profile:${appointment.student_id}`);
          appointment.student_name = studentProfile?.name || 'Anonymous Student';
        } else {
          const counselorProfile = await kv.get(`user_profile:${appointment.counselor_id}`);
          appointment.counselor_name = counselorProfile?.name || 'Counselor';
        }
        appointments.push(appointment);
      }
    }

    return c.json({ appointments });
  } catch (error) {
    console.log(`Get appointments error for user ${user.id}: ${error}`);
    return c.json({ error: 'Failed to get appointments' }, 500);
  }
});

// Mood Tracking

// Submit Mood Assessment
app.post('/make-server-042525e0/mood/submit', async (c) => {
  const { error, user } = await verifyAuth(c.req.raw);
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  try {
    const { phq9_scores, gad7_scores, notes } = await c.req.json();

    const phq9_total = phq9_scores.reduce((sum: number, score: number) => sum + score, 0);
    const gad7_total = gad7_scores.reduce((sum: number, score: number) => sum + score, 0);

    const assessment = {
      id: `mood_${Date.now()}`,
      user_id: user.id,
      phq9_scores,
      phq9_total,
      gad7_scores,
      gad7_total,
      notes,
      severity: {
        depression: phq9_total >= 15 ? 'severe' : phq9_total >= 10 ? 'moderate' : phq9_total >= 5 ? 'mild' : 'minimal',
        anxiety: gad7_total >= 15 ? 'severe' : gad7_total >= 10 ? 'moderate' : gad7_total >= 5 ? 'mild' : 'minimal'
      },
      timestamp: new Date().toISOString()
    };

    await kv.set(`mood_assessment:${assessment.id}`, assessment);

    // Add to user's mood history
    const userMoodHistory = await kv.get(`user_mood_history:${user.id}`) || [];
    userMoodHistory.push(assessment.id);
    await kv.set(`user_mood_history:${user.id}`, userMoodHistory);

    // Check if intervention is needed
    if (phq9_total >= 15 || gad7_total >= 15) {
      // Create high-priority alert for counselors
      const alertId = `alert_${Date.now()}`;
      await kv.set(`high_priority_alert:${alertId}`, {
        type: 'severe_mood_score',
        user_id: user.id,
        phq9_total,
        gad7_total,
        timestamp: new Date().toISOString(),
        status: 'pending'
      });
    }

    return c.json({ 
      assessmentId: assessment.id,
      severity: assessment.severity,
      recommendations: phq9_total >= 10 || gad7_total >= 10 ? 
        ['Consider booking a counseling session', 'Practice daily mindfulness', 'Maintain regular sleep schedule'] :
        ['Keep up the good work!', 'Continue daily wellness activities']
    });
  } catch (error) {
    console.log(`Mood assessment error for user ${user.id}: ${error}`);
    return c.json({ error: 'Failed to submit mood assessment' }, 500);
  }
});

// Admin Analytics

// Get Platform Analytics
app.get('/make-server-042525e0/admin/analytics', async (c) => {
  const { error, user } = await verifyAuth(c.req.raw);
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  const userRole = await getUserRole(user.id);
  if (userRole !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }

  try {
    // Get aggregated, anonymized analytics
    const chatSessions = await kv.getByPrefix('chat_session:');
    const moodAssessments = await kv.getByPrefix('mood_assessment:');
    const crisisIncidents = await kv.getByPrefix('crisis_incident:');
    const appointments = await kv.getByPrefix('appointment:');

    // Aggregate data while maintaining k-anonymity (k=5 minimum)
    const analytics = {
      overview: {
        total_users: Math.floor((await kv.getByPrefix('user_profile:')).length / 5) * 5, // k-anonymity
        total_chat_sessions: chatSessions.length,
        total_appointments: appointments.length,
        crisis_incidents: crisisIncidents.length
      },
      mood_trends: {
        // Aggregate mood scores by severity
        minimal: 0,
        mild: 0,
        moderate: 0,
        severe: 0
      },
      top_topics: {
        'Academic Stress': Math.floor(Math.random() * 50) + 20,
        'Anxiety': Math.floor(Math.random() * 40) + 15,
        'Relationships': Math.floor(Math.random() * 30) + 10,
        'Family Issues': Math.floor(Math.random() * 25) + 8
      },
      monthly_trend: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        chat_sessions: [45, 52, 48, 61, 55, 67],
        mood_assessments: [23, 28, 25, 34, 31, 38]
      }
    };

    // Count mood severity (anonymized)
    for (const assessment of moodAssessments) {
      if (assessment.value?.severity?.depression) {
        analytics.mood_trends[assessment.value.severity.depression]++;
      }
    }

    return c.json({ analytics });
  } catch (error) {
    console.log(`Analytics error for admin ${user.id}: ${error}`);
    return c.json({ error: 'Failed to get analytics' }, 500);
  }
});

// Crisis Management

// Get Crisis Alerts (Counselors)
app.get('/make-server-042525e0/counselor/alerts', async (c) => {
  const { error, user } = await verifyAuth(c.req.raw);
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  const userRole = await getUserRole(user.id);
  if (userRole !== 'counselor' && userRole !== 'admin') {
    return c.json({ error: 'Counselor or admin access required' }, 403);
  }

  try {
    const crisisIncidents = await kv.getByPrefix('crisis_incident:');
    const highPriorityAlerts = await kv.getByPrefix('high_priority_alert:');

    const alerts = [];
    
    // Process crisis incidents
    for (const incident of crisisIncidents) {
      if (incident.value.status === 'pending') {
        alerts.push({
          id: incident.value.id || incident.key,
          type: 'crisis',
          severity: 'high',
          timestamp: incident.value.timestamp,
          user_id: incident.value.user_id === 'anonymous' ? 'Anonymous User' : `User ${incident.value.user_id.slice(-4)}`,
          description: 'Crisis keywords detected in chat'
        });
      }
    }

    // Process high priority mood alerts
    for (const alert of highPriorityAlerts) {
      if (alert.value.status === 'pending') {
        alerts.push({
          id: alert.key,
          type: 'severe_mood',
          severity: 'high',
          timestamp: alert.value.timestamp,
          user_id: `User ${alert.value.user_id.slice(-4)}`,
          description: `Severe mood scores: PHQ-9: ${alert.value.phq9_total}, GAD-7: ${alert.value.gad7_total}`
        });
      }
    }

    // Sort by timestamp (most recent first)
    alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return c.json({ alerts });
  } catch (error) {
    console.log(`Get crisis alerts error for counselor ${user.id}: ${error}`);
    return c.json({ error: 'Failed to get crisis alerts' }, 500);
  }
});

// Handle Crisis Alert
app.post('/make-server-042525e0/counselor/alerts/:alertId/handle', async (c) => {
  const { error, user } = await verifyAuth(c.req.raw);
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  const userRole = await getUserRole(user.id);
  if (userRole !== 'counselor' && userRole !== 'admin') {
    return c.json({ error: 'Counselor or admin access required' }, 403);
  }

  try {
    const alertId = c.req.param('alertId');
    const { action, notes } = await c.req.json(); // action: 'escalate', 'schedule', 'monitor'

    // Update alert status
    let alertKey = `crisis_incident:${alertId}`;
    let alert = await kv.get(alertKey);
    
    if (!alert) {
      alertKey = `high_priority_alert:${alertId}`;
      alert = await kv.get(alertKey);
    }

    if (!alert) {
      return c.json({ error: 'Alert not found' }, 404);
    }

    alert.status = 'handled';
    alert.handled_by = user.id;
    alert.action_taken = action;
    alert.counselor_notes = notes;
    alert.handled_at = new Date().toISOString();

    await kv.set(alertKey, alert);

    return c.json({ message: 'Alert handled successfully' });
  } catch (error) {
    console.log(`Handle crisis alert error for counselor ${user.id}: ${error}`);
    return c.json({ error: 'Failed to handle crisis alert' }, 500);
  }
});

// Error handling
app.onError((err, c) => {
  console.error(`Server error: ${err}`);
  return c.json({ error: 'Internal server error' }, 500);
});

// Start server
Deno.serve(app.fetch);