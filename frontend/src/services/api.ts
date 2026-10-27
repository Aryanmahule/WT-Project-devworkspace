const API_BASE = '/api';

function getAuthHeaders(isFormData = false): HeadersInit {
  const token = localStorage.getItem('apex_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

async function handleResponse(response: Response) {
  let data: any = {};
  let text = '';
  try {
    text = await response.text();
    data = JSON.parse(text);
  } catch {
    data = {};
  }

  if (response.status === 401) {
    if (!data.error) {
      localStorage.removeItem('apex_token');
      localStorage.removeItem('apex_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    throw new Error(data.error || 'Invalid credentials or unauthorized');
  }

  if (!response.ok) {
    const errorMsg = data.error || (text && text.length < 200 && !text.includes('<!DOCTYPE') ? text : `HTTP ${response.status}: Server request failed`);
    throw new Error(errorMsg);
  }
  return data;
}

export const api = {
  // Auth
  async login(email_or_username: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_or_username, password }),
    });
    return handleResponse(res);
  },

  async register(userData: any) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getUsers() {
    const res = await fetch(`${API_BASE}/auth/users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Organizations & Teams
  async getOrganizations() {
    const res = await fetch(`${API_BASE}/orgs`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getDepartments() {
    const res = await fetch(`${API_BASE}/departments`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getTeams() {
    const res = await fetch(`${API_BASE}/teams`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async createTeam(data: any) {
    const res = await fetch(`${API_BASE}/teams`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Projects & Milestones
  async getProjects(params?: { team_id?: number; status?: string }) {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/projects?${query}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getProject(id: number) {
    const res = await fetch(`${API_BASE}/projects/${id}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async createProject(data: any) {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateProject(id: number, data: any) {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Tasks
  async getTasks(params?: { project_id?: number; assignee_id?: number; status?: string }) {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/tasks?${query}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async createTask(data: any) {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateTaskStatus(id: number, status: string, order_index?: number) {
    const res = await fetch(`${API_BASE}/tasks/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, order_index }),
    });
    return handleResponse(res);
  },

  async updateTask(id: number, data: any) {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async addSubtask(taskId: number, title: string) {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/subtasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title }),
    });
    return handleResponse(res);
  },

  async updateSubtask(subtaskId: number, is_completed: boolean) {
    const res = await fetch(`${API_BASE}/subtasks/${subtaskId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_completed }),
    });
    return handleResponse(res);
  },

  // Chat & Messages
  async getChannels(team_id?: number) {
    const query = team_id ? `?team_id=${team_id}` : '';
    const res = await fetch(`${API_BASE}/channels${query}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async createChannel(data: any) {
    const res = await fetch(`${API_BASE}/channels`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getMessages(channelId: number) {
    const res = await fetch(`${API_BASE}/channels/${channelId}/messages`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async sendMessage(channelId: number, content: string, attachments?: any[]) {
    const res = await fetch(`${API_BASE}/channels/${channelId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content, attachments }),
    });
    return handleResponse(res);
  },

  // Meetings
  async getMeetings(projectId?: number) {
    const query = projectId ? `?project_id=${projectId}` : '';
    const res = await fetch(`${API_BASE}/meetings${query}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getMeeting(codeOrId: string | number) {
    const res = await fetch(`${API_BASE}/meetings/${codeOrId}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async createMeeting(data: any) {
    const res = await fetch(`${API_BASE}/meetings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateMeetingStatus(meetingId: number, status: string) {
    const res = await fetch(`${API_BASE}/meetings/${meetingId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  // Whiteboards
  async getWhiteboards(projectId?: number) {
    const query = projectId ? `?project_id=${projectId}` : '';
    const res = await fetch(`${API_BASE}/whiteboards${query}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getWhiteboard(id: number) {
    const res = await fetch(`${API_BASE}/whiteboards/${id}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async createWhiteboard(data: any) {
    const res = await fetch(`${API_BASE}/whiteboards`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async saveWhiteboard(id: number, data: any) {
    const res = await fetch(`${API_BASE}/whiteboards/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Calendar
  async getCalendarEvents(params?: any) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/calendar/events?${query}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async createCalendarEvent(data: any) {
    const res = await fetch(`${API_BASE}/calendar/events`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Planner
  async getPersonalTasks() {
    const res = await fetch(`${API_BASE}/planner/tasks`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async createPersonalTask(data: any) {
    const res = await fetch(`${API_BASE}/planner/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updatePersonalTask(id: number, data: any) {
    const res = await fetch(`${API_BASE}/planner/tasks/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deletePersonalTask(id: number) {
    const res = await fetch(`${API_BASE}/planner/tasks/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Files
  async getFiles(projectId?: number, folder?: string) {
    const params = new URLSearchParams();
    if (projectId) params.append('project_id', projectId.toString());
    if (folder) params.append('folder', folder);
    const res = await fetch(`${API_BASE}/files?${params.toString()}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async uploadFile(file: File, projectId?: number, folder = '/') {
    const formData = new FormData();
    formData.append('file', file);
    if (projectId) formData.append('project_id', projectId.toString());
    formData.append('folder_path', folder);

    const res = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });
    return handleResponse(res);
  },

  // Developer Workspace
  async getDevEnvironments(projectId?: number) {
    const query = projectId ? `?project_id=${projectId}` : '';
    const res = await fetch(`${API_BASE}/dev/environments${query}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async devEnvironmentAction(id: number, action: string) {
    const res = await fetch(`${API_BASE}/dev/environments/${id}/action`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action }),
    });
    return handleResponse(res);
  },

  async runSandboxedCommand(command_key: string) {
    const res = await fetch(`${API_BASE}/dev/terminal/run`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ command_key }),
    });
    return handleResponse(res);
  },

  async getDockerStatus() {
    const res = await fetch(`${API_BASE}/dev/docker-status`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  // Analytics & Dashboard
  async getDashboardAnalytics() {
    const res = await fetch(`${API_BASE}/analytics/dashboard`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  // Admin
  async getAdminUsers() {
    const res = await fetch(`${API_BASE}/admin/users`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async updateUserRoleStatus(userId: number, data: { status?: string; role?: string }) {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getAuditLogs(limit = 50) {
    const res = await fetch(`${API_BASE}/admin/audit-logs?limit=${limit}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  // Notifications
  async getNotifications() {
    const res = await fetch(`${API_BASE}/notifications`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async markNotificationRead(id: number) {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async markAllNotificationsRead() {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};
