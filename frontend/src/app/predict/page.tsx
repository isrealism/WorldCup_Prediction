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
import { Target, BarChart3, History, Swords, ChevronRight } from "lucide-react";
import Link from "next/link";

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
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      {/* Team Selection Card */}
      <Card elevated className="mb-6">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
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
            <div className="flex flex-col items-center justify-center py-2 lg:py-0 lg:px-6">
              {homeTeam && awayTeam ? (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFlagEmoji(homeTeam.code)}</span>
                  <span className="text-xs font-bold text-foreground-subtle uppercase tracking-wider">vs</span>
                  <span className="text-2xl">{getFlagEmoji(awayTeam.code)}</span>
                </div>
              ) : (
                <span className="text-xs font-bold text-foreground-subtle uppercase tracking-wider">vs</span>
              )}
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
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-foreground-muted uppercase tracking-wider mr-2">
                Stage
              </span>
              {[
                { value: "group", label: "Group" },
                { value: "knockout", label: "Knockout" },
                { value: "final", label: "Final" },
              ].map((stage) => (
                <button
                  key={stage.value}
                  onClick={() => setMatchStage(stage.value as MatchStage)}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-medium transition-all",
                    matchStage === stage.value
                      ? "bg-primary text-white"
                      : "bg-background-secondary text-foreground-muted hover:text-foreground"
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
        <div className="space-y-6">
          {/* Main Prediction Card */}
          <Card elevated>
            <CardContent className="p-0">
              {/* Team Header */}
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getFlagEmoji(homeTeam.code)}</span>
                  <div>
                    <div className="font-semibold">{homeTeam.name}</div>
                    <div className="text-xs text-foreground-muted">Home</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-foreground-subtle uppercase tracking-wider mb-1">Predicted</div>
                  <div className="text-2xl font-bold tabular-nums">
                    {Math.round(prediction.lambdaHome)} - {Math.round(prediction.lambdaAway)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-semibold">{awayTeam.name}</div>
                    <div className="text-xs text-foreground-muted">Away</div>
                  </div>
                  <span className="text-3xl">{getFlagEmoji(awayTeam.code)}</span>
                </div>
              </div>

              {/* Probability Bar */}
              <div className="p-5">
                <ProbabilityBar
                  homeWin={prediction.homeWin}
                  draw={prediction.draw}
                  awayWin={prediction.awayWin}
                  homeLabel={homeTeam.code}
                  awayLabel={awayTeam.code}
                />
              </div>

              {/* Probability Stats */}
              <div className="grid grid-cols-3 border-t border-border">
                <div className="p-4 text-center border-r border-border">
                  <div className="text-2xl font-bold text-win">
                    {(prediction.homeWin * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-foreground-muted mt-0.5">{homeTeam.name} Win</div>
                </div>
                <div className="p-4 text-center border-r border-border">
                  <div className="text-2xl font-bold text-foreground-subtle">
                    {(prediction.draw * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-foreground-muted mt-0.5">Draw</div>
                </div>
                <div className="p-4 text-center">
                  <div className="text-2xl font-bold text-loss">
                    {(prediction.awayWin * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-foreground-muted mt-0.5">{awayTeam.name} Win</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expected Goals & Score Matrix */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Expected Goals */}
            <Card elevated>
              <CardHeader className="flex flex-row items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <CardTitle>Expected Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 text-center">
                    <div className="text-4xl font-bold text-foreground">{prediction.lambdaHome.toFixed(2)}</div>
                    <div className="text-sm text-foreground-muted mt-1">{homeTeam.name}</div>
                  </div>
                  <div className="text-foreground-subtle">vs</div>
                  <div className="flex-1 text-center">
                    <div className="text-4xl font-bold text-foreground">{prediction.lambdaAway.toFixed(2)}</div>
                    <div className="text-sm text-foreground-muted mt-1">{awayTeam.name}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Knockout Extras */}
            {(matchStage === "knockout" || matchStage === "final") && (
              <Card elevated>
                <CardHeader className="flex flex-row items-center gap-2">
                  <Swords className="h-4 w-4 text-primary" />
                  <CardTitle>Knockout Scenario</CardTitle>
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
          </div>

          {/* Score Matrix */}
          <Card elevated>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <CardTitle>Score Probability Matrix</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ScoreMatrix
                lambdaHome={prediction.lambdaHome}
                lambdaAway={prediction.lambdaAway}
              />
            </CardContent>
          </Card>

          {/* Features and H2H */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Feature Breakdown */}
            <Card elevated>
              <CardHeader className="flex flex-row items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <CardTitle>Key Features</CardTitle>
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
              <Card elevated>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    <CardTitle>Head-to-Head</CardTitle>
                  </div>
                  <Link
                    href={`/h2h?team1=${homeTeam.code}&team2=${awayTeam.code}`}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
                  >
                    View all
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
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
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-background-secondary flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-foreground-muted" />
            </div>
            <h3 className="text-base font-semibold mb-1">
              Select teams to start
            </h3>
            <p className="text-sm text-foreground-muted max-w-sm mx-auto">
              Choose a home and away team to generate AI-powered match predictions
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
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-40 bg-background-secondary rounded-xl" />
          <div className="h-64 bg-background-secondary rounded-xl" />
        </div>
      </div>
    }>
      <PredictContent />
    </Suspense>
  );
}
