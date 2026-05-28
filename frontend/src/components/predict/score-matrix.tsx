"use client";

import { cn } from "@/lib/utils";

interface ScoreMatrixProps {
  lambdaHome: number;
  lambdaAway: number;
  maxScore?: number;
  className?: string;
}

// Poisson probability calculation
function poissonProbability(lambda: number, k: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

export function ScoreMatrix({
  lambdaHome,
  lambdaAway,
  maxScore = 5,
  className,
}: ScoreMatrixProps) {
  // Calculate probability matrix
  const matrix: number[][] = [];
  let maxProb = 0;
  let mostLikelyScore = { home: 0, away: 0, prob: 0 };
  const topScores: { home: number; away: number; prob: number }[] = [];

  for (let home = 0; home <= maxScore; home++) {
    matrix[home] = [];
    for (let away = 0; away <= maxScore; away++) {
      const prob =
        poissonProbability(lambdaHome, home) *
        poissonProbability(lambdaAway, away);
      matrix[home][away] = prob;
      topScores.push({ home, away, prob });
      if (prob > maxProb) {
        maxProb = prob;
        mostLikelyScore = { home, away, prob };
      }
    }
  }

  // Sort top scores
  topScores.sort((a, b) => b.prob - a.prob);

  // Get opacity for cell based on probability
  const getOpacity = (prob: number): number => {
    return Math.min(0.9, (prob / maxProb) * 0.9 + 0.1);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Expected Goals */}
      <div className="flex items-center justify-center gap-8">
        <div className="text-center">
          <div className="text-sm text-foreground-muted mb-1">Home xG</div>
          <div className="text-4xl font-bold text-win">{lambdaHome.toFixed(2)}</div>
        </div>
        <div className="h-12 w-px bg-border" />
        <div className="text-center">
          <div className="text-sm text-foreground-muted mb-1">Away xG</div>
          <div className="text-4xl font-bold text-loss">{lambdaAway.toFixed(2)}</div>
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header row - Away goals */}
          <div className="flex">
            <div className="w-12 h-12 flex items-center justify-center text-xs text-foreground-muted">
              H\A
            </div>
            {Array.from({ length: maxScore + 1 }, (_, i) => (
              <div
                key={i}
                className="w-12 h-12 flex items-center justify-center text-sm font-medium text-loss"
              >
                {i}
              </div>
            ))}
          </div>

          {/* Matrix rows */}
          {matrix.map((row, homeGoals) => (
            <div key={homeGoals} className="flex">
              {/* Row header - Home goals */}
              <div className="w-12 h-12 flex items-center justify-center text-sm font-medium text-win">
                {homeGoals}
              </div>
              {/* Cells */}
              {row.map((prob, awayGoals) => {
                const isMaxProb =
                  homeGoals === mostLikelyScore.home &&
                  awayGoals === mostLikelyScore.away;
                return (
                  <div
                    key={awayGoals}
                    className={cn(
                      "w-12 h-12 flex items-center justify-center text-xs font-medium rounded-md m-0.5 cursor-default transition-all group relative",
                      isMaxProb
                        ? "ring-2 ring-primary bg-primary text-background"
                        : "text-foreground"
                    )}
                    style={{
                      backgroundColor: isMaxProb
                        ? undefined
                        : `rgba(16, 185, 129, ${getOpacity(prob)})`,
                    }}
                    title={`${homeGoals}-${awayGoals}: ${(prob * 100).toFixed(2)}%`}
                  >
                    {(prob * 100).toFixed(1)}
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                      <div className="bg-background-secondary border border-border rounded-lg px-3 py-2 text-sm whitespace-nowrap shadow-lg">
                        <div className="font-semibold">
                          {homeGoals} - {awayGoals}
                        </div>
                        <div className="text-foreground-muted">
                          {(prob * 100).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Top 8 Most Likely Scores */}
      <div>
        <h4 className="text-sm font-medium text-foreground-muted mb-3">
          Most Likely Scores
        </h4>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {topScores.slice(0, 8).map((score, index) => (
            <div
              key={`${score.home}-${score.away}`}
              className={cn(
                "rounded-lg border p-2 text-center transition-colors",
                index === 0
                  ? "border-primary bg-primary-muted"
                  : "border-border bg-card hover:bg-card-hover"
              )}
            >
              <div className="text-lg font-bold">
                {score.home}-{score.away}
              </div>
              <div className="text-xs text-foreground-muted">
                {(score.prob * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
