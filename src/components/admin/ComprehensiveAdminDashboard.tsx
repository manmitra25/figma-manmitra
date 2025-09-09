import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { 
  Users, UserCheck, AlertTriangle, MessageSquare, Calendar, TrendingUp, TrendingDown, 
  Shield, Settings, Bell, Flag, Activity, Heart, Brain, Clock, Filter, Search,
  Download, FileText, Eye, Edit, Trash2, Plus, CheckCircle, XCircle
} from 'lucide-react';

interface AdminDashboardProps {
  language?: string;
}

// Sample data for dashboard
const userGrowthData = [
  { month: 'Jan', students: 120, counselors: 8, total: 128 },
  { month: 'Feb', students: 180, counselors: 12, total: 192 },
  { month: 'Mar', students: 250, counselors: 15, total: 265 },
  { month: 'Apr', students: 320, counselors: 18, total: 338 },
  { month: 'May', students: 420, counselors: 22, total: 442 },
  { month: 'Jun', students: 520, counselors: 25, total: 545 }
];

const mentalHealthData = [
  { category: 'Anxiety', mild: 45, moderate: 32, severe: 8 },
  { category: 'Depression', mild: 38, moderate: 28, severe: 12 },
  { category: 'Stress', mild: 52, moderate: 41, severe: 15 },
  { category: 'Sleep Issues', mild: 35, moderate: 22, severe: 6 }
];

const regionData = [
  { name: 'Srinagar', value: 35, color: '#3A86FF' },
  { name: 'Jammu', value: 28, color: '#2ECC71' },
  { name: 'Baramulla', value: 15, color: '#F59E0B' },
  { name: 'Anantnag', value: 12, color: '#EF4444' },
  { name: 'Other', value: 10, color: '#8B5CF6' }
];

const crisisAlerts = [
  { id: '1', student: 'Anonymous_User_1', type: 'High PHQ-9 Score', severity: 'high', timestamp: '10 min ago', status: 'escalated' },
  { id: '2', student: 'Anonymous_User_2', type: 'Suicidal Ideation', severity: 'critical', timestamp: '1 hour ago', status: 'resolved' },
  { id: '3', student: 'Anonymous_User_3', type: 'Panic Attack', severity: 'medium', timestamp: '3 hours ago', status: 'monitoring' }
];

const forumReports = [
  { id: '1', postId: 'post_123', reporter: 'Anonymous', reason: 'Inappropriate content', status: 'pending' },
  { id: '2', postId: 'post_456', reporter: 'Anonymous', reason: 'Spam', status: 'resolved' },
  { id: '3', postId: 'post_789', reporter: 'Anonymous', reason: 'Harmful advice', status: 'escalated' }
];

const counselorPerformance = [
  { name: 'Dr. Priya Sharma', sessions: 45, rating: 4.8, responseTime: '12 min', utilization: 85 },
  { name: 'Dr. Rajesh Kumar', sessions: 52, rating: 4.9, responseTime: '8 min', utilization: 92 },
  { name: 'Dr. Fatima Sheikh', sessions: 38, rating: 4.7, responseTime: '15 min', utilization: 78 }
];

export function ComprehensiveAdminDashboard({ language = 'en' }: AdminDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [showCrisisDetails, setShowCrisisDetails] = useState<string | null>(null);

  const texts = {
    overview: 'Overview',
    users: 'Users',
    crisis: 'Crisis Management',
    content: 'Content Moderation',
    counselors: 'Counselors',
    analytics: 'Analytics',
    settings: 'Settings',
    totalUsers: 'Total Users',
    activeStudents: 'Active Students',
    activeCounselors: 'Active Counselors',
    crisisAlerts: 'Crisis Alerts',
    last30Days: 'Last 30 days',
    userGrowth: 'User Growth',
    mentalHealthTrends: 'Mental Health Trends',
    regionalDistribution: 'Regional Distribution',
    recentAlerts: 'Recent Crisis Alerts',
    forumReports: 'Forum Reports',
    counselorMetrics: 'Counselor Performance',
    viewAll: 'View All',
    escalate: 'Escalate',
    resolve: 'Resolve',
    monitor: 'Monitor',
    pending: 'Pending',
    resolved: 'Resolved',
    escalated: 'Escalated',
    high: 'High',
    medium: 'Medium',
    critical: 'Critical',
    approve: 'Approve',
    reject: 'Reject',
    sessions: 'Sessions',
    rating: 'Rating',
    responseTime: 'Response Time',
    utilization: 'Utilization',
    export: 'Export Data',
    filter: 'Filter',
    search: 'Search',
    refresh: 'Refresh'
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-warning text-warning-foreground';
      case 'medium': return 'bg-primary text-primary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-success text-success-foreground';
      case 'escalated': return 'bg-destructive text-destructive-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'monitoring': return 'bg-primary text-primary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl mb-2">ManMitra Admin Dashboard</h1>
            <p className="text-muted-foreground text-lg">Comprehensive platform management for J&K mental health services</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              {texts.export}
            </Button>
          </div>
        </div>

        {/* Crisis Alert Banner */}
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              <div>
                <h3 className="font-medium text-destructive">3 Active Crisis Alerts</h3>
                <p className="text-sm text-destructive/80">Immediate attention required for high-risk students</p>
              </div>
            </div>
            <Button variant="destructive" onClick={() => setSelectedTab('crisis')}>
              View Crisis Dashboard
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-6 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            {texts.overview}
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {texts.users}
          </TabsTrigger>
          <TabsTrigger value="crisis" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {texts.crisis}
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            {texts.content}
          </TabsTrigger>
          <TabsTrigger value="counselors" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            {texts.counselors}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart className="w-4 h-4" />
            {texts.analytics}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{texts.totalUsers}</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,247</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-success">+12%</span> from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{texts.activeStudents}</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,182</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-success">+8%</span> weekly active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{texts.activeCounselors}</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">25</div>
                  <p className="text-xs text-muted-foreground">
                    92% average utilization
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{texts.crisisAlerts}</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">3</div>
                  <p className="text-xs text-muted-foreground">
                    Requiring immediate attention
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{texts.userGrowth}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={userGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="students" stroke="#3A86FF" strokeWidth={2} />
                      <Line type="monotone" dataKey="counselors" stroke="#2ECC71" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{texts.regionalDistribution}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={regionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {regionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{texts.recentAlerts}</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setSelectedTab('crisis')}>
                      {texts.viewAll}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {crisisAlerts.slice(0, 3).map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className={`w-5 h-5 ${alert.severity === 'critical' ? 'text-destructive' : alert.severity === 'high' ? 'text-warning' : 'text-primary'}`} />
                          <div>
                            <p className="font-medium">{alert.type}</p>
                            <p className="text-sm text-muted-foreground">{alert.timestamp}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(alert.status)}>
                          {alert.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{texts.forumReports}</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setSelectedTab('content')}>
                      {texts.viewAll}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {forumReports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Flag className="w-5 h-5 text-warning" />
                          <div>
                            <p className="font-medium">{report.reason}</p>
                            <p className="text-sm text-muted-foreground">Post #{report.postId}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="crisis">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Crisis Management Center</h2>
                <p className="text-muted-foreground">Monitor and respond to mental health emergencies</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">
                  <Bell className="w-4 h-4 mr-2" />
                  Alert Settings
                </Button>
                <Button variant="destructive">
                  Emergency Protocol
                </Button>
              </div>
            </div>

            {/* Crisis Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Active Crisis Alerts</CardTitle>
                <CardDescription>Immediate intervention required</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {crisisAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <span className="font-medium">{alert.type}</span>
                          <span className="text-sm text-muted-foreground">{alert.timestamp}</span>
                        </div>
                        <Badge className={getStatusColor(alert.status)}>
                          {alert.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <Label className="text-sm font-medium">Student ID</Label>
                          <p className="text-sm">{alert.student}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Detection Method</Label>
                          <p className="text-sm">Automated PHQ-9 Analysis</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Risk Score</Label>
                          <p className="text-sm">8.5/10</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="destructive" size="sm">
                          {texts.escalate}
                        </Button>
                        <Button variant="outline" size="sm">
                          Contact Counselor
                        </Button>
                        <Button variant="outline" size="sm">
                          View History
                        </Button>
                        <Button variant="secondary" size="sm">
                          {texts.resolve}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Crisis Response Protocols */}
            <Card>
              <CardHeader>
                <CardTitle>Crisis Response Protocols</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium text-destructive mb-2">Level 1: Critical</h3>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Immediate counselor notification</li>
                      <li>• Emergency contact activation</li>
                      <li>• Tele-MANAS escalation</li>
                      <li>• 24/7 monitoring</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium text-warning mb-2">Level 2: High Risk</h3>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Counselor assignment within 2 hours</li>
                      <li>• Daily check-ins</li>
                      <li>• Resource recommendations</li>
                      <li>• Family notification (if consented)</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium text-primary mb-2">Level 3: Monitoring</h3>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Regular mood tracking</li>
                      <li>• Peer support group referral</li>
                      <li>• Self-help resource provision</li>
                      <li>• Weekly assessment</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="counselors">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Counselor Management</h2>
                <p className="text-muted-foreground">Monitor performance and manage counselor resources</p>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Counselor
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{texts.counselorMetrics}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {counselorPerformance.map((counselor, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {counselor.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{counselor.name}</h3>
                            <p className="text-sm text-muted-foreground">Clinical Psychologist</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-sm font-medium">{texts.sessions}</Label>
                          <p className="text-lg font-semibold">{counselor.sessions}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">{texts.rating}</Label>
                          <p className="text-lg font-semibold">{counselor.rating}/5.0</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">{texts.responseTime}</Label>
                          <p className="text-lg font-semibold">{counselor.responseTime}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">{texts.utilization}</Label>
                          <div className="flex items-center gap-2">
                            <Progress value={counselor.utilization} className="flex-1" />
                            <span className="text-sm">{counselor.utilization}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{texts.mentalHealthTrends}</CardTitle>
                <CardDescription>Analysis of mental health patterns across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={mentalHealthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="mild" stackId="a" fill="#2ECC71" />
                    <Bar dataKey="moderate" stackId="a" fill="#F59E0B" />
                    <Bar dataKey="severe" stackId="a" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Content Moderation</h2>
                <p className="text-muted-foreground">Review and moderate forum content and user reports</p>
              </div>
              <div className="flex items-center gap-2">
                <Input placeholder="Search reports..." className="w-64" />
                <Button variant="outline">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Pending Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {forumReports.filter(r => r.status === 'pending').map((report) => (
                    <div key={report.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{report.reason}</h3>
                          <p className="text-sm text-muted-foreground">Post ID: {report.postId}</p>
                        </div>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Post
                        </Button>
                        <Button variant="destructive" size="sm">
                          Remove Content
                        </Button>
                        <Button variant="secondary" size="sm">
                          {texts.approve}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}