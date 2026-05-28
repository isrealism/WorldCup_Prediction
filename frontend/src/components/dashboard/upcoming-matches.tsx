"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ProbabilityBar } from "@/components/ui/probability-bar";
import { Match, getFlagEmoji } from "@/lib/mock-data";
import { Calendar, ArrowRight } from "lucide-react";

interface UpcomingMatchesProps {
  matches: Match[];
}

export function UpcomingMatches({ matches }: UpcomingMatchesProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Matches
            </CardTitle>
            <CardDescription>Next 7 days predictions</CardDescription>
          </div>
          <Link
            href="/predict"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {matches.map((match) => {
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
                className="block rounded-xl border border-border bg-card p-4 transition-all hover:border-border-hover hover:bg-card-hover"
              >
                {/* Match header */}
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full bg-primary-muted px-2 py-0.5 text-xs font-medium text-primary">
                    {match.stage}
                  </span>
                  <span className="text-xs text-foreground-muted">
                    {formattedDate} {formattedTime}
                  </span>
                </div>

                {/* Teams */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {getFlagEmoji(match.homeTeam.code)}
                    </span>
                    <div>
                      <div className="font-semibold">{match.homeTeam.name}</div>
                      <div className="text-xs text-foreground-muted">
                        #{match.homeTeam.fifaRanking} FIFA
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-foreground-muted">Predicted</span>
                    <span className="text-xl font-bold">
                      {match.predictedScore.home} - {match.predictedScore.away}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-semibold">{match.awayTeam.name}</div>
                      <div className="text-xs text-foreground-muted">
                        #{match.awayTeam.fifaRanking} FIFA
                      </div>
                    </div>
                    <span className="text-3xl">
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
                />
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
