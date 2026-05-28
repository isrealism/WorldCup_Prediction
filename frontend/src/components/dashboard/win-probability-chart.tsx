"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Team, continentColors, getFlagEmoji } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { TrendingUp, ChevronRight } from "lucide-react";
import { useState } from "react";

interface WinProbabilityChartProps {
  teams: Team[];
}

export function WinProbabilityChart({ teams }: WinProbabilityChartProps) {
  const [dataSource, setDataSource] = useState<"model" | "market">("model");
  
  // Sort by win probability
  const sortedTeams = [...teams].sort((a, b) => b.winProbability - a.winProbability);
  const maxProb = sortedTeams[0]?.winProbability || 1;

  return (
    <Card elevated>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4.5 w-4.5 text-primary" />
          <CardTitle>Championship Odds</CardTitle>
        </div>
        <div className="flex items-center rounded-lg bg-background-secondary p-0.5">
          <button
            onClick={() => setDataSource("model")}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-all",
              dataSource === "model"
                ? "bg-card text-foreground shadow-sm"
                : "text-foreground-muted hover:text-foreground"
            )}
          >
            Model
          </button>
          <button
            onClick={() => setDataSource("market")}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-all",
              dataSource === "market"
                ? "bg-card text-foreground shadow-sm"
                : "text-foreground-muted hover:text-foreground"
            )}
          >
            Market
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {sortedTeams.slice(0, 10).map((team, index) => {
            const percentage = (team.winProbability * 100).toFixed(1);
            const barWidth = (team.winProbability / maxProb) * 100;
            const colors = continentColors[team.continent];

            return (
              <Link
                key={team.code}
                href={`/team/${team.name.toLowerCase()}`}
                className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-background-secondary"
              >
                <span className="w-5 text-xs font-medium text-foreground-muted">
                  {index + 1}
                </span>
                <span className="text-xl">{getFlagEmoji(team.code)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {team.name}
                    </span>
                    <span className="text-xs text-foreground-subtle hidden sm:inline">
                      #{team.fifaRanking}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-background-tertiary overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        colors?.bg || "bg-primary"
                      )}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    colors?.text || "text-primary"
                  )}
                >
                  {percentage}%
                </span>
                <ChevronRight className="h-4 w-4 text-foreground-subtle opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            );
          })}
        </div>
        
        {/* Footer with legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 bg-background-secondary/50">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {Object.entries(continentColors).slice(0, 4).map(([continent, colors]) => (
              <div key={continent} className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", colors.bg)} />
                <span className="text-xs text-foreground-muted">{continent}</span>
              </div>
            ))}
          </div>
          <Link
            href="/tournament"
            className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
          >
            View all teams
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
