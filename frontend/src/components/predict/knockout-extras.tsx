"use client";

import { cn } from "@/lib/utils";
import { Clock, Target } from "lucide-react";

interface KnockoutExtrasProps {
  extraTimeProb: number;
  penaltyProb: number;
  homePenaltyWinRate: number;
  awayPenaltyWinRate: number;
  homeTeam: string;
  awayTeam: string;
  className?: string;
}

export function KnockoutExtras({
  extraTimeProb,
  penaltyProb,
  homePenaltyWinRate,
  awayPenaltyWinRate,
  homeTeam,
  awayTeam,
  className,
}: KnockoutExtrasProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Extra Time & Penalty Probabilities */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-lg bg-warning/10 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/20">
            <Clock className="h-4 w-4 text-warning" />
          </div>
          <div>
            <div className="text-xs text-foreground-muted">Extra Time</div>
            <div className="text-lg font-bold text-warning">
              {(extraTimeProb * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg bg-danger/10 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger/20">
            <Target className="h-4 w-4 text-danger" />
          </div>
          <div>
            <div className="text-xs text-foreground-muted">Penalties</div>
            <div className="text-lg font-bold text-danger">
              {(penaltyProb * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Historical Penalty Records */}
      <div>
        <h4 className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-2">
          Penalty Shootout Record
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-20 text-xs font-medium truncate">{homeTeam}</span>
            <div className="flex-1 h-1.5 bg-background-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-win rounded-full"
                style={{ width: `${homePenaltyWinRate * 100}%` }}
              />
            </div>
            <span className="w-10 text-xs font-semibold text-right tabular-nums">
              {(homePenaltyWinRate * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 text-xs font-medium truncate">{awayTeam}</span>
            <div className="flex-1 h-1.5 bg-background-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-loss rounded-full"
                style={{ width: `${awayPenaltyWinRate * 100}%` }}
              />
            </div>
            <span className="w-10 text-xs font-semibold text-right tabular-nums">
              {(awayPenaltyWinRate * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
