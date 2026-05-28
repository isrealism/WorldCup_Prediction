"""
routers/teams.py — 球队数据接口
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import pandas as pd
import numpy as np

from backend.cache import cache

router = APIRouter(prefix="/teams", tags=["球队"])

PROC = Path("data/processed")
RAW  = Path("data/raw")


def _load(pattern: str) -> pd.DataFrame:
    files = sorted(RAW.glob(pattern))
    if not files:
        return pd.DataFrame()
    return pd.concat([pd.read_parquet(f) for f in files], ignore_index=True)


# ── 响应模型 ──────────────────────────────────────────────────────────────────

class TeamSummary(BaseModel):
    name:          str
    country:       str | None = None
    fifa_rank:     int | None = None
    elo:           float | None = None
    squad_mv_eur:  float | None = None
    coach:         str | None = None
    form_last5:    str | None = None   # e.g. "WWDLW"
    win_rate_last10: float | None = None

class PlayerRow(BaseModel):
    name:         str
    position:     str | None = None
    club:         str | None = None
    market_value: float | None = None
    age:          int | None = None
    rating_avg:   float | None = None
    injured:      bool = False

class TeamDetail(BaseModel):
    summary:      TeamSummary
    players:      list[PlayerRow]
    recent_form:  list[dict]    # 近10场比赛
    wc_history:   list[dict]    # 历届世界杯成绩


# ── 所有球队列表 ──────────────────────────────────────────────────────────────

@router.get("", response_model=list[TeamSummary])
def list_teams():
    """返回所有参赛队的摘要列表（用于搜索下拉）。"""
    cached = cache.get("teams_list")
    if cached:
        return cached

    try:
        feat_df = pd.read_parquet(PROC / "features.parquet")
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="特征数据尚未构建，请先运行 features.py --build")

    teams = set(feat_df["home_team"].tolist() + feat_df["away_team"].tolist())
    rank_df  = _load("fifa_rankings_history.parquet")
    squad_df = _load("tm_national_team_squads.parquet")
    inj_df   = _load("injuries_af.parquet")

    results = []
    for team in sorted(teams):
        # FIFA 排名（最新）
        rank = None
        if not rank_df.empty:
            r = rank_df[rank_df["team"].str.contains(team, case=False, na=False)]
            if not r.empty:
                latest = r.sort_values("ranking_date").iloc[-1]
                rank = int(latest["rank"]) if not pd.isna(latest["rank"]) else None

        # 市值
        mv = None
        if not squad_df.empty:
            sq = squad_df[squad_df["team_name"].str.contains(team, case=False, na=False)]
            if not sq.empty and "market_value" in sq.columns:
                mv = float(sq["market_value"].sum(skipna=True))

        # 近期状态
        h_rows = feat_df[feat_df["home_team"].str.contains(team, case=False, na=False)]
        form_cols = "home_form5_win_rate"
        win_rate = None
        if not h_rows.empty and form_cols in h_rows.columns:
            win_rate = round(float(h_rows.iloc[-1][form_cols]), 3)

        # Elo
        elo = None
        if not h_rows.empty and "home_elo" in h_rows.columns:
            elo = round(float(h_rows.iloc[-1]["home_elo"]), 1)

        results.append(TeamSummary(
            name=team, fifa_rank=rank, elo=elo,
            squad_mv_eur=mv, win_rate_last10=win_rate,
        ))

    cache.set("teams_list", results, ttl=3600)
    return results


# ── 球队详情 ──────────────────────────────────────────────────────────────────

@router.get("/{team_name}", response_model=TeamDetail)
def get_team(team_name: str):
    """单支球队完整数据。"""
    cache_key = cache.make_key("team_detail", team_name)
    cached = cache.get(cache_key)
    if cached:
        return cached

    try:
        feat_df = pd.read_parquet(PROC / "features.parquet")
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="特征数据尚未构建")

    # 摘要
    summary = _build_summary(team_name, feat_df)

    # 近10场比赛
    recent_form = _build_recent_form(team_name, feat_df)

    # 球员阵容
    players = _build_players(team_name)

    # 世界杯历史
    wc_history = _build_wc_history(team_name, feat_df)

    result = TeamDetail(
        summary=summary,
        players=players,
        recent_form=recent_form,
        wc_history=wc_history,
    )
    cache.set(cache_key, result, ttl=3600)
    return result


def _build_summary(team: str, feat_df: pd.DataFrame) -> TeamSummary:
    rank_df  = _load("fifa_rankings_history.parquet")
    squad_df = _load("tm_national_team_squads.parquet")
    info_df  = _load("team_info_fd.parquet")

    rank = coach = mv = elo = None

    if not rank_df.empty:
        r = rank_df[rank_df["team"].str.contains(team, case=False, na=False)]
        if not r.empty:
            rank = int(r.sort_values("ranking_date").iloc[-1]["rank"])

    if not squad_df.empty:
        sq = squad_df[squad_df["team_name"].str.contains(team, case=False, na=False)]
        if not sq.empty and "market_value" in sq.columns:
            mv = float(sq["market_value"].sum(skipna=True))

    if not info_df.empty:
        ti = info_df[info_df["team_name"].str.contains(team, case=False, na=False)]
        if not ti.empty and "coach_name" in ti.columns:
            coach = str(ti.iloc[-1]["coach_name"])

    h_rows = feat_df[feat_df["home_team"].str.contains(team, case=False, na=False)]
    if not h_rows.empty:
        last = h_rows.iloc[-1]
        elo  = round(float(last.get("home_elo", 1500)), 1)

    return TeamSummary(
        name=team, fifa_rank=rank, elo=elo,
        squad_mv_eur=mv, coach=coach,
    )


def _build_recent_form(team: str, feat_df: pd.DataFrame) -> list[dict]:
    all_matches = []
    for side, opp_col, gf_col, ga_col in [
        ("home", "away_team", "home_goals", "away_goals"),
        ("away", "home_team", "away_goals", "home_goals"),
    ]:
        rows = feat_df[feat_df[f"{side}_team"].str.contains(team, case=False, na=False)]
        for _, row in rows.tail(10).iterrows():
            gf = row.get(gf_col, 0); ga = row.get(ga_col, 0)
            result = "W" if gf > ga else ("D" if gf == ga else "L")
            all_matches.append({
                "date":        str(row["utc_date"])[:10],
                "competition": row.get("competition", ""),
                "opponent":    row.get(opp_col, ""),
                "score":       f"{int(gf)}-{int(ga)}",
                "result":      result,
                "side":        side,
            })

    all_matches.sort(key=lambda x: x["date"], reverse=True)
    return all_matches[:10]


def _build_players(team: str) -> list[PlayerRow]:
    squad_df  = _load("tm_national_team_squads.parquet")
    stats_df  = _load("player_stats_af.parquet")
    inj_df    = _load("injuries_af.parquet")

    if squad_df.empty:
        return []

    sq = squad_df[squad_df["team_name"].str.contains(team, case=False, na=False)]
    if sq.empty:
        return []

    injured_names = set()
    if not inj_df.empty:
        inj = inj_df[inj_df["national_team"].str.contains(team, case=False, na=False)]
        injured_names = set(inj["player_name"].dropna().str.lower())

    players = []
    for _, row in sq.iterrows():
        pname = str(row.get("player_name", ""))
        rating = None
        if not stats_df.empty:
            ps = stats_df[stats_df["player_name"].str.contains(pname, case=False, na=False)]
            if not ps.empty and "rating" in ps.columns:
                r = pd.to_numeric(ps["rating"], errors="coerce").dropna()
                rating = round(float(r.mean()), 2) if not r.empty else None

        mv = row.get("market_value")
        players.append(PlayerRow(
            name         = pname,
            position     = str(row.get("position", "")),
            market_value = float(mv) if mv and not pd.isna(mv) else None,
            age          = int(row["age"]) if "age" in row and not pd.isna(row["age"]) else None,
            rating_avg   = rating,
            injured      = pname.lower() in injured_names,
        ))

    players.sort(key=lambda p: p.market_value or 0, reverse=True)
    return players[:30]


def _build_wc_history(team: str, feat_df: pd.DataFrame) -> list[dict]:
    wc = feat_df[
        (feat_df["competition"] == "world_cup") &
        (feat_df["home_team"].str.contains(team, case=False, na=False) |
         feat_df["away_team"].str.contains(team, case=False, na=False))
    ]
    if wc.empty:
        return []

    by_season = []
    for season, grp in wc.groupby("season"):
        home = grp[grp["home_team"].str.contains(team, case=False, na=False)]
        away = grp[grp["away_team"].str.contains(team, case=False, na=False)]
        gf = int(home["home_goals"].sum() + away["away_goals"].sum())
        ga = int(home["away_goals"].sum() + away["home_goals"].sum())
        played = len(grp)
        wins   = int(
            (home["result"] == "W").sum() +
            (away["result"] == "L").sum()
        )
        # 最远轮次
        stages = grp["stage"].dropna().unique().tolist()
        by_season.append({
            "season":  int(season) if season else None,
            "played":  played,
            "wins":    wins,
            "gf":      gf,
            "ga":      ga,
            "stages":  stages,
        })

    return sorted(by_season, key=lambda x: x["season"] or 0, reverse=True)


# ── H2H 接口 ──────────────────────────────────────────────────────────────────

@router.get("/h2h/history")
def h2h_history(
    team1: str = Query(...),
    team2: str = Query(...),
    competition: str = Query(None, description="过滤赛事"),
    limit: int = Query(20, ge=1, le=100),
):
    """两队历史交锋完整记录。"""
    cache_key = cache.make_key("h2h", team1, team2, competition, limit)
    cached = cache.get(cache_key)
    if cached:
        return cached

    try:
        feat_df = pd.read_parquet(PROC / "features.parquet")
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="特征数据尚未构建")

    mask = (
        (feat_df["home_team"].str.contains(team1, case=False, na=False) &
         feat_df["away_team"].str.contains(team2, case=False, na=False)) |
        (feat_df["home_team"].str.contains(team2, case=False, na=False) &
         feat_df["away_team"].str.contains(team1, case=False, na=False))
    )
    df = feat_df[mask].sort_values("utc_date", ascending=False)
    if competition:
        df = df[df["competition"].str.contains(competition, case=False, na=False)]

    df = df.head(limit)

    matches = []
    for _, row in df.iterrows():
        home = row["home_team"]; away = row["away_team"]
        hg = int(row["home_goals"]); ag = int(row["away_goals"])
        t1_won = (
            (home.lower().find(team1.lower()) >= 0 and hg > ag) or
            (away.lower().find(team1.lower()) >= 0 and ag > hg)
        )
        matches.append({
            "date":        str(row["utc_date"])[:10],
            "competition": row.get("competition"),
            "stage":       row.get("stage"),
            "home_team":   home,
            "away_team":   away,
            "score":       f"{hg}-{ag}",
            "team1_won":   t1_won,
            "draw":        hg == ag,
        })

    # 总体统计
    total  = len(matches)
    t1_wins = sum(1 for m in matches if m["team1_won"])
    draws   = sum(1 for m in matches if m["draw"])

    result = {
        "team1": team1, "team2": team2,
        "total": total,
        "team1_wins": t1_wins,
        "draws":      draws,
        "team2_wins": total - t1_wins - draws,
        "team1_win_rate": round(t1_wins / total, 3) if total else 0,
        "matches": matches,
    }
    cache.set(cache_key, result, ttl=3600)
    return result