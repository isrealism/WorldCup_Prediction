"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TeamSelector, mockTeams, Team } from "@/components/team-selector";
import { ProbabilityBar } from "@/components/ui/probability-bar";
import { getFlagEmoji } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  History,
  ArrowRight,
  ArrowLeftRight,
  Sliders,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from "lucide-react";

// Historical squad options
const historicalSquads = [
  { year: 2022, team: "Argentina", label: "Argentina 2022 (World Champions)" },
  { year: 2010, team: "Spain", label: "Spain 2010 (Tiki-Taka)" },
  { year: 2002, team: "Brazil", label: "Brazil 2002 (R9, Ronaldinho)" },
  { year: 1998, team: "France", label: "France 1998 (Zidane Era)" },
  { year: 1970, team: "Brazil", label: "Brazil 1970 (Pele Era)" },
  { year: 1986, team: "Argentina", label: "Argentina 1986 (Maradona)" },
];

export default function WhatIfPage() {
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [historicalSquad, setHistoricalSquad] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Mock comparison data
  const comparison = {
    current: {
      marketValue: "850M",
      avgAge: 27.4,
      elo: 2143,
      xgPerGame: 2.1,
      ppda: 8.4,
    },
    historical: {
      marketValue: "420M*",
      avgAge: 25.8,
      elo: 2180,
      xgPerGame: 2.4,
      ppda: 9.2,
    },
  };

  const runSimulation = () => {
    if (currentTeam && historicalSquad) {
      setShowResults(true);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          What-If Simulation
        </h1>
        <p className="mt-2 text-foreground-muted">
          Explore counterfactual scenarios - what if historical squads played in 2026?
        </p>
      </div>

      {/* Selection Panel */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            Squad Replacement Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Current Team Selection */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-foreground-muted">
                Replace this 2026 squad:
              </label>
              <TeamSelector
                value={currentTeam}
                onChange={setCurrentTeam}
                teams={mockTeams}
                placeholder="Select team to replace"
              />
            </div>

            {/* Historical Squad Selection */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-foreground-muted">
                With this historical squad:
              </label>
              <div className="grid gap-2">
                {historicalSquads.map((squad) => (
                  <button
                    key={`${squad.year}-${squad.team}`}
                    onClick={() => setHistoricalSquad(squad.label)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                      historicalSquad === squad.label
                        ? "border-primary bg-primary-muted"
                        : "border-border bg-card hover:bg-card-hover hover:border-border-hover"
                    )}
                  >
                    <History className="h-5 w-5 text-foreground-muted" />
                    <div>
                      <div className="font-medium">{squad.label}</div>
                      <div className="text-xs text-foreground-muted">
                        World Cup {squad.year}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <Button
              onClick={runSimulation}
              disabled={!currentTeam || !historicalSquad}
              size="lg"
              className="w-full lg:w-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Run What-If Simulation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {showResults && currentTeam && historicalSquad && (
        <div className="space-y-8">
          {/* Squad Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-primary" />
                Squad Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-3 gap-4 text-center text-sm font-medium text-foreground-muted pb-2 border-b border-border">
                  <div>{currentTeam.name} 2026</div>
                  <div>Metric</div>
                  <div>{historicalSquad}</div>
                </div>
                {[
                  { label: "Squad Value", current: comparison.current.marketValue, historical: comparison.historical.marketValue },
                  { label: "Average Age", current: comparison.current.avgAge, historical: comparison.historical.avgAge },
                  { label: "Elo Rating", current: comparison.current.elo, historical: comparison.historical.elo },
                  { label: "xG per Game", current: comparison.current.xgPerGame, historical: comparison.historical.xgPerGame },
                  { label: "PPDA", current: comparison.current.ppda, historical: comparison.historical.ppda },
                ].map((row) => (
                  <div key={row.label} className="grid grid-cols-3 gap-4 items-center py-2">
                    <div className="text-right text-lg font-semibold">{row.current}</div>
                    <div className="text-center text-sm text-foreground-muted">{row.label}</div>
                    <div className="text-left text-lg font-semibold">{row.historical}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Prediction Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Championship Probability Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{getFlagEmoji(currentTeam.code)}</span>
                    <div>
                      <div className="font-semibold">{currentTeam.name} 2026</div>
                      <div className="text-sm text-foreground-muted">Current Squad</div>
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-primary mb-2">14.2%</div>
                  <div className="text-sm text-foreground-muted">Win probability</div>
                </div>

                <div className="rounded-xl border border-primary/50 bg-primary/5 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <History className="h-8 w-8 text-primary" />
                    <div>
                      <div className="font-semibold">{historicalSquad}</div>
                      <div className="text-sm text-foreground-muted">Historical Squad</div>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-primary">18.7%</span>
                    <span className="flex items-center gap-1 text-success text-sm font-medium">
                      <TrendingUp className="h-4 w-4" />
                      +4.5%
                    </span>
                  </div>
                  <div className="text-sm text-foreground-muted">Win probability</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Round by Round */}
          <Card>
            <CardHeader>
              <CardTitle>Round-by-Round Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { round: "Group Stage", current: 0.95, historical: 0.97 },
                  { round: "Round of 16", current: 0.82, historical: 0.88 },
                  { round: "Quarter Finals", current: 0.58, historical: 0.68 },
                  { round: "Semi Finals", current: 0.35, historical: 0.45 },
                  { round: "Final", current: 0.22, historical: 0.30 },
                  { round: "Champion", current: 0.142, historical: 0.187 },
                ].map((round) => {
                  const diff = round.historical - round.current;
                  const isPositive = diff > 0;
                  return (
                    <div key={round.round} className="flex items-center gap-4">
                      <div className="w-28 text-sm font-medium">{round.round}</div>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="w-20 text-right text-sm text-foreground-muted">
                          {(round.current * 100).toFixed(1)}%
                        </div>
                        <div className="flex-1 h-3 bg-background-secondary rounded-full overflow-hidden flex">
                          <div
                            className="h-full bg-win"
                            style={{ width: `${round.current * 100}%` }}
                          />
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-foreground-muted" />
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 h-3 bg-background-secondary rounded-full overflow-hidden flex">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${round.historical * 100}%` }}
                          />
                        </div>
                        <div className="w-20 text-sm text-foreground-muted">
                          {(round.historical * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div
                        className={cn(
                          "w-16 text-right text-sm font-medium flex items-center justify-end gap-1",
                          isPositive ? "text-success" : "text-danger"
                        )}
                      >
                        {isPositive ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {isPositive ? "+" : ""}
                        {(diff * 100).toFixed(1)}%
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
      {!showResults && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-foreground-muted mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Configure Your What-If Scenario
            </h3>
            <p className="text-foreground-muted max-w-md mx-auto">
              Select a current 2026 squad and a historical squad to see how the
              historical team would perform in the current tournament.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
