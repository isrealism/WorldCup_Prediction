"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface FeatureImportance {
  name: string;
  value: number;
  impact: "home" | "away" | "neutral";
  category: "form" | "h2h" | "squad" | "xg" | "external" | "elo";
  description?: string;
}

interface FeatureBreakdownProps {
  features: FeatureImportance[];
  homeTeam: string;
  awayTeam: string;
  className?: string;
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  form: { bg: "bg-europe/20", text: "text-europe" },
  h2h: { bg: "bg-south-america/20", text: "text-south-america" },
  squad: { bg: "bg-asia/20", text: "text-asia" },
  xg: { bg: "bg-africa/20", text: "text-africa" },
  external: { bg: "bg-north-america/20", text: "text-north-america" },
  elo: { bg: "bg-oceania/20", text: "text-oceania" },
};

const categoryLabels: Record<string, string> = {
  form: "Form",
  h2h: "H2H",
  squad: "Squad",
  xg: "xG Stats",
  external: "External",
  elo: "Elo Rating",
};

export function FeatureBreakdown({
  features,
  homeTeam,
  awayTeam,
  className,
}: FeatureBreakdownProps) {
  // Sort by absolute impact
  const sortedFeatures = [...features].sort(
    (a, b) => Math.abs(b.value) - Math.abs(a.value)
  );

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case "home":
        return <TrendingUp className="h-4 w-4 text-win" />;
      case "away":
        return <TrendingDown className="h-4 w-4 text-loss" />;
      default:
        return <Minus className="h-4 w-4 text-draw" />;
    }
  };

  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case "home":
        return `Favors ${homeTeam}`;
      case "away":
        return `Favors ${awayTeam}`;
      default:
        return "Neutral";
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {sortedFeatures.slice(0, 5).map((feature) => {
        const colors = categoryColors[feature.category];
        return (
          <div
            key={feature.name}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      colors?.bg,
                      colors?.text
                    )}
                  >
                    {categoryLabels[feature.category]}
                  </span>
                  <span className="text-sm font-medium">{feature.name}</span>
                </div>
                {feature.description && (
                  <p className="text-xs text-foreground-muted">
                    {feature.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-lg font-bold tabular-nums">
                    {feature.value > 0 ? "+" : ""}
                    {feature.value.toFixed(2)}
                  </div>
                  <div className="flex items-center justify-end gap-1 text-xs text-foreground-muted">
                    {getImpactIcon(feature.impact)}
                    <span>{getImpactLabel(feature.impact)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Impact bar */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-2 bg-background-secondary rounded-full overflow-hidden flex">
                <div className="flex-1 flex justify-end">
                  {feature.impact === "home" && (
                    <div
                      className="h-full bg-win rounded-r-full"
                      style={{
                        width: `${Math.min(100, Math.abs(feature.value) * 20)}%`,
                      }}
                    />
                  )}
                </div>
                <div className="w-px bg-foreground-muted" />
                <div className="flex-1">
                  {feature.impact === "away" && (
                    <div
                      className="h-full bg-loss rounded-l-full"
                      style={{
                        width: `${Math.min(100, Math.abs(feature.value) * 20)}%`,
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Category Legend */}
      <div className="flex flex-wrap gap-3 pt-2">
        {Object.entries(categoryLabels).map(([key, label]) => {
          const colors = categoryColors[key];
          return (
            <div key={key} className="flex items-center gap-1.5">
              <span
                className={cn("h-2.5 w-2.5 rounded-full", colors?.bg)}
              />
              <span className="text-xs text-foreground-muted">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Mock feature data generator
export function generateMockFeatures(
  homeTeam: string,
  awayTeam: string
): FeatureImportance[] {
  return [
    {
      name: "Elo Rating Difference",
      value: 120,
      impact: "home",
      category: "elo",
      description: `${homeTeam} has a higher Elo rating by 120 points`,
    },
    {
      name: "Recent Form (Last 5)",
      value: 0.8,
      impact: "home",
      category: "form",
      description: `${homeTeam} won 4 of last 5 matches vs ${awayTeam}'s 2`,
    },
    {
      name: "xG Difference",
      value: 0.45,
      impact: "home",
      category: "xg",
      description: "Average xG per game advantage",
    },
    {
      name: "H2H Record",
      value: -0.3,
      impact: "away",
      category: "h2h",
      description: `${awayTeam} has won 3 of last 5 head-to-head matches`,
    },
    {
      name: "Squad Market Value",
      value: 0.65,
      impact: "home",
      category: "squad",
      description: "Relative squad valuation comparison",
    },
    {
      name: "Weather Conditions",
      value: 0.1,
      impact: "neutral",
      category: "external",
      description: "Minimal weather impact expected",
    },
  ];
}
