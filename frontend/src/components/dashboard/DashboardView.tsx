import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { StatStrip } from '../common/StatStrip';
import { ActivityItem } from '../common/ActivityItem';
import { ProgressBar } from '../common/ProgressBar';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { NavTab } from '../layout/Sidebar';
import { Calendar, Video, CheckCircle2 } from 'lucide-react';

interface DashboardViewProps {
  onNavigateTab: (tab: NavTab) => void;
  onJoinMeeting?: (roomCode: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab, onJoinMeeting }) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.getDashboardAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'there';

  // Format today's date: e.g. "Monday, October 26, 2026"
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  if (loading) {
    return (
      <div className="max-w-content mx-auto p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-secondary text-text-muted">Loading dashboard...</div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const userTasks = data?.user_tasks || [];
  const upcomingMeetings = data?.upcoming_meetings || [];
  const nextMeeting = upcomingMeetings.length > 0 ? upcomingMeetings[0] : null;
  const recentActivity = data?.recent_activity || [];
  const workloadChart = data?.workload_chart || [];

  const activeProjects = metrics.active_projects || 0;
  const completedTasks = metrics.completed_tasks || 0;
  const totalTasks = metrics.total_tasks || 0;
  const progressPercent = metrics.overall_progress || 0;
  const needsAttention = (metrics.blocked_tasks || 0) + (metrics.overdue_tasks || 0);
  const inProgressOrReview = (metrics.in_progress_tasks || 0) + (metrics.review_tasks || 0);

  return (
    <div className="max-w-content mx-auto p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-page-title text-text-main">
            Good morning, {firstName}
          </h1>
          <div className="text-secondary text-text-muted mt-1">
            {formattedDate}
          </div>
        </div>

        {/* Two outlined secondary buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('projects')}
            className="btn-outlined"
          >
            Sprint board
          </button>
          <button
            onClick={() => onNavigateTab('dev')}
            className="btn-outlined"
          >
            Docker hub
          </button>
        </div>
      </div>

      {/* Summary: ONE card split into 4 cells with vertical dividers */}
      <StatStrip
        activeProjects={activeProjects}
        completedTasks={completedTasks}
        totalTasks={totalTasks}
        progressPercent={progressPercent}
        needsAttention={needsAttention}
        inProgressOrReview={inProgressOrReview}
      />

      {/* Row 2: "My tasks" card + "Next meeting" card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card: My tasks */}
        <Card
          title="My tasks"
          action={
            <button
              onClick={() => onNavigateTab('tasks')}
              className="text-secondary text-accent hover:underline font-medium"
            >
              View all
            </button>
          }
        >
          {userTasks.length === 0 ? (
            <div className="py-8 text-center">
              <div className="text-body text-text-muted">
                No tasks assigned to you right now.
              </div>
              <div className="text-secondary text-text-muted mt-1">
                You're all caught up for the day!
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {userTasks.slice(0, 4).map((task: any) => (
                <div
                  key={task.id}
                  className="p-3.5 rounded-[8px] border border-border bg-page/50 flex items-center justify-between gap-3"
                >
                  <div className="overflow-hidden">
                    <div className="text-body font-medium text-text-main truncate">
                      {task.title}
                    </div>
                    <div className="text-secondary text-text-muted mt-0.5">
                      {task.due_date ? `Due ${task.due_date}` : 'No due date'}
                    </div>
                  </div>
                  <span className="text-[12px] font-medium px-2.5 py-1 rounded-full border border-border capitalize bg-surface text-text-main flex-shrink-0">
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Card: Next meeting */}
        <Card title="Next meeting">
          {nextMeeting ? (
            <div className="flex flex-col justify-between h-[calc(100%-36px)] pt-1">
              <div>
                <h3 className="text-[17px] font-semibold text-text-main">
                  {nextMeeting.title}
                </h3>
                <div className="text-body text-text-muted mt-2 flex items-center gap-2">
                  <Calendar size={15} className="text-text-muted flex-shrink-0" />
                  <span>
                    {nextMeeting.scheduled_start
                      ? new Date(nextMeeting.scheduled_start).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : 'Scheduled'}
                  </span>
                </div>
                <div className="text-secondary text-text-muted mt-1">
                  Host: {nextMeeting.host?.full_name || 'Team Lead'} &middot; Room {nextMeeting.room_code}
                </div>
                {nextMeeting.description && (
                  <p className="text-secondary text-text-muted mt-3 line-clamp-2">
                    {nextMeeting.description}
                  </p>
                )}
              </div>

              <div className="pt-6 mt-auto">
                <button
                  onClick={() => {
                    if (onJoinMeeting) {
                      onJoinMeeting(nextMeeting.room_code);
                    }
                    onNavigateTab('meetings');
                  }}
                  className="btn-accent w-full"
                >
                  <Video size={16} />
                  <span>Join meeting</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-body text-text-muted">
              No meetings scheduled for today.
            </div>
          )}
        </Card>
      </div>

      {/* Row 3: "Team workload" with thin 6px bars + "Recent activity" as a clean list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card: Team workload */}
        <Card title="Team workload">
          <div className="space-y-4">
            {workloadChart.length === 0 ? (
              <div className="py-6 text-center text-secondary text-text-muted">
                No active workload recorded.
              </div>
            ) : (
              workloadChart.slice(0, 6).map((item: any) => {
                const percentage = Math.min(100, Math.round((item.tasks / 8) * 100));
                return (
                  <div key={item.user} className="space-y-1.5">
                    <div className="flex items-center justify-between text-body">
                      <span className="font-medium text-text-main">{item.user}</span>
                      <span className="text-secondary text-text-muted">
                        {item.tasks} {item.tasks === 1 ? 'task' : 'tasks'}
                      </span>
                    </div>
                    <ProgressBar progress={percentage} height={6} />
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Card: Recent activity */}
        <Card title="Recent activity">
          <div className="divide-y divide-border/60">
            {recentActivity.length === 0 ? (
              <div className="py-6 text-center text-secondary text-text-muted">
                No recent activity logged.
              </div>
            ) : (
              recentActivity.slice(0, 5).map((log: any) => (
                <ActivityItem key={log.id} activity={log} />
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
