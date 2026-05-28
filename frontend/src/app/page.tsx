import { Countdown } from "@/components/dashboard/countdown";
import { WinProbabilityChart } from "@/components/dashboard/win-probability-chart";
import { UpcomingMatches } from "@/components/dashboard/upcoming-matches";
import { DataHealthStatus } from "@/components/dashboard/data-health-status";
import { QuickPredict } from "@/components/dashboard/quick-predict";
import {
  mockTeamsWithStats,
  mockUpcomingMatches,
  mockDataSources,
  worldCupStartDate,
} from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-2 text-foreground-muted">
          AI-powered predictions for the FIFA World Cup 2026
        </p>
      </div>

      {/* Countdown Section */}
      <div className="mb-8">
        <Countdown targetDate={worldCupStartDate} currentStage="Pre-Tournament" />
      </div>

      {/* Quick Predict Section */}
      <div className="mb-8">
        <QuickPredict />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Win Probability Chart - Takes 2 columns */}
        <div className="lg:col-span-2">
          <WinProbabilityChart teams={mockTeamsWithStats} />
        </div>

        {/* Data Health Status - Takes 1 column */}
        <div>
          <DataHealthStatus sources={mockDataSources} />
        </div>
      </div>

      {/* Upcoming Matches Section */}
      <div className="mt-8">
        <UpcomingMatches matches={mockUpcomingMatches} />
      </div>
    </div>
  );
}
