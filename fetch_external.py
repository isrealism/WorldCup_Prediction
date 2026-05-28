"""
fetch_external.py
-----------------
拉取三类外部数据：
  1. 天气预报  — Open-Meteo API（免费，无需注册）
  2. 赔    率  — The Odds API（免费 500次/月，需注册）
  3. FIFA 排名 — FIFA 官网爬虫

用法:
    pip install requests pandas pyarrow beautifulsoup4
    python fetch_external.py --weather    # 拉 16 个场馆天气
    python fetch_external.py --odds       # 拉赔率（需填 ODDS_API_KEY）
    python fetch_external.py --rankings   # 拉 FIFA 排名历史
    python fetch_external.py --all        # 全部
"""

import argparse
import time
from datetime import datetime, timedelta
from pathlib import Path

import requests
import pandas as pd
from bs4 import BeautifulSoup

from config import VENUES_2026, ODDS_API_KEY, DATA_DIR

OUT = Path(DATA_DIR)
OUT.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}


def save(df: pd.DataFrame, name: str):
    if df is None or df.empty:
        print(f"  [skip] {name} — 空")
        return
    path = OUT / f"{name}.parquet"
    df.to_parquet(path, index=False)
    print(f"  [ok]   {name}.parquet  ({len(df):,} 行)")


# ══════════════════════════════════════════════════════════════════════════════
# 1. 天气预报 — Open-Meteo（完全免费，无需 API Key）
# ══════════════════════════════════════════════════════════════════════════════
def fetch_weather():
    """
    对 VENUES_2026 中每个场馆拉取：
      - 未来 60 天每小时天气（温度、湿度、降水、风速）
      - 以及比赛期间（2026-06 ~ 2026-07）的历史气候均值

    Open-Meteo API 文档：https://open-meteo.com/en/docs
    """
    print("\n── 天气预报（Open-Meteo）──────────────────────────────────────")

    base_url = "https://api.open-meteo.com/v1/forecast"
    # 世界杯大致时间段
    start_date = "2026-06-11"
    end_date   = "2026-07-19"

    all_rows = []
    for v in VENUES_2026:
        print(f"  拉取 {v['city']} ({v['stadium']})...")
        params = {
            "latitude":   v["lat"],
            "longitude":  v["lon"],
            "hourly":     "temperature_2m,relativehumidity_2m,precipitation,windspeed_10m,weathercode",
            "daily":      "temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max",
            "timezone":   "auto",
            "start_date": start_date,
            "end_date":   end_date,
        }
        try:
            resp = requests.get(base_url, params=params, timeout=15)
            resp.raise_for_status()
            data = resp.json()

            # 解析 daily 数据（更适合比赛预测）
            daily = data.get("daily", {})
            if daily:
                n = len(daily["time"])
                for i in range(n):
                    all_rows.append({
                        "city":           v["city"],
                        "stadium":        v["stadium"],
                        "altitude_m":     v["altitude_m"],
                        "lat":            v["lat"],
                        "lon":            v["lon"],
                        "date":           daily["time"][i],
                        "temp_max":       daily["temperature_2m_max"][i],
                        "temp_min":       daily["temperature_2m_min"][i],
                        "precipitation":  daily["precipitation_sum"][i],
                        "windspeed_max":  daily["windspeed_10m_max"][i],
                    })
            time.sleep(0.5)   # 礼貌性限速

        except Exception as e:
            print(f"    [warn] {v['city']} 失败: {e}")

    df = pd.DataFrame(all_rows)
    save(df, "weather_venues_2026")
    print(f"\n  场馆数: {df['city'].nunique()}，日期范围: {df['date'].min()} ~ {df['date'].max()}")


# ══════════════════════════════════════════════════════════════════════════════
# 2. 赔率 — The Odds API
# ══════════════════════════════════════════════════════════════════════════════
def fetch_odds():
    """
    从 The Odds API 拉取足球国际赛事赔率。
    - 免费套餐：500 次请求/月
    - 支持 1X2 / 亚盘 / 大小球
    - 历史赔率需付费；此脚本拉当前+即将比赛的赔率

    注册后在 config.py 填入 ODDS_API_KEY。
    API 文档：https://the-odds-api.com/liveapi/guides/v4/
    """
    print("\n── 赔率（The Odds API）────────────────────────────────────────")

    if ODDS_API_KEY == "YOUR_ODDS_API_KEY":
        print("  [skip] 请先在 config.py 填写 ODDS_API_KEY")
        return

    base = "https://api.the-odds-api.com/v4"

    # 支持的赛事 key（国际足球类）
    sport_keys = [
        "soccer_international_friendlies",  # 友谊赛
        "soccer_fifa_world_cup",            # 世界杯（开赛后才出现）
        "soccer_uefa_european_championship",
        "soccer_copa_america",
    ]

    all_odds = []
    for sport in sport_keys:
        print(f"  拉取 {sport}...")
        try:
            # 1X2 赔率
            resp = requests.get(
                f"{base}/sports/{sport}/odds/",
                params={
                    "apiKey":  ODDS_API_KEY,
                    "regions": "eu,uk,us",
                    "markets": "h2h,totals",   # h2h=1X2, totals=大小球
                    "oddsFormat": "decimal",
                },
                timeout=15,
            )
            remaining = resp.headers.get("x-requests-remaining", "?")
            print(f"    剩余请求次数: {remaining}")

            if resp.status_code == 200:
                for game in resp.json():
                    for bookmaker in game.get("bookmakers", []):
                        for market in bookmaker.get("markets", []):
                            for outcome in market.get("outcomes", []):
                                all_odds.append({
                                    "sport":       sport,
                                    "game_id":     game["id"],
                                    "home_team":   game["home_team"],
                                    "away_team":   game["away_team"],
                                    "commence":    game["commence_time"],
                                    "bookmaker":   bookmaker["key"],
                                    "market":      market["key"],
                                    "outcome":     outcome["name"],
                                    "price":       outcome["price"],
                                    "fetched_at":  datetime.utcnow().isoformat(),
                                })
            else:
                print(f"    [warn] HTTP {resp.status_code}: {resp.text[:200]}")

        except Exception as e:
            print(f"    [warn] {sport} 失败: {e}")
        time.sleep(1)

    df = pd.DataFrame(all_odds)
    save(df, "odds_current")

    # 计算隐含概率（1/decimal odds）并附加
    if not df.empty and "price" in df.columns:
        df["implied_prob"] = 1 / df["price"]
        # 归一化（消除庄家抽水后的概率）
        total = df.groupby(["game_id", "bookmaker", "market"])["implied_prob"].transform("sum")
        df["prob_normalized"] = df["implied_prob"] / total
        save(df, "odds_with_prob")


# ══════════════════════════════════════════════════════════════════════════════
# 3. FIFA 排名 — 爬取官网
# ══════════════════════════════════════════════════════════════════════════════
def fetch_fifa_rankings():
    """
    爬取 FIFA 世界排名（男子）历史快照。
    FIFA 官网提供 JSON 接口，无需 API Key。

    存储结构：
      ranking_date | rank | team | total_points | previous_rank | rank_change
    """
    print("\n── FIFA 排名（官网爬取）────────────────────────────────────────")

    # FIFA 排名 API（非公开但可直接请求）
    api_url = "https://inside.fifa.com/fifa-world-ranking/men"
    json_api = "https://inside.fifa.com/api/v1/picture/flags-associations-{code}"

    # FIFA 提供按日期的排名 JSON
    ranking_dates_url = "https://inside.fifa.com/fifa-world-ranking/rankingtable/men"

    all_rows = []

    # 方法：直接请求 FIFA 排名页面的 JSON endpoint
    # 已知可用的端点格式（2024 年确认有效）
    endpoint = "https://inside.fifa.com/api/client/v2/ranking/snapshot"

    try:
        # 先获取可用的排名日期列表
        dates_resp = requests.get(
            "https://inside.fifa.com/api/client/v2/ranking/config",
            headers=HEADERS,
            timeout=15,
        )
        if dates_resp.status_code == 200:
            config_data = dates_resp.json()
            available_dates = config_data.get("dates", [])
            print(f"  找到 {len(available_dates)} 个历史排名日期")
        else:
            # fallback：手动构造近年重要排名日期（世界杯前公布日期）
            available_dates = [
                "2018-06-07",  # 2018 世界杯前
                "2022-03-31",  # 2022 世界杯资格赛结束
                "2022-10-06",  # 2022 世界杯前最后一次
                "2023-04-06", "2023-07-20", "2023-10-19",
                "2024-04-04", "2024-07-18", "2024-10-24",
                "2025-04-03", "2025-07-17", "2025-10-23",
            ]
            print(f"  使用预设日期列表（{len(available_dates)} 个）")

        for date_str in available_dates:
            try:
                resp = requests.get(
                    endpoint,
                    params={"rankingDate": date_str, "count": 220},
                    headers=HEADERS,
                    timeout=15,
                )
                if resp.status_code != 200:
                    print(f"    [warn] {date_str}: HTTP {resp.status_code}")
                    continue

                data = resp.json()
                rankings = data.get("items", data.get("rankings", []))
                for item in rankings:
                    all_rows.append({
                        "ranking_date":  date_str,
                        "rank":          item.get("rankId") or item.get("rank"),
                        "previous_rank": item.get("previousRankId") or item.get("previousRank"),
                        "team":          item.get("name") or item.get("teamName"),
                        "team_code":     item.get("countryCode") or item.get("code"),
                        "total_points":  item.get("totalPoints") or item.get("points"),
                        "confederation": item.get("confederationCode"),
                    })
                print(f"  {date_str}: {len(rankings)} 支队")
                time.sleep(0.8)

            except Exception as e:
                print(f"    [warn] {date_str} 解析失败: {e}")

    except Exception as e:
        print(f"  [error] FIFA 排名获取失败: {e}")
        print("  提示：可手动下载 https://www.fifa.com/fifa-world-ranking/men → 保存为 CSV")

    df = pd.DataFrame(all_rows)
    if not df.empty:
        # 计算排名变动
        df["rank_change"] = df["previous_rank"] - df["rank"]
        save(df, "fifa_rankings_history")
        print(f"\n  覆盖 {df['ranking_date'].nunique()} 个日期，"
              f"{df['team'].nunique()} 支队")


# ══════════════════════════════════════════════════════════════════════════════
# CLI
# ══════════════════════════════════════════════════════════════════════════════
def main():
    parser = argparse.ArgumentParser(description="外部数据拉取：天气 / 赔率 / FIFA排名")
    parser.add_argument("--weather",   action="store_true")
    parser.add_argument("--odds",      action="store_true")
    parser.add_argument("--rankings",  action="store_true")
    parser.add_argument("--all",       action="store_true")
    args = parser.parse_args()

    if args.weather  or args.all: fetch_weather()
    if args.odds     or args.all: fetch_odds()
    if args.rankings or args.all: fetch_fifa_rankings()

    if not any(vars(args).values()):
        parser.print_help()

    print("\n✅ 外部数据完成，存放于 data/raw/")


if __name__ == "__main__":
    main()