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
  Search,
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
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Trophy className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">
            WorldCup Predictor
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:items-center lg:gap-0.5">
          {navigation.slice(0, 6).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-primary text-white"
                    : "text-foreground-muted hover:bg-background-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Search & Status */}
        <div className="hidden lg:flex lg:items-center lg:gap-3">
          <button className="flex items-center gap-2 rounded-lg bg-background-secondary px-3 py-1.5 text-sm text-foreground-muted transition-colors hover:bg-background-tertiary hover:text-foreground">
            <Search className="h-4 w-4" />
            <span>Search teams...</span>
            <kbd className="ml-2 rounded bg-background-tertiary px-1.5 py-0.5 text-xs font-mono text-foreground-subtle">/</kbd>
          </button>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-foreground-muted text-xs font-medium">Live</span>
          </div>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="lg:hidden rounded-lg p-2 text-foreground-muted hover:bg-background-secondary hover:text-foreground transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-card">
          <div className="space-y-0.5 px-3 py-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-primary text-white"
                      : "text-foreground-muted hover:bg-background-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4.5 w-4.5" />
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
