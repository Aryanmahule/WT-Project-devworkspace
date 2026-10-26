import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Briefcase
} from 'lucide-react';
import { api } from '../../services/api';

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await api.getDashboardAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const metrics = data?.metrics || {};
  const workload = data?.workload_chart || [];

  const handleExportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Projects', metrics.total_projects || 0],
      ['Active Projects', metrics.active_projects || 0],
      ['Completed Projects', metrics.completed_projects || 0],
      ['Total Tasks', metrics.total_tasks || 0],
      ['Completed Tasks', metrics.completed_tasks || 0],
      ['In Progress Tasks', metrics.in_progress_tasks || 0],
      ['Review Tasks', metrics.review_tasks || 0],
      ['Blocked Tasks', metrics.blocked_tasks || 0],
      ['Overdue Tasks', metrics.overdue_tasks || 0],
      ['Overall Completion Rate %', metrics.overall_progress || 0],
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `apex_analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="max-w-content mx-auto p-8 text-center text-text-muted text-body">
        Loading reports and analytics...
      </div>
    );
  }

  return (
    <div className="max-w-content mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-page-title text-text-main font-semibold">
            Executive Reporting & Analytics
          </h1>
          <p className="text-secondary text-text-muted mt-1">
            Calculated database metrics, team delivery velocity, and workload balancing
          </p>
        </div>
        <button onClick={handleExportCSV} className="btn-outlined">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="ui-card flex flex-col justify-between">
          <div className="text-[11px] font-semibold tracking-wider text-text-muted uppercase">
            Overall Velocity
          </div>
          <div className="my-3 text-[32px] font-semibold text-text-main leading-none">
            {metrics.overall_progress || 0}%
          </div>
          <div className="text-secondary text-text-muted">
            {metrics.completed_tasks || 0} tasks resolved
          </div>
        </div>

        <div className="ui-card flex flex-col justify-between">
          <div className="text-[11px] font-semibold tracking-wider text-text-muted uppercase">
            In Flight Work
          </div>
          <div className="my-3 text-[32px] font-semibold text-accent leading-none">
            {(metrics.in_progress_tasks || 0) + (metrics.review_tasks || 0)}
          </div>
          <div className="text-secondary text-text-muted">
            {metrics.in_progress_tasks || 0} active, {metrics.review_tasks || 0} in review
          </div>
        </div>

        <div className="ui-card flex flex-col justify-between">
          <div className="text-[11px] font-semibold tracking-wider text-text-muted uppercase">
            Critical Risks
          </div>
          <div className="my-3 text-[32px] font-semibold text-danger leading-none">
            {(metrics.blocked_tasks || 0) + (metrics.overdue_tasks || 0)}
          </div>
          <div className="text-secondary text-text-muted">
            {metrics.blocked_tasks || 0} blocked, {metrics.overdue_tasks || 0} overdue
          </div>
        </div>

        <div className="ui-card flex flex-col justify-between">
          <div className="text-[11px] font-semibold tracking-wider text-text-muted uppercase">
            Active Initiatives
          </div>
          <div className="my-3 text-[32px] font-semibold text-text-main leading-none">
            {metrics.active_projects || 0}
          </div>
          <div className="text-secondary text-text-muted">
            Across engineering teams
          </div>
        </div>
      </div>

      {/* Detailed Analysis Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <div className="ui-card">
          <div className="flex items-center gap-2 mb-6">
            <PieChart size={18} className="text-accent" />
            <h2 className="text-card-title text-text-main font-semibold">
              Task Status Distribution
            </h2>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Completed', count: metrics.completed_tasks || 0, barColor: 'bg-[#12B76A]' },
              { label: 'In Progress', count: metrics.in_progress_tasks || 0, barColor: 'bg-accent' },
              { label: 'In Review', count: metrics.review_tasks || 0, barColor: 'bg-[#F79009]' },
              { label: 'Blocked', count: metrics.blocked_tasks || 0, barColor: 'bg-danger' },
              { label: 'To Do', count: metrics.todo_tasks || 0, barColor: 'bg-[#98A2B3]' },
            ].map((item) => {
              const total = metrics.total_tasks || 1;
              const pct = Math.round((item.count / total) * 100);
              return (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-secondary">
                    <span className="font-medium text-text-main">{item.label}</span>
                    <span className="text-text-muted">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.barColor} rounded-full transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Workload Balance */}
        <div className="ui-card">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={18} className="text-accent" />
            <h2 className="text-card-title text-text-main font-semibold">
              Team Workload Balance
            </h2>
          </div>
          <div className="space-y-4">
            {workload.length === 0 ? (
              <div className="text-secondary text-text-muted py-8 text-center">
                No active workload recorded for current sprint.
              </div>
            ) : (
              workload.map((w: any) => {
                const maxExpectedTasks = 8;
                const pct = Math.min(100, Math.round((w.tasks / maxExpectedTasks) * 100));
                return (
                  <div key={w.user} className="space-y-1.5">
                    <div className="flex items-center justify-between text-secondary">
                      <span className="font-medium text-text-main">{w.user}</span>
                      <span className="text-text-muted">{w.tasks} active tasks</span>
                    </div>
                    <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
