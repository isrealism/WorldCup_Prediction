"use client";

import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

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

const categoryColors: Record<string, { bg: string; text: string; dot: string }> = {
  form: { bg: "bg-europe/10", text: "text-europe", dot: "bg-europe" },
  h2h: { bg: "bg-south-america/10", text: "text-south-america", dot: "bg-south-america" },
  squad: { bg: "bg-asia/10", text: "text-asia", dot: "bg-asia" },
  xg: { bg: "bg-africa/10", text: "text-africa", dot: "bg-africa" },
  external: { bg: "bg-north-america/10", text: "text-north-america", dot: "bg-north-america" },
  elo: { bg: "bg-primary/10", text: "text-primary", dot: "bg-primary" },
};

const categoryLabels: Record<string, string> = {
  form: "Form",
  h2h: "H2H",
  squad: "Squad",
  xg: "xG",
  external: "External",
  elo: "Elo",
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
        return <ArrowUp className="h-3 w-3 text-win" />;
      case "away":
        return <ArrowDown className="h-3 w-3 text-loss" />;
      default:
        return <Minus className="h-3 w-3 text-foreground-subtle" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "home":
        return "text-win";
      case "away":
        return "text-loss";
      default:
        return "text-foreground-subtle";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {sortedFeatures.slice(0, 5).map((feature) => {
        const colors = categoryColors[feature.category];
        return (
          <div
            key={feature.name}
            className="flex items-center gap-3 rounded-lg bg-background-secondary p-3"
          >
            {/* Category dot */}
            <span className={cn("h-2 w-2 rounded-full flex-shrink-0", colors?.dot)} />
            
            {/* Feature info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{feature.name}</span>
                <span className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded",
                  colors?.bg, colors?.text
                )}>
                  {categoryLabels[feature.category]}
                </span>
              </div>
              {feature.description && (
                <p className="text-xs text-foreground-muted truncate mt-0.5">
                  {feature.description}
                </p>
              )}
            </div>
            
            {/* Value */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {getImpactIcon(feature.impact)}
              <span className={cn("text-sm font-semibold tabular-nums", getImpactColor(feature.impact))}>
                {feature.value > 0 ? "+" : ""}
                {feature.value.toFixed(1)}
              </span>
            </div>
          </div>
        );
      })}
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
      description: `${homeTeam} has a higher Elo rating`,
    },
    {
      name: "Recent Form (Last 5)",
      value: 0.8,
      impact: "home",
      category: "form",
      description: `${homeTeam} won 4 of last 5 matches`,
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
      description: `${awayTeam} leads head-to-head`,
    },
    {
      name: "Squad Market Value",
      value: 0.65,
      impact: "home",
      category: "squad",
      description: "Relative squad valuation",
    },
  ];
}
