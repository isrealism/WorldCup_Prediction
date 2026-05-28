import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { mockTeamsWithStats, getFlagEmoji, continentColors } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Users, Search, Trophy } from "lucide-react";

export default function TeamsPage() {
  // Group teams by continent
  const teamsByContinent = mockTeamsWithStats.reduce(
    (acc, team) => {
      if (!acc[team.continent]) acc[team.continent] = [];
      acc[team.continent].push(team);
      return acc;
    },
    {} as Record<string, typeof mockTeamsWithStats>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          Teams
        </h1>
        <p className="mt-2 text-foreground-muted">
          Browse all participating teams in the World Cup 2026
        </p>
      </div>

      {/* Teams by Continent */}
      <div className="space-y-8">
        {Object.entries(teamsByContinent).map(([continent, teams]) => {
          const colors = continentColors[continent];
          return (
            <Card key={continent}>
              <CardHeader>
                <CardTitle className={cn("flex items-center gap-2", colors?.text)}>
                  <Trophy className="h-5 w-5" />
                  {continent}
                  <span className="text-sm font-normal text-foreground-muted ml-2">
                    ({teams.length} teams)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {teams
                    .sort((a, b) => a.fifaRanking - b.fifaRanking)
                    .map((team) => (
                      <Link
                        key={team.code}
                        href={`/team/${team.name.toLowerCase()}`}
                        className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:border-border-hover hover:bg-card-hover"
                      >
                        <span className="text-4xl">{getFlagEmoji(team.code)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate">{team.name}</div>
                          <div className="flex items-center gap-3 text-sm text-foreground-muted">
                            <span>#{team.fifaRanking} FIFA</span>
                            <span className="text-primary font-medium">
                              {(team.winProbability * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
