"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Search, ChevronDown } from "lucide-react";

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
        <label className="mb-2 block text-sm font-medium text-foreground-muted">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors",
          "hover:border-border-hover hover:bg-card-hover",
          "focus:outline-none focus:ring-2 focus:ring-primary",
          isOpen && "border-primary"
        )}
      >
        {value ? (
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getFlagEmoji(value.code)}</span>
            <span className="font-medium">{value.name}</span>
            <span className={cn("text-xs", continentColors[value.continent])}>
              {value.continent}
            </span>
          </div>
        ) : (
          <span className="text-foreground-muted">{placeholder}</span>
        )}
        <ChevronDown
          className={cn(
            "h-5 w-5 text-foreground-muted transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-hidden rounded-lg border border-border bg-card shadow-xl">
          {/* Search */}
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search teams..."
                className="w-full rounded-md border border-border bg-background-secondary py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none"
                autoFocus
              />
            </div>
          </div>

          {/* Team list */}
          <div className="max-h-60 overflow-y-auto p-2">
            {Object.entries(groupedTeams).map(([continent, teams]) => (
              <div key={continent} className="mb-2">
                <div
                  className={cn(
                    "mb-1 px-2 text-xs font-semibold uppercase tracking-wider",
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
                      "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors",
                      "hover:bg-background-tertiary",
                      value?.code === team.code &&
                        "bg-primary-muted text-primary"
                    )}
                  >
                    <span className="text-lg">{getFlagEmoji(team.code)}</span>
                    <span className="text-sm font-medium">{team.name}</span>
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
