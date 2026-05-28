"""
fetch.py — 比赛结果拉取
  - football-data.org  →  世界杯 / 欧洲杯
  - API-Football       →  美洲杯 / 非洲杯 / 亚洲杯 / 欧国联 / 预选赛 / 友谊赛

用法:
    python fetch.py --test          # 验证两个 API Key 是否有效
    python fetch.py --fd            # 拉 football-data.org 数据
    python fetch.py --af            # 拉 API-Football 数据
    python fetch.py --all           # 全部
"""

import argparse
import time
from pathlib import Path

import requests
import pandas as pd

from config import (
    FOOTBALL_DATA_API_KEY, API_FOOTBALL_KEY,
    FD_COMPETITIONS, FD_SEASONS, AF_COMPETITIONS, DATA_DIR,
)

OUT = Path(DATA_DIR)
OUT.mkdir(parents=True, exist_ok=True)

# ── 通用工具 ──────────────────────────────────────────────────────────────────

def save(df: pd.DataFrame, name: str):
    if df is None or df.empty:
        print(f"  [skip] {name} — 空数据")
        return
    path = OUT / f"{name}.parquet"
    df.to_parquet(path, index=False)
    print(f"  [ok]   {name}.parquet  ({len(df):,} 行)")


# ══════════════════════════════════════════════════════════════════════════════
# 1. football-data.org
#    文档：https://docs.football-data.org
#    免费套餐：10 req/min，覆盖 WC / EC
# ══════════════════════════════════════════════════════════════════════════════

FD_BASE    = "https://api.football-data.org/v4"
FD_HEADERS = {"X-Auth-Token": FOOTBALL_DATA_API_KEY}
FD_DELAY   = 7   # 免费套餐 10 req/min，保守用 7 秒间隔


def fd_get(path: str, params: dict = None) -> dict | None:
    url = f"{FD_BASE}{path}"
    for attempt in range(3):
        try:
            resp = requests.get(url, headers=FD_HEADERS, params=params, timeout=15)
            if resp.status_code == 200:
                return resp.json()
            if resp.status_code == 429:
                print(f"  [限速] 等待 60s ...")
                time.sleep(60)
            else:
                print(f"  [warn] HTTP {resp.status_code}: {path}")
                return None
        except Exception as e:
            print(f"  [warn] 请求失败({attempt+1}/3): {e}")
            time.sleep(5)
    return None


def parse_fd_matches(raw: list, competition: str, season: int) -> pd.DataFrame:
    """把 football-data.org 的 matches 列表展平为 DataFrame。"""
    rows = []
    for m in raw:
        home = m.get("homeTeam", {})
        away = m.get("awayTeam", {})
        score = m.get("score", {})
        full  = score.get("fullTime", {})
        half  = score.get("halfTime", {})
        rows.append({
            "competition":     competition,
            "season":          season,
            "match_id":        m.get("id"),
            "utc_date":        m.get("utcDate"),
            "stage":           m.get("stage"),
            "group":           m.get("group"),
            "status":          m.get("status"),
            "matchday":        m.get("matchday"),
            "home_team":       home.get("name"),
            "home_team_id":    home.get("id"),
            "away_team":       away.get("name"),
            "away_team_id":    away.get("id"),
            "home_score":      full.get("home"),
            "away_score":      full.get("away"),
            "home_score_ht":   half.get("home"),
            "away_score_ht":   half.get("away"),
            "winner":          score.get("winner"),       # HOME_TEAM / AWAY_TEAM / DRAW
            "duration":        score.get("duration"),     # REGULAR / EXTRA_TIME / PENALTY_SHOOTOUT
            "referee":         m.get("referees", [{}])[0].get("name") if m.get("referees") else None,
        })
    return pd.DataFrame(rows)


def cmd_fd():
    print("\n══ football-data.org ══════════════════════════════════════════")

    for name, code in FD_COMPETITIONS.items():
        if code is None:
            print(f"\n  [skip] {name} — 无免费赛事代码，由 API-Football 覆盖")
            continue

        seasons = FD_SEASONS.get(name, [])
        all_frames = []

        for season in seasons:
            print(f"\n  {name} {season} ...")
            data = fd_get(f"/competitions/{code}/matches", {"season": season})
            time.sleep(FD_DELAY)

            if not data or "matches" not in data:
                print(f"    [warn] 无数据")
                continue

            matches = data["matches"]
            print(f"    {len(matches)} 场")
            df = parse_fd_matches(matches, name, season)
            all_frames.append(df)

            # 同时拉积分榜（有小组赛阶段时）
            standings_data = fd_get(f"/competitions/{code}/standings", {"season": season})
            time.sleep(FD_DELAY)
            if standings_data and "standings" in standings_data:
                s_rows = []
                for group in standings_data["standings"]:
                    for entry in group.get("table", []):
                        team = entry.get("team", {})
                        s_rows.append({
                            "competition": name,
                            "season":      season,
                            "stage":       group.get("stage"),
                            "group":       group.get("group"),
                            "position":    entry.get("position"),
                            "team":        team.get("name"),
                            "team_id":     team.get("id"),
                            "played":      entry.get("playedGames"),
                            "won":         entry.get("won"),
                            "draw":        entry.get("draw"),
                            "lost":        entry.get("lost"),
                            "goals_for":   entry.get("goalsFor"),
                            "goals_against": entry.get("goalsAgainst"),
                            "goal_diff":   entry.get("goalDifference"),
                            "points":      entry.get("points"),
                        })
                save(pd.DataFrame(s_rows), f"standings_{name}_{season}")

        if all_frames:
            save(pd.concat(all_frames, ignore_index=True), f"matches_{name}_fd")

    print("\n  ✅ football-data.org 完成")


# ══════════════════════════════════════════════════════════════════════════════
# 2. API-Football (RapidAPI)
#    文档：https://www.api-football.com/documentation-v3
#    免费：100 req/day，足够覆盖历史数据（缓存后只需拉一次）
# ══════════════════════════════════════════════════════════════════════════════

AF_BASE    = "https://v3.football.api-sports.io"
AF_HEADERS = {
    "x-rapidapi-key":  API_FOOTBALL_KEY,
    "x-rapidapi-host": "v3.football.api-sports.io",
}
AF_DELAY = 1.5


def af_get(path: str, params: dict = None) -> dict | None:
    url = f"{AF_BASE}/{path}"
    for attempt in range(3):
        try:
            resp = requests.get(url, headers=AF_HEADERS, params=params, timeout=15)
            remaining = resp.headers.get("x-ratelimit-requests-remaining", "?")

            if resp.status_code == 200:
                data = resp.json()
                errors = data.get("errors", {})
                if errors:
                    print(f"  [warn] API 错误: {errors}")
                    return None
                if int(remaining) < 5:
                    print(f"  [warn] 今日剩余请求: {remaining}，暂停")
                    return None
                return data
            if resp.status_code == 429:
                print(f"  [限速] 等待 60s ...")
                time.sleep(60)
            else:
                print(f"  [warn] HTTP {resp.status_code}: {path}")
                return None
        except Exception as e:
            print(f"  [warn] 请求失败({attempt+1}/3): {e}")
            time.sleep(5)
    return None


def parse_af_fixtures(fixtures: list, competition: str, season: int) -> pd.DataFrame:
    rows = []
    for f in fixtures:
        fix   = f.get("fixture", {})
        teams = f.get("teams", {})
        goals = f.get("goals", {})
        score = f.get("score", {})
        league= f.get("league", {})
        rows.append({
            "competition":      competition,
            "season":           season,
            "match_id":         fix.get("id"),
            "utc_date":         fix.get("date"),
            "stage":            league.get("round"),
            "status":           fix.get("status", {}).get("short"),
            "venue":            fix.get("venue", {}).get("name"),
            "venue_city":       fix.get("venue", {}).get("city"),
            "home_team":        teams.get("home", {}).get("name"),
            "home_team_id":     teams.get("home", {}).get("id"),
            "away_team":        teams.get("away", {}).get("name"),
            "away_team_id":     teams.get("away", {}).get("id"),
            "home_score":       goals.get("home"),
            "away_score":       goals.get("away"),
            "home_score_ht":    score.get("halftime", {}).get("home"),
            "away_score_ht":    score.get("halftime", {}).get("away"),
            "home_score_et":    score.get("extratime", {}).get("home"),
            "away_score_et":    score.get("extratime", {}).get("away"),
            "home_score_pen":   score.get("penalty", {}).get("home"),
            "away_score_pen":   score.get("penalty", {}).get("away"),
            "referee":          fix.get("referee"),
        })
    return pd.DataFrame(rows)


def af_fetch_fixtures_paged(league_id: int, season: int) -> list:
    """API-Football 默认每页返回全部（最多1000条），但需处理分页。"""
    all_fixtures = []
    page = 1
    while True:
        data = af_get("fixtures", {"league": league_id, "season": season, "page": page})
        time.sleep(AF_DELAY)
        if not data:
            break
        fixtures = data.get("response", [])
        all_fixtures.extend(fixtures)
        paging = data.get("paging", {})
        if page >= paging.get("total", 1):
            break
        page += 1
    return all_fixtures


def cmd_af():
    print("\n══ API-Football ════════════════════════════════════════════════")

    # 先检查今日剩余请求数
    status = af_get("status")
    if status:
        sub = status.get("response", {}).get("subscription", {})
        remaining = status.get("response", {}).get("requests", {}).get("current", "?")
        limit      = status.get("response", {}).get("requests", {}).get("limit_day", "?")
        print(f"  API-Football 今日用量: {remaining}/{limit}")

    for comp_name, cfg in AF_COMPETITIONS.items():
        league_id = cfg["id"]
        seasons   = cfg["seasons"]
        all_frames = []

        for season in seasons:
            print(f"\n  {comp_name} {season} (league={league_id})...")
            fixtures = af_fetch_fixtures_paged(league_id, season)
            if not fixtures:
                print(f"    [warn] 无数据")
                continue
            print(f"    {len(fixtures)} 场")
            df = parse_af_fixtures(fixtures, comp_name, season)
            all_frames.append(df)

        if all_frames:
            save(pd.concat(all_frames, ignore_index=True), f"matches_{comp_name}_af")

    print("\n  ✅ API-Football 完成")


# ── 测试 API Key ──────────────────────────────────────────────────────────────

def cmd_test():
    print("\n── 测试 football-data.org ──────────────────────────────────────")
    data = fd_get("/competitions/WC")
    if data:
        print(f"  ✅ 有效！赛事：{data.get('name')}，当前赛季：{data.get('currentSeason', {}).get('startDate')}")
    else:
        print("  ❌ 无效，请检查 FOOTBALL_DATA_API_KEY")

    print("\n── 测试 API-Football ───────────────────────────────────────────")
    data = af_get("status")
    if data and data.get("response"):
        acc = data["response"].get("account", {})
        req = data["response"].get("requests", {})
        print(f"  ✅ 有效！账户：{acc.get('email')}，今日剩余：{req.get('limit_day', 0) - req.get('current', 0)}")
    else:
        print("  ❌ 无效，请检查 API_FOOTBALL_KEY")


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="比赛数据拉取（官方 API）")
    parser.add_argument("--test", action="store_true", help="验证 API Key")
    parser.add_argument("--fd",   action="store_true", help="football-data.org")
    parser.add_argument("--af",   action="store_true", help="API-Football")
    parser.add_argument("--all",  action="store_true", help="全部")
    args = parser.parse_args()

    if args.test:          cmd_test()
    if args.fd  or args.all: cmd_fd()
    if args.af  or args.all: cmd_af()
    if not any(vars(args).values()):
        parser.print_help()

    print("\n✅ 数据存放于 data/raw/")


if __name__ == "__main__":
    main()