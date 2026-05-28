"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Search, ChevronDown, X } from "lucide-react";

export interface Team {
  name: string;
  code: string;
  continent: string;
  flag?: string;
}

// Mock teams data - will be replaced with API data
export const mockTeams: Team[] = [
  { name: "Argentina", code: "ARG", continent: "South America" },
  { name: "Brazil", code: "BRA", continent: "South America" },
  { name: "France", code: "FRA", continent: "Europe" },
  { name: "England", code: "ENG", continent: "Europe" },
  { name: "Germany", code: "GER", continent: "Europe" },
  { name: "Spain", code: "ESP", continent: "Europe" },
  { name: "Portugal", code: "POR", continent: "Europe" },
  { name: "Netherlands", code: "NED", continent: "Europe" },
  { name: "Belgium", code: "BEL", continent: "Europe" },
  { name: "Italy", code: "ITA", continent: "Europe" },
  { name: "Croatia", code: "CRO", continent: "Europe" },
  { name: "Morocco", code: "MAR", continent: "Africa" },
  { name: "Senegal", code: "SEN", continent: "Africa" },
  { name: "Japan", code: "JPN", continent: "Asia" },
  { name: "South Korea", code: "KOR", continent: "Asia" },
  { name: "Australia", code: "AUS", continent: "Oceania" },
  { name: "USA", code: "USA", continent: "North America" },
  { name: "Mexico", code: "MEX", continent: "North America" },
  { name: "Canada", code: "CAN", continent: "North America" },
  { name: "Uruguay", code: "URU", continent: "South America" },
  { name: "Colombia", code: "COL", continent: "South America" },
  { name: "Ecuador", code: "ECU", continent: "South America" },
  { name: "Denmark", code: "DEN", continent: "Europe" },
  { name: "Switzerland", code: "SUI", continent: "Europe" },
  { name: "Poland", code: "POL", continent: "Europe" },
  { name: "Wales", code: "WAL", continent: "Europe" },
  { name: "Serbia", code: "SRB", continent: "Europe" },
  { name: "Cameroon", code: "CMR", continent: "Africa" },
  { name: "Ghana", code: "GHA", continent: "Africa" },
  { name: "Tunisia", code: "TUN", continent: "Africa" },
  { name: "Saudi Arabia", code: "KSA", continent: "Asia" },
  { name: "Iran", code: "IRN", continent: "Asia" },
];

const continentColors: Record<string, string> = {
  Europe: "text-europe",
  "South America": "text-south-america",
  Asia: "text-asia",
  Africa: "text-africa",
  "North America": "text-north-america",
  Oceania: "text-oceania",
};

interface TeamSelectorProps {
  label?: string;
  value: Team | null;
  onChange: (team: Team | null) => void;
  teams?: Team[];
  placeholder?: string;
  className?: string;
}

export function TeamSelector({
  label,
  value,
  onChange,
  teams = mockTeams,
  placeholder = "Select team",
  className,
}: TeamSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(search.toLowerCase())
  );

  // Group by continent
  const groupedTeams = filteredTeams.reduce(
    (acc, team) => {
      if (!acc[team.continent]) acc[team.continent] = [];
      acc[team.continent].push(team);
      return acc;
    },
    {} as Record<string, Team[]>
  );

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {label && (
        <label className="mb-1.5 block text-xs font-medium text-foreground-muted uppercase tracking-wider">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-all duration-150",
          "hover:border-border-hover",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          isOpen && "border-primary ring-2 ring-primary ring-offset-2"
        )}
      >
        {value ? (
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{getFlagEmoji(value.code)}</span>
            <span className="text-sm font-medium">{value.name}</span>
          </div>
        ) : (
          <span className="text-sm text-foreground-muted">{placeholder}</span>
        )}
        <div className="flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="rounded p-0.5 text-foreground-subtle hover:bg-background-secondary hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-foreground-muted transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-72 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          {/* Search */}
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search teams..."
                className="w-full rounded-md border-0 bg-background-secondary py-1.5 pl-8 pr-3 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>
          </div>

          {/* Team list */}
          <div className="max-h-52 overflow-y-auto p-1.5">
            {Object.entries(groupedTeams).map(([continent, teams]) => (
              <div key={continent} className="mb-1.5 last:mb-0">
                <div
                  className={cn(
                    "mb-0.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider",
                    continentColors[continent]
                  )}
                >
                  {continent}
                </div>
                {teams.map((team) => (
                  <button
                    key={team.code}
                    onClick={() => {
                      onChange(team);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors",
                      "hover:bg-background-secondary",
                      value?.code === team.code &&
                        "bg-primary-muted text-primary"
                    )}
                  >
                    <span className="text-base">{getFlagEmoji(team.code)}</span>
                    <span className="text-sm">{team.name}</span>
                  </button>
                ))}
              </div>
            ))}
            {filteredTeams.length === 0 && (
              <div className="px-2 py-4 text-center text-sm text-foreground-muted">
                No teams found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to get flag emoji from country code
function getFlagEmoji(countryCode: string): string {
  const codeMap: Record<string, string> = {
    ARG: "🇦🇷",
    BRA: "🇧🇷",
    FRA: "🇫🇷",
    ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    GER: "🇩🇪",
    ESP: "🇪🇸",
    POR: "🇵🇹",
    NED: "🇳🇱",
    BEL: "🇧🇪",
    ITA: "🇮🇹",
    CRO: "🇭🇷",
    MAR: "🇲🇦",
    SEN: "🇸🇳",
    JPN: "🇯🇵",
    KOR: "🇰🇷",
    AUS: "🇦🇺",
    USA: "🇺🇸",
    MEX: "🇲🇽",
    CAN: "🇨🇦",
    URU: "🇺🇾",
    COL: "🇨🇴",
    ECU: "🇪🇨",
    DEN: "🇩🇰",
    SUI: "🇨🇭",
    POL: "🇵🇱",
    WAL: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
    SRB: "🇷🇸",
    CMR: "🇨🇲",
    GHA: "🇬🇭",
    TUN: "🇹🇳",
    KSA: "🇸🇦",
    IRN: "🇮🇷",
  };
  return codeMap[countryCode] || "🏳️";
}
