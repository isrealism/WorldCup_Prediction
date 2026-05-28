"use client";

import { cn } from "@/lib/utils";
import { History, Trophy, Scale } from "lucide-react";
import { getFlagEmoji } from "@/lib/mock-data";

interface H2HRecord {
  date: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

interface H2HSummaryProps {
  homeTeam: { name: string; code: string };
  awayTeam: { name: string; code: string };
  totalMatches: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  recentMatches: H2HRecord[];
  className?: string;
}

export function H2HSummary({
  homeTeam,
  awayTeam,
  totalMatches,
  homeWins,
  draws,
  awayWins,
  recentMatches,
  className,
}: H2HSummaryProps) {
  const homeWinRate = totalMatches > 0 ? homeWins / totalMatches : 0;
  const drawRate = totalMatches > 0 ? draws / totalMatches : 0;
  const awayWinRate = totalMatches > 0 ? awayWins / totalMatches : 0;

  const getResultColor = (record: H2HRecord) => {
    if (record.homeScore > record.awayScore) return "bg-win";
    if (record.homeScore < record.awayScore) return "bg-loss";
    return "bg-draw";
  };

  const getResultLabel = (record: H2HRecord) => {
    if (record.homeScore > record.awayScore) return "W";
    if (record.homeScore < record.awayScore) return "L";
    return "D";
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Overall Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <History className="h-5 w-5 mx-auto mb-2 text-foreground-muted" />
          <div className="text-2xl font-bold">{totalMatches}</div>
          <div className="text-xs text-foreground-muted">Total Matches</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <div className="text-2xl mb-1">{getFlagEmoji(homeTeam.code)}</div>
          <div className="text-2xl font-bold text-win">{homeWins}</div>
          <div className="text-xs text-foreground-muted">{homeTeam.name} Wins</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <Scale className="h-5 w-5 mx-auto mb-2 text-draw" />
          <div className="text-2xl font-bold text-draw">{draws}</div>
          <div className="text-xs text-foreground-muted">Draws</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <div className="text-2xl mb-1">{getFlagEmoji(awayTeam.code)}</div>
          <div className="text-2xl font-bold text-loss">{awayWins}</div>
          <div className="text-xs text-foreground-muted">{awayTeam.name} Wins</div>
        </div>
      </div>

      {/* Win Rate Bar */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="font-medium text-win">{homeTeam.name}</span>
          <span className="text-foreground-muted">Draw</span>
          <span className="font-medium text-loss">{awayTeam.name}</span>
        </div>
        <div className="flex h-4 w-full overflow-hidden rounded-full">
          <div
            className="bg-win transition-all"
            style={{ width: `${homeWinRate * 100}%` }}
          />
          <div
            className="bg-draw transition-all"
            style={{ width: `${drawRate * 100}%` }}
          />
          <div
            className="bg-loss transition-all"
            style={{ width: `${awayWinRate * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-foreground-muted">
          <span>{(homeWinRate * 100).toFixed(0)}%</span>
          <span>{(drawRate * 100).toFixed(0)}%</span>
          <span>{(awayWinRate * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Recent Matches Timeline */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          Recent Encounters (from {homeTeam.name}&apos;s perspective)
        </h4>
        <div className="flex items-center justify-center gap-2">
          {recentMatches.slice(0, 5).map((match, index) => (
            <div
              key={index}
              className="group relative flex flex-col items-center"
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white",
                  getResultColor(match)
                )}
              >
                {getResultLabel(match)}
              </div>
              <span className="mt-1 text-xs text-foreground-muted">
                {match.homeScore}-{match.awayScore}
              </span>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="bg-background-secondary border border-border rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-lg">
                  <div className="font-semibold">{match.competition}</div>
                  <div className="text-foreground-muted">{match.date}</div>
                  <div>
                    {match.homeTeam} {match.homeScore} - {match.awayScore}{" "}
                    {match.awayTeam}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Mock H2H data generator
export function generateMockH2HData(
  homeTeam: { name: string; code: string },
  awayTeam: { name: string; code: string }
) {
  const recentMatches: H2HRecord[] = [
    {
      date: "2024-06-15",
      competition: "Copa America",
      homeTeam: homeTeam.name,
      awayTeam: awayTeam.name,
      homeScore: 2,
      awayScore: 1,
    },
    {
      date: "2023-11-21",
      competition: "Friendly",
      homeTeam: awayTeam.name,
      awayTeam: homeTeam.name,
      homeScore: 0,
      awayScore: 0,
    },
    {
      date: "2022-12-09",
      competition: "World Cup 2022",
      homeTeam: homeTeam.name,
      awayTeam: awayTeam.name,
      homeScore: 2,
      awayScore: 2,
    },
    {
      date: "2022-09-23",
      competition: "Friendly",
      homeTeam: homeTeam.name,
      awayTeam: awayTeam.name,
      homeScore: 1,
      awayScore: 3,
    },
    {
      date: "2021-07-10",
      competition: "Copa America Final",
      homeTeam: awayTeam.name,
      awayTeam: homeTeam.name,
      homeScore: 0,
      awayScore: 1,
    },
  ];

  return {
    totalMatches: 24,
    homeWins: 10,
    draws: 6,
    awayWins: 8,
    recentMatches,
  };
}
