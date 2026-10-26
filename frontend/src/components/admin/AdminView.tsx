import React, { useState, useEffect } from 'react';
import {
  Users,
  FileText,
  RefreshCw
} from 'lucide-react';
import { User, AuditLog } from '../../types';
import { api } from '../../services/api';

export const AdminView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [uRes, aRes] = await Promise.all([
        api.getAdminUsers(),
        api.getAuditLogs(50),
      ]);
      setUsers(uRes.users || []);
      setAuditLogs(aRes.audit_logs || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await api.updateUserRoleStatus(userId, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole as any } : u))
      );
      const aRes = await api.getAuditLogs(50);
      setAuditLogs(aRes.audit_logs || []);
    } catch (err: any) {
      alert(err.message || 'Error updating role');
    }
  };

  const handleStatusToggle = async (userId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.updateUserRoleStatus(userId, { status: nextStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: nextStatus as any } : u))
      );
      const aRes = await api.getAuditLogs(50);
      setAuditLogs(aRes.audit_logs || []);
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  return (
    <div className="max-w-content mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-page-title text-text-main font-semibold">
            Administrative Control Center
          </h1>
          <p className="text-secondary text-text-muted mt-1">
            Enterprise user governance, role-based access control (RBAC), and security audit trails
          </p>
        </div>

        {/* Tab switch */}
        <div className="inline-flex p-1 bg-surface border border-border rounded-[8px] self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-[6px] text-secondary font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-accent-subtle text-accent'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <Users size={14} />
            <span>User Governance</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-[6px] text-secondary font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-accent-subtle text-accent'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <FileText size={14} />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="ui-card p-0 overflow-hidden">
          <table className="w-full text-left text-body border-collapse">
            <thead>
              <tr className="border-b border-border bg-page text-[12px] font-semibold text-text-muted uppercase tracking-wider">
                <th className="py-3 px-6">User</th>
                <th className="py-3 px-6">Job Title</th>
                <th className="py-3 px-6">Role (RBAC)</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-page/50 transition-colors">
                  <td className="py-3.5 px-6">
                    <div className="font-semibold text-text-main">{u.full_name}</div>
                    <div className="text-[12px] text-text-muted font-mono">{u.email}</div>
                  </td>
                  <td className="py-3.5 px-6 text-secondary text-text-muted">
                    {u.job_title}
                  </td>
                  <td className="py-3.5 px-6">
                    <select
                      className="ui-input h-8 py-1 px-2.5 text-[13px]"
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    >
                      <option value="platform_admin">Platform Administrator</option>
                      <option value="org_admin">Organization Admin</option>
                      <option value="manager">Manager</option>
                      <option value="team_lead">Team Leader</option>
                      <option value="member">Team Member</option>
                      <option value="guest">Guest Collaborator</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-6">
                    <span
                      className={`badge ${
                        u.status === 'active' ? 'badge-completed' : 'badge-blocked'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <button
                      onClick={() => handleStatusToggle(u.id, u.status)}
                      className={`btn-sm ${
                        u.status === 'active' ? 'btn-danger' : 'btn-outlined'
                      }`}
                    >
                      {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <div className="ui-card p-0 overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between bg-page">
            <div className="font-semibold text-card-title text-text-main">
              Security Audit Event Logs
            </div>
            <button onClick={loadAdminData} className="btn-outlined btn-sm">
              <RefreshCw size={13} /> Refresh Logs
            </button>
          </div>
          <table className="w-full text-left text-body border-collapse">
            <thead>
              <tr className="border-b border-border text-[12px] font-semibold text-text-muted uppercase tracking-wider">
                <th className="py-3 px-6">Timestamp</th>
                <th className="py-3 px-6">User</th>
                <th className="py-3 px-6">Action</th>
                <th className="py-3 px-6">Target</th>
                <th className="py-3 px-6">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-page/50 transition-colors">
                  <td className="py-3 px-6 text-secondary text-text-muted">
                    {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                  </td>
                  <td className="py-3 px-6 font-medium text-text-main">
                    {log.user_name}
                  </td>
                  <td className="py-3 px-6">
                    <code className="text-accent bg-accent-subtle px-2 py-0.5 rounded text-[12px] font-mono">
                      {log.action}
                    </code>
                  </td>
                  <td className="py-3 px-6 text-secondary text-text-muted">
                    {log.target_type ? `${log.target_type} #${log.target_id || ''}` : '-'}
                  </td>
                  <td className="py-3 px-6 text-secondary text-text-muted font-mono text-[12px]">
                    {log.ip_address || '127.0.0.1'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
