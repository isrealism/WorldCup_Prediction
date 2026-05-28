"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataSourceStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Database, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface DataHealthStatusProps {
  sources: DataSourceStatus[];
}

export function DataHealthStatus({ sources }: DataHealthStatusProps) {
  const statusConfig = {
    healthy: {
      icon: CheckCircle2,
      color: "text-success",
      bgColor: "bg-success/10",
      dotColor: "bg-success",
    },
    warning: {
      icon: AlertCircle,
      color: "text-warning",
      bgColor: "bg-warning/10",
      dotColor: "bg-warning",
    },
    error: {
      icon: XCircle,
      color: "text-danger",
      bgColor: "bg-danger/10",
      dotColor: "bg-danger",
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
      return `${hours}h ago`;
    }
    return `${minutes}m ago`;
  };

  const formatRecords = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const healthyCount = sources.filter(s => s.status === "healthy").length;

  return (
    <Card elevated>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-4.5 w-4.5 text-primary" />
          <CardTitle>Data Sources</CardTitle>
        </div>
        <span className="text-xs font-medium text-foreground-muted">
          {healthyCount}/{sources.length} healthy
        </span>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {sources.map((source) => {
            const config = statusConfig[source.status];

            return (
              <div
                key={source.name}
                className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-background-secondary"
              >
                <div className="flex items-center gap-3">
                  <span className={cn("h-2 w-2 rounded-full", config.dotColor)} />
                  <div>
                    <div className="text-sm font-medium">{source.name}</div>
                    <div className="text-xs text-foreground-subtle">
                      {formatRecords(source.records)} records
                    </div>
                  </div>
                </div>
                <div className="text-right">
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
