"""
fetch_squads.py — 球队 & 球员数据拉取
  - football-data.org  →  球队基本信息 + 阵容
  - API-Football       →  球员详细数据 + 教练 + 伤病

用法:
    python fetch_squads.py --teams      # 拉球队信息
    python fetch_squads.py --players    # 拉球员数据
    python fetch_squads.py --injuries   # 拉伤病状态
    python fetch_squads.py --all
"""

import argparse
import time
from pathlib import Path

import requests
import pandas as pd

from config import (
    FOOTBALL_DATA_API_KEY, API_FOOTBALL_KEY,
    FD_COMPETITIONS, FD_SEASONS, DATA_DIR,
)

OUT = Path(DATA_DIR)
OUT.mkdir(parents=True, exist_ok=True)

FD_BASE    = "https://api.football-data.org/v4"
FD_HEADERS = {"X-Auth-Token": FOOTBALL_DATA_API_KEY}
FD_DELAY   = 7

AF_BASE    = "https://v3.football.api-sports.io"
AF_HEADERS = {
    "x-rapidapi-key":  API_FOOTBALL_KEY,
    "x-rapidapi-host": "v3.football.api-sports.io",
}
AF_DELAY = 1.5


def save(df: pd.DataFrame, name: str):
    if df is None or df.empty:
        print(f"  [skip] {name} — 空")
        return
    path = OUT / f"{name}.parquet"
    df.to_parquet(path, index=False)
    print(f"  [ok]   {name}.parquet  ({len(df):,} 行)")


def fd_get(path, params=None):
    resp = requests.get(f"{FD_BASE}{path}", headers=FD_HEADERS, params=params, timeout=15)
    return resp.json() if resp.status_code == 200 else None


def af_get(path, params=None):
    resp = requests.get(f"{AF_BASE}/{path}", headers=AF_HEADERS, params=params, timeout=15)
    if resp.status_code == 200:
        return resp.json().get("response", [])
    return []


# ══════════════════════════════════════════════════════════════════════════════
# 1. 球队基本信息（football-data.org）
# ══════════════════════════════════════════════════════════════════════════════

def cmd_teams():
    print("\n══ 球队信息（football-data.org）═══════════════════════════════")
    all_teams, all_squads = [], []

    for comp_name, code in FD_COMPETITIONS.items():
        if code is None:
            continue
        seasons = FD_SEASONS.get(comp_name, [])
        for season in seasons:
            print(f"  {comp_name} {season} 球队...")
            data = fd_get(f"/competitions/{code}/teams", {"season": season})
            time.sleep(FD_DELAY)
            if not data or "teams" not in data:
                continue

            for team in data["teams"]:
                # 球队基本信息
                all_teams.append({
                    "competition": comp_name,
                    "season":      season,
                    "team_id":     team.get("id"),
                    "team_name":   team.get("name"),
                    "short_name":  team.get("shortName"),
                    "tla":         team.get("tla"),
                    "country":     team.get("area", {}).get("name"),
                    "founded":     team.get("founded"),
                    "venue":       team.get("venue"),
                    "coach_name":  team.get("coach", {}).get("name"),
                    "coach_nationality": team.get("coach", {}).get("nationality"),
                    "coach_contract_until": team.get("coach", {}).get("contract", {}).get("until"),
                })

                # 阵容
                for player in team.get("squad", []):
                    all_squads.append({
                        "competition":  comp_name,
                        "season":       season,
                        "team_id":      team.get("id"),
                        "team_name":    team.get("name"),
                        "player_id":    player.get("id"),
                        "player_name":  player.get("name"),
                        "position":     player.get("position"),
                        "date_of_birth":player.get("dateOfBirth"),
                        "nationality":  player.get("nationality"),
                    })

            print(f"    {len(data['teams'])} 支队")

    save(pd.DataFrame(all_teams),  "team_info_fd")
    save(pd.DataFrame(all_squads), "squads_fd")


# ══════════════════════════════════════════════════════════════════════════════
# 2. 球员详细数据（API-Football）
# ══════════════════════════════════════════════════════════════════════════════

# 主要国家队在 API-Football 中的 team ID
# 用 af_get("teams", {"country": "Brazil"}) 可查任意球队
NATIONAL_TEAM_IDS = {
    "Brazil":      6,    "France":      2,    "Germany":     25,
    "Spain":       9,    "Argentina":   26,   "England":     10,
    "Portugal":    27,   "Netherlands": 1141, "Belgium":     1,
    "USA":         3,    "Mexico":      16,   "Canada":      95,
    "Japan":       2364, "South Korea": 2363, "Morocco":     32,
    "Senegal":     37,   "Croatia":     3,    "Uruguay":     17,
    "Switzerland": 15,   "Denmark":     21,   "Poland":      24,
    "Australia":   26,   "Ecuador":     56,   "Ghana":       33,
    "Cameroon":    34,   "Serbia":      14,   "Qatar":       164,
    "Iran":        2366, "Saudi Arabia":2366, "Tunisia":     35,
}

SEASONS_FOR_PLAYERS = [2022, 2023, 2024]


def cmd_players():
    print("\n══ 球员详细数据（API-Football）═════════════════════════════════")
    all_players, all_stats = [], []

    for team_name, team_id in NATIONAL_TEAM_IDS.items():
        print(f"\n  {team_name} (id={team_id})...")

        for season in SEASONS_FOR_PLAYERS:
            page = 1
            while True:
                players = af_get("players", {
                    "team": team_id, "season": season, "page": page
                })
                time.sleep(AF_DELAY)
                if not players:
                    break

                for item in players:
                    p = item.get("player", {})
                    all_players.append({
                        "national_team":   team_name,
                        "season":          season,
                        "player_id":       p.get("id"),
                        "player_name":     p.get("name"),
                        "firstname":       p.get("firstname"),
                        "lastname":        p.get("lastname"),
                        "age":             p.get("age"),
                        "birth_date":      p.get("birth", {}).get("date"),
                        "birth_country":   p.get("birth", {}).get("country"),
                        "nationality":     p.get("nationality"),
                        "height":          p.get("height"),
                        "weight":          p.get("weight"),
                        "position":        p.get("position"),
                        "photo":           p.get("photo"),
                    })

                    # 本赛季所有俱乐部统计
                    for stat in item.get("statistics", []):
                        team  = stat.get("team", {})
                        league= stat.get("league", {})
                        games = stat.get("games", {})
                        goals = stat.get("goals", {})
                        passes= stat.get("passes", {})
                        shots = stat.get("shots", {})
                        dribbles = stat.get("dribbles", {})
                        tackles  = stat.get("tackles", {})
                        cards    = stat.get("cards", {})

                        all_stats.append({
                            "national_team":     team_name,
                            "season":            season,
                            "player_id":         p.get("id"),
                            "player_name":       p.get("name"),
                            "club":              team.get("name"),
                            "club_id":           team.get("id"),
                            "league":            league.get("name"),
                            "league_country":    league.get("country"),
                            "appearances":       games.get("appearences"),
                            "minutes":           games.get("minutes"),
                            "rating":            games.get("rating"),
                            "goals":             goals.get("total"),
                            "assists":           goals.get("assists"),
                            "shots_total":       shots.get("total"),
                            "shots_on":          shots.get("on"),
                            "passes_total":      passes.get("total"),
                            "passes_key":        passes.get("key"),
                            "pass_accuracy":     passes.get("accuracy"),
                            "dribbles_attempts": dribbles.get("attempts"),
                            "dribbles_success":  dribbles.get("success"),
                            "tackles_total":     tackles.get("total"),
                            "tackles_interceptions": tackles.get("interceptions"),
                            "yellow_cards":      cards.get("yellow"),
                            "red_cards":         cards.get("red"),
                        })

                # 翻页
                page += 1
                if page > 5:   # 国家队球员有限，5页绰绰有余
                    break

        print(f"    {len([p for p in all_players if p['national_team']==team_name])} 条球员记录")

    save(pd.DataFrame(all_players), "player_profiles_af")
    save(pd.DataFrame(all_stats),   "player_stats_af")


# ══════════════════════════════════════════════════════════════════════════════
# 3. 伤病 / 停赛（API-Football）
# ══════════════════════════════════════════════════════════════════════════════

def cmd_injuries():
    print("\n══ 伤病 / 停赛（API-Football）══════════════════════════════════")

    # 拉取当前赛季各国家队伤病
    all_rows = []
    for team_name, team_id in NATIONAL_TEAM_IDS.items():
        print(f"  {team_name}...")
        for season in [2024]:
            injuries = af_get("injuries", {"team": team_id, "season": season})
            time.sleep(AF_DELAY)
            for item in injuries:
                player = item.get("player", {})
                fix    = item.get("fixture", {})
                all_rows.append({
                    "national_team": team_name,
                    "season":        season,
                    "player_id":     player.get("id"),
                    "player_name":   player.get("name"),
                    "type":          player.get("type"),
                    "reason":        player.get("reason"),
                    "match_date":    fix.get("date"),
                })

    save(pd.DataFrame(all_rows), "injuries_af")


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="球队 & 球员数据拉取")
    parser.add_argument("--teams",    action="store_true")
    parser.add_argument("--players",  action="store_true")
    parser.add_argument("--injuries", action="store_true")
    parser.add_argument("--all",      action="store_true")
    args = parser.parse_args()

    if args.teams    or args.all: cmd_teams()
    if args.players  or args.all: cmd_players()
    if args.injuries or args.all: cmd_injuries()
    if not any(vars(args).values()):
        parser.print_help()


if __name__ == "__main__":
    main()