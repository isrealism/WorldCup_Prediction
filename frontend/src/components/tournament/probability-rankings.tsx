"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getFlagEmoji, continentColors, Team } from "@/lib/mock-data";
import { ChevronDown, ChevronUp, ChevronRight } from "lucide-react";

export interface TeamProbabilities {
  team: Team;
  groupStage: number;
  roundOf16: number;
  quarterFinals: number;
  semiFinals: number;
  finals: number;
  champion: number;
}

interface ProbabilityRankingsProps {
  teams: TeamProbabilities[];
  className?: string;
}

export function ProbabilityRankings({
  teams,
  className,
}: ProbabilityRankingsProps) {
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  // Sort by champion probability
  const sortedTeams = [...teams].sort((a, b) => b.champion - a.champion);

  const formatProb = (prob: number) => `${(prob * 100).toFixed(1)}%`;

  return (
    <div className={cn("overflow-hidden", className)}>
      {/* Table Header */}
      <div className="grid grid-cols-8 gap-2 px-5 py-2.5 bg-background-secondary text-[10px] font-medium text-foreground-muted uppercase tracking-wider border-b border-border">
        <div className="col-span-2">Team</div>
        <div className="text-center">Group</div>
        <div className="text-center">R16</div>
        <div className="text-center">QF</div>
        <div className="text-center">SF</div>
        <div className="text-center">Final</div>
        <div className="text-center">Champ</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-border">
        {sortedTeams.slice(0, 20).map((teamData, index) => {
          const isExpanded = expandedTeam === teamData.team.code;
          const colors = continentColors[teamData.team.continent];

          return (
            <div key={teamData.team.code}>
              {/* Main Row */}
              <button
                onClick={() =>
                  setExpandedTeam(isExpanded ? null : teamData.team.code)
                }
                className="w-full grid grid-cols-8 gap-2 px-5 py-2.5 items-center hover:bg-background-secondary transition-colors text-left"
              >
                {/* Team */}
                <div className="col-span-2 flex items-center gap-2">
                  <span className="w-4 text-xs text-foreground-muted font-medium tabular-nums">
                    {index + 1}
                  </span>
                  <span className="text-lg">{getFlagEmoji(teamData.team.code)}</span>
                  <span className="text-sm font-medium truncate">
                    {teamData.team.name}
                  </span>
                </div>

                {/* Probabilities */}
                <div className="text-center text-xs font-medium tabular-nums text-foreground-muted">
                  {formatProb(teamData.groupStage)}
                </div>
                <div className="text-center text-xs font-medium tabular-nums text-foreground-muted">
                  {formatProb(teamData.roundOf16)}
                </div>
                <div className="text-center text-xs font-medium tabular-nums text-foreground-muted">
                  {formatProb(teamData.quarterFinals)}
                </div>
                <div className="text-center text-xs font-medium tabular-nums text-foreground-muted">
                  {formatProb(teamData.semiFinals)}
                </div>
                <div className="text-center text-xs font-medium tabular-nums text-foreground-muted">
                  {formatProb(teamData.finals)}
                </div>
                <div className="flex items-center justify-center gap-1">
                  <span className={cn(
                    "text-xs font-bold tabular-nums",
                    index < 3 ? "text-primary" : "text-foreground"
                  )}>
                    {formatProb(teamData.champion)}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5 text-foreground-subtle" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-foreground-subtle" />
                  )}
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-5 py-3 bg-background-secondary border-t border-border">
                  {/* Visual probability flow */}
                  <div className="flex items-center gap-1">
                    {[
                      { label: "Group", prob: teamData.groupStage },
                      { label: "R16", prob: teamData.roundOf16 },
                      { label: "QF", prob: teamData.quarterFinals },
                      { label: "SF", prob: teamData.semiFinals },
                      { label: "Final", prob: teamData.finals },
                      { label: "Champ", prob: teamData.champion },
                    ].map((stage, i, arr) => (
                      <div key={stage.label} className="flex-1 flex items-center">
                        <div className="flex-1">
                          <div
                            className={cn(
                              "h-7 rounded-md flex items-center justify-center text-[10px] font-semibold",
                              stage.prob >= 0.5
                                ? "bg-primary text-white"
                                : stage.prob >= 0.2
                                ? "bg-primary/30 text-foreground"
                                : "bg-background-tertiary text-foreground-muted"
                            )}
                          >
                            {formatProb(stage.prob)}
                          </div>
                          <div className="text-[10px] text-center mt-0.5 text-foreground-subtle">
                            {stage.label}
                          </div>
                        </div>
                        {i < arr.length - 1 && (
                          <div className="w-2 h-px bg-border mx-0.5" />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex justify-end">
                    <Link
                      href={`/team/${teamData.team.name.toLowerCase()}`}
                      className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
                    >
                      View team
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
