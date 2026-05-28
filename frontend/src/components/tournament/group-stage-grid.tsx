"use client";

import { cn } from "@/lib/utils";
import { getFlagEmoji, continentColors, Team } from "@/lib/mock-data";

interface GroupTeam {
  team: Team;
  qualifyProb: number;
  firstProb: number;
}

interface Group {
  name: string;
  teams: GroupTeam[];
}

interface GroupStageGridProps {
  groups: Group[];
  className?: string;
}

export function GroupStageGrid({ groups, className }: GroupStageGridProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}>
      {groups.map((group) => (
        <div
          key={group.name}
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          {/* Group Header */}
          <div className="px-4 py-3 bg-background-secondary border-b border-border">
            <h3 className="text-sm font-semibold">Group {group.name}</h3>
          </div>

          {/* Teams */}
          <div className="divide-y divide-border">
            {group.teams.map((teamData, index) => {
              const colors = continentColors[teamData.team.continent];
              const isQualifying = index < 2;

              return (
                <div
                  key={teamData.team.code}
                  className={cn(
                    "px-4 py-3 flex items-center gap-3",
                    isQualifying && "bg-primary/5"
                  )}
                >
                  {/* Position */}
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                      isQualifying
                        ? "bg-primary text-background"
                        : "bg-background-secondary text-foreground-muted"
                    )}
                  >
                    {index + 1}
                  </span>

                  {/* Team Info */}
                  <span className="text-lg">{getFlagEmoji(teamData.team.code)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {teamData.team.name}
                    </div>
                    <div className={cn("text-xs", colors?.text)}>
                      {teamData.team.continent}
                    </div>
                  </div>

                  {/* Probability Bar */}
                  <div className="w-20">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-background-secondary">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          colors?.bg || "bg-primary"
                        )}
                        style={{ width: `${teamData.qualifyProb * 100}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-right text-foreground-muted tabular-nums">
                      {(teamData.qualifyProb * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
