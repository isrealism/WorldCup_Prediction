import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { mockTeamsWithStats, getFlagEmoji, continentColors } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  Trophy,
  TrendingUp,
  Users,
  Target,
  Shield,
  Calendar,
  Medal,
  BarChart3,
  Star,
  Clock,
} from "lucide-react";

// Mock player data
const mockPlayers = [
  { name: "Lionel Messi", position: "Forward", club: "Inter Miami", value: "25M", rating: 9.2, status: "fit" },
  { name: "Julian Alvarez", position: "Forward", club: "Atletico Madrid", value: "85M", rating: 8.5, status: "fit" },
  { name: "Lautaro Martinez", position: "Forward", club: "Inter Milan", value: "110M", rating: 8.8, status: "fit" },
  { name: "Rodrigo De Paul", position: "Midfielder", club: "Atletico Madrid", value: "35M", rating: 8.2, status: "fit" },
  { name: "Enzo Fernandez", position: "Midfielder", club: "Chelsea", value: "120M", rating: 8.6, status: "fit" },
  { name: "Alexis Mac Allister", position: "Midfielder", club: "Liverpool", value: "75M", rating: 8.4, status: "doubt" },
  { name: "Nahuel Molina", position: "Defender", club: "Atletico Madrid", value: "30M", rating: 7.8, status: "fit" },
  { name: "Cristian Romero", position: "Defender", club: "Tottenham", value: "55M", rating: 8.3, status: "fit" },
  { name: "Nicolas Otamendi", position: "Defender", club: "Benfica", value: "4M", rating: 7.5, status: "fit" },
  { name: "Emiliano Martinez", position: "Goalkeeper", club: "Aston Villa", value: "35M", rating: 8.7, status: "fit" },
];

// Mock recent form data
const mockRecentForm = [
  { opponent: "Brazil", result: "W", score: "2-1", date: "2026-03-15" },
  { opponent: "Uruguay", result: "D", score: "1-1", date: "2026-03-10" },
  { opponent: "Colombia", result: "W", score: "3-0", date: "2026-02-20" },
  { opponent: "Paraguay", result: "W", score: "2-0", date: "2026-02-15" },
  { opponent: "Chile", result: "W", score: "4-1", date: "2026-01-25" },
  { opponent: "Peru", result: "D", score: "0-0", date: "2026-01-20" },
  { opponent: "Venezuela", result: "W", score: "3-1", date: "2025-11-18" },
  { opponent: "Ecuador", result: "L", score: "1-2", date: "2025-11-14" },
  { opponent: "Bolivia", result: "W", score: "5-0", date: "2025-10-15" },
  { name: "Mexico", result: "W", score: "2-0", date: "2025-10-10" },
];

// Mock World Cup history
const mockWCHistory = [
  { year: 2022, result: "Champion", position: 1 },
  { year: 2018, result: "Round of 16", position: 9 },
  { year: 2014, result: "Runner-up", position: 2 },
  { year: 2010, result: "Quarter-finals", position: 5 },
  { year: 2006, result: "Quarter-finals", position: 6 },
  { year: 2002, result: "Group Stage", position: 18 },
  { year: 1998, result: "Quarter-finals", position: 6 },
  { year: 1994, result: "Round of 16", position: 10 },
  { year: 1990, result: "Runner-up", position: 2 },
  { year: 1986, result: "Champion", position: 1 },
];

interface PageProps {
  params: Promise<{ name: string }>;
}

export default async function TeamDetailPage({ params }: PageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  
  // Find team by name (case-insensitive)
  const team = mockTeamsWithStats.find(
    (t) => t.name.toLowerCase() === decodedName.toLowerCase()
  );

  if (!team) {
    notFound();
  }

  const colors = continentColors[team.continent];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Team Header */}
      <div className="mb-8 rounded-xl border border-border bg-card p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6">
            <div className="text-7xl">{getFlagEmoji(team.code)}</div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
              <div className="mt-2 flex items-center gap-4">
                <span className={cn("text-sm font-medium", colors?.text)}>
                  {team.continent}
                </span>
                <span className="text-foreground-muted">|</span>
                <span className="text-sm text-foreground-muted">
                  Group {team.group}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 lg:gap-8">
            <div className="text-center">
              <div className="text-sm text-foreground-muted mb-1">FIFA Ranking</div>
              <div className="text-3xl font-bold text-primary">#{team.fifaRanking}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-foreground-muted mb-1">Elo Rating</div>
              <div className="text-3xl font-bold">{team.elo}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-foreground-muted mb-1">Win Prob.</div>
              <div className="text-3xl font-bold text-success">
                {(team.winProbability * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {/* Recent Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Form (Last 10 Matches)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              {mockRecentForm.slice(0, 10).map((match, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white",
                    match.result === "W"
                      ? "bg-win"
                      : match.result === "D"
                      ? "bg-draw"
                      : "bg-loss"
                  )}
                  title={`vs ${match.opponent}: ${match.score}`}
                >
                  {match.result}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {mockRecentForm.slice(0, 5).map((match, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded text-xs font-bold text-white",
                        match.result === "W"
                          ? "bg-win"
                          : match.result === "D"
                          ? "bg-draw"
                          : "bg-loss"
                      )}
                    >
                      {match.result}
                    </span>
                    <span className="text-sm">vs {match.opponent}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold">{match.score}</span>
                    <span className="text-xs text-foreground-muted">{match.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Key Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Goals Scored (Avg)", value: "2.3", icon: Target },
                { label: "Goals Conceded (Avg)", value: "0.8", icon: Shield },
                { label: "Clean Sheets", value: "6", icon: Medal },
                { label: "xG per Game", value: "2.1", icon: Star },
                { label: "xGA per Game", value: "0.9", icon: Shield },
                { label: "PPDA", value: "8.4", icon: Clock },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <stat.icon className="h-4 w-4 text-foreground-muted" />
                    <span className="text-sm text-foreground-muted">{stat.label}</span>
                  </div>
                  <span className="text-sm font-semibold">{stat.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Squad */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Squad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs text-foreground-muted">
                  <th className="pb-3 font-medium">Player</th>
                  <th className="pb-3 font-medium">Position</th>
                  <th className="pb-3 font-medium">Club</th>
                  <th className="pb-3 font-medium text-right">Value</th>
                  <th className="pb-3 font-medium text-right">Rating</th>
                  <th className="pb-3 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockPlayers.map((player) => (
                  <tr key={player.name} className="hover:bg-card-hover">
                    <td className="py-3 font-medium">{player.name}</td>
                    <td className="py-3 text-sm text-foreground-muted">
                      {player.position}
                    </td>
                    <td className="py-3 text-sm text-foreground-muted">
                      {player.club}
                    </td>
                    <td className="py-3 text-sm text-right font-medium">
                      {player.value}
                    </td>
                    <td className="py-3 text-sm text-right">
                      <span className="inline-flex h-7 w-10 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                        {player.rating}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={cn(
                          "inline-flex h-2 w-2 rounded-full",
                          player.status === "fit"
                            ? "bg-success"
                            : player.status === "doubt"
                            ? "bg-warning"
                            : "bg-danger"
                        )}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* World Cup History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            World Cup History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {mockWCHistory.map((wc) => (
              <div
                key={wc.year}
                className={cn(
                  "rounded-lg border p-4 text-center transition-colors",
                  wc.position === 1
                    ? "border-yellow-500/50 bg-yellow-500/10"
                    : wc.position === 2
                    ? "border-gray-400/50 bg-gray-400/10"
                    : "border-border bg-card"
                )}
              >
                <div className="text-lg font-bold">{wc.year}</div>
                <div
                  className={cn(
                    "text-sm mt-1",
                    wc.position === 1
                      ? "text-yellow-500 font-semibold"
                      : wc.position === 2
                      ? "text-gray-400 font-semibold"
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
