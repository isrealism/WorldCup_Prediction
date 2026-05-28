"""
routers/simulate.py — 蒙特卡洛模拟接口 + WebSocket 进度推送
"""

import sys, json, asyncio
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel, Field
import pandas as pd
import numpy as np

from simulate import PoissonEngine, MonteCarloSimulator
from backend.cache import cache

router = APIRouter(prefix="/simulate", tags=["模拟"])

_engine: PoissonEngine | None = None

def get_engine() -> PoissonEngine:
    global _engine
    if _engine is None:
        _engine = PoissonEngine()
    return _engine


# ── 请求 / 响应模型 ───────────────────────────────────────────────────────────

class TournamentRequest(BaseModel):
    n:      int  = Field(50_000, ge=1_000, le=200_000, description="模拟次数")
    groups: dict = Field(default=None, description="自定义分组，不传则用默认")

class TeamSimResult(BaseModel):
    team:         str
    advance_pct:  float
    r32_pct:      float | None = None
    r16_pct:      float | None = None
    qf_pct:       float | None = None
    sf_pct:       float | None = None
    final_pct:    float | None = None
    winner_pct:   float

class TournamentResult(BaseModel):
    n:       int
    teams:   list[TeamSimResult]
    cached:  bool = False

class WhatIfRequest(BaseModel):
    team:      str = Field(..., description="要替换的队")
    overrides: dict = Field(..., description="替换的特征值")
    opponent:  str | None = Field(None, description="单场对手（不传则跑全程）")
    n:         int = Field(20_000, ge=1_000, le=100_000)

class GroupRequest(BaseModel):
    teams: list[str] = Field(..., min_length=3, max_length=4)
    n:     int = Field(30_000, ge=1_000, le=100_000)

class GroupResult(BaseModel):
    team:         str
    advance_pct:  float
    win_pct:      float
    pts_avg:      float
    gd_avg:       float


# ── 赛程模拟（同步，带缓存）─────────────────────────────────────────────────

@router.post("/tournament", response_model=TournamentResult)
def simulate_tournament(req: TournamentRequest):
    """整届世界杯蒙特卡洛模拟。"""
    cache_key = cache.make_key("tournament", req.n, str(req.groups))
    cached = cache.get(cache_key)
    if cached:
        cached["cached"] = True
        return cached

    engine = get_engine()
    sim    = MonteCarloSimulator(engine, groups=req.groups)
    df     = sim.run(n=req.n)

    def _pct(row, col):
        return round(float(row.get(col, 0)), 4) if col in df.columns else None

    teams = []
    for _, row in df.iterrows():
        teams.append(TeamSimResult(
            team        = row["team"],
            advance_pct = round(float(row.get("advance_pct", 0)), 4),
            r32_pct     = _pct(row, "r32"),
            r16_pct     = _pct(row, "r16"),
            qf_pct      = _pct(row, "qf"),
            sf_pct      = _pct(row, "sf"),
            final_pct   = _pct(row, "final"),
            winner_pct  = round(float(row.get("winner", 0)), 4),
        ))

    result = {"n": req.n, "teams": teams, "cached": False}
    cache.set(cache_key, result, ttl=86_400)   # 缓存 24 小时
    return result


# ── WebSocket：实时进度推送 ──────────────────────────────────────────────────

@router.websocket("/ws/tournament")
async def ws_tournament(ws: WebSocket):
    """
    WebSocket 版蒙特卡洛，实时推送进度。
    
    客户端发送：{"n": 50000, "groups": {...}}
    服务端推送：{"type": "progress", "pct": 45.2}
                {"type": "done", "data": {...}}
                {"type": "error", "msg": "..."}
    """
    await ws.accept()
    try:
        raw = await ws.receive_text()
        req = json.loads(raw)
        n      = min(int(req.get("n", 50_000)), 200_000)
        groups = req.get("groups", None)

        engine = get_engine()
        sim    = MonteCarloSimulator(engine, groups=groups)

        # 分批运行，每批推送进度
        batch      = max(1_000, n // 20)
        results_df = await _run_sim_batched(ws, sim, n, batch)

        def _pct(row, col):
            return round(float(row.get(col, 0)), 4) if col in results_df.columns else None

        teams = []
        for _, row in results_df.iterrows():
            teams.append({
                "team":        row["team"],
                "advance_pct": round(float(row.get("advance_pct", 0)), 4),
                "r16_pct":     _pct(row, "r16"),
                "qf_pct":      _pct(row, "qf"),
                "sf_pct":      _pct(row, "sf"),
                "final_pct":   _pct(row, "final"),
                "winner_pct":  round(float(row.get("winner", 0)), 4),
            })

        await ws.send_json({"type": "done", "data": {"n": n, "teams": teams}})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        await ws.send_json({"type": "error", "msg": str(e)})
    finally:
        try:
            await ws.close()
        except Exception:
            pass


async def _run_sim_batched(ws: WebSocket, sim: MonteCarloSimulator,
                           n: int, batch: int) -> pd.DataFrame:
    """分批运行模拟，每批后推送进度并 yield 控制权给事件循环。"""
    from collections import defaultdict
    counts = defaultdict(lambda: defaultdict(int))
    done   = 0

    while done < n:
        this_batch = min(batch, n - done)
        # 在线程池运行 CPU 密集任务，不阻塞事件循环
        loop = asyncio.get_event_loop()
        batch_counts = await loop.run_in_executor(
            None, _run_batch, sim, this_batch
        )
        for team, stage_counts in batch_counts.items():
            for stage, cnt in stage_counts.items():
                counts[team][stage] += cnt
        done += this_batch
        pct = round(done / n * 100, 1)
        await ws.send_json({"type": "progress", "pct": pct, "done": done, "total": n})

    # 整理成 DataFrame
    return _counts_to_df(counts, n, sim.groups)


def _run_batch(sim: MonteCarloSimulator, n: int) -> dict:
    from collections import defaultdict
    counts = defaultdict(lambda: defaultdict(int))
    for _ in range(n):
        result = sim.simulate_once()
        for team, stage in result.items():
            counts[team][stage] += 1
    return dict(counts)


def _counts_to_df(counts: dict, n: int, groups: dict) -> pd.DataFrame:
    stage_order = ["group_stage", "r32", "r16", "qf", "sf", "final", "winner"]
    all_teams = set()
    for g_teams in groups.values():
        all_teams.update(g_teams)

    rows = []
    for team in sorted(all_teams):
        row = {"team": team}
        tc = counts.get(team, {})
        for stage in stage_order:
            row[stage] = tc.get(stage, 0) / n
        row["advance_pct"] = 1 - row["group_stage"]
        rows.append(row)
    return pd.DataFrame(rows).sort_values("winner", ascending=False)


# ── 小组赛模拟 ────────────────────────────────────────────────────────────────

@router.post("/group", response_model=list[GroupResult])
def simulate_group(req: GroupRequest):
    """模拟单个小组的出线概率。"""
    cache_key = cache.make_key("group", sorted(req.teams), req.n)
    cached = cache.get(cache_key)
    if cached:
        return cached

    engine = get_engine()
    sim    = MonteCarloSimulator(engine, groups={"X": req.teams})

    from collections import defaultdict
    advance_counts = defaultdict(int)
    win_counts     = defaultdict(int)
    pts_sums       = defaultdict(float)
    gd_sums        = defaultdict(float)

    for _ in range(req.n):
        table = sim._simulate_group(req.teams)
        for idx, row in table.iterrows():
            team = row["team"]
            pts_sums[team] += row["pts"]
            gd_sums[team]  += row["gd"]
            if idx < 2:
                advance_counts[team] += 1
            if idx == 0:
                win_counts[team] += 1

    results = []
    for team in req.teams:
        results.append(GroupResult(
            team        = team,
            advance_pct = round(advance_counts[team] / req.n, 4),
            win_pct     = round(win_counts[team] / req.n, 4),
            pts_avg     = round(pts_sums[team] / req.n, 2),
            gd_avg      = round(gd_sums[team] / req.n, 2),
        ))

    results.sort(key=lambda x: -x.advance_pct)
    cache.set(cache_key, results, ttl=3600)
    return results


# ── 反事实模拟 ────────────────────────────────────────────────────────────────

@router.post("/whatif")
def simulate_whatif(req: WhatIfRequest):
    """历史阵容替换后的预测对比。"""
    engine = get_engine()

    if req.opponent:
        # 单场对比：当前 vs 历史阵容
        current = engine.match_probs(req.team, req.opponent)
        historical = engine.match_probs(req.team, req.opponent,
                                         overrides=req.overrides)
        return {
            "mode": "single_match",
            "home": req.team,
            "away": req.opponent,
            "current": {
                "lambda_home":   round(current["lambda_home"], 3),
                "lambda_away":   round(current["lambda_away"], 3),
                "home_win_prob": round(current["home_win"], 4),
                "draw_prob":     round(current["draw"], 4),
                "away_win_prob": round(current["away_win"], 4),
            },
            "historical": {
                "lambda_home":   round(historical["lambda_home"], 3),
                "lambda_away":   round(historical["lambda_away"], 3),
                "home_win_prob": round(historical["home_win"], 4),
                "draw_prob":     round(historical["draw"], 4),
                "away_win_prob": round(historical["away_win"], 4),
            },
            "overrides_applied": req.overrides,
        }
    else:
        # 全程模拟对比（耗时，建议用 WebSocket 版本）
        sim = MonteCarloSimulator(engine)

        # 当前阵容
        df_current = sim.run(n=req.n)

        # 历史阵容（覆盖特征）
        sim_hist = MonteCarloSimulator(engine)
        sim_hist._team_overrides = {req.team: req.overrides}
        df_hist = sim_hist.run(n=req.n)

        def _extract(df, team):
            row = df[df["team"] == team]
            if row.empty:
                return {}
            r = row.iloc[0]
            return {
                "advance_pct": round(float(r.get("advance_pct", 0)), 4),
                "winner_pct":  round(float(r.get("winner", 0)), 4),
                "sf_pct":      round(float(r.get("sf", 0)), 4),
            }

        return {
            "mode":      "tournament",
            "team":      req.team,
            "current":   _extract(df_current, req.team),
            "historical":_extract(df_hist,    req.team),
        }