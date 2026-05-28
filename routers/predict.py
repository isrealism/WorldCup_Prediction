"""
routers/predict.py — 比赛预测相关接口
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import numpy as np

from simulate import PoissonEngine
from backend.cache import cache

router = APIRouter(prefix="/predict", tags=["预测"])

# 全局单例，避免每次请求重新加载模型
_engine: PoissonEngine | None = None

def get_engine() -> PoissonEngine:
    global _engine
    if _engine is None:
        _engine = PoissonEngine()
    return _engine


# ── 响应模型 ──────────────────────────────────────────────────────────────────

class ScoreProb(BaseModel):
    score: str
    prob: float

class MatchPrediction(BaseModel):
    home_team:     str
    away_team:     str
    lambda_home:   float
    lambda_away:   float
    home_win_prob: float
    draw_prob:     float
    away_win_prob: float
    top_scores:    list[ScoreProb]
    # 泊松模型推导的 W/D/L（可与分类模型对比）
    poisson_home_win: float
    poisson_draw:     float
    poisson_away_win: float

class KeyFeature(BaseModel):
    name:       str
    value:      float
    direction:  str   # "home" | "away" | "neutral"
    label:      str

class MatchDetail(BaseModel):
    prediction:   MatchPrediction
    key_features: list[KeyFeature]
    h2h_summary:  dict


# ── 接口 ──────────────────────────────────────────────────────────────────────

@router.get("", response_model=MatchPrediction)
def predict_match(
    home: str = Query(..., description="主队名称"),
    away: str = Query(..., description="客队名称"),
    stage: str = Query("GROUP_STAGE", description="比赛阶段"),
):
    """预测一场比赛的结果概率和比分分布。"""
    cache_key = cache.make_key("predict", home, away, stage)
    cached = cache.get(cache_key)
    if cached:
        return cached

    try:
        engine = get_engine()
        probs  = engine.match_probs(home, away)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"预测失败: {str(e)}")

    result = MatchPrediction(
        home_team     = home,
        away_team     = away,
        lambda_home   = round(probs["lambda_home"], 3),
        lambda_away   = round(probs["lambda_away"], 3),
        home_win_prob = round(probs["home_win"], 4),
        draw_prob     = round(probs["draw"], 4),
        away_win_prob = round(probs["away_win"], 4),
        top_scores    = [ScoreProb(score=s, prob=round(p, 4))
                         for s, p in probs["top_scores"]],
        poisson_home_win = round(probs["home_win"], 4),
        poisson_draw     = round(probs["draw"], 4),
        poisson_away_win = round(probs["away_win"], 4),
    )

    cache.set(cache_key, result, ttl=3600)
    return result


@router.get("/detail", response_model=MatchDetail)
def predict_match_detail(
    home:  str = Query(...),
    away:  str = Query(...),
    stage: str = Query("GROUP_STAGE"),
):
    """预测 + 关键特征解读 + H2H 摘要。"""
    prediction = predict_match(home, away, stage)

    # 关键特征（从特征矩阵中取最近该对阵的特征值）
    key_features = _build_key_features(home, away)

    # H2H 摘要
    h2h_summary = _build_h2h_summary(home, away)

    return MatchDetail(
        prediction=prediction,
        key_features=key_features,
        h2h_summary=h2h_summary,
    )


@router.get("/score-matrix")
def score_matrix(
    home: str = Query(...),
    away: str = Query(...),
    max_goals: int = Query(6, ge=3, le=10),
):
    """返回完整的比分概率矩阵（用于热力图）。"""
    cache_key = cache.make_key("matrix", home, away, max_goals)
    cached = cache.get(cache_key)
    if cached:
        return cached

    engine = get_engine()
    probs  = engine.match_probs(home, away, max_goals=max_goals)
    matrix = probs["score_matrix"].tolist()

    result = {
        "home_team":    home,
        "away_team":    away,
        "lambda_home":  round(probs["lambda_home"], 3),
        "lambda_away":  round(probs["lambda_away"], 3),
        "max_goals":    max_goals,
        "matrix":       matrix,        # [home_goals][away_goals]
        "axis_labels":  list(range(max_goals + 1)),
    }
    cache.set(cache_key, result, ttl=3600)
    return result


# ── 内部工具 ──────────────────────────────────────────────────────────────────

def _build_key_features(home: str, away: str) -> list[KeyFeature]:
    """从特征矩阵找该对阵的 Top 特征，简单展示。"""
    try:
        import pandas as pd
        from pathlib import Path
        df = pd.read_parquet(Path("data/processed/features.parquet"))

        h_rows = df[df["home_team"].str.contains(home, case=False, na=False)].tail(5)
        a_rows = df[df["away_team"].str.contains(away, case=False, na=False)].tail(5)

        if h_rows.empty or a_rows.empty:
            return []

        features = []
        checks = [
            ("elo_diff",       "Elo 评分差",      100,  "home"),
            ("rank_diff",      "FIFA 排名差",      -10,  "home"),
            ("home_form5_win_rate", "主队近5场胜率", 0.6, "home"),
            ("away_form5_win_rate", "客队近5场胜率", 0.6, "away"),
            ("mv_ratio_log",   "市值比（对数）",    0,   "neutral"),
            ("h2h_win_rate",   "历史交锋胜率",     0.5,  "home"),
            ("home_xg_avg",    "主队场均 xG",      1.5,  "home"),
            ("away_xg_avg",    "客队场均 xG",      1.5,  "away"),
        ]
        for col, label, threshold, default_dir in checks:
            h_val = h_rows[col].mean() if col in h_rows.columns else None
            a_val = a_rows[col].mean() if col in a_rows.columns else None
            val   = h_val if h_val is not None else a_val
            if val is None or (hasattr(val, "__float__") and np.isnan(float(val))):
                continue
            val = float(val)
            direction = "home" if val > threshold else "away" if val < -threshold else "neutral"
            features.append(KeyFeature(
                name=col, value=round(val, 3),
                direction=direction, label=label,
            ))
        return features[:6]
    except Exception:
        return []


def _build_h2h_summary(home: str, away: str) -> dict:
    try:
        import pandas as pd
        from pathlib import Path
        df = pd.read_parquet(Path("data/processed/features.parquet"))
        row = df[
            (df["home_team"].str.contains(home, case=False, na=False)) &
            (df["away_team"].str.contains(away, case=False, na=False))
        ]
        if row.empty:
            return {}
        latest = row.iloc[-1]
        return {
            "played":   int(latest.get("h2h_played", 0)),
            "win_rate": round(float(latest.get("h2h_win_rate", 0)), 3),
            "draw_rate":round(float(latest.get("h2h_draw_rate", 0)), 3),
            "gf_avg":   round(float(latest.get("h2h_gf_avg", 0)), 2),
            "ga_avg":   round(float(latest.get("h2h_ga_avg", 0)), 2),
        }
    except Exception:
        return {}