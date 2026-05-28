"use client";

import { cn } from "@/lib/utils";

interface ProbabilityBarProps {
  homeWin: number;
  draw: number;
  awayWin: number;
  homeLabel?: string;
  awayLabel?: string;
  showLabels?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function ProbabilityBar({
  homeWin,
  draw,
  awayWin,
  homeLabel = "Home",
  awayLabel = "Away",
  showLabels = true,
  size = "md",
  className,
}: ProbabilityBarProps) {
  const homePercent = (homeWin * 100).toFixed(0);
  const drawPercent = (draw * 100).toFixed(0);
  const awayPercent = (awayWin * 100).toFixed(0);

  return (
    <div className={cn("space-y-1.5", className)}>
      {/* Probability bar */}
      <div className={cn(
        "flex w-full overflow-hidden rounded-full",
        size === "sm" ? "h-2" : "h-2.5"
      )}>
        <div
          className="bg-win transition-all duration-500 rounded-l-full"
          style={{ width: `${homePercent}%` }}
        />
        <div
          className="bg-foreground-subtle/40 transition-all duration-500"
          style={{ width: `${drawPercent}%` }}
        />
        <div
          className="bg-loss transition-all duration-500 rounded-r-full"
          style={{ width: `${awayPercent}%` }}
        />
      </div>
      
      {/* Labels */}
      {showLabels && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-win">{homePercent}%</span>
            <span className="text-foreground-muted">{homeLabel}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium text-foreground-subtle">{drawPercent}%</span>
            <span className="text-foreground-muted">Draw</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-foreground-muted">{awayLabel}</span>
            <span className="font-semibold text-loss">{awayPercent}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
