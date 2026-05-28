"use client";

import { cn } from "@/lib/utils";
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
    return "bg-foreground-subtle";
  };

  const getResultLabel = (record: H2HRecord) => {
    if (record.homeScore > record.awayScore) return "W";
    if (record.homeScore < record.awayScore) return "L";
    return "D";
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="rounded-lg bg-background-secondary p-2">
          <div className="text-lg font-bold">{totalMatches}</div>
          <div className="text-[10px] text-foreground-muted">Matches</div>
        </div>
        <div className="rounded-lg bg-win/10 p-2">
          <div className="text-lg font-bold text-win">{homeWins}</div>
          <div className="text-[10px] text-foreground-muted">{homeTeam.code}</div>
        </div>
        <div className="rounded-lg bg-background-secondary p-2">
          <div className="text-lg font-bold text-foreground-subtle">{draws}</div>
          <div className="text-[10px] text-foreground-muted">Draws</div>
        </div>
        <div className="rounded-lg bg-loss/10 p-2">
          <div className="text-lg font-bold text-loss">{awayWins}</div>
          <div className="text-[10px] text-foreground-muted">{awayTeam.code}</div>
        </div>
      </div>

      {/* Win Rate Bar */}
      <div>
        <div className="flex h-2 w-full overflow-hidden rounded-full">
          <div className="bg-win" style={{ width: `${homeWinRate * 100}%` }} />
          <div className="bg-foreground-subtle/40" style={{ width: `${drawRate * 100}%` }} />
          <div className="bg-loss" style={{ width: `${awayWinRate * 100}%` }} />
        </div>
        <div className="flex items-center justify-between mt-1 text-[10px] text-foreground-muted">
          <span>{(homeWinRate * 100).toFixed(0)}%</span>
          <span>{(drawRate * 100).toFixed(0)}%</span>
          <span>{(awayWinRate * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Recent Matches */}
      <div>
        <h4 className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-2">
          Last 5 Encounters
        </h4>
        <div className="flex items-center justify-center gap-2">
          {recentMatches.slice(0, 5).map((match, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold text-white",
                  getResultColor(match)
                )}
              >
                {getResultLabel(match)}
              </div>
              <span className="mt-1 text-[10px] text-foreground-muted tabular-nums">
                {match.homeScore}-{match.awayScore}
              </span>
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
