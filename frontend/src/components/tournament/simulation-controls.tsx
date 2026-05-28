"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Play, Loader2, RotateCcw } from "lucide-react";

interface SimulationControlsProps {
  onSimulate: (iterations: number) => Promise<void>;
  isSimulating: boolean;
  progress: number;
  lastSimulationTime?: string;
  className?: string;
}

const iterationOptions = [
  { value: 10000, label: "10K", description: "Fast (~5s)" },
  { value: 50000, label: "50K", description: "Balanced (~15s)" },
  { value: 100000, label: "100K", description: "Precise (~30s)" },
];

export function SimulationControls({
  onSimulate,
  isSimulating,
  progress,
  lastSimulationTime,
  className,
}: SimulationControlsProps) {
  const [selectedIterations, setSelectedIterations] = useState(50000);

  const handleSimulate = () => {
    onSimulate(selectedIterations);
  };

  return (
    <div className={cn("rounded-xl border border-border bg-card p-6", className)}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Iteration Selector */}
        <div>
          <label className="block text-sm font-medium text-foreground-muted mb-3">
            Simulation Iterations
          </label>
          <div className="flex gap-2">
            {iterationOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedIterations(option.value)}
                disabled={isSimulating}
                className={cn(
                  "rounded-lg px-4 py-3 text-center transition-colors",
                  selectedIterations === option.value
                    ? "bg-primary text-background"
                    : "border border-border bg-background-secondary text-foreground hover:bg-card-hover",
                  isSimulating && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="text-lg font-bold">{option.label}</div>
                <div className="text-xs opacity-70">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 lg:items-end">
          <Button
            onClick={handleSimulate}
            disabled={isSimulating}
            size="lg"
            className="w-full lg:w-auto"
          >
            {isSimulating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Simulating...
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                Run Simulation
              </>
            )}
          </Button>
          
          {lastSimulationTime && (
            <div className="flex items-center gap-2 text-xs text-foreground-muted">
              <RotateCcw className="h-3.5 w-3.5" />
              Last run: {lastSimulationTime}
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isSimulating && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground-muted">
              Running Monte Carlo simulation...
            </span>
            <span className="text-sm font-medium tabular-nums">
              {progress.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-background-secondary">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-foreground-muted">
            Simulating {selectedIterations.toLocaleString()} tournament scenarios...
          </p>
        </div>
      )}
    </div>
  );
}
