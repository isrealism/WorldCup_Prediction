"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProbabilityBar } from "@/components/ui/probability-bar";
import { TeamSelector, mockTeams, Team } from "@/components/team-selector";
import { ScoreMatrix } from "@/components/predict/score-matrix";
import { FeatureBreakdown, generateMockFeatures } from "@/components/predict/feature-breakdown";
import { KnockoutExtras } from "@/components/predict/knockout-extras";
import { H2HSummary, generateMockH2HData } from "@/components/predict/h2h-summary";
import { getFlagEmoji } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Target, Sparkles, BarChart3, History, Swords, Settings2 } from "lucide-react";

type MatchStage = "group" | "knockout" | "final";

function PredictContent() {
  const searchParams = useSearchParams();
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [matchStage, setMatchStage] = useState<MatchStage>("group");
  const [showPrediction, setShowPrediction] = useState(false);

  // Mock prediction data
  const [prediction, setPrediction] = useState({
    homeWin: 0.52,
    draw: 0.24,
    awayWin: 0.24,
    lambdaHome: 1.85,
    lambdaAway: 1.12,
    extraTimeProb: 0.24,
    penaltyProb: 0.12,
    homePenaltyWinRate: 0.67,
    awayPenaltyWinRate: 0.58,
  });

  // Parse URL params on mount
  useEffect(() => {
    const homeCode = searchParams.get("home");
    const awayCode = searchParams.get("away");

    if (homeCode) {
      const team = mockTeams.find((t) => t.code === homeCode);
      if (team) setHomeTeam(team);
    }
    if (awayCode) {
      const team = mockTeams.find((t) => t.code === awayCode);
      if (team) setAwayTeam(team);
    }
  }, [searchParams]);

  // Generate prediction when both teams are selected
  useEffect(() => {
    if (homeTeam && awayTeam) {
      // Mock prediction generation - would be API call in production
      const homeRandom = Math.random() * 0.3 + 0.35;
      const awayRandom = Math.random() * 0.25 + 0.15;
      const drawProb = 1 - homeRandom - awayRandom;

      setPrediction({
        homeWin: homeRandom,
        draw: Math.max(0.1, drawProb),
        awayWin: awayRandom,
        lambdaHome: 1.2 + Math.random() * 1.2,
        lambdaAway: 0.8 + Math.random() * 1.0,
        extraTimeProb: 0.15 + Math.random() * 0.15,
        penaltyProb: 0.08 + Math.random() * 0.1,
        homePenaltyWinRate: 0.5 + Math.random() * 0.3,
        awayPenaltyWinRate: 0.4 + Math.random() * 0.35,
      });
      setShowPrediction(true);
    } else {
      setShowPrediction(false);
    }
  }, [homeTeam, awayTeam]);

  const features = homeTeam && awayTeam
    ? generateMockFeatures(homeTeam.name, awayTeam.name)
    : [];

  const h2hData = homeTeam && awayTeam
    ? generateMockH2HData(
        { name: homeTeam.name, code: homeTeam.code },
        { name: awayTeam.name, code: awayTeam.code }
      )
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Target className="h-8 w-8 text-primary" />
          Match Prediction
        </h1>
        <p className="mt-2 text-foreground-muted">
          Select two teams to generate AI-powered match predictions
        </p>
      </div>

      {/* Team Selection */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Match Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end">
            {/* Home Team */}
            <div className="flex-1">
              <TeamSelector
                label="Home Team"
                value={homeTeam}
                onChange={setHomeTeam}
                teams={mockTeams}
                placeholder="Select home team"
              />
            </div>

            {/* VS Separator */}
            <div className="flex items-center justify-center py-4 lg:py-0 lg:px-8">
              <div className="flex flex-col items-center gap-2">
                <div className="text-4xl font-bold text-foreground-muted">VS</div>
                {homeTeam && awayTeam && (
                  <div className="flex items-center gap-2 text-3xl">
                    <span>{getFlagEmoji(homeTeam.code)}</span>
                    <Swords className="h-5 w-5 text-primary" />
                    <span>{getFlagEmoji(awayTeam.code)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Away Team */}
            <div className="flex-1">
              <TeamSelector
                label="Away Team"
                value={awayTeam}
                onChange={setAwayTeam}
                teams={mockTeams.filter((t) => t.code !== homeTeam?.code)}
                placeholder="Select away team"
              />
            </div>
          </div>

          {/* Match Stage Selector */}
          <div className="mt-6 pt-6 border-t border-border">
            <label className="block text-sm font-medium text-foreground-muted mb-3">
              Match Stage
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "group", label: "Group Stage" },
                { value: "knockout", label: "Knockout Round" },
                { value: "final", label: "Final" },
              ].map((stage) => (
                <button
                  key={stage.value}
                  onClick={() => setMatchStage(stage.value as MatchStage)}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    matchStage === stage.value
                      ? "bg-primary text-background"
                      : "border border-border bg-card text-foreground-muted hover:bg-card-hover hover:text-foreground"
                  )}
                >
                  {stage.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prediction Results */}
      {showPrediction && homeTeam && awayTeam && (
        <div className="space-y-8">
          {/* Win Probability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Result Probability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <ProbabilityBar
                  homeWin={prediction.homeWin}
                  draw={prediction.draw}
                  awayWin={prediction.awayWin}
                  homeLabel={homeTeam.name}
                  awayLabel={awayTeam.name}
                />
              </div>

              {/* Large probability display */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="text-sm text-foreground-muted mb-2">
                    {homeTeam.name} Wins
                  </div>
                  <div className="text-4xl font-bold text-win">
                    {(prediction.homeWin * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="text-sm text-foreground-muted mb-2">Draw</div>
                  <div className="text-4xl font-bold text-draw">
                    {(prediction.draw * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="text-sm text-foreground-muted mb-2">
                    {awayTeam.name} Wins
                  </div>
                  <div className="text-4xl font-bold text-loss">
                    {(prediction.awayWin * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score Matrix */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Score Probability Matrix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreMatrix
                lambdaHome={prediction.lambdaHome}
                lambdaAway={prediction.lambdaAway}
              />
            </CardContent>
          </Card>

          {/* Knockout Extras - Only show for knockout/final stages */}
          {(matchStage === "knockout" || matchStage === "final") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Swords className="h-5 w-5 text-primary" />
                  Knockout Stage Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <KnockoutExtras
                  extraTimeProb={prediction.extraTimeProb}
                  penaltyProb={prediction.penaltyProb}
                  homePenaltyWinRate={prediction.homePenaltyWinRate}
                  awayPenaltyWinRate={prediction.awayPenaltyWinRate}
                  homeTeam={homeTeam.name}
                  awayTeam={awayTeam.name}
                />
              </CardContent>
            </Card>
          )}

          {/* Two column layout for features and H2H */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Feature Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Key Prediction Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FeatureBreakdown
                  features={features}
                  homeTeam={homeTeam.name}
                  awayTeam={awayTeam.name}
                />
              </CardContent>
            </Card>

            {/* H2H Summary */}
            {h2hData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Head-to-Head History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <H2HSummary
                    homeTeam={{ name: homeTeam.name, code: homeTeam.code }}
                    awayTeam={{ name: awayTeam.name, code: awayTeam.code }}
                    totalMatches={h2hData.totalMatches}
                    homeWins={h2hData.homeWins}
                    draws={h2hData.draws}
                    awayWins={h2hData.awayWins}
                    recentMatches={h2hData.recentMatches}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!showPrediction && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Target className="h-12 w-12 mx-auto text-foreground-muted mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Select Teams to Start
            </h3>
            <p className="text-foreground-muted max-w-md mx-auto">
              Choose a home and away team above to generate AI-powered match
              predictions including win probabilities, expected goals, and score
              matrix.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function PredictPage() {
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
      <PredictContent />
    </Suspense>
  );
}
