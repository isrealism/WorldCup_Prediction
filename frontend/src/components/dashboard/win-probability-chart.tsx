"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Team, continentColors, getFlagEmoji } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

interface WinProbabilityChartProps {
  teams: Team[];
  dataSource?: "model" | "market";
}

export function WinProbabilityChart({
  teams,
  dataSource = "model",
}: WinProbabilityChartProps) {
  // Sort by win probability
  const sortedTeams = [...teams].sort((a, b) => b.winProbability - a.winProbability);
  const maxProb = sortedTeams[0]?.winProbability || 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Championship Odds
            </CardTitle>
            <CardDescription>
              Probability of winning the tournament
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                dataSource === "model"
                  ? "bg-primary text-background"
                  : "text-foreground-muted hover:bg-card-hover"
              )}
            >
              Model
            </button>
            <button
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                dataSource === "market"
                  ? "bg-primary text-background"
                  : "text-foreground-muted hover:bg-card-hover"
              )}
            >
              Market
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedTeams.slice(0, 12).map((team, index) => {
            const percentage = (team.winProbability * 100).toFixed(1);
            const barWidth = (team.winProbability / maxProb) * 100;
            const colors = continentColors[team.continent];

            return (
              <Link
                key={team.code}
                href={`/team/${team.name.toLowerCase()}`}
                className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-card-hover"
              >
                <span className="w-5 text-xs text-foreground-muted">
                  {index + 1}
                </span>
                <span className="text-xl">{getFlagEmoji(team.code)}</span>
                <span className="w-24 text-sm font-medium truncate">
                  {team.name}
                </span>
                <div className="flex-1">
                  <div className="h-6 w-full rounded-full bg-background-secondary overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500 group-hover:opacity-80",
                        colors?.bg || "bg-primary"
                      )}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
                <span
                  className={cn(
                    "w-16 text-right text-sm font-semibold tabular-nums",
                    colors?.text || "text-primary"
                  )}
                >
                  {percentage}%
                </span>
              </Link>
            );
          })}
        </div>
        
        {/* Continent Legend */}
        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border pt-4">
          {Object.entries(continentColors).map(([continent, colors]) => (
            <div key={continent} className="flex items-center gap-2">
              <span className={cn("h-3 w-3 rounded-full", colors.bg)} />
              <span className="text-xs text-foreground-muted">{continent}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
