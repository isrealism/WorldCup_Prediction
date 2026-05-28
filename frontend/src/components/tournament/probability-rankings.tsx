"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getFlagEmoji, continentColors, Team } from "@/lib/mock-data";
import { ChevronDown, ChevronUp, Trophy, Medal } from "lucide-react";

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

  const getProbColor = (prob: number) => {
    if (prob >= 0.7) return "text-success";
    if (prob >= 0.4) return "text-warning";
    if (prob >= 0.1) return "text-foreground";
    return "text-foreground-muted";
  };

  return (
    <div className={cn("rounded-xl border border-border bg-card overflow-hidden", className)}>
      {/* Table Header */}
      <div className="grid grid-cols-8 gap-2 px-4 py-3 bg-background-secondary text-xs font-medium text-foreground-muted border-b border-border">
        <div className="col-span-2">Team</div>
        <div className="text-center">Group</div>
        <div className="text-center">R16</div>
        <div className="text-center">QF</div>
        <div className="text-center">SF</div>
        <div className="text-center">Final</div>
        <div className="text-center">
          <Trophy className="h-4 w-4 mx-auto" />
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-border">
        {sortedTeams.map((teamData, index) => {
          const isExpanded = expandedTeam === teamData.team.code;
          const colors = continentColors[teamData.team.continent];

          return (
            <div key={teamData.team.code}>
              {/* Main Row */}
              <button
                onClick={() =>
                  setExpandedTeam(isExpanded ? null : teamData.team.code)
                }
                className="w-full grid grid-cols-8 gap-2 px-4 py-3 items-center hover:bg-card-hover transition-colors text-left"
              >
                {/* Team */}
                <div className="col-span-2 flex items-center gap-3">
                  <span className="w-6 text-sm text-foreground-muted font-medium">
                    {index + 1}
                  </span>
                  <span className="text-xl">{getFlagEmoji(teamData.team.code)}</span>
                  <div>
                    <div className="font-medium text-sm truncate">
                      {teamData.team.name}
                    </div>
                    <div className={cn("text-xs", colors?.text)}>
                      {teamData.team.continent}
                    </div>
                  </div>
                </div>

                {/* Probabilities */}
                <div className={cn("text-center text-sm font-medium", getProbColor(teamData.groupStage))}>
                  {formatProb(teamData.groupStage)}
                </div>
                <div className={cn("text-center text-sm font-medium", getProbColor(teamData.roundOf16))}>
                  {formatProb(teamData.roundOf16)}
                </div>
                <div className={cn("text-center text-sm font-medium", getProbColor(teamData.quarterFinals))}>
                  {formatProb(teamData.quarterFinals)}
                </div>
                <div className={cn("text-center text-sm font-medium", getProbColor(teamData.semiFinals))}>
                  {formatProb(teamData.semiFinals)}
                </div>
                <div className={cn("text-center text-sm font-medium", getProbColor(teamData.finals))}>
                  {formatProb(teamData.finals)}
                </div>
                <div className="flex items-center justify-center gap-1">
                  <span className={cn("text-sm font-bold", index < 3 ? "text-primary" : getProbColor(teamData.champion))}>
                    {formatProb(teamData.champion)}
                  </span>
                  {index < 3 && <Medal className={cn("h-4 w-4", index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : "text-amber-600")} />}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-foreground-muted ml-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-foreground-muted ml-1" />
                  )}
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 py-4 bg-background-secondary border-t border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium">Probability Journey</h4>
                    <Link
                      href={`/team/${teamData.team.name.toLowerCase()}`}
                      className="text-xs text-primary hover:text-primary-hover transition-colors"
                    >
                      View Team Details
                    </Link>
                  </div>
                  
                  {/* Visual probability flow */}
                  <div className="flex items-center gap-1">
                    {[
                      { label: "Group", prob: teamData.groupStage },
                      { label: "R16", prob: teamData.roundOf16 },
                      { label: "QF", prob: teamData.quarterFinals },
                      { label: "SF", prob: teamData.semiFinals },
                      { label: "Final", prob: teamData.finals },
                      { label: "Win", prob: teamData.champion },
                    ].map((stage, i, arr) => (
                      <div key={stage.label} className="flex-1 flex items-center">
                        <div className="flex-1">
                          <div
                            className={cn(
                              "h-8 rounded-md flex items-center justify-center text-xs font-medium transition-all",
                              stage.prob >= 0.5
                                ? "bg-primary text-background"
                                : stage.prob >= 0.2
                                ? "bg-primary/50 text-foreground"
                                : "bg-background-tertiary text-foreground-muted"
                            )}
                          >
                            {formatProb(stage.prob)}
                          </div>
                          <div className="text-xs text-center mt-1 text-foreground-muted">
                            {stage.label}
                          </div>
                        </div>
                        {i < arr.length - 1 && (
                          <div className="w-4 h-px bg-border mx-1" />
                        )}
                      </div>
                    ))}
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
