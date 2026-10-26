import React from 'react';
import { Search, Menu, Plus } from 'lucide-react';

interface TopBarProps {
  onOpenMobileMenu: () => void;
  onOpenNewTask: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenMobileMenu, onOpenNewTask }) => {
  return (
    <header className="h-16 bg-surface border-b border-border px-8 flex items-center justify-between sticky top-0 z-30 flex-shrink-0">
      <div className="flex items-center gap-3 flex-1 max-w-[420px]">
        {/* Menu toggle button for < 900px */}
        <button
          onClick={onOpenMobileMenu}
          className="min-[900px]:hidden p-2 text-text-muted hover:text-text-main rounded-[8px] border border-border"
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>

        {/* Search input (max 420px, 40px tall, 8px radius) */}
        <div className="relative w-full">
          <label htmlFor="topbar-search" className="sr-only">
            Search
          </label>
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            id="topbar-search"
            type="search"
            placeholder="Search..."
            className="ui-input w-full pl-9 pr-3"
          />
        </div>
      </div>

      {/* One filled "New task" button on the right */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenNewTask}
          className="btn-accent"
        >
          <Plus size={16} />
          <span>New task</span>
        </button>
      </div>
    </header>
  );
};
