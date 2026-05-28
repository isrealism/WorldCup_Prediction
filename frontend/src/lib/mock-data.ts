// Mock data types and data for the World Cup Predictor

export interface Team {
  name: string;
  code: string;
  continent: string;
  fifaRanking: number;
  elo: number;
  group: string;
  winProbability: number;
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  stage: string;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  predictedScore: { home: number; away: number };
}

export interface DataSourceStatus {
  name: string;
  lastUpdated: string;
  status: "healthy" | "warning" | "error";
  records: number;
}

// Mock team data with probabilities
export const mockTeamsWithStats: Team[] = [
  { name: "Argentina", code: "ARG", continent: "South America", fifaRanking: 1, elo: 2143, group: "A", winProbability: 0.142 },
  { name: "France", code: "FRA", continent: "Europe", fifaRanking: 2, elo: 2087, group: "D", winProbability: 0.128 },
  { name: "Brazil", code: "BRA", continent: "South America", fifaRanking: 3, elo: 2075, group: "G", winProbability: 0.118 },
  { name: "England", code: "ENG", continent: "Europe", fifaRanking: 4, elo: 2048, group: "B", winProbability: 0.095 },
  { name: "Spain", code: "ESP", continent: "Europe", fifaRanking: 5, elo: 2032, group: "E", winProbability: 0.088 },
  { name: "Germany", code: "GER", continent: "Europe", fifaRanking: 6, elo: 2018, group: "F", winProbability: 0.072 },
  { name: "Portugal", code: "POR", continent: "Europe", fifaRanking: 7, elo: 1995, group: "H", winProbability: 0.065 },
  { name: "Netherlands", code: "NED", continent: "Europe", fifaRanking: 8, elo: 1987, group: "A", winProbability: 0.058 },
  { name: "Belgium", code: "BEL", continent: "Europe", fifaRanking: 9, elo: 1974, group: "F", winProbability: 0.042 },
  { name: "Italy", code: "ITA", continent: "Europe", fifaRanking: 10, elo: 1962, group: "C", winProbability: 0.038 },
  { name: "Croatia", code: "CRO", continent: "Europe", fifaRanking: 11, elo: 1948, group: "B", winProbability: 0.032 },
  { name: "Uruguay", code: "URU", continent: "South America", fifaRanking: 12, elo: 1935, group: "H", winProbability: 0.028 },
  { name: "Colombia", code: "COL", continent: "South America", fifaRanking: 13, elo: 1920, group: "D", winProbability: 0.022 },
  { name: "Denmark", code: "DEN", continent: "Europe", fifaRanking: 14, elo: 1905, group: "C", winProbability: 0.018 },
  { name: "Morocco", code: "MAR", continent: "Africa", fifaRanking: 15, elo: 1890, group: "E", winProbability: 0.015 },
  { name: "USA", code: "USA", continent: "North America", fifaRanking: 16, elo: 1875, group: "G", winProbability: 0.012 },
  { name: "Mexico", code: "MEX", continent: "North America", fifaRanking: 17, elo: 1860, group: "A", winProbability: 0.008 },
  { name: "Japan", code: "JPN", continent: "Asia", fifaRanking: 18, elo: 1845, group: "B", winProbability: 0.006 },
  { name: "Switzerland", code: "SUI", continent: "Europe", fifaRanking: 19, elo: 1830, group: "F", winProbability: 0.005 },
  { name: "Poland", code: "POL", continent: "Europe", fifaRanking: 20, elo: 1815, group: "D", winProbability: 0.004 },
  { name: "Senegal", code: "SEN", continent: "Africa", fifaRanking: 21, elo: 1800, group: "E", winProbability: 0.003 },
  { name: "South Korea", code: "KOR", continent: "Asia", fifaRanking: 22, elo: 1785, group: "H", winProbability: 0.003 },
  { name: "Australia", code: "AUS", continent: "Oceania", fifaRanking: 23, elo: 1770, group: "G", winProbability: 0.002 },
  { name: "Canada", code: "CAN", continent: "North America", fifaRanking: 24, elo: 1755, group: "C", winProbability: 0.001 },
];

// Mock upcoming matches
export const mockUpcomingMatches: Match[] = [
  {
    id: "1",
    homeTeam: mockTeamsWithStats[0], // Argentina
    awayTeam: mockTeamsWithStats[7], // Netherlands
    date: "2026-06-11T18:00:00Z",
    stage: "Group A",
    homeWinProb: 0.52,
    drawProb: 0.24,
    awayWinProb: 0.24,
    predictedScore: { home: 2, away: 1 },
  },
  {
    id: "2",
    homeTeam: mockTeamsWithStats[1], // France
    awayTeam: mockTeamsWithStats[12], // Colombia
    date: "2026-06-12T20:00:00Z",
    stage: "Group D",
    homeWinProb: 0.58,
    drawProb: 0.22,
    awayWinProb: 0.20,
    predictedScore: { home: 2, away: 0 },
  },
  {
    id: "3",
    homeTeam: mockTeamsWithStats[2], // Brazil
    awayTeam: mockTeamsWithStats[15], // USA
    date: "2026-06-13T18:00:00Z",
    stage: "Group G",
    homeWinProb: 0.62,
    drawProb: 0.20,
    awayWinProb: 0.18,
    predictedScore: { home: 3, away: 1 },
  },
  {
    id: "4",
    homeTeam: mockTeamsWithStats[3], // England
    awayTeam: mockTeamsWithStats[10], // Croatia
    date: "2026-06-14T16:00:00Z",
    stage: "Group B",
    homeWinProb: 0.48,
    drawProb: 0.28,
    awayWinProb: 0.24,
    predictedScore: { home: 1, away: 1 },
  },
];

// Mock data source status
export const mockDataSources: DataSourceStatus[] = [
  { name: "Football-Data.org", lastUpdated: "2026-05-28T06:00:00Z", status: "healthy", records: 125430 },
  { name: "StatsBomb", lastUpdated: "2026-05-28T04:30:00Z", status: "healthy", records: 48920 },
  { name: "Transfermarkt", lastUpdated: "2026-05-27T18:00:00Z", status: "warning", records: 12850 },
  { name: "Open-Meteo", lastUpdated: "2026-05-28T05:45:00Z", status: "healthy", records: 3240 },
  { name: "Odds API", lastUpdated: "2026-05-28T06:00:00Z", status: "healthy", records: 890 },
  { name: "FIFA Rankings", lastUpdated: "2026-05-20T12:00:00Z", status: "warning", records: 211 },
];

// World Cup 2026 start date
export const worldCupStartDate = new Date("2026-06-11T00:00:00Z");

// Helper to get flag emoji
export function getFlagEmoji(countryCode: string): string {
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

// Continental colors
export const continentColors: Record<string, { bg: string; text: string }> = {
  Europe: { bg: "bg-europe", text: "text-europe" },
  "South America": { bg: "bg-south-america", text: "text-south-america" },
  Asia: { bg: "bg-asia", text: "text-asia" },
  Africa: { bg: "bg-africa", text: "text-africa" },
  "North America": { bg: "bg-north-america", text: "text-north-america" },
  Oceania: { bg: "bg-oceania", text: "text-oceania" },
};
