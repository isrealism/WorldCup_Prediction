"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Target,
  Trophy,
  Users,
  Swords,
  Sparkles,
  BarChart3,
  Database,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Predict", href: "/predict", icon: Target },
  { name: "Tournament", href: "/tournament", icon: Trophy },
  { name: "Teams", href: "/teams", icon: Users },
  { name: "H2H", href: "/h2h", icon: Swords },
  { name: "What-If", href: "/whatif", icon: Sparkles },
  { name: "Model", href: "/model", icon: BarChart3 },
  { name: "Admin", href: "/admin", icon: Database },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Trophy className="h-5 w-5 text-background" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            WorldCup Predictor
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:items-center lg:gap-1">
          {navigation.slice(0, 6).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-muted text-primary"
                    : "text-foreground-muted hover:bg-card hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Status Indicator & Actions */}
        <div className="hidden lg:flex lg:items-center lg:gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span className="text-foreground-muted">Data Updated</span>
          </div>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="lg:hidden rounded-lg p-2 text-foreground-muted hover:bg-card hover:text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background">
          <div className="space-y-1 px-4 py-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-muted text-primary"
                      : "text-foreground-muted hover:bg-card hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
