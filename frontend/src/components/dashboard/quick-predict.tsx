"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TeamSelector, mockTeams, Team } from "@/components/team-selector";
import { Button } from "@/components/ui/button";
import { Target, ArrowRight } from "lucide-react";

export function QuickPredict() {
  const router = useRouter();
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);

  const handlePredict = () => {
    if (homeTeam && awayTeam) {
      router.push(`/predict?home=${homeTeam.code}&away=${awayTeam.code}`);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-card via-card to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Quick Predict
        </CardTitle>
        <CardDescription>
          Select two teams to get instant match predictions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <TeamSelector
              label="Home Team"
              value={homeTeam}
              onChange={setHomeTeam}
              teams={mockTeams}
              placeholder="Select home team"
            />
          </div>
          
          <div className="flex items-center justify-center py-2 lg:py-0">
            <div className="rounded-lg bg-background-secondary px-4 py-2 text-sm font-bold text-foreground-muted">
              VS
            </div>
          </div>
          
          <div className="flex-1">
            <TeamSelector
              label="Away Team"
              value={awayTeam}
              onChange={setAwayTeam}
              teams={mockTeams.filter((t) => t.code !== homeTeam?.code)}
              placeholder="Select away team"
            />
          </div>
          
          <Button
            onClick={handlePredict}
            disabled={!homeTeam || !awayTeam}
            size="lg"
            className="w-full lg:w-auto"
          >
            Predict
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
