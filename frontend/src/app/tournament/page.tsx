"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SimulationControls } from "@/components/tournament/simulation-controls";
import { ProbabilityRankings, TeamProbabilities } from "@/components/tournament/probability-rankings";
import { GroupStageGrid } from "@/components/tournament/group-stage-grid";
import { CompareView } from "@/components/tournament/compare-view";
import { mockTeamsWithStats, Team } from "@/lib/mock-data";
import { Trophy, Users, LineChart, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

// Generate mock simulation data
function generateMockSimulationData(): TeamProbabilities[] {
  return mockTeamsWithStats.map((team) => {
    const groupStage = 0.85 + Math.random() * 0.15;
    const roundOf16 = groupStage * (0.6 + Math.random() * 0.35);
    const quarterFinals = roundOf16 * (0.5 + Math.random() * 0.4);
    const semiFinals = quarterFinals * (0.45 + Math.random() * 0.45);
    const finals = semiFinals * (0.4 + Math.random() * 0.5);
    const champion = finals * (0.35 + Math.random() * 0.55);

    return {
      team,
      groupStage,
      roundOf16,
      quarterFinals,
      semiFinals,
      finals,
      champion,
    };
  });
}

// Generate mock groups
function generateMockGroups() {
  const groups: { name: string; teams: { team: Team; qualifyProb: number; firstProb: number }[] }[] = [];
  const groupNames = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const shuffled = [...mockTeamsWithStats].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < 8; i++) {
    const groupTeams = shuffled.slice(i * 3, (i + 1) * 3);
    while (groupTeams.length < 4) {
      groupTeams.push(mockTeamsWithStats[groupTeams.length]);
    }

    groups.push({
      name: groupNames[i],
      teams: groupTeams.map((team, idx) => ({
        team,
        qualifyProb: 0.9 - idx * 0.2 + Math.random() * 0.15,
        firstProb: 0.6 - idx * 0.15 + Math.random() * 0.1,
      })).sort((a, b) => b.qualifyProb - a.qualifyProb),
    });
  }
  
  return groups;
}

type TabType = "rankings" | "groups" | "compare";

export default function TournamentPage() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [simulationData, setSimulationData] = useState<TeamProbabilities[]>([]);
  const [groups, setGroups] = useState<ReturnType<typeof generateMockGroups>>([]);
  const [lastSimulationTime, setLastSimulationTime] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<TabType>("rankings");

  useEffect(() => {
    setSimulationData(generateMockSimulationData());
    setGroups(generateMockGroups());
    setLastSimulationTime("2 hours ago");
  }, []);

  const handleSimulate = async (iterations: number) => {
    setIsSimulating(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 8 + 2;
      });
    }, 200);

    await new Promise((resolve) => setTimeout(resolve, 3000));

    clearInterval(interval);
    setProgress(100);

    setSimulationData(generateMockSimulationData());
    setGroups(generateMockGroups());
    setLastSimulationTime("Just now");

    setTimeout(() => {
      setIsSimulating(false);
      setProgress(0);
    }, 500);
  };

  const tabs = [
    { id: "rankings", label: "Rankings", icon: Trophy },
    { id: "groups", label: "Groups", icon: Layers },
    { id: "compare", label: "Compare", icon: LineChart },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      {/* Simulation Controls */}
      <div className="mb-6">
        <SimulationControls
          onSimulate={handleSimulate}
          isSimulating={isSimulating}
          progress={Math.min(100, progress)}
          lastSimulationTime={lastSimulationTime}
        />
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-1 p-1 bg-background-secondary rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
              activeTab === tab.id
                ? "bg-card text-foreground shadow-sm"
                : "text-foreground-muted hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "rankings" && (
        <Card elevated>
          <CardHeader className="flex flex-row items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <CardTitle>Championship Probability</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ProbabilityRankings teams={simulationData} />
          </CardContent>
        </Card>
      )}

      {activeTab === "groups" && (
        <Card elevated>
          <CardHeader className="flex flex-row items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <CardTitle>Group Stage Qualification</CardTitle>
          </CardHeader>
          <CardContent>
            <GroupStageGrid groups={groups} />
          </CardContent>
        </Card>
      )}

      {activeTab === "compare" && (
        <CompareView availableTeams={mockTeamsWithStats} />
      )}
    </div>
  );
}
