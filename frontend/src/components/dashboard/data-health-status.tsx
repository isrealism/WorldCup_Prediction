"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DataSourceStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Database, CheckCircle2, AlertCircle, XCircle, RefreshCw } from "lucide-react";

interface DataHealthStatusProps {
  sources: DataSourceStatus[];
}

export function DataHealthStatus({ sources }: DataHealthStatusProps) {
  const statusConfig = {
    healthy: {
      icon: CheckCircle2,
      color: "text-success",
      bgColor: "bg-success/10",
      label: "Healthy",
    },
    warning: {
      icon: AlertCircle,
      color: "text-warning",
      bgColor: "bg-warning/10",
      label: "Outdated",
    },
    error: {
      icon: XCircle,
      color: "text-danger",
      bgColor: "bg-danger/10",
      label: "Error",
    },
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    if (hours > 24) {
      return `${Math.floor(hours / 24)}d ago`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m ago`;
    }
    return `${minutes}m ago`;
  };

  const formatRecords = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Data Health
            </CardTitle>
            <CardDescription>Data source status overview</CardDescription>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:bg-card-hover hover:text-foreground">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh All
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sources.map((source) => {
            const config = statusConfig[source.status];
            const StatusIcon = config.icon;

            return (
              <div
                key={source.name}
                className="flex items-center justify-between rounded-lg border border-border bg-background-secondary p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      config.bgColor
                    )}
                  >
                    <StatusIcon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{source.name}</div>
                    <div className="text-xs text-foreground-muted">
                      {formatRecords(source.records)} records
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={cn(
                      "text-xs font-medium",
                      config.color
                    )}
                  >
                    {config.label}
                  </div>
                  <div className="text-xs text-foreground-muted">
                    {formatTime(source.lastUpdated)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
