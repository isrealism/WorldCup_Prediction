"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProbabilityBar } from "@/components/ui/probability-bar";
import { Match, getFlagEmoji } from "@/lib/mock-data";
import { Calendar, ChevronRight } from "lucide-react";

interface UpcomingMatchesProps {
  matches: Match[];
}

export function UpcomingMatches({ matches }: UpcomingMatchesProps) {
  return (
    <Card elevated>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4.5 w-4.5 text-primary" />
          <CardTitle>Upcoming Matches</CardTitle>
        </div>
        <Link
          href="/predict"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover transition-colors"
        >
          View all
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid gap-0 divide-y divide-border sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
          {matches.slice(0, 4).map((match) => {
            const matchDate = new Date(match.date);
            const formattedDate = matchDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            const formattedTime = matchDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <Link
                key={match.id}
                href={`/predict?home=${match.homeTeam.code}&away=${match.awayTeam.code}`}
                className="group block p-4 transition-colors hover:bg-background-secondary"
              >
                {/* Match header */}
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-md bg-primary-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {match.stage}
                  </span>
                  <span className="text-xs text-foreground-muted">
                    {formattedDate} | {formattedTime}
                  </span>
                </div>

                {/* Teams */}
                <div className="mb-3 flex items-center justify-between gap-2">
                  {/* Home team */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-2xl flex-shrink-0">
                      {getFlagEmoji(match.homeTeam.code)}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{match.homeTeam.name}</div>
                      <div className="text-[10px] text-foreground-subtle">
                        #{match.homeTeam.fifaRanking} FIFA
                      </div>
                    </div>
                  </div>
                  
                  {/* Score prediction */}
                  <div className="flex flex-col items-center px-3">
                    <span className="text-[10px] uppercase tracking-wider text-foreground-subtle">vs</span>
                    <span className="text-lg font-bold tabular-nums">
                      {match.predictedScore.home} - {match.predictedScore.away}
                    </span>
                  </div>

                  {/* Away team */}
                  <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                    <div className="min-w-0 text-right">
                      <div className="text-sm font-semibold truncate">{match.awayTeam.name}</div>
                      <div className="text-[10px] text-foreground-subtle">
                        #{match.awayTeam.fifaRanking} FIFA
                      </div>
                    </div>
                    <span className="text-2xl flex-shrink-0">
                      {getFlagEmoji(match.awayTeam.code)}
                    </span>
                  </div>
                </div>

                {/* Probability Bar */}
                <ProbabilityBar
                  homeWin={match.homeWinProb}
                  draw={match.drawProb}
                  awayWin={match.awayWinProb}
                  homeLabel={match.homeTeam.code}
                  awayLabel={match.awayTeam.code}
                  size="sm"
                />
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
