"use client";

import { cn } from "@/lib/utils";
import { Clock, Percent } from "lucide-react";

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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium">Extra Time Probability</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-warning">
              {(extraTimeProb * 100).toFixed(1)}%
            </span>
          </div>
          <p className="mt-2 text-xs text-foreground-muted">
            Likelihood of match going to extra time
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Percent className="h-4 w-4 text-danger" />
            <span className="text-sm font-medium">Penalty Shootout</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-danger">
              {(penaltyProb * 100).toFixed(1)}%
            </span>
          </div>
          <p className="mt-2 text-xs text-foreground-muted">
            Likelihood of going to penalties
          </p>
        </div>
      </div>

      {/* Historical Penalty Records */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="text-sm font-medium mb-4">
          Historical Penalty Shootout Win Rates
        </h4>
        <div className="space-y-3">
          {/* Home team */}
          <div className="flex items-center gap-3">
            <span className="w-24 text-sm font-medium truncate">{homeTeam}</span>
            <div className="flex-1 h-3 bg-background-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-win rounded-full transition-all"
                style={{ width: `${homePenaltyWinRate * 100}%` }}
              />
            </div>
            <span className="w-12 text-sm font-semibold text-right tabular-nums">
              {(homePenaltyWinRate * 100).toFixed(0)}%
            </span>
          </div>

          {/* Away team */}
          <div className="flex items-center gap-3">
            <span className="w-24 text-sm font-medium truncate">{awayTeam}</span>
            <div className="flex-1 h-3 bg-background-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-loss rounded-full transition-all"
                style={{ width: `${awayPenaltyWinRate * 100}%` }}
              />
            </div>
            <span className="w-12 text-sm font-semibold text-right tabular-nums">
              {(awayPenaltyWinRate * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
