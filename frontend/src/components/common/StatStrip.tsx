import React from 'react';
import { ProgressBar } from './ProgressBar';

interface StatStripProps {
  activeProjects: number;
  completedTasks: number;
  totalTasks: number;
  progressPercent: number;
  needsAttention: number;
  inProgressOrReview: number;
}

export const StatStrip: React.FC<StatStripProps> = ({
  activeProjects,
  completedTasks,
  totalTasks,
  progressPercent,
  needsAttention,
  inProgressOrReview,
}) => {
  return (
    <div className="bg-surface border border-border rounded-[10px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
      {/* Cell 1: Active projects */}
      <div className="p-6 flex flex-col justify-between">
        <span className="text-secondary text-text-muted">Active projects</span>
        <div className="mt-2 text-[26px] font-semibold text-text-main leading-tight">
          {activeProjects}
        </div>
      </div>

      {/* Cell 2: Tasks completed with a thin progress bar */}
      <div className="p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between text-secondary">
          <span className="text-text-muted">Tasks completed</span>
          <span className="font-medium text-text-main">
            {completedTasks} of {totalTasks} ({progressPercent}%)
          </span>
        </div>
        <div className="mt-3">
          <ProgressBar progress={progressPercent} height={6} />
        </div>
      </div>

      {/* Cell 3: Needs attention in red */}
      <div className="p-6 flex flex-col justify-between">
        <span className="text-secondary text-text-muted">Needs attention</span>
        <div className="mt-2 text-[26px] font-semibold text-danger leading-tight">
          {needsAttention}
        </div>
      </div>

      {/* Cell 4: In progress or review */}
      <div className="p-6 flex flex-col justify-between">
        <span className="text-secondary text-text-muted">In progress or review</span>
        <div className="mt-2 text-[26px] font-semibold text-text-main leading-tight">
          {inProgressOrReview}
        </div>
      </div>
    </div>
  );
};
