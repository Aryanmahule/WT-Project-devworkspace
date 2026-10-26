import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  MessageSquare,
  Video,
  Calendar,
  PenTool,
  Files,
  Boxes,
  BarChart3,
  ShieldCheck,
  X,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavTab =
  | 'dashboard'
  | 'projects'
  | 'tasks'
  | 'chat'
  | 'meetings'
  | 'calendar'
  | 'whiteboard'
  | 'files'
  | 'dev'
  | 'analytics'
  | 'admin';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenOnMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenOnMobile,
  onCloseMobile,
}) => {
  const { user, organization, logout } = useAuth();

  const mainNav = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects' as NavTab, label: 'Projects', icon: FolderKanban },
    { id: 'tasks' as NavTab, label: 'Tasks', icon: CheckSquare },
    { id: 'chat' as NavTab, label: 'Messages', icon: MessageSquare },
    { id: 'meetings' as NavTab, label: 'Meetings', icon: Video },
    { id: 'calendar' as NavTab, label: 'Calendar', icon: Calendar },
  ];

  const workspaceNav = [
    { id: 'whiteboard' as NavTab, label: 'Whiteboard', icon: PenTool },
    { id: 'files' as NavTab, label: 'Files', icon: Files },
    { id: 'dev' as NavTab, label: 'Developer hub', icon: Boxes },
    { id: 'analytics' as NavTab, label: 'Reports', icon: BarChart3 },
    { id: 'admin' as NavTab, label: 'Administration', icon: ShieldCheck },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface">
      {/* Workspace Name & Plan Label */}
      <div className="h-16 px-5 border-b border-border flex items-center justify-between flex-shrink-0">
        <div className="overflow-hidden">
          <div className="text-[15px] font-semibold text-text-main truncate leading-tight">
            {organization?.name || 'Apex Technologies'}
          </div>
          <div className="text-secondary text-text-muted mt-0.5 font-normal">
            Enterprise plan
          </div>
        </div>
        {/* Close button for mobile drawer */}
        <button
          onClick={onCloseMobile}
          className="min-[900px]:hidden p-1.5 text-text-muted hover:text-text-main rounded-[6px]"
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main Group */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-text-muted uppercase">
            Main
          </div>
          <div className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full h-10 px-3 rounded-[8px] flex items-center gap-3 text-body font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-accent-subtle text-accent font-semibold'
                      : 'text-text-main hover:bg-page'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-accent' : 'text-text-muted'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Workspace Group */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-text-muted uppercase">
            Workspace
          </div>
          <div className="space-y-1">
            {workspaceNav.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full h-10 px-3 rounded-[8px] flex items-center gap-3 text-body font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-accent-subtle text-accent font-semibold'
                      : 'text-text-main hover:bg-page'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-accent' : 'text-text-muted'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Pinned User Details at Bottom */}
      <div className="p-4 border-t border-border flex items-center justify-between flex-shrink-0 bg-surface">
        <div className="overflow-hidden pr-2">
          <div className="text-body font-medium text-text-main truncate">
            {user?.full_name || 'Platform Administrator'}
          </div>
          <div className="text-secondary text-text-muted truncate capitalize">
            {user?.role?.replace('_', ' ') || 'Administrator'}
          </div>
        </div>
        <button
          onClick={logout}
          className="p-2 text-text-muted hover:text-danger rounded-[6px] transition-colors"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (>= 900px) */}
      <aside className="hidden min-[900px]:block w-[232px] flex-shrink-0 border-r border-border h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop (< 900px) */}
      {isOpenOnMobile && (
        <div
          className="min-[900px]:hidden fixed inset-0 bg-black/30 z-40"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer (< 900px) */}
      <div
        className={`min-[900px]:hidden fixed inset-y-0 left-0 w-[232px] z-50 transform transition-transform duration-200 ease-in-out border-r border-border ${
          isOpenOnMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};
