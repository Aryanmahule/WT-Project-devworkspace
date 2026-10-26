import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Check } from 'lucide-react';
import { PersonalTask } from '../../types';
import { api } from '../../services/api';

export const PlannerView: React.FC = () => {
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await api.getPersonalTasks();
      setTasks(res.tasks || []);
    } catch (err) {
      console.error('Failed to load personal planner tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const res = await api.createPersonalTask({
        title: newTitle.trim(),
        priority: newPriority,
        due_date: newDueDate || undefined,
      });
      setTasks([res.task, ...tasks]);
      setNewTitle('');
      setNewDueDate('');
    } catch (err: any) {
      alert(err.message || 'Error creating personal task');
    }
  };

  const handleToggleCompleted = async (task: PersonalTask) => {
    try {
      const updated = !task.is_completed;
      await api.updatePersonalTask(task.id, { is_completed: updated });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, is_completed: updated } : t))
      );
    } catch (err: any) {
      alert(err.message || 'Error updating task');
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await api.deletePersonalTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error deleting task');
    }
  };

  const completedCount = tasks.filter((t) => t.is_completed).length;

  return (
    <div className="max-w-content mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-page-title text-text-main font-semibold">
            Personal Planner & To-Do
          </h1>
          <p className="text-secondary text-text-muted mt-1">
            Private productivity tasks, daily schedule checklists, and personal focus items
          </p>
        </div>
        <div className="text-secondary font-medium text-text-muted bg-surface border border-border px-3 py-1.5 rounded-[8px]">
          <span className="text-accent font-semibold">{completedCount}</span> of {tasks.length} Completed
        </div>
      </div>

      {/* Quick Add Form */}
      <div className="ui-card">
        <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            className="ui-input flex-1"
            placeholder="What do you need to focus on today? (e.g. Finish PR review, verify SSL)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <select
            className="ui-input sm:w-40"
            value={newPriority}
            onChange={(e: any) => setNewPriority(e.target.value)}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <input
            type="date"
            className="ui-input sm:w-44"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
          />
          <button type="submit" className="btn-accent shrink-0">
            <Plus size={16} /> Add Task
          </button>
        </form>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="ui-card text-center py-12 text-secondary text-text-muted">
            No personal tasks found. Add a task above to plan your day.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`ui-card flex items-center justify-between transition-opacity ${
                task.is_completed ? 'opacity-60 bg-page/40' : ''
              }`}
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <button
                  onClick={() => handleToggleCompleted(task)}
                  className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-colors shrink-0 ${
                    task.is_completed
                      ? 'bg-accent border-accent text-white'
                      : 'border-border hover:border-accent'
                  }`}
                >
                  {task.is_completed && <Check size={13} strokeWidth={3} />}
                </button>

                <div className="flex-1 min-w-0">
                  <div
                    className={`text-body font-medium truncate ${
                      task.is_completed ? 'line-through text-text-muted' : 'text-text-main'
                    }`}
                  >
                    {task.title}
                  </div>
                  {task.due_date && (
                    <div className="text-[12px] text-text-muted mt-0.5 flex items-center gap-1.5">
                      <Calendar size={12} /> Due: {task.due_date}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1.5 text-text-muted hover:text-danger rounded transition-colors"
                  title="Delete Task"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
