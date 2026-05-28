"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { getFlagEmoji, Team } from "@/lib/mock-data";
import { TeamSelector, mockTeams } from "@/components/team-selector";
import { X } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TeamProbData {
  team: Team;
  color: string;
  data: {
    stage: string;
    probability: number;
  }[];
}

interface CompareViewProps {
  availableTeams: Team[];
  className?: string;
}

const colors = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f97316", // orange
  "#a855f7", // purple
];

const stages = ["Group", "R16", "QF", "SF", "Final", "Champion"];

export function CompareView({ availableTeams, className }: CompareViewProps) {
  const [selectedTeams, setSelectedTeams] = useState<(Team | null)[]>([null, null]);

  const addTeam = (team: Team | null, index: number) => {
    const newTeams = [...selectedTeams];
    newTeams[index] = team;
    setSelectedTeams(newTeams);
  };

  const removeTeam = (index: number) => {
    const newTeams = [...selectedTeams];
    newTeams[index] = null;
    setSelectedTeams(newTeams);
  };

  const addSlot = () => {
    if (selectedTeams.length < 4) {
      setSelectedTeams([...selectedTeams, null]);
    }
  };

  // Generate mock probability data for chart
  const chartData = stages.map((stage, stageIndex) => {
    const dataPoint: Record<string, string | number> = { stage };
    selectedTeams.forEach((team, teamIndex) => {
      if (team) {
        // Mock declining probability through stages
        const baseProbability = 0.95 - stageIndex * 0.15 + (Math.random() - 0.5) * 0.1;
        dataPoint[team.code] = Math.max(0, Math.min(1, baseProbability)) * 100;
      }
    });
    return dataPoint;
  });

  const activeTeams = selectedTeams.filter((t): t is Team => t !== null);

  return (
    <div className={cn("rounded-xl border border-border bg-card p-6", className)}>
      <h3 className="text-lg font-semibold mb-4">Compare Teams</h3>

      {/* Team Selectors */}
      <div className="flex flex-wrap gap-3 mb-6">
        {selectedTeams.map((team, index) => (
          <div key={index} className="flex items-center gap-2">
            {team ? (
              <div
                className="flex items-center gap-2 rounded-lg border px-3 py-2"
                style={{ borderColor: colors[index] }}
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: colors[index] }}
                />
                <span className="text-lg">{getFlagEmoji(team.code)}</span>
                <span className="text-sm font-medium">{team.name}</span>
                <button
                  onClick={() => removeTeam(index)}
                  className="text-foreground-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="w-48">
                <TeamSelector
                  value={null}
                  onChange={(t) => addTeam(t, index)}
                  teams={availableTeams.filter(
                    (t) => !selectedTeams.some((st) => st?.code === t.code)
                  )}
                  placeholder={`Team ${index + 1}`}
                />
              </div>
            )}
          </div>
        ))}
        
        {selectedTeams.length < 4 && (
          <button
            onClick={addSlot}
            className="rounded-lg border border-dashed border-border px-4 py-2 text-sm text-foreground-muted hover:bg-card-hover hover:text-foreground transition-colors"
          >
            + Add Team
          </button>
        )}
      </div>

      {/* Chart */}
      {activeTeams.length > 0 ? (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis
                dataKey="stage"
                stroke="#666666"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#666666"
                fontSize={12}
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#141414",
                  border: "1px solid #262626",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#ededed" }}
                formatter={(value: number) => [`${value.toFixed(1)}%`]}
              />
              <Legend />
              {activeTeams.map((team, index) => (
                <Line
                  key={team.code}
                  type="monotone"
                  dataKey={team.code}
                  name={team.name}
                  stroke={colors[index]}
                  strokeWidth={2}
                  dot={{ fill: colors[index], strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: colors[index] }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-80 flex items-center justify-center text-foreground-muted">
          <p>Select teams to compare their progression probabilities</p>
        </div>
      )}
    </div>
  );
}
