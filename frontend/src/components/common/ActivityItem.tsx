import React from 'react';
import { AuditLog } from '../../types';

interface ActivityItemProps {
  activity: AuditLog;
}

export const formatActionText = (log: AuditLog): string => {
  const actor = log.user_name || 'System';
  const details = log.details || {};

  switch (log.action) {
    case 'user_login':
      return `${actor} signed in`;
    case 'user_registered':
      return `${actor} registered an account`;
    case 'task_created':
      return details.title
        ? `${actor} created task "${details.title}"`
        : `${actor} created a new task`;
    case 'task_status_changed':
      return details.new_status
        ? `${actor} moved task to ${details.new_status.replace('_', ' ')}`
        : `${actor} updated task status`;
    case 'project_created':
      return details.name
        ? `${actor} created project "${details.name}"`
        : `${actor} created a new project`;
    case 'meeting_created':
      return details.title
        ? `${actor} scheduled meeting "${details.title}"`
        : `${actor} scheduled a new meeting`;
    case 'whiteboard_created':
      return `${actor} created a new whiteboard`;
    case 'file_uploaded':
      return details.filename
        ? `${actor} uploaded file "${details.filename}"`
        : `${actor} uploaded a file`;
    case 'file_deleted':
      return `${actor} deleted a file`;
    case 'sandboxed_tool_executed':
      return details.cmd_key
        ? `${actor} ran diagnostic tool "${details.cmd_key.replace('_', ' ')}"`
        : `${actor} ran a diagnostic command`;
    case 'system_initialized':
      return 'System database initialized';
    case 'password_changed':
      return `${actor} changed their password`;
    case 'profile_updated':
      return `${actor} updated their profile`;
    case 'user_status_updated':
      return `${actor} updated user account status`;
    default:
      return `${actor} performed ${log.action.replace(/_/g, ' ')}`;
  }
};

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const sentence = formatActionText(activity);
  
  // Format readable time, e.g. "10:48 AM" or "Oct 26, 10:48 AM"
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="py-3 flex items-center justify-between text-body border-b border-border/50 last:border-0">
      <span className="text-text-main pr-4">{sentence}</span>
      <span className="text-secondary text-text-muted whitespace-nowrap text-right">
        {formatTime(activity.created_at)}
      </span>
    </div>
  );
};
