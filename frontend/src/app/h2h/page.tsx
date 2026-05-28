"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TeamSelector, mockTeams, Team } from "@/components/team-selector";
import { getFlagEmoji } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  Swords,
  Trophy,
  History,
  Scale,
  Calendar,
  MapPin,
  Filter,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// Mock H2H match data
const generateMockH2HMatches = (team1: string, team2: string) => [
  { date: "2024-06-15", competition: "Copa America", stage: "Semi-Final", venue: "Miami, USA", home: team1, away: team2, homeScore: 2, awayScore: 1, neutral: true },
  { date: "2023-11-21", competition: "Friendly", stage: "Friendly", venue: "Abu Dhabi, UAE", home: team2, away: team1, homeScore: 0, awayScore: 0, neutral: true },
  { date: "2022-12-09", competition: "World Cup 2022", stage: "Quarter-Final", venue: "Lusail, Qatar", home: team1, away: team2, homeScore: 2, awayScore: 2, neutral: true },
  { date: "2022-09-23", competition: "Friendly", stage: "Friendly", venue: "New Jersey, USA", home: team1, away: team2, homeScore: 1, awayScore: 3, neutral: true },
  { date: "2021-07-10", competition: "Copa America", stage: "Final", venue: "Rio de Janeiro, Brazil", home: team2, away: team1, homeScore: 0, awayScore: 1, neutral: false },
  { date: "2019-07-06", competition: "Copa America", stage: "Semi-Final", venue: "Belo Horizonte, Brazil", home: team2, away: team1, homeScore: 0, awayScore: 2, neutral: false },
  { date: "2018-06-30", competition: "World Cup 2018", stage: "Round of 16", venue: "Kazan, Russia", home: team1, away: team2, homeScore: 2, awayScore: 1, neutral: true },
  { date: "2017-06-09", competition: "Friendly", stage: "Friendly", venue: "Melbourne, Australia", home: team2, away: team1, homeScore: 0, awayScore: 1, neutral: true },
  { date: "2014-07-13", competition: "World Cup 2014", stage: "Final", venue: "Rio de Janeiro, Brazil", home: team1, away: team2, homeScore: 0, awayScore: 1, neutral: false },
  { date: "2010-06-27", competition: "World Cup 2010", stage: "Quarter-Final", venue: "Cape Town, South Africa", home: team1, away: team2, homeScore: 0, awayScore: 4, neutral: true },
];

// Mock Elo trend data
const generateEloTrend = (team1: string, team2: string) => [
  { year: "1990", [team1]: 1920, [team2]: 1850, diff: 70 },
  { year: "1995", [team1]: 1880, [team2]: 1910, diff: -30 },
  { year: "2000", [team1]: 1950, [team2]: 1980, diff: -30 },
  { year: "2005", [team1]: 2000, [team2]: 2050, diff: -50 },
  { year: "2010", [team1]: 1920, [team2]: 2100, diff: -180 },
  { year: "2015", [team1]: 2020, [team2]: 2000, diff: 20 },
  { year: "2020", [team1]: 2100, [team2]: 2050, diff: 50 },
  { year: "2025", [team1]: 2143, [team2]: 2075, diff: 68 },
];

function H2HContent() {
  const searchParams = useSearchParams();
  const [team1, setTeam1] = useState<Team | null>(null);
  const [team2, setTeam2] = useState<Team | null>(null);
  const [filter, setFilter] = useState<"all" | "worldcup" | "knockout">("all");

  const matches = team1 && team2 ? generateMockH2HMatches(team1.name, team2.name) : [];
  const eloTrend = team1 && team2 ? generateEloTrend(team1.name, team2.name) : [];

  // Calculate stats
  const stats = {
    total: matches.length,
    team1Wins: matches.filter(m => 
      (m.home === team1?.name && m.homeScore > m.awayScore) ||
      (m.away === team1?.name && m.awayScore > m.homeScore)
    ).length,
    draws: matches.filter(m => m.homeScore === m.awayScore).length,
    team2Wins: matches.filter(m => 
      (m.home === team2?.name && m.homeScore > m.awayScore) ||
      (m.away === team2?.name && m.awayScore > m.homeScore)
    ).length,
  };

  // Filter matches
  const filteredMatches = matches.filter(m => {
    if (filter === "worldcup") return m.competition.includes("World Cup");
    if (filter === "knockout") return ["Final", "Semi-Final", "Quarter-Final", "Round of 16"].includes(m.stage);
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Swords className="h-8 w-8 text-primary" />
          Head-to-Head
        </h1>
        <p className="mt-2 text-foreground-muted">
          Explore historical matchups between any two teams
        </p>
      </div>

      {/* Team Selection */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end">
            <div className="flex-1">
              <TeamSelector
                label="Team 1"
                value={team1}
                onChange={setTeam1}
                teams={mockTeams}
                placeholder="Select first team"
              />
            </div>

            <div className="flex items-center justify-center py-4 lg:py-0 lg:px-8">
              <div className="flex flex-col items-center gap-2">
                <Swords className="h-8 w-8 text-primary" />
                {team1 && team2 && (
                  <div className="flex items-center gap-2 text-3xl">
                    <span>{getFlagEmoji(team1.code)}</span>
                    <span className="text-foreground-muted">vs</span>
                    <span>{getFlagEmoji(team2.code)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1">
              <TeamSelector
                label="Team 2"
                value={team2}
                onChange={setTeam2}
                teams={mockTeams.filter(t => t.code !== team1?.code)}
                placeholder="Select second team"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {team1 && team2 && (
        <div className="space-y-8">
          {/* Overall Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <History className="h-6 w-6 mx-auto mb-2 text-foreground-muted" />
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-sm text-foreground-muted">Total Matches</div>
              </CardContent>
            </Card>
            <Card className="bg-win/5 border-win/20">
              <CardContent className="pt-6 text-center">
                <div className="text-2xl mb-1">{getFlagEmoji(team1.code)}</div>
                <div className="text-3xl font-bold text-win">{stats.team1Wins}</div>
                <div className="text-sm text-foreground-muted">{team1.name} Wins</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Scale className="h-6 w-6 mx-auto mb-2 text-draw" />
                <div className="text-3xl font-bold text-draw">{stats.draws}</div>
                <div className="text-sm text-foreground-muted">Draws</div>
              </CardContent>
            </Card>
            <Card className="bg-loss/5 border-loss/20">
              <CardContent className="pt-6 text-center">
                <div className="text-2xl mb-1">{getFlagEmoji(team2.code)}</div>
                <div className="text-3xl font-bold text-loss">{stats.team2Wins}</div>
                <div className="text-sm text-foreground-muted">{team2.name} Wins</div>
              </CardContent>
            </Card>
          </div>

          {/* Win Rate Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="font-medium text-win">{team1.name}</span>
                <span className="text-foreground-muted">Draw</span>
                <span className="font-medium text-loss">{team2.name}</span>
              </div>
              <div className="flex h-6 w-full overflow-hidden rounded-full">
                <div
                  className="bg-win transition-all"
                  style={{ width: `${(stats.team1Wins / stats.total) * 100}%` }}
                />
                <div
                  className="bg-draw transition-all"
                  style={{ width: `${(stats.draws / stats.total) * 100}%` }}
                />
                <div
                  className="bg-loss transition-all"
                  style={{ width: `${(stats.team2Wins / stats.total) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-foreground-muted">
                <span>{((stats.team1Wins / stats.total) * 100).toFixed(0)}%</span>
                <span>{((stats.draws / stats.total) * 100).toFixed(0)}%</span>
                <span>{((stats.team2Wins / stats.total) * 100).toFixed(0)}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Elo Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Elo Rating Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={eloTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="year" stroke="#666666" fontSize={12} />
                    <YAxis stroke="#666666" fontSize={12} domain={[1800, 2200]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#141414",
                        border: "1px solid #262626",
                        borderRadius: "8px",
                      }}
                    />
                    <ReferenceLine y={2000} stroke="#404040" strokeDasharray="3 3" />
                    <Line
                      type="monotone"
                      dataKey={team1.name}
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6" }}
                    />
                    <Line
                      type="monotone"
                      dataKey={team2.name}
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ fill: "#ef4444" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Match History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Match History
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-foreground-muted" />
                  {["all", "worldcup", "knockout"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f as typeof filter)}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                        filter === f
                          ? "bg-primary text-background"
                          : "text-foreground-muted hover:bg-card-hover"
                      )}
                    >
                      {f === "all" ? "All" : f === "worldcup" ? "World Cup" : "Knockout"}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredMatches.map((match, index) => {
                  const team1IsHome = match.home === team1.name;
                  const team1Score = team1IsHome ? match.homeScore : match.awayScore;
                  const team2Score = team1IsHome ? match.awayScore : match.homeScore;
                  const result = team1Score > team2Score ? "W" : team1Score < team2Score ? "L" : "D";

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:bg-card-hover transition-colors"
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white",
                          result === "W" ? "bg-win" : result === "L" ? "bg-loss" : "bg-draw"
                        )}
                      >
                        {result}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <span>{match.competition}</span>
                          <span className="text-foreground-muted">-</span>
                          <span className="text-foreground-muted">{match.stage}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-foreground-muted mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>{match.venue}</span>
                          {match.neutral && (
                            <span className="rounded bg-background-tertiary px-1.5 py-0.5 text-[10px]">
                              Neutral
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {team1Score} - {team2Score}
                        </div>
                        <div className="text-xs text-foreground-muted">{match.date}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {(!team1 || !team2) && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Swords className="h-12 w-12 mx-auto text-foreground-muted mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Select Two Teams
            </h3>
            <p className="text-foreground-muted max-w-md mx-auto">
              Choose two teams above to explore their complete head-to-head
              history, including all matches, statistics, and Elo rating trends.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function H2HPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="animate-pulse">
          <div className="h-10 w-64 bg-card rounded mb-4" />
          <div className="h-6 w-96 bg-card rounded mb-8" />
          <div className="h-64 bg-card rounded" />
        </div>
      </div>
    }>
      <H2HContent />
    </Suspense>
  );
}
