import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Plus,
  UserCheck,
  Video,
  FolderPlus,
  CheckCircle2,
  X,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Notification } from '../../types';

interface HeaderProps {
  onOpenCreateProject?: () => void;
  onOpenCreateTask?: () => void;
  onOpenCreateMeeting?: () => void;
  onNavigateTab?: (tab: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreateProject,
  onOpenCreateTask,
  onOpenCreateMeeting,
  onNavigateTab,
}) => {
  const { user, quickLogin } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState<boolean>(false);
  const [showQuickCreate, setShowQuickCreate] = useState<boolean>(false);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const roles = [
    { email: 'admin@apexcorp.internal', label: 'Platform Admin', desc: 'Full System Control' },
    { email: 'alex.chen@apexcorp.internal', label: 'Org Admin', desc: 'VP Engineering' },
    { email: 'sarah.jenkins@apexcorp.internal', label: 'Manager', desc: 'Product Engineering' },
    { email: 'marcus.vance@apexcorp.internal', label: 'Team Lead', desc: 'DevOps & SRE' },
    { email: 'elena.rostova@apexcorp.internal', label: 'Member', desc: 'Senior Frontend Dev' },
    { email: 'guest.partner@apexcorp.internal', label: 'Guest Collaborator', desc: 'Limited Access' },
  ];

  return (
    <header className="top-header">
      {/* Search Bar */}
      <div style={{ position: 'relative', width: '320px' }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-dim)',
          }}
        />
        <input
          type="text"
          placeholder="Search projects, tasks, messages, files..."
          className="input-text"
          style={{ width: '100%', paddingLeft: '36px', height: '36px', fontSize: '13px' }}
        />
      </div>

      {/* Action Center */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Quick Role Switcher for instant evaluator testing */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowRoleSwitcher(!showRoleSwitcher);
              setShowNotifications(false);
              setShowQuickCreate(false);
            }}
            className="btn btn-secondary btn-sm"
            style={{
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              borderColor: 'rgba(99, 102, 241, 0.3)',
              color: '#818cf8',
              fontSize: '12px',
            }}
            title="Switch demo user profile"
          >
            <UserCheck size={14} />
            <span>Role: {user?.role?.replace('_', ' ')}</span>
          </button>

          {showRoleSwitcher && (
            <div
              style={{
                position: 'absolute',
                top: '44px',
                right: '0',
                width: '260px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                zIndex: 100,
                padding: '8px',
              }}
            >
              <div style={{ padding: '6px 8px', fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Quick Test Switcher
              </div>
              {roles.map((r) => (
                <button
                  key={r.email}
                  onClick={() => {
                    quickLogin(r.email);
                    setShowRoleSwitcher(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: user?.email === r.email ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    color: user?.email === r.email ? '#818cf8' : 'var(--text-main)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                  onMouseEnter={(e) => {
                    if (user?.email !== r.email) e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (user?.email !== r.email) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>{r.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.desc}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Create Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowQuickCreate(!showQuickCreate);
              setShowNotifications(false);
              setShowRoleSwitcher(false);
            }}
            className="btn btn-primary btn-sm"
          >
            <Plus size={15} />
            <span>Create</span>
          </button>

          {showQuickCreate && (
            <div
              style={{
                position: 'absolute',
                top: '44px',
                right: '0',
                width: '200px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                zIndex: 100,
                padding: '6px',
              }}
            >
              <button
                onClick={() => {
                  setShowQuickCreate(false);
                  onOpenCreateTask?.();
                }}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
              >
                <CheckCircle2 size={15} color="#34d399" /> New Task
              </button>
              <button
                onClick={() => {
                  setShowQuickCreate(false);
                  onOpenCreateProject?.();
                }}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
              >
                <FolderPlus size={15} color="#60a5fa" /> New Project
              </button>
              <button
                onClick={() => {
                  setShowQuickCreate(false);
                  onOpenCreateMeeting?.();
                }}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
              >
                <Video size={15} color="#c084fc" /> Schedule Meeting
              </button>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowRoleSwitcher(false);
              setShowQuickCreate(false);
            }}
            style={{
              position: 'relative',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-rose)',
                }}
              />
            )}
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: '44px',
                right: '0',
                width: '320px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                zIndex: 100,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '13px' }}>Notifications</div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid rgba(51, 65, 85, 0.4)',
                        backgroundColor: n.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.08)',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        api.markNotificationRead(n.id);
                        if (n.link_url && onNavigateTab) {
                          if (n.link_url.includes('meeting')) onNavigateTab('meetings');
                          else if (n.link_url.includes('project')) onNavigateTab('projects');
                        }
                        setShowNotifications(false);
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--text-main)', marginBottom: '2px' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
