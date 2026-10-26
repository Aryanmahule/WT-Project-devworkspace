import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { LoginModal } from './components/auth/LoginModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProjectsView } from './components/projects/ProjectsView';
import { ChatView } from './components/chat/ChatView';
import { MeetingsView } from './components/meetings/MeetingsView';
import { WhiteboardView } from './components/whiteboard/WhiteboardView';
import { CalendarView } from './components/calendar/CalendarView';
import { PlannerView } from './components/planner/PlannerView';
import { FilesView } from './components/files/FilesView';
import { DevWorkspaceView } from './components/dev/DevWorkspaceView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { AdminView } from './components/admin/AdminView';

const WorkspaceShell: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [activeMeetingRoom, setActiveMeetingRoom] = useState<string | undefined>(undefined);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-page text-text-muted text-body font-medium">
        Loading Apex Workspace...
      </div>
    );
  }

  if (!user) {
    return <LoginModal />;
  }

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onJoinMeeting={(code) => {
              setActiveMeetingRoom(code);
              setCurrentTab('meetings');
            }}
          />
        );
      case 'projects':
      case 'tasks':
        return <ProjectsView />;
      case 'chat':
        return <ChatView />;
      case 'meetings':
        return <MeetingsView initialRoomCode={activeMeetingRoom} />;
      case 'calendar':
        return <CalendarView />;
      case 'whiteboard':
        return <WhiteboardView />;
      case 'files':
        return <FilesView />;
      case 'dev':
        return <DevWorkspaceView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'admin':
        return <AdminView />;
      default:
        return <DashboardView onNavigateTab={(tab) => setCurrentTab(tab)} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-page">
      {/* 232px Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setActiveMeetingRoom(undefined);
          setCurrentTab(tab);
        }}
        isOpenOnMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <TopBar
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenNewTask={() => setCurrentTab('projects')}
        />
        <main className="flex-1 overflow-y-auto bg-page">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <WorkspaceShell />
    </AuthProvider>
  );
}
