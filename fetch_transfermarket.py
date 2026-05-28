"""
fetch_transfermarkt.py
----------------------
从 Transfermarkt 爬取：
  1. 国家队球员市值 & 阵容
  2. 球员伤病 / 停赛状态
  3. 教练执教历史

用法:
    pip install requests beautifulsoup4 pandas pyarrow
    python fetch_transfermarkt.py --squads      # 各国家队阵容+市值
    python fetch_transfermarkt.py --injuries    # 伤病/停赛
    python fetch_transfermarkt.py --coaches     # 教练历史
    python fetch_transfermarkt.py --all
"""

import argparse
import time
from pathlib import Path

import requests
import pandas as pd
from bs4 import BeautifulSoup

from config import TM_NATIONAL_TEAMS, DATA_DIR

OUT = Path(DATA_DIR)
OUT.mkdir(parents=True, exist_ok=True)

BASE = "https://www.transfermarkt.com"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml",
}
DELAY = 3.0   # 礼貌延迟（秒），Transfermarkt 对爬虫敏感


def save(df: pd.DataFrame, name: str):
    if df is None or df.empty:
        print(f"  [skip] {name} — 空")
        return
    path = OUT / f"tm_{name}.parquet"
    df.to_parquet(path, index=False)
    print(f"  [ok]   tm_{name}.parquet  ({len(df):,} 行)")


def get(url: str) -> BeautifulSoup | None:
    """带重试的 GET 请求，返回 BeautifulSoup。"""
    for attempt in range(3):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=20)
            if resp.status_code == 200:
                return BeautifulSoup(resp.text, "html.parser")
            if resp.status_code == 429:
                wait = 30 * (attempt + 1)
                print(f"    [限速] 等待 {wait}s...")
                time.sleep(wait)
            else:
                print(f"    [warn] HTTP {resp.status_code}: {url}")
                return None
        except Exception as e:
            print(f"    [warn] 请求失败 ({attempt+1}/3): {e}")
            time.sleep(5)
    return None


# ══════════════════════════════════════════════════════════════════════════════
# 1. 国家队阵容 + 球员市值
# ══════════════════════════════════════════════════════════════════════════════
def parse_market_value(text: str) -> float | None:
    """将 '€45.00m' / '€500k' 统一转为 float（欧元）。"""
    if not text or text.strip() in ("-", ""):
        return None
    text = text.replace("€", "").replace(",", "").strip()
    if "m" in text:
        return float(text.replace("m", "")) * 1_000_000
    if "k" in text:
        return float(text.replace("k", "")) * 1_000
    try:
        return float(text)
    except ValueError:
        return None


def fetch_team_squad(team_name: str, slug: str, team_id: int) -> list[dict]:
    url  = f"{BASE}/{slug}/kader/verein/{team_id}/saison_id/2025/plus/1"
    soup = get(url)
    if not soup:
        return []

    rows = []
    table = soup.find("table", class_="items")
    if not table:
        return []

    for tr in table.find_all("tr", class_=["odd", "even"]):
        cols = tr.find_all("td")
        if len(cols) < 5:
            continue

        # 球员名 & ID
        name_tag = tr.find("a", class_="spielprofil_tooltip")
        if not name_tag:
            continue
        player_name = name_tag.get_text(strip=True)
        href = name_tag.get("href", "")
        player_id = href.split("/")[-1] if href else None

        # 位置
        pos_tag = tr.find("td", class_="posrela")
        position = pos_tag.get_text(strip=True) if pos_tag else None

        # 年龄
        age_tag = cols[3] if len(cols) > 3 else None
        age = age_tag.get_text(strip=True) if age_tag else None

        # 国籍
        nat_img = tr.find("img", class_="flaggenrahmen")
        nationality = nat_img["title"] if nat_img and nat_img.get("title") else None

        # 市值
        mv_tag = tr.find("td", class_="rechts hauptlink")
        market_value = parse_market_value(mv_tag.get_text(strip=True) if mv_tag else "")

        rows.append({
            "national_team":  team_name,
            "player_name":    player_name,
            "player_tm_id":   player_id,
            "position":       position,
            "age":            age,
            "nationality":    nationality,
            "market_value":   market_value,
            "currency":       "EUR",
        })
    return rows


def cmd_squads():
    print("\n── 国家队阵容 & 市值（Transfermarkt）──────────────────────────")
    all_rows = []
    for team_name, cfg in TM_NATIONAL_TEAMS.items():
        print(f"  {team_name}...")
        rows = fetch_team_squad(team_name, cfg["slug"], cfg["id"])
        all_rows.extend(rows)
        print(f"    {len(rows)} 名球员")
        time.sleep(DELAY)

    df = pd.DataFrame(all_rows)
    save(df, "national_team_squads")
    if not df.empty:
        summary = df.groupby("national_team")["market_value"].sum() / 1e6
        print("\n  球队总市值（百万欧元）：")
        print(summary.sort_values(ascending=False).round(1).to_string())


# ══════════════════════════════════════════════════════════════════════════════
# 2. 伤病 / 停赛状态
# ══════════════════════════════════════════════════════════════════════════════
def fetch_injuries(team_name: str, slug: str, team_id: int) -> list[dict]:
    url  = f"{BASE}/{slug}/sperren-und-verletzungen/verein/{team_id}"
    soup = get(url)
    if not soup:
        return []

    rows = []
    table = soup.find("table", class_="items")
    if not table:
        return []

    for tr in table.find_all("tr", class_=["odd", "even"]):
        cols = tr.find_all("td")
        if len(cols) < 4:
            continue

        name_tag = tr.find("a", class_="spielprofil_tooltip")
        player_name = name_tag.get_text(strip=True) if name_tag else None

        reason     = cols[2].get_text(strip=True) if len(cols) > 2 else None
        since      = cols[3].get_text(strip=True) if len(cols) > 3 else None
        until      = cols[4].get_text(strip=True) if len(cols) > 4 else None

        rows.append({
            "national_team": team_name,
            "player_name":   player_name,
            "reason":        reason,
            "since":         since,
            "until":         until,
        })
    return rows


def cmd_injuries():
    print("\n── 伤病 / 停赛（Transfermarkt）─────────────────────────────────")
    all_rows = []
    for team_name, cfg in TM_NATIONAL_TEAMS.items():
        print(f"  {team_name}...")
        rows = fetch_injuries(team_name, cfg["slug"], cfg["id"])
        all_rows.extend(rows)
        if rows:
            print(f"    {len(rows)} 名球员受伤/停赛")
        time.sleep(DELAY)

    df = pd.DataFrame(all_rows)
    save(df, "injuries_suspensions")


# ══════════════════════════════════════════════════════════════════════════════
# 3. 教练执教历史
# ══════════════════════════════════════════════════════════════════════════════
def fetch_coach_history(team_name: str, slug: str, team_id: int) -> list[dict]:
    """拉取该国家队的历任教练列表。"""
    url  = f"{BASE}/{slug}/trainer-statistik/verein/{team_id}"
    soup = get(url)
    if not soup:
        return []

    rows = []
    table = soup.find("table", class_="items")
    if not table:
        return []

    for tr in table.find_all("tr", class_=["odd", "even"]):
        cols = tr.find_all("td")
        if len(cols) < 5:
            continue

        coach_tag  = tr.find("a", class_="spielprofil_tooltip")
        coach_name = coach_tag.get_text(strip=True) if coach_tag else None
        coach_href = coach_tag.get("href", "") if coach_tag else ""
        coach_tm_id = coach_href.split("/")[-1] if coach_href else None

        # 任期
        dates      = cols[2].get_text(strip=True) if len(cols) > 2 else None
        games      = cols[3].get_text(strip=True) if len(cols) > 3 else None
        win_pct    = cols[4].get_text(strip=True) if len(cols) > 4 else None
        ppg        = cols[5].get_text(strip=True) if len(cols) > 5 else None

        rows.append({
            "national_team":  team_name,
            "coach_name":     coach_name,
            "coach_tm_id":    coach_tm_id,
            "tenure":         dates,
            "games":          games,
            "win_pct":        win_pct,
            "points_per_game":ppg,
        })
    return rows


def cmd_coaches():
    print("\n── 教练执教历史（Transfermarkt）────────────────────────────────")
    all_rows = []
    for team_name, cfg in TM_NATIONAL_TEAMS.items():
        print(f"  {team_name}...")
        rows = fetch_coach_history(team_name, cfg["slug"], cfg["id"])
        all_rows.extend(rows)
        print(f"    {len(rows)} 条记录")
        time.sleep(DELAY)

    df = pd.DataFrame(all_rows)
    save(df, "coach_history")


# ══════════════════════════════════════════════════════════════════════════════
# CLI
# ══════════════════════════════════════════════════════════════════════════════
def main():
    parser = argparse.ArgumentParser(description="Transfermarkt 数据爬取")
    parser.add_argument("--squads",   action="store_true", help="国家队阵容+市值")
    parser.add_argument("--injuries", action="store_true", help="伤病/停赛状态")
    parser.add_argument("--coaches",  action="store_true", help="教练执教历史")
    parser.add_argument("--all",      action="store_true", help="全部")
    args = parser.parse_args()

    if args.squads   or args.all: cmd_squads()
    if args.injuries or args.all: cmd_injuries()
    if args.coaches  or args.all: cmd_coaches()

    if not any(vars(args).values()):
        parser.print_help()

    print("\n✅ Transfermarkt 数据完成，存放于 data/raw/tm_*.parquet")


if __name__ == "__main__":
    main()