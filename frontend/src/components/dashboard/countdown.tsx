"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Trophy, MapPin } from "lucide-react";

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
    <Card className="overflow-hidden border-0 bg-gradient-to-r from-primary to-emerald-600 text-white shadow-lg">
      <div className="px-5 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left side - Event info */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">FIFA World Cup 2026</h2>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <MapPin className="h-3.5 w-3.5" />
                <span>USA, Canada, Mexico</span>
                <span className="mx-1">|</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                  {currentStage}
                </span>
              </div>
            </div>
          </div>

          {/* Right side - Countdown */}
          <div className="flex items-center gap-3">
            {[
              { value: timeLeft.days, label: "Days" },
              { value: timeLeft.hours, label: "Hrs" },
              { value: timeLeft.minutes, label: "Min" },
              { value: timeLeft.seconds, label: "Sec" },
            ].map((item, idx) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <span className="text-2xl sm:text-3xl font-bold tabular-nums">
                    {item.value.toString().padStart(2, "0")}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-white/70">{item.label}</span>
                </div>
                {idx < 3 && <span className="text-2xl font-light text-white/40">:</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
