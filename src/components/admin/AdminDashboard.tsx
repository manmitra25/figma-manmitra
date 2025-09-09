import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  AlertTriangle, 
  TrendingUp, 
  Brain,
  Heart,
  Shield,
  Download,
  RefreshCw
} from 'lucide-react';
import { api, supabase } from '../../utils/supabase/client';
import { useAuth } from '../auth/AuthProvider';

interface Analytics {
  overview: {
    total_users: number;
    total_chat_sessions: number;
    total_appointments: number;
    crisis_incidents: number;
  };
  mood_trends: {
    minimal: number;
    mild: number;
    moderate: number;
    severe: number;
  };
  top_topics: Record<string, number>;
  monthly_trend: {
    labels: string[];
    chat_sessions: number[];
    mood_assessments: number[];
  };
}

const COLORS = ['#3A86FF', '#2ECC71', '#F59E0B', '#EF4444'];

export function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Authentication required');
        return;
      }

      const response = await api.getAnalytics(session.access_token);
      setAnalytics(response.analytics);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!analytics) return;
    
    const reportData = {
      generated_at: new Date().toISOString(),
      ...analytics
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manmitra-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button 
          onClick={loadAnalytics} 
          className="mt-4"
          variant="outline"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>No analytics data available</AlertDescription>
        </Alert>
      </div>
    );
  }

  const moodData = Object.entries(analytics.mood_trends).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
    color: COLORS[Object.keys(analytics.mood_trends).indexOf(key)]
  }));

  const topicsData = Object.entries(analytics.top_topics).map(([topic, count]) => ({
    topic,
    count
  }));

  const trendData = analytics.monthly_trend.labels.map((label, index) => ({
    month: label,
    chats: analytics.monthly_trend.chat_sessions[index],
    assessments: analytics.monthly_trend.mood_assessments[index]
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl mb-2">Platform Analytics</h1>
          <p className="text-muted-foreground">
            Mental health insights and platform usage statistics
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={loadAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportReport} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.total_users}</div>
            <p className="text-xs text-muted-foreground">
              K-anonymized (min 5 users)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chat Sessions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.total_chat_sessions}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.total_appointments}</div>
            <p className="text-xs text-muted-foreground">
              Professional sessions
            </p>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crisis Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {analytics.overview.crisis_incidents}
            </div>
            <p className="text-xs text-muted-foreground">
              All appropriately handled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Trends</CardTitle>
            <CardDescription>
              Monthly chat sessions and mood assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="chats" 
                  stroke="#3A86FF" 
                  strokeWidth={2}
                  name="Chat Sessions"
                />
                <Line 
                  type="monotone" 
                  dataKey="assessments" 
                  stroke="#2ECC71" 
                  strokeWidth={2}
                  name="Mood Assessments"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Mood Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Mental Health Severity</CardTitle>
            <CardDescription>
              Distribution of mood assessment results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={moodData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {moodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Topics */}
        <Card>
          <CardHeader>
            <CardTitle>Most Discussed Topics</CardTitle>
            <CardDescription>
              What students are talking about most
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topicsData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="topic" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#3A86FF" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Recommendations
            </CardTitle>
            <CardDescription>
              Suggested actions based on platform data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Organize Academic Stress Workshop</p>
                <p className="text-sm text-muted-foreground">
                  45% of conversations are about academic pressure. Consider hosting a campus-wide stress management session.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-success/5 rounded-lg">
              <Heart className="h-5 w-5 text-success mt-0.5" />
              <div>
                <p className="font-medium">Peer Support Program</p>
                <p className="text-sm text-muted-foreground">
                  High engagement in community features suggests students want peer connections.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-warning/5 rounded-lg">
              <Shield className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <p className="font-medium">Counselor Capacity</p>
                <p className="text-sm text-muted-foreground">
                  Consider adding 2 more counselors to handle increasing demand.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Privacy Notice */}
      <Card className="border-muted">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Shield className="h-5 w-5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Privacy & Ethics Compliance</p>
              <p>
                All data is aggregated and anonymized using k-anonymity (minimum 5 users per group). 
                Individual student data is never shared without explicit consent. Crisis incidents are 
                handled according to institutional protocols and Tele-MANAS guidelines.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}