"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Play,
  Clock,
  Loader2,
  Settings,
  Cpu,
  Layers,
} from "lucide-react";

// Mock data source status
const mockDataSources = [
  { id: "football-data", name: "Football-Data.org", lastUpdated: "2026-05-28T06:00:00Z", status: "healthy" as const, records: 125430, updateTime: "~2 min" },
  { id: "statsbomb", name: "StatsBomb", lastUpdated: "2026-05-28T04:30:00Z", status: "healthy" as const, records: 48920, updateTime: "~5 min" },
  { id: "transfermarkt", name: "Transfermarkt", lastUpdated: "2026-05-27T18:00:00Z", status: "warning" as const, records: 12850, updateTime: "~10 min" },
  { id: "open-meteo", name: "Open-Meteo Weather", lastUpdated: "2026-05-28T05:45:00Z", status: "healthy" as const, records: 3240, updateTime: "~1 min" },
  { id: "odds-api", name: "Odds API", lastUpdated: "2026-05-28T06:00:00Z", status: "healthy" as const, records: 890, updateTime: "~30 sec" },
  { id: "fifa", name: "FIFA Rankings", lastUpdated: "2026-05-20T12:00:00Z", status: "warning" as const, records: 211, updateTime: "~1 min" },
];

const statusConfig = {
  healthy: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: "Healthy" },
  warning: { icon: AlertCircle, color: "text-warning", bg: "bg-warning/10", label: "Outdated" },
  error: { icon: XCircle, color: "text-danger", bg: "bg-danger/10", label: "Error" },
};

export default function AdminPage() {
  const [updatingSource, setUpdatingSource] = useState<string | null>(null);
  const [rebuildingFeatures, setRebuildingFeatures] = useState(false);
  const [retrainingModel, setRetrainingModel] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    if (hours > 24) return `${Math.floor(hours / 24)}d ago`;
    if (hours > 0) return `${hours}h ${minutes}m ago`;
    return `${minutes}m ago`;
  };

  const formatRecords = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleUpdateSource = async (sourceId: string) => {
    setUpdatingSource(sourceId);
    setLogs((prev) => [...prev, `[${new Date().toISOString()}] Starting update for ${sourceId}...`]);
    
    // Simulate update
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLogs((prev) => [...prev, `[${new Date().toISOString()}] Fetching data from ${sourceId}...`]);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLogs((prev) => [...prev, `[${new Date().toISOString()}] Processing records...`]);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLogs((prev) => [...prev, `[${new Date().toISOString()}] Update complete for ${sourceId}`]);
    
    setUpdatingSource(null);
  };

  const handleRebuildFeatures = async () => {
    setRebuildingFeatures(true);
    setLogs((prev) => [...prev, `[${new Date().toISOString()}] Starting feature matrix rebuild...`]);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setLogs((prev) => [...prev, `[${new Date().toISOString()}] Computing 60+ features for all teams...`]);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLogs((prev) => [...prev, `[${new Date().toISOString()}] Feature rebuild complete`]);
    setRebuildingFeatures(false);
  };

  const handleRetrainModel = async () => {
    setRetrainingModel(true);
    setLogs((prev) => [...prev, `[${new Date().toISOString()}] Starting model retraining...`]);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLogs((prev) => [...prev, `[${new Date().toISOString()}] Training LightGBM classifier...`]);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setLogs((prev) => [...prev, `[${new Date().toISOString()}] Cross-validation complete. RPS: 0.195`]);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLogs((prev) => [...prev, `[${new Date().toISOString()}] Model saved. Training complete.`]);
    setRetrainingModel(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Database className="h-8 w-8 text-primary" />
          Data Management
        </h1>
        <p className="mt-2 text-foreground-muted">
          Manage data sources, feature engineering, and model training
        </p>
      </div>

      {/* Data Sources */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Data Sources
              </CardTitle>
              <CardDescription>Status and management of all data feeds</CardDescription>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                mockDataSources.forEach((s) => handleUpdateSource(s.id));
              }}
              disabled={updatingSource !== null}
            >
              <RefreshCw className={cn("h-4 w-4", updatingSource && "animate-spin")} />
              Refresh All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockDataSources.map((source) => {
              const config = statusConfig[source.status];
              const StatusIcon = config.icon;
              const isUpdating = updatingSource === source.id;

              return (
                <div
                  key={source.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-card-hover transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", config.bg)}>
                      <StatusIcon className={cn("h-5 w-5", config.color)} />
                    </div>
                    <div>
                      <div className="font-medium">{source.name}</div>
                      <div className="flex items-center gap-4 text-xs text-foreground-muted">
                        <span>{formatRecords(source.records)} records</span>
                        <span>Updated {formatTime(source.lastUpdated)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-xs text-foreground-muted">
                      <div>{source.updateTime}</div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUpdateSource(source.id)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Update
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Feature & Model Management */}
      <div className="grid gap-8 lg:grid-cols-2 mb-8">
        {/* Feature Rebuild */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Feature Engineering
            </CardTitle>
            <CardDescription>
              Rebuild the feature matrix from raw data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg bg-background-secondary p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Last Build</span>
                  <span className="text-sm text-foreground-muted">2h 15m ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Build Time</span>
                  <span className="text-sm text-foreground-muted">~45 seconds</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-medium">Features</span>
                  <span className="text-sm text-foreground-muted">64 features</span>
                </div>
              </div>
              <Button
                onClick={handleRebuildFeatures}
                disabled={rebuildingFeatures}
                className="w-full"
              >
                {rebuildingFeatures ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Rebuilding...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Rebuild Features
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Model Retrain */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              Model Training
            </CardTitle>
            <CardDescription>
              Retrain the prediction model with latest data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg bg-background-secondary p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Last Training</span>
                  <span className="text-sm text-foreground-muted">1d 4h ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Train Time</span>
                  <span className="text-sm text-foreground-muted">~2 minutes</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-medium">Best RPS</span>
                  <span className="text-sm font-medium text-success">0.195</span>
                </div>
              </div>
              <Button
                onClick={handleRetrainModel}
                disabled={retrainingModel}
                className="w-full"
              >
                {retrainingModel ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Training...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Retrain Model
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-background-secondary p-4 font-mono text-xs h-48 overflow-y-auto">
            {logs.length === 0 ? (
              <span className="text-foreground-muted">No recent activity...</span>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="py-0.5 text-foreground-muted">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
