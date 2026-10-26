export type UserRole = 'platform_admin' | 'org_admin' | 'manager' | 'team_lead' | 'member' | 'guest';

export interface User {
  id: number;
  organization_id?: number;
  department_id?: number;
  username: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  job_title: string;
  role: UserRole;
  status: 'active' | 'suspended' | 'pending';
  phone?: string;
  bio?: string;
  timezone: string;
  created_at?: string;
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
  domain?: string;
  logo_url?: string;
  description?: string;
  settings?: Record<string, any>;
  created_at?: string;
}

export interface Department {
  id: number;
  organization_id: number;
  name: string;
  code?: string;
  description?: string;
  manager_id?: number;
}

export interface Team {
  id: number;
  organization_id: number;
  department_id?: number;
  name: string;
  description?: string;
  lead_id?: number;
  is_private: boolean;
  member_count?: number;
}

export interface ProjectMetrics {
  total: number;
  completed: number;
  in_progress: number;
  blocked: number;
  todo: number;
  review: number;
  overdue: number;
  progress_percent: number;
}

export interface Project {
  id: number;
  organization_id: number;
  team_id?: number;
  name: string;
  key: string;
  description?: string;
  status: 'planning' | 'active' | 'paused' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  start_date?: string;
  due_date?: string;
  owner_id?: number;
  owner?: User;
  metrics?: ProjectMetrics;
  created_at?: string;
}

export interface Milestone {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  due_date?: string;
  status: 'open' | 'completed';
}

export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  is_completed: boolean;
}

export interface Task {
  id: number;
  project_id: number;
  milestone_id?: number;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'blocked' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  creator_id?: number;
  assignee_id?: number;
  creator?: User;
  assignee?: User;
  due_date?: string;
  estimated_hours: number;
  actual_hours: number;
  order_index: number;
  subtasks?: Subtask[];
  created_at?: string;
  updated_at?: string;
}

export interface Channel {
  id: number;
  organization_id: number;
  team_id?: number;
  project_id?: number;
  name: string;
  description?: string;
  is_direct: boolean;
  is_private: boolean;
  last_message?: Message;
}

export interface Message {
  id: number;
  channel_id: number;
  sender_id: number;
  sender?: User;
  content: string;
  parent_id?: number;
  message_type: 'text' | 'file' | 'system' | 'code';
  attachments?: any[];
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
}

export interface MeetingParticipant {
  id: number;
  meeting_id: number;
  user_id: number;
  user?: User;
  role: 'host' | 'presenter' | 'attendee';
  status: 'accepted' | 'tentative' | 'declined';
}

export interface Meeting {
  id: number;
  organization_id: number;
  project_id?: number;
  title: string;
  description?: string;
  scheduled_start: string;
  scheduled_end: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  room_code: string;
  host_id: number;
  host?: User;
  participants?: MeetingParticipant[];
}

export interface WhiteboardElement {
  id: string;
  type: 'freehand' | 'rect' | 'circle' | 'arrow' | 'sticky' | 'text';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  toX?: number;
  toY?: number;
  color: string;
  text?: string;
  points?: { x: number; y: number }[];
  strokeWidth?: number;
}

export interface Whiteboard {
  id: number;
  organization_id: number;
  team_id?: number;
  project_id?: number;
  title: string;
  board_data: { elements: WhiteboardElement[]; version?: number };
  thumbnail_url?: string;
  created_by: number;
  creator?: User;
  updated_at?: string;
}

export interface CalendarEvent {
  id: number | string;
  organization_id?: number;
  user_id?: number;
  team_id?: number;
  project_id?: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  event_type: 'meeting' | 'deadline' | 'milestone' | 'personal' | 'reminder';
  is_all_day: boolean;
  location?: string;
}

export interface PersonalTask {
  id: number;
  user_id: number;
  title: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  is_completed: boolean;
  project_task_id?: number;
  created_at?: string;
}

export interface FileRecord {
  id: number;
  organization_id: number;
  user_id: number;
  project_id?: number;
  filename: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  folder_path: string;
  uploader?: User;
  created_at?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: 'task_assigned' | 'meeting_invite' | 'mention' | 'project_update' | 'system';
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: number;
  organization_id?: number;
  user_id?: number;
  user_name?: string;
  action: string;
  target_type?: string;
  target_id?: number;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface DevEnvironment {
  id: number;
  project_id?: number;
  name: string;
  service_type: 'web' | 'api' | 'database' | 'redis' | 'worker';
  status: 'running' | 'stopped' | 'building' | 'healthy' | 'degraded';
  port_mappings: string;
  image_tag: string;
  cpu_usage: number;
  memory_usage: string;
  repo_url?: string;
  branch: string;
  last_commit: string;
  last_deployed_at?: string;
}
