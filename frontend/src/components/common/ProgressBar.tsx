import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
  height?: number; // default 6
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className = '', height = 6 }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div
      className={`w-full bg-[#F5F6F8] rounded-full overflow-hidden border border-border/40 ${className}`}
      style={{ height: `${height}px` }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="bg-accent h-full rounded-full transition-all duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};
