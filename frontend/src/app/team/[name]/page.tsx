import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { mockTeamsWithStats, getFlagEmoji, continentColors } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  Trophy,
  TrendingUp,
  Users,
  Target,
  Shield,
  ChevronLeft,
} from "lucide-react";

// Mock player data
const mockPlayers = [
  { name: "Lionel Messi", position: "FW", club: "Inter Miami", value: "25M", rating: 9.2, status: "fit" },
  { name: "Julian Alvarez", position: "FW", club: "Atletico Madrid", value: "85M", rating: 8.5, status: "fit" },
  { name: "Lautaro Martinez", position: "FW", club: "Inter Milan", value: "110M", rating: 8.8, status: "fit" },
  { name: "Rodrigo De Paul", position: "MF", club: "Atletico Madrid", value: "35M", rating: 8.2, status: "fit" },
  { name: "Enzo Fernandez", position: "MF", club: "Chelsea", value: "120M", rating: 8.6, status: "fit" },
  { name: "Alexis Mac Allister", position: "MF", club: "Liverpool", value: "75M", rating: 8.4, status: "doubt" },
  { name: "Cristian Romero", position: "DF", club: "Tottenham", value: "55M", rating: 8.3, status: "fit" },
  { name: "Nicolas Otamendi", position: "DF", club: "Benfica", value: "4M", rating: 7.5, status: "fit" },
  { name: "Emiliano Martinez", position: "GK", club: "Aston Villa", value: "35M", rating: 8.7, status: "fit" },
];

// Mock recent form data
const mockRecentForm = [
  { opponent: "Brazil", result: "W", score: "2-1" },
  { opponent: "Uruguay", result: "D", score: "1-1" },
  { opponent: "Colombia", result: "W", score: "3-0" },
  { opponent: "Paraguay", result: "W", score: "2-0" },
  { opponent: "Chile", result: "W", score: "4-1" },
  { opponent: "Peru", result: "D", score: "0-0" },
  { opponent: "Venezuela", result: "W", score: "3-1" },
  { opponent: "Ecuador", result: "L", score: "1-2" },
];

// Mock World Cup history
const mockWCHistory = [
  { year: 2022, result: "Champion", position: 1 },
  { year: 2018, result: "R16", position: 9 },
  { year: 2014, result: "Runner-up", position: 2 },
  { year: 2010, result: "QF", position: 5 },
  { year: 2006, result: "QF", position: 6 },
  { year: 1986, result: "Champion", position: 1 },
];

interface PageProps {
  params: Promise<{ name: string }>;
}

export default async function TeamDetailPage({ params }: PageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  
  const team = mockTeamsWithStats.find(
    (t) => t.name.toLowerCase() === decodedName.toLowerCase()
  );

  if (!team) {
    notFound();
  }

  const colors = continentColors[team.continent];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      {/* Back link */}
      <Link 
        href="/teams" 
        className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground mb-4"
      >
        <ChevronLeft className="h-4 w-4" />
        All Teams
      </Link>

      {/* Team Header */}
      <Card elevated className="mb-6">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{getFlagEmoji(team.code)}</div>
              <div>
                <h1 className="text-2xl font-bold">{team.name}</h1>
                <div className="flex items-center gap-2 text-sm text-foreground-muted mt-0.5">
                  <span className={cn("font-medium", colors?.text)}>
                    {team.continent}
                  </span>
                  <span>Group {team.group}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-[10px] text-foreground-muted uppercase tracking-wider">FIFA</div>
                <div className="text-xl font-bold">#{team.fifaRanking}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-foreground-muted uppercase tracking-wider">Elo</div>
                <div className="text-xl font-bold">{team.elo}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-foreground-muted uppercase tracking-wider">Win%</div>
                <div className="text-xl font-bold text-primary">
                  {(team.winProbability * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Form */}
        <Card elevated className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <CardTitle>Recent Form</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Form indicators */}
            <div className="flex items-center gap-1.5 mb-4">
              {mockRecentForm.slice(0, 8).map((match, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold text-white",
                    match.result === "W"
                      ? "bg-win"
                      : match.result === "D"
                      ? "bg-foreground-subtle"
                      : "bg-loss"
                  )}
                  title={`vs ${match.opponent}: ${match.score}`}
                >
                  {match.result}
                </div>
              ))}
            </div>
            {/* Match list */}
            <div className="divide-y divide-border">
              {mockRecentForm.slice(0, 5).map((match, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold text-white",
                        match.result === "W"
                          ? "bg-win"
                          : match.result === "D"
                          ? "bg-foreground-subtle"
                          : "bg-loss"
                      )}
                    >
                      {match.result}
                    </span>
                    <span className="text-sm">vs {match.opponent}</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{match.score}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Stats */}
        <Card elevated>
          <CardHeader className="flex flex-row items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Goals/Game", value: "2.3" },
                { label: "Conceded/Game", value: "0.8" },
                { label: "Clean Sheets", value: "6" },
                { label: "xG/Game", value: "2.1" },
                { label: "xGA/Game", value: "0.9" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-sm text-foreground-muted">{stat.label}</span>
                  <span className="text-sm font-semibold">{stat.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Squad */}
      <Card elevated className="mt-6">
        <CardHeader className="flex flex-row items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <CardTitle>Squad</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background-secondary text-[10px] text-foreground-muted uppercase tracking-wider">
                  <th className="px-5 py-2 text-left font-medium">Player</th>
                  <th className="px-5 py-2 text-left font-medium">Pos</th>
                  <th className="px-5 py-2 text-left font-medium">Club</th>
                  <th className="px-5 py-2 text-right font-medium">Value</th>
                  <th className="px-5 py-2 text-right font-medium">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockPlayers.map((player) => (
                  <tr key={player.name} className="hover:bg-background-secondary">
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            player.status === "fit"
                              ? "bg-success"
                              : player.status === "doubt"
                              ? "bg-warning"
                              : "bg-danger"
                          )}
                        />
                        <span className="text-sm font-medium">{player.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 text-xs text-foreground-muted">
                      {player.position}
                    </td>
                    <td className="px-5 py-2.5 text-xs text-foreground-muted">
                      {player.club}
                    </td>
                    <td className="px-5 py-2.5 text-xs text-right font-medium">
                      {player.value}
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <span className="inline-flex h-5 w-8 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
                        {player.rating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* World Cup History */}
      <Card elevated className="mt-6">
        <CardHeader className="flex flex-row items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <CardTitle>World Cup History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {mockWCHistory.map((wc) => (
              <div
                key={wc.year}
                className={cn(
                  "rounded-lg px-3 py-2 text-center",
                  wc.position === 1
                    ? "bg-yellow-500/10 border border-yellow-500/30"
                    : wc.position === 2
                    ? "bg-foreground-subtle/10 border border-foreground-subtle/30"
                    : "bg-background-secondary"
                )}
              >
                <div className="text-sm font-bold">{wc.year}</div>
                <div
                  className={cn(
                    "text-xs",
                    wc.position === 1
                      ? "text-yellow-600 font-semibold"
                      : wc.position === 2
                      ? "text-foreground-subtle font-semibold"
                      : "text-foreground-muted"
                  )}
                >
                  {wc.result}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
