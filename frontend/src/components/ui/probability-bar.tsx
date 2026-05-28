"use client";

import { cn } from "@/lib/utils";

interface ProbabilityBarProps {
  homeWin: number;
  draw: number;
  awayWin: number;
  homeLabel?: string;
  awayLabel?: string;
  showLabels?: boolean;
  className?: string;
}

export function ProbabilityBar({
  homeWin,
  draw,
  awayWin,
  homeLabel = "Home",
  awayLabel = "Away",
  showLabels = true,
  className,
}: ProbabilityBarProps) {
  const homePercent = (homeWin * 100).toFixed(1);
  const drawPercent = (draw * 100).toFixed(1);
  const awayPercent = (awayWin * 100).toFixed(1);

  return (
    <div className={cn("space-y-2", className)}>
      {showLabels && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-win">{homeLabel}</span>
          <span className="text-foreground-muted">Draw</span>
          <span className="font-medium text-loss">{awayLabel}</span>
        </div>
      )}
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-background-tertiary">
        <div
          className="bg-win transition-all duration-500"
          style={{ width: `${homePercent}%` }}
        />
        <div
          className="bg-draw transition-all duration-500"
          style={{ width: `${drawPercent}%` }}
        />
        <div
          className="bg-loss transition-all duration-500"
          style={{ width: `${awayPercent}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-foreground-muted">
        <span>{homePercent}%</span>
        <span>{drawPercent}%</span>
        <span>{awayPercent}%</span>
      </div>
    </div>
  );
}
