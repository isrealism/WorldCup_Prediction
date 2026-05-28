import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { mockTeamsWithStats, getFlagEmoji, continentColors } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

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

  // Order continents
  const continentOrder = ["Europe", "South America", "North America", "Asia", "Africa", "Oceania"];
  const orderedContinents = continentOrder.filter(c => teamsByContinent[c]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      {/* Teams by Continent */}
      <div className="space-y-6">
        {orderedContinents.map((continent) => {
          const teams = teamsByContinent[continent];
          const colors = continentColors[continent];
          return (
            <Card key={continent} elevated>
              <CardHeader className="flex flex-row items-center gap-2">
                <span className={cn("h-3 w-3 rounded-full", colors?.bg)} />
                <CardTitle>{continent}</CardTitle>
                <span className="text-xs font-normal text-foreground-muted">
                  {teams.length} teams
                </span>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3">
                  {teams
                    .sort((a, b) => a.fifaRanking - b.fifaRanking)
                    .map((team, idx) => (
                      <Link
                        key={team.code}
                        href={`/team/${team.name.toLowerCase()}`}
                        className={cn(
                          "flex items-center gap-3 px-5 py-3 transition-colors hover:bg-background-secondary group",
                          idx % 3 !== 2 && "lg:border-r lg:border-border",
                          idx % 2 !== 1 && "sm:border-r sm:border-border lg:border-r-0",
                          idx < teams.length - 3 && "lg:border-b lg:border-border",
                          idx < teams.length - 2 && "sm:border-b sm:border-border lg:border-b-0"
                        )}
                      >
                        <span className="text-2xl">{getFlagEmoji(team.code)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{team.name}</div>
                          <div className="flex items-center gap-2 text-xs text-foreground-muted">
                            <span>#{team.fifaRanking}</span>
                            <span className="text-primary font-semibold">
                              {(team.winProbability * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-foreground-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
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
