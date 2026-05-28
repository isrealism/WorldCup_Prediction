"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Loader2, Clock } from "lucide-react";

interface SimulationControlsProps {
  onSimulate: (iterations: number) => Promise<void>;
  isSimulating: boolean;
  progress: number;
  lastSimulationTime?: string;
  className?: string;
}

const iterationOptions = [
  { value: 10000, label: "10K" },
  { value: 50000, label: "50K" },
  { value: 100000, label: "100K" },
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
    <Card elevated className={cn("p-5", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Iteration Selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
            Iterations
          </span>
          <div className="flex rounded-lg bg-background-secondary p-0.5">
            {iterationOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedIterations(option.value)}
                disabled={isSimulating}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-medium transition-all",
                  selectedIterations === option.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-foreground-muted hover:text-foreground",
                  isSimulating && "opacity-50 cursor-not-allowed"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action */}
        <div className="flex items-center gap-3">
          {lastSimulationTime && !isSimulating && (
            <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
              <Clock className="h-3.5 w-3.5" />
              {lastSimulationTime}
            </div>
          )}
          <Button onClick={handleSimulate} disabled={isSimulating}>
            {isSimulating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Simulating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Simulation
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {isSimulating && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-foreground-muted">
              Running {selectedIterations.toLocaleString()} simulations...
            </span>
            <span className="text-xs font-medium tabular-nums">
              {progress.toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-background-secondary">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
