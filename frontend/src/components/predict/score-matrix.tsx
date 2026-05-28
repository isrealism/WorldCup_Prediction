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
    return Math.min(0.85, (prob / maxProb) * 0.8 + 0.05);
  };

  return (
    <div className={cn("space-y-5", className)}>
      {/* Matrix Grid */}
      <div className="overflow-x-auto -mx-5 px-5">
        <div className="inline-block min-w-full">
          {/* Header row - Away goals */}
          <div className="flex">
            <div className="w-10 h-10 flex items-center justify-center text-[10px] font-medium text-foreground-subtle">
              H\A
            </div>
            {Array.from({ length: maxScore + 1 }, (_, i) => (
              <div
                key={i}
                className="w-10 h-10 flex items-center justify-center text-xs font-semibold text-loss"
              >
                {i}
              </div>
            ))}
          </div>

          {/* Matrix rows */}
          {matrix.map((row, homeGoals) => (
            <div key={homeGoals} className="flex">
              {/* Row header - Home goals */}
              <div className="w-10 h-10 flex items-center justify-center text-xs font-semibold text-win">
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
                      "w-10 h-10 flex items-center justify-center text-[10px] font-medium rounded m-0.5 cursor-default transition-all",
                      isMaxProb
                        ? "ring-2 ring-primary bg-primary text-white font-bold"
                        : "text-foreground"
                    )}
                    style={{
                      backgroundColor: isMaxProb
                        ? undefined
                        : `rgba(29, 156, 108, ${getOpacity(prob)})`,
                    }}
                    title={`${homeGoals}-${awayGoals}: ${(prob * 100).toFixed(2)}%`}
                  >
                    {(prob * 100).toFixed(1)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Top 8 Most Likely Scores */}
      <div>
        <h4 className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-3">
          Most Likely Scores
        </h4>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {topScores.slice(0, 8).map((score, index) => (
            <div
              key={`${score.home}-${score.away}`}
              className={cn(
                "rounded-lg p-2 text-center transition-colors",
                index === 0
                  ? "bg-primary text-white"
                  : "bg-background-secondary hover:bg-background-tertiary"
              )}
            >
              <div className="text-sm font-bold tabular-nums">
                {score.home}-{score.away}
              </div>
              <div className={cn(
                "text-[10px]",
                index === 0 ? "text-white/70" : "text-foreground-muted"
              )}>
                {(score.prob * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
