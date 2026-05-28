"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Clock, Trophy, Calendar } from "lucide-react";

interface CountdownProps {
  targetDate: Date;
  currentStage?: string;
}

export function Countdown({ targetDate, currentStage = "Pre-Tournament" }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-card to-card border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <CardTitle>FIFA World Cup 2026</CardTitle>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-primary-muted px-3 py-1 text-sm font-medium text-primary">
            <Calendar className="h-4 w-4" />
            {currentStage}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-foreground-muted mb-4">
          <Clock className="h-4 w-4" />
          <span className="text-sm">Until kickoff</span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { value: timeLeft.days, label: "Days" },
            { value: timeLeft.hours, label: "Hours" },
            { value: timeLeft.minutes, label: "Minutes" },
            { value: timeLeft.seconds, label: "Seconds" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center rounded-lg bg-background-secondary p-4"
            >
              <span className="text-3xl font-bold tabular-nums text-foreground">
                {item.value.toString().padStart(2, "0")}
              </span>
              <span className="text-xs text-foreground-muted">{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
