"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
    <Card elevated>
      <CardHeader className="flex flex-row items-center gap-2 border-0 pb-0">
        <Target className="h-4.5 w-4.5 text-primary" />
        <CardTitle>Quick Predict</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground-muted mb-4">
          Select two teams to get instant match predictions
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <TeamSelector
              label="Home Team"
              value={homeTeam}
              onChange={setHomeTeam}
              teams={mockTeams}
              placeholder="Select home team"
            />
          </div>
          
          <div className="flex items-center justify-center py-1 sm:py-0 sm:pb-2.5">
            <span className="text-xs font-bold text-foreground-subtle uppercase tracking-wider">
              vs
            </span>
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
            className="w-full sm:w-auto"
          >
            Predict
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
