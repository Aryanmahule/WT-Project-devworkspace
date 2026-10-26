import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  ListFilter,
  Plus,
  X,
  ChevronRight,
  Calendar,
  CheckSquare
} from 'lucide-react';
import { Project, Task, User as UserType } from '../../types';
import { api } from '../../services/api';

export const ProjectsView: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Form states
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectKey, setNewProjectKey] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectPriority, setNewProjectPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [newTaskAssignee, setNewTaskAssignee] = useState<number | undefined>(undefined);
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [subtaskTitle, setSubtaskTitle] = useState('');

  useEffect(() => {
    loadProjectsAndUsers();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadProjectTasks(selectedProject.id);
    }
  }, [selectedProject]);

  const loadProjectsAndUsers = async () => {
    try {
      const [projRes, usersRes] = await Promise.all([
        api.getProjects(),
        api.getUsers()
      ]);
      setProjects(projRes.projects || []);
      setUsers(usersRes.users || []);
      if (projRes.projects?.length > 0) {
        setSelectedProject(projRes.projects[0]);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectTasks = async (projectId: number) => {
    try {
      const res = await api.getTasks({ project_id: projectId });
      setTasks(res.tasks || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName || !newProjectKey) return;
    try {
      const res = await api.createProject({
        name: newProjectName,
        key: newProjectKey,
        description: newProjectDesc,
        priority: newProjectPriority,
      });
      setProjects([res.project, ...projects]);
      setSelectedProject(res.project);
      setShowCreateProject(false);
      setNewProjectName('');
      setNewProjectKey('');
      setNewProjectDesc('');
    } catch (err: any) {
      alert(err.message || 'Error creating project');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !selectedProject) return;
    try {
      const res = await api.createTask({
        project_id: selectedProject.id,
        title: newTaskTitle,
        description: newTaskDesc,
        priority: newTaskPriority,
        assignee_id: newTaskAssignee,
        due_date: newTaskDueDate || undefined,
        estimated_hours: 10,
        status: 'todo',
      });
      setTasks([...tasks, res.task]);
      setShowCreateTask(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskDueDate('');
    } catch (err: any) {
      alert(err.message || 'Error creating task');
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: Task['status']) => {
    try {
      await api.updateTaskStatus(taskId, newStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskTitle || !selectedTask) return;
    try {
      const res = await api.addSubtask(selectedTask.id, subtaskTitle);
      const updatedSubtasks = [...(selectedTask.subtasks || []), res.subtask];
      const updatedTask = { ...selectedTask, subtasks: updatedSubtasks };
      setSelectedTask(updatedTask);
      setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? updatedTask : t)));
      setSubtaskTitle('');
    } catch (err: any) {
      alert(err.message || 'Failed to add subtask');
    }
  };

  const handleToggleSubtask = async (subtaskId: number, currentCompleted: boolean) => {
    if (!selectedTask) return;
    try {
      await api.updateSubtask(subtaskId, !currentCompleted);
      const updatedSubtasks = (selectedTask.subtasks || []).map((s) =>
        s.id === subtaskId ? { ...s, is_completed: !currentCompleted } : s
      );
      const updatedTask = { ...selectedTask, subtasks: updatedSubtasks };
      setSelectedTask(updatedTask);
      setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? updatedTask : t)));
    } catch (err: any) {
      alert(err.message || 'Failed to update subtask');
    }
  };

  const columns: { id: Task['status']; label: string }[] = [
    { id: 'todo', label: 'To Do' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'review', label: 'In Review' },
    { id: 'blocked', label: 'Blocked' },
    { id: 'completed', label: 'Completed' },
  ];

  if (loading) {
    return (
      <div className="max-w-content mx-auto p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-secondary text-text-muted">Loading Projects & Tasks...</div>
      </div>
    );
  }

  return (
    <div className="max-w-content mx-auto p-8 space-y-6">
      {/* Project Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            className="ui-input font-medium text-body min-w-[240px]"
            value={selectedProject?.id || ''}
            onChange={(e) => {
              const p = projects.find((x) => x.id === parseInt(e.target.value));
              if (p) setSelectedProject(p);
            }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.key}] {p.name}
              </option>
            ))}
          </select>

          {selectedProject && (
            <div className="text-secondary text-text-muted">
              <span className="font-medium text-accent">
                {selectedProject.metrics?.progress_percent || 0}% Complete
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex border border-border rounded-[8px] p-0.5 bg-surface">
            <button
              onClick={() => setViewMode('kanban')}
              className={`h-8 px-3 rounded-[6px] text-secondary font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'kanban' ? 'bg-accent-subtle text-accent font-semibold' : 'text-text-muted hover:text-text-main'
              }`}
            >
              <FolderKanban size={14} /> Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`h-8 px-3 rounded-[6px] text-secondary font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'list' ? 'bg-accent-subtle text-accent font-semibold' : 'text-text-muted hover:text-text-main'
              }`}
            >
              <ListFilter size={14} /> List
            </button>
          </div>

          <button onClick={() => setShowCreateProject(true)} className="btn-outlined">
            New Project
          </button>
          <button onClick={() => setShowCreateTask(true)} className="btn-accent">
            <Plus size={16} /> Add Task
          </button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="bg-surface border border-border rounded-[10px] flex flex-col min-h-[460px]">
                <div className="p-3.5 border-b border-border flex items-center justify-between text-secondary font-semibold text-text-main">
                  <span>{col.label}</span>
                  <span className="text-text-muted font-normal text-[12px]">{colTasks.length}</span>
                </div>

                <div className="p-3 space-y-2.5 flex-1 overflow-y-auto">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="p-3 rounded-[8px] border border-border bg-page/40 hover:bg-page hover:border-border transition-colors cursor-pointer space-y-2"
                    >
                      <div className="text-body font-medium text-text-main">
                        {task.title}
                      </div>

                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="text-[12px] text-text-muted flex items-center gap-1">
                          <CheckSquare size={12} />
                          <span>
                            {task.subtasks.filter((s) => s.is_completed).length}/{task.subtasks.length} subtasks
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-border/50 text-secondary text-text-muted">
                        <span className="truncate max-w-[120px]">
                          {task.assignee?.full_name || 'Unassigned'}
                        </span>

                        {col.id !== 'completed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextStatus =
                                col.id === 'todo' ? 'in_progress' :
                                col.id === 'in_progress' ? 'review' :
                                col.id === 'review' ? 'completed' : 'in_progress';
                              handleStatusChange(task.id, nextStatus);
                            }}
                            className="p-1 hover:text-accent rounded-[4px]"
                            title="Advance Status"
                          >
                            <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-surface border border-border rounded-[10px] overflow-hidden">
          <table className="w-full text-left text-body border-collapse">
            <thead>
              <tr className="border-b border-border bg-page/50 text-secondary text-text-muted font-medium">
                <th className="py-3 px-4">Task Title</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="hover:bg-page/40 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-text-main">{task.title}</td>
                  <td className="py-3 px-4 capitalize text-secondary">{task.status.replace('_', ' ')}</td>
                  <td className="py-3 px-4 capitalize text-secondary">{task.priority}</td>
                  <td className="py-3 px-4 text-secondary text-text-muted">
                    {task.assignee?.full_name || 'Unassigned'}
                  </td>
                  <td className="py-3 px-4 text-secondary text-text-muted">{task.due_date || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-[#16181D]/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border rounded-[10px] w-full max-w-[520px] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-secondary font-medium capitalize text-text-muted">
                Status: {selectedTask.status.replace('_', ' ')}
              </span>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 text-text-muted hover:text-text-main rounded"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <h3 className="text-card-title text-text-main font-semibold">
                {selectedTask.title}
              </h3>
              <p className="text-body text-text-muted mt-2 leading-relaxed">
                {selectedTask.description || 'No description provided.'}
              </p>
            </div>

            {/* Workflow status quick update */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <div className="text-secondary font-medium text-text-muted">Update Status</div>
              <div className="flex flex-wrap gap-2">
                {columns.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleStatusChange(selectedTask.id, c.id)}
                    className={`h-8 px-3 rounded-[6px] text-secondary font-medium border ${
                      selectedTask.status === c.id
                        ? 'bg-accent-subtle text-accent border-accent font-semibold'
                        : 'border-border bg-surface text-text-main hover:bg-page'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subtask checklist */}
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="text-secondary font-semibold text-text-main">Subtasks</div>
              <div className="space-y-2">
                {(selectedTask.subtasks || []).map((sub) => (
                  <div key={sub.id} className="flex items-center gap-2.5 text-body">
                    <input
                      type="checkbox"
                      checked={sub.is_completed}
                      onChange={() => handleToggleSubtask(sub.id, sub.is_completed)}
                      className="rounded border-border text-accent focus:ring-accent"
                    />
                    <span className={sub.is_completed ? 'line-through text-text-muted' : 'text-text-main'}>
                      {sub.title}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddSubtask} className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add a checklist item..."
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  className="ui-input flex-1"
                />
                <button type="submit" className="btn-accent">
                  Add
                </button>
              </form>
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <button onClick={() => setSelectedTask(null)} className="btn-outlined">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-[#16181D]/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border rounded-[10px] w-full max-w-[480px] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-card-title text-text-main font-semibold">Create New Project</h3>
              <button onClick={() => setShowCreateProject(false)} className="p-1 text-text-muted hover:text-text-main">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-3.5">
              <div>
                <label className="block text-secondary font-medium text-text-main mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  className="ui-input w-full"
                  placeholder="e.g. Distributed Telemetry Pipeline"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-secondary font-medium text-text-main mb-1">Project Key</label>
                <input
                  type="text"
                  required
                  className="ui-input w-full uppercase"
                  placeholder="e.g. PIPE"
                  value={newProjectKey}
                  onChange={(e) => setNewProjectKey(e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <label className="block text-secondary font-medium text-text-main mb-1">Description</label>
                <textarea
                  rows={3}
                  className="w-full bg-surface border border-border rounded-[8px] p-2.5 text-body text-text-main outline-none focus:border-accent"
                  placeholder="Project deliverables and objectives..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button type="button" onClick={() => setShowCreateProject(false)} className="btn-outlined">
                  Cancel
                </button>
                <button type="submit" className="btn-accent">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-[#16181D]/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border rounded-[10px] w-full max-w-[480px] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-card-title text-text-main font-semibold">New Task</h3>
              <button onClick={() => setShowCreateTask(false)} className="p-1 text-text-muted hover:text-text-main">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="block text-secondary font-medium text-text-main mb-1">Title</label>
                <input
                  type="text"
                  required
                  className="ui-input w-full"
                  placeholder="e.g. Configure health check endpoints"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-secondary font-medium text-text-main mb-1">Assignee</label>
                <select
                  className="ui-input w-full"
                  value={newTaskAssignee || ''}
                  onChange={(e) => setNewTaskAssignee(e.target.value ? parseInt(e.target.value) : undefined)}
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.job_title})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-secondary font-medium text-text-main mb-1">Due Date</label>
                <input
                  type="date"
                  className="ui-input w-full"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button type="button" onClick={() => setShowCreateTask(false)} className="btn-outlined">
                  Cancel
                </button>
                <button type="submit" className="btn-accent">
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
