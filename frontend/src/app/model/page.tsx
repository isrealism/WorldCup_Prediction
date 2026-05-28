"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Target,
  CheckCircle2,
  TrendingUp,
  Layers,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  Cell,
} from "recharts";

// Mock model performance data
const modelComparison = [
  { name: "LogReg", accuracy: 0.542, logLoss: 0.985, rps: 0.218 },
  { name: "RF", accuracy: 0.558, logLoss: 0.952, rps: 0.212 },
  { name: "XGBoost", accuracy: 0.572, logLoss: 0.924, rps: 0.198 },
  { name: "LightGBM", accuracy: 0.578, logLoss: 0.912, rps: 0.195 },
];

// Mock feature importance
const featureImportance = [
  { name: "Elo Difference", importance: 0.18, category: "elo" },
  { name: "Recent Form", importance: 0.14, category: "form" },
  { name: "xG Difference", importance: 0.12, category: "xg" },
  { name: "H2H Record", importance: 0.10, category: "h2h" },
  { name: "Squad Value", importance: 0.08, category: "squad" },
  { name: "Home Advantage", importance: 0.07, category: "external" },
  { name: "Goals Scored Avg", importance: 0.06, category: "form" },
  { name: "Clean Sheets", importance: 0.05, category: "form" },
  { name: "PPDA", importance: 0.05, category: "xg" },
  { name: "Rest Days", importance: 0.04, category: "external" },
];

const categoryColors: Record<string, string> = {
  elo: "#ec4899",
  form: "#3b82f6",
  xg: "#a855f7",
  h2h: "#22c55e",
  squad: "#f97316",
  external: "#06b6d4",
};

// Mock calibration data
const calibrationData = [
  { predicted: 0.1, actual: 0.08 },
  { predicted: 0.2, actual: 0.18 },
  { predicted: 0.3, actual: 0.28 },
  { predicted: 0.4, actual: 0.42 },
  { predicted: 0.5, actual: 0.48 },
  { predicted: 0.6, actual: 0.58 },
  { predicted: 0.7, actual: 0.72 },
  { predicted: 0.8, actual: 0.78 },
  { predicted: 0.9, actual: 0.88 },
];

// Mock confusion matrix
const confusionMatrix = [
  { actual: "Home Win", homeWin: 156, draw: 42, awayWin: 28 },
  { actual: "Draw", homeWin: 38, draw: 89, awayWin: 35 },
  { actual: "Away Win", homeWin: 22, draw: 31, awayWin: 124 },
];

export default function ModelPage() {
  const bestModel = modelComparison.reduce((a, b) =>
    a.rps < b.rps ? a : b
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          Model Evaluation
        </h1>
        <p className="mt-2 text-foreground-muted">
          Performance metrics and analysis of our prediction models
        </p>
      </div>

      {/* Model Comparison */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Cross-Validation Results
          </CardTitle>
          <CardDescription>
            Time-series cross-validation on historical World Cup data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-sm text-foreground-muted">
                  <th className="pb-3 font-medium">Model</th>
                  <th className="pb-3 font-medium text-center">Accuracy</th>
                  <th className="pb-3 font-medium text-center">Log Loss</th>
                  <th className="pb-3 font-medium text-center">RPS</th>
                  <th className="pb-3 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {modelComparison.map((model) => {
                  const isBest = model.name === bestModel.name;
                  return (
                    <tr
                      key={model.name}
                      className={cn(
                        "hover:bg-card-hover",
                        isBest && "bg-primary/5"
                      )}
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{model.name}</span>
                          {isBest && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-background">
                              Best
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-center font-mono">
                        {(model.accuracy * 100).toFixed(1)}%
                      </td>
                      <td className="py-4 text-center font-mono">
                        {model.logLoss.toFixed(3)}
                      </td>
                      <td className="py-4 text-center">
                        <span
                          className={cn(
                            "font-mono font-semibold",
                            model.rps < 0.2 ? "text-success" : "text-foreground"
                          )}
                        >
                          {model.rps.toFixed(3)}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <CheckCircle2 className="h-5 w-5 mx-auto text-success" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 rounded-lg bg-background-secondary text-sm">
            <span className="font-medium">Benchmark:</span>{" "}
            <span className="text-foreground-muted">
              Random baseline RPS = 0.333 | Betting market RPS ≈ 0.200
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Two column layout */}
      <div className="grid gap-8 lg:grid-cols-2 mb-8">
        {/* Feature Importance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Feature Importance (Top 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={featureImportance}
                  layout="vertical"
                  margin={{ left: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis
                    type="number"
                    stroke="#666666"
                    fontSize={12}
                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#666666"
                    fontSize={12}
                    width={95}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#141414",
                      border: "1px solid #262626",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [
                      `${(value * 100).toFixed(1)}%`,
                      "Importance",
                    ]}
                  />
                  <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                    {featureImportance.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={categoryColors[entry.category]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-3">
              {Object.entries(categoryColors).map(([category, color]) => (
                <div key={category} className="flex items-center gap-1.5">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-foreground-muted capitalize">
                    {category}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Calibration Curve */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Calibration Curve
            </CardTitle>
            <CardDescription>
              Predicted vs actual win probabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={calibrationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis
                    dataKey="predicted"
                    stroke="#666666"
                    fontSize={12}
                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                    label={{
                      value: "Predicted",
                      position: "bottom",
                      fill: "#666666",
                      fontSize: 12,
                    }}
                  />
                  <YAxis
                    stroke="#666666"
                    fontSize={12}
                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                    label={{
                      value: "Actual",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#666666",
                      fontSize: 12,
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#141414",
                      border: "1px solid #262626",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [
                      `${(value * 100).toFixed(1)}%`,
                    ]}
                  />
                  {/* Perfect calibration line */}
                  <Line
                    type="linear"
                    dataKey="predicted"
                    stroke="#404040"
                    strokeDasharray="5 5"
                    dot={false}
                    name="Perfect"
                  />
                  {/* Actual calibration */}
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981" }}
                    name="Model"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs text-foreground-muted text-center">
              Closer to diagonal = better calibrated predictions
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confusion Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Confusion Matrix
          </CardTitle>
          <CardDescription>
            Win / Draw / Loss classification accuracy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full max-w-lg mx-auto">
              <thead>
                <tr>
                  <th className="p-2"></th>
                  <th className="p-2 text-center text-sm font-medium text-win">
                    Pred: Home
                  </th>
                  <th className="p-2 text-center text-sm font-medium text-draw">
                    Pred: Draw
                  </th>
                  <th className="p-2 text-center text-sm font-medium text-loss">
                    Pred: Away
                  </th>
                </tr>
              </thead>
              <tbody>
                {confusionMatrix.map((row) => (
                  <tr key={row.actual}>
                    <td className="p-2 text-sm font-medium">{row.actual}</td>
                    <td className="p-2">
                      <div
                        className={cn(
                          "rounded-lg p-4 text-center text-lg font-bold",
                          row.actual === "Home Win"
                            ? "bg-success/20 text-success"
                            : "bg-card"
                        )}
                      >
                        {row.homeWin}
                      </div>
                    </td>
                    <td className="p-2">
                      <div
                        className={cn(
                          "rounded-lg p-4 text-center text-lg font-bold",
                          row.actual === "Draw"
                            ? "bg-success/20 text-success"
                            : "bg-card"
                        )}
                      >
                        {row.draw}
                      </div>
                    </td>
                    <td className="p-2">
                      <div
                        className={cn(
                          "rounded-lg p-4 text-center text-lg font-bold",
                          row.actual === "Away Win"
                            ? "bg-success/20 text-success"
                            : "bg-card"
                        )}
                      >
                        {row.awayWin}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 rounded-lg bg-background-secondary text-sm text-center">
            <span className="text-foreground-muted">
              Draws are the hardest outcome to predict accurately (common in
              football analytics)
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
