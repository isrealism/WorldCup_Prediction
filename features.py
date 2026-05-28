"""
features.py — 特征工程主文件
将 data/raw/ 中的原始数据转换为模型可用的特征矩阵。

用法:
    python features.py --build      # 构建全部特征
    python features.py --inspect    # 查看特征概览
    python features.py --validate   # 检查数据泄露 & 缺失率
"""

import argparse
import warnings
from pathlib import Path

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

RAW  = Path("data/raw")
PROC = Path("data/processed")
PROC.mkdir(parents=True, exist_ok=True)


# ══════════════════════════════════════════════════════════════════════════════
# DataLoader — 统一加载所有原始数据
# ══════════════════════════════════════════════════════════════════════════════

class DataLoader:
    def __init__(self):
        self._cache = {}

    def _load(self, pattern: str) -> pd.DataFrame:
        """加载匹配 glob pattern 的所有 parquet，合并返回。"""
        if pattern in self._cache:
            return self._cache[pattern]
        files = sorted(RAW.glob(pattern))
        if not files:
            return pd.DataFrame()
        df = pd.concat([pd.read_parquet(f) for f in files], ignore_index=True)
        self._cache[pattern] = df
        return df

    @property
    def matches(self) -> pd.DataFrame:
        """所有比赛结果（football-data.org + API-Football 合并）。"""
        fd = self._load("matches_*_fd.parquet")
        af = self._load("matches_*_af.parquet")
        df = pd.concat([fd, af], ignore_index=True)
        df["utc_date"] = pd.to_datetime(df["utc_date"], utc=True, errors="coerce")
        df = df.dropna(subset=["home_score", "away_score", "utc_date"])
        df["home_score"] = df["home_score"].astype(int)
        df["away_score"] = df["away_score"].astype(int)
        # 统一结果列
        df["result"] = np.select(
            [df["home_score"] > df["away_score"],
             df["home_score"] == df["away_score"]],
            ["W", "D"], default="L"
        )
        # 是否进行了加时/点球
        df["went_to_et"]  = df.get("duration", "").isin(["EXTRA_TIME", "PENALTY_SHOOTOUT"])
        df["went_to_pen"] = df.get("duration", "") == "PENALTY_SHOOTOUT"
        return df.drop_duplicates(subset=["home_team", "away_team", "utc_date"])

    @property
    def squads(self) -> pd.DataFrame:
        tm = self._load("tm_national_team_squads.parquet")
        fd = self._load("squads_fd.parquet")
        return pd.concat([tm, fd], ignore_index=True)

    @property
    def team_info(self) -> pd.DataFrame:
        return self._load("team_info_fd.parquet")

    @property
    def player_stats(self) -> pd.DataFrame:
        return self._load("player_stats_af.parquet")

    @property
    def player_profiles(self) -> pd.DataFrame:
        return self._load("player_profiles_af.parquet")

    @property
    def coach_history(self) -> pd.DataFrame:
        return self._load("tm_coach_history.parquet")

    @property
    def injuries(self) -> pd.DataFrame:
        return self._load("injuries_af.parquet")

    @property
    def sb_xg(self) -> pd.DataFrame:
        return self._load("sb_*_xg.parquet")

    @property
    def sb_ppda(self) -> pd.DataFrame:
        return self._load("sb_*_ppda.parquet")

    @property
    def rankings(self) -> pd.DataFrame:
        df = self._load("fifa_rankings_history.parquet")
        if not df.empty:
            df["ranking_date"] = pd.to_datetime(df["ranking_date"])
        return df

    @property
    def odds(self) -> pd.DataFrame:
        return self._load("odds_with_prob.parquet")

    @property
    def weather(self) -> pd.DataFrame:
        df = self._load("weather_venues_2026.parquet")
        if not df.empty:
            df["date"] = pd.to_datetime(df["date"])
        return df


# ══════════════════════════════════════════════════════════════════════════════
# 工具函数
# ══════════════════════════════════════════════════════════════════════════════

def _team_matches(matches: pd.DataFrame, team: str) -> pd.DataFrame:
    """返回某球队所有比赛，添加 is_home / goals_for / goals_against / points 列。"""
    home = matches[matches["home_team"] == team].copy()
    home["is_home"]        = True
    home["goals_for"]      = home["home_score"]
    home["goals_against"]  = home["away_score"]
    home["opponent"]       = home["away_team"]
    home["team_result"]    = home["result"]            # W/D/L

    away = matches[matches["away_team"] == team].copy()
    away["is_home"]        = False
    away["goals_for"]      = away["away_score"]
    away["goals_against"]  = away["home_score"]
    away["opponent"]       = away["home_team"]
    away["team_result"]    = away["result"].map({"W": "L", "D": "D", "L": "W"})

    df = pd.concat([home, away], ignore_index=True).sort_values("utc_date")
    df["points"] = df["team_result"].map({"W": 3, "D": 1, "L": 0})
    return df


def _form_stats(tm: pd.DataFrame, before_date, n: int, comp_filter=None) -> dict:
    """计算 before_date 之前最近 n 场的形态指标。"""
    hist = tm[tm["utc_date"] < before_date]
    if comp_filter:
        hist = hist[hist["competition"].isin(comp_filter)]
    hist = hist.tail(n)
    if hist.empty:
        return {}
    total = len(hist)
    return {
        "played":        total,
        "win_rate":      (hist["team_result"] == "W").mean(),
        "draw_rate":     (hist["team_result"] == "D").mean(),
        "loss_rate":     (hist["team_result"] == "L").mean(),
        "goals_for_avg": hist["goals_for"].mean(),
        "goals_ag_avg":  hist["goals_against"].mean(),
        "goal_diff_avg": (hist["goals_for"] - hist["goals_against"]).mean(),
        "ppg":           hist["points"].mean(),
        "clean_sheets":  (hist["goals_against"] == 0).mean(),
        "scored_rate":   (hist["goals_for"] > 0).mean(),
    }


# ══════════════════════════════════════════════════════════════════════════════
# 1. FormBuilder — 近期状态
# ══════════════════════════════════════════════════════════════════════════════

class FormBuilder:
    """每场比赛，对 home/away 两队分别计算赛前近期状态。"""

    OFFICIAL_COMPS = [
        "world_cup", "euro", "copa_america", "africa_cup",
        "asia_cup", "nations_league_uefa", "gold_cup",
        "wc_qual_europe", "wc_qual_south_america",
        "wc_qual_africa", "wc_qual_asia", "wc_qual_concacaf",
    ]

    def __init__(self, matches: pd.DataFrame):
        # 为每支出现过的球队预建索引，加速查询
        all_teams = set(matches["home_team"].tolist() + matches["away_team"].tolist())
        self._team_hist = {t: _team_matches(matches, t) for t in all_teams}

    def build(self, row: pd.Series, side: str) -> dict:
        """side: 'home' or 'away'"""
        team = row[f"{side}_team"]
        date = row["utc_date"]
        tm   = self._team_hist.get(team, pd.DataFrame())
        if tm.empty:
            return {}

        out = {}
        for n, tag in [(5, "5"), (10, "10")]:
            stats = _form_stats(tm, date, n)
            for k, v in stats.items():
                out[f"{side}_form{tag}_{k}"] = v

        # 仅官方赛事（剔除友谊赛）
        official = _form_stats(tm, date, 10, self.OFFICIAL_COMPS)
        for k, v in official.items():
            out[f"{side}_official_{k}"] = v

        # 形态趋势：近5场 ppg - 近10场 ppg（正值=改善）
        out[f"{side}_form_trend"] = (
            out.get(f"{side}_form5_ppg", 0) - out.get(f"{side}_form10_ppg", 0)
        )

        # 连胜/连败
        hist = tm[tm["utc_date"] < date].tail(10)
        streak, val = 0, None
        for r in reversed(hist["team_result"].tolist()):
            if val is None:
                val = r
            if r == val:
                streak += 1
            else:
                break
        out[f"{side}_streak_len"]  = streak
        out[f"{side}_streak_type"] = 1 if val == "W" else (-1 if val == "L" else 0)

        return out


# ══════════════════════════════════════════════════════════════════════════════
# 2. H2HBuilder — 历史交锋
# ══════════════════════════════════════════════════════════════════════════════

class H2HBuilder:
    def __init__(self, matches: pd.DataFrame):
        self._matches = matches

    def _h2h(self, team1: str, team2: str, before_date, n=None, stage_filter=None) -> dict:
        m = self._matches[
            ((self._matches["home_team"] == team1) & (self._matches["away_team"] == team2)) |
            ((self._matches["home_team"] == team2) & (self._matches["away_team"] == team1))
        ]
        m = m[m["utc_date"] < before_date]
        if stage_filter:
            m = m[m["stage"].str.contains(stage_filter, na=False, case=False)]
        if n:
            m = m.tail(n)
        if m.empty:
            return {"h2h_played": 0}

        t1_wins = (
            ((m["home_team"] == team1) & (m["result"] == "W")) |
            ((m["away_team"] == team1) & (m["result"] == "L"))
        ).sum()
        draws   = (m["result"] == "D").sum()
        total   = len(m)

        # 进球（从 team1 视角）
        t1_gf = np.where(m["home_team"] == team1, m["home_score"], m["away_score"])
        t1_ga = np.where(m["home_team"] == team1, m["away_score"], m["home_score"])

        return {
            "h2h_played":    total,
            "h2h_win_rate":  t1_wins / total,
            "h2h_draw_rate": draws   / total,
            "h2h_gf_avg":    t1_gf.mean(),
            "h2h_ga_avg":    t1_ga.mean(),
        }

    def build(self, row: pd.Series) -> dict:
        t1, t2, date = row["home_team"], row["away_team"], row["utc_date"]
        out = {}

        # 全历史
        for k, v in self._h2h(t1, t2, date).items():
            out[k] = v

        # 近5次
        recent = self._h2h(t1, t2, date, n=5)
        for k, v in recent.items():
            out[f"recent_{k}"] = v

        # 仅淘汰赛阶段
        ko = self._h2h(t1, t2, date, stage_filter="ROUND|QUARTER|SEMI|FINAL")
        for k, v in ko.items():
            out[f"ko_{k}"] = v

        return out


# ══════════════════════════════════════════════════════════════════════════════
# 3. StageBuilder — 大赛阶段表现
# ══════════════════════════════════════════════════════════════════════════════

class StageBuilder:
    def __init__(self, matches: pd.DataFrame):
        self._team_hist = {}
        all_teams = set(matches["home_team"].tolist() + matches["away_team"].tolist())
        for t in all_teams:
            self._team_hist[t] = _team_matches(matches, t)

    def build(self, row: pd.Series, side: str) -> dict:
        team = row[f"{side}_team"]
        date = row["utc_date"]
        tm   = self._team_hist.get(team, pd.DataFrame())
        out  = {}

        if tm.empty:
            return out

        hist = tm[tm["utc_date"] < date]

        # 淘汰赛胜率
        ko = hist[hist["stage"].str.contains(
            "ROUND|QUARTER|SEMI|FINAL", na=False, case=False
        )]
        out[f"{side}_ko_win_rate"]  = (ko["team_result"] == "W").mean() if len(ko) else np.nan
        out[f"{side}_ko_played"]    = len(ko)

        # 点球大战胜率
        pen = hist[hist.get("went_to_pen", pd.Series(False, index=hist.index))]
        out[f"{side}_pen_win_rate"] = (pen["team_result"] == "W").mean() if len(pen) else np.nan
        out[f"{side}_pen_played"]   = len(pen)

        # 世界杯专项
        wc = hist[hist["competition"] == "world_cup"]
        wc_stats = _form_stats(wc, date, 999) if not wc.empty else {}
        out[f"{side}_wc_win_rate"]  = wc_stats.get("win_rate", np.nan)
        out[f"{side}_wc_ppg"]       = wc_stats.get("ppg", np.nan)
        out[f"{side}_wc_played"]    = wc_stats.get("played", 0)

        # 加时赛胜率
        et = hist[hist.get("went_to_et", pd.Series(False, index=hist.index))]
        out[f"{side}_et_win_rate"]  = (et["team_result"] == "W").mean() if len(et) else np.nan

        return out


# ══════════════════════════════════════════════════════════════════════════════
# 4. SquadBuilder — 阵容实力
# ══════════════════════════════════════════════════════════════════════════════

class SquadBuilder:
    def __init__(self, loader: DataLoader):
        self._squads     = loader.squads
        self._profiles   = loader.player_profiles
        self._injuries   = loader.injuries
        self._coach_hist = loader.coach_history
        self._team_info  = loader.team_info

    def _get_squad_mv(self, team: str) -> float:
        """球队总市值（欧元）。"""
        sq = self._squads[self._squads["team_name"].str.contains(team, na=False, case=False)]
        if "market_value" in sq.columns and not sq.empty:
            return sq["market_value"].sum(skipna=True)
        return np.nan

    def _get_avg_age(self, team: str) -> float:
        sq = self._squads[self._squads["team_name"].str.contains(team, na=False, case=False)]
        if "age" in sq.columns and not sq.empty:
            return pd.to_numeric(sq["age"], errors="coerce").mean()
        return np.nan

    def _get_injured_count(self, team: str) -> int:
        if self._injuries.empty:
            return 0
        inj = self._injuries[self._injuries["national_team"].str.contains(team, na=False, case=False)]
        return len(inj)

    def _get_coach_stats(self, team: str) -> dict:
        if self._coach_hist.empty:
            return {}
        ch = self._coach_hist[
            self._coach_hist["national_team"].str.contains(team, na=False, case=False)
        ]
        if ch.empty:
            return {}
        # 取最新一任
        latest = ch.iloc[-1]
        win_pct = pd.to_numeric(
            str(latest.get("win_pct", "0")).replace("%", ""), errors="coerce"
        )
        return {
            "coach_win_pct": win_pct / 100 if win_pct else np.nan,
            "coach_ppg":     pd.to_numeric(latest.get("points_per_game"), errors="coerce"),
        }

    def build(self, row: pd.Series, side: str) -> dict:
        team = row[f"{side}_team"]
        out  = {}

        mv = self._get_squad_mv(team)
        out[f"{side}_squad_mv"]     = mv
        out[f"{side}_squad_mv_log"] = np.log1p(mv) if not np.isnan(mv) else np.nan
        out[f"{side}_avg_age"]      = self._get_avg_age(team)
        out[f"{side}_injured_cnt"]  = self._get_injured_count(team)

        for k, v in self._get_coach_stats(team).items():
            out[f"{side}_{k}"] = v

        return out


# ══════════════════════════════════════════════════════════════════════════════
# 5. TacticalBuilder — xG / PPDA（StatsBomb）
# ══════════════════════════════════════════════════════════════════════════════

class TacticalBuilder:
    def __init__(self, loader: DataLoader):
        self._xg   = loader.sb_xg
        self._ppda = loader.sb_ppda

    def build(self, row: pd.Series, side: str) -> dict:
        team = row[f"{side}_team"]
        out  = {}

        if not self._xg.empty and "team" in self._xg.columns:
            tq = self._xg[self._xg["team"].str.contains(team, na=False, case=False)]
            if not tq.empty:
                out[f"{side}_xg_avg"]   = tq["xg_total"].mean()
                out[f"{side}_shots_avg"] = tq["shots_total"].mean()

        if not self._ppda.empty and "team" in self._ppda.columns:
            tq = self._ppda[self._ppda["team"].str.contains(team, na=False, case=False)]
            if not tq.empty:
                out[f"{side}_ppda_avg"] = tq["ppda"].mean()

        return out


# ══════════════════════════════════════════════════════════════════════════════
# 6. ExternalBuilder — FIFA 排名 / 赔率 / 天气 / 海拔
# ══════════════════════════════════════════════════════════════════════════════

class ExternalBuilder:
    def __init__(self, loader: DataLoader):
        self._rankings = loader.rankings
        self._odds     = loader.odds
        self._weather  = loader.weather

        # 场馆海拔字典
        from config import VENUES_2026
        self._altitude = {v["city"]: v["altitude_m"] for v in VENUES_2026}

    def _get_rank(self, team: str, before_date) -> float:
        if self._rankings.empty:
            return np.nan
        past = self._rankings[self._rankings["ranking_date"] <= before_date]
        if past.empty:
            return np.nan
        latest = past[past["ranking_date"] == past["ranking_date"].max()]
        row = latest[latest["team"].str.contains(team, na=False, case=False)]
        if row.empty:
            return np.nan
        return float(row["rank"].iloc[0])

    def build(self, row: pd.Series) -> dict:
        date = row["utc_date"]
        home, away = row["home_team"], row["away_team"]
        out  = {}

        # FIFA 排名
        r_home = self._get_rank(home, date)
        r_away = self._get_rank(away, date)
        out["home_fifa_rank"] = r_home
        out["away_fifa_rank"] = r_away
        out["rank_diff"]      = r_home - r_away      # 负值=主队排名更靠前
        out["rank_diff_log"]  = (
            np.sign(out["rank_diff"]) * np.log1p(abs(out["rank_diff"]))
            if not np.isnan(out["rank_diff"]) else np.nan
        )

        # 赔率隐含概率
        if not self._odds.empty:
            game_odds = self._odds[
                (self._odds["home_team"].str.contains(home, na=False, case=False)) &
                (self._odds["away_team"].str.contains(away, na=False, case=False))
            ]
            if not game_odds.empty:
                h2h = game_odds[game_odds["market"] == "h2h"]
                for outcome, key in [
                    (home, "home_implied_prob"),
                    ("Draw", "draw_implied_prob"),
                    (away, "away_implied_prob"),
                ]:
                    o = h2h[h2h["outcome"].str.contains(outcome, na=False, case=False)]
                    out[key] = o["prob_normalized"].mean() if not o.empty else np.nan

        # 天气（2026 世界杯场馆）
        if not self._weather.empty and "venue_city" in row:
            city = row.get("venue_city", "")
            match_date = date.date() if hasattr(date, "date") else None
            if city and match_date:
                wrow = self._weather[
                    (self._weather["city"].str.contains(str(city), na=False, case=False)) &
                    (self._weather["date"].dt.date == match_date)
                ]
                if not wrow.empty:
                    out["venue_temp_max"]   = wrow["temp_max"].iloc[0]
                    out["venue_precip"]     = wrow["precipitation"].iloc[0]
                    out["venue_wind_max"]   = wrow["windspeed_max"].iloc[0]

        # 海拔
        for city, alt in self._altitude.items():
            if str(row.get("venue_city", "")).lower() in city.lower():
                out["venue_altitude"] = alt
                break
        else:
            out["venue_altitude"] = np.nan

        return out


# ══════════════════════════════════════════════════════════════════════════════
# 7. EloBuilder — 自计算 Elo 评分
# ══════════════════════════════════════════════════════════════════════════════

class EloBuilder:
    """
    从历史比赛结果中自底向上计算 Elo 评分。
    赛前 Elo 差值是预测胜负的强力特征。
    """
    K_MAP = {
        "world_cup":   60,   "euro":        50,
        "copa_america":50,   "africa_cup":  50,
        "asia_cup":    50,   "nations_league_uefa": 40,
        "wc_qual_europe": 40,"international_friendlies": 20,
    }
    DEFAULT_K = 30

    def __init__(self, matches: pd.DataFrame, base_elo: float = 1500.0):
        self._elo = {}          # team -> current elo
        self._history = {}      # (home_team, away_team, date) -> elo snapshot
        self._base = base_elo
        self._build(matches)

    def _expected(self, ra: float, rb: float) -> float:
        return 1 / (1 + 10 ** ((rb - ra) / 400))

    def _build(self, matches: pd.DataFrame):
        for _, row in matches.sort_values("utc_date").iterrows():
            home, away = row["home_team"], row["away_team"]
            ra = self._elo.get(home, self._base)
            rb = self._elo.get(away, self._base)

            ea = self._expected(ra, rb)
            k  = self.K_MAP.get(row.get("competition", ""), self.DEFAULT_K)

            # 실제 결과
            result = row.get("result", "D")
            sa = {"W": 1.0, "D": 0.5, "L": 0.0}.get(result, 0.5)

            # 进球差加成
            gd = abs(row.get("home_score", 0) - row.get("away_score", 0))
            gd_mult = 1 + (gd - 1) * 0.5 if gd > 1 else 1.0
            k *= gd_mult

            self._elo[home] = ra + k * (sa - ea)
            self._elo[away] = rb + k * ((1 - sa) - (1 - ea))

            key = (home, away, str(row["utc_date"].date()))
            self._history[key] = {"home_elo": ra, "away_elo": rb}

    def build(self, row: pd.Series) -> dict:
        home = row["home_team"]
        away = row["away_team"]
        date = str(row["utc_date"].date())
        snap = self._history.get((home, away, date), {})
        ra   = snap.get("home_elo", self._elo.get(home, self._base))
        rb   = snap.get("away_elo", self._elo.get(away, self._base))
        return {
            "home_elo":     ra,
            "away_elo":     rb,
            "elo_diff":     ra - rb,
            "home_win_prob_elo": self._expected(ra, rb),
        }


# ══════════════════════════════════════════════════════════════════════════════
# FeaturePipeline — 主流程
# ══════════════════════════════════════════════════════════════════════════════

class FeaturePipeline:
    def __init__(self):
        print("加载数据...")
        self.loader  = DataLoader()
        self.matches = self.loader.matches
        print(f"  比赛总数: {len(self.matches):,} 场")

        print("初始化特征构建器...")
        self.form    = FormBuilder(self.matches)
        self.h2h     = H2HBuilder(self.matches)
        self.stage   = StageBuilder(self.matches)
        self.squad   = SquadBuilder(self.loader)
        self.tactical= TacticalBuilder(self.loader)
        self.external= ExternalBuilder(self.loader)
        self.elo     = EloBuilder(self.matches)
        print("  初始化完成")

    def build_row(self, row: pd.Series) -> dict:
        """对单场比赛构建完整特征向量。"""
        feat = {
            # ── 元数据 ──────────────────────────────────────────────────
            "match_id":    row.get("match_id"),
            "utc_date":    row["utc_date"],
            "competition": row.get("competition"),
            "season":      row.get("season"),
            "stage":       row.get("stage"),
            "home_team":   row["home_team"],
            "away_team":   row["away_team"],
            # ── 标签 ────────────────────────────────────────────────────
            "home_goals":  row["home_score"],
            "away_goals":  row["away_score"],
            "result":      row["result"],          # W/D/L (主队视角)
            "result_num":  {"W": 1, "D": 0, "L": -1}[row["result"]],
            "went_to_et":  row.get("went_to_et", False),
            "went_to_pen": row.get("went_to_pen", False),
        }

        # ── 各特征组 ──────────────────────────────────────────────────
        for side in ("home", "away"):
            feat.update(self.form.build(row, side))
            feat.update(self.stage.build(row, side))
            feat.update(self.squad.build(row, side))
            feat.update(self.tactical.build(row, side))

        feat.update(self.h2h.build(row))
        feat.update(self.external.build(row))
        feat.update(self.elo.build(row))

        # ── 衍生特征 ──────────────────────────────────────────────────
        # 市值比
        h_mv = feat.get("home_squad_mv", np.nan)
        a_mv = feat.get("away_squad_mv", np.nan)
        feat["mv_ratio"] = (
            h_mv / a_mv if (h_mv and a_mv and a_mv > 0) else np.nan
        )
        feat["mv_ratio_log"] = np.log(feat["mv_ratio"]) if feat["mv_ratio"] > 0 else np.nan

        # xG 差值
        feat["xg_diff"] = (
            feat.get("home_xg_avg", np.nan) - feat.get("away_xg_avg", np.nan)
        )

        # 综合实力差（Elo + 市值 + 排名 简单加权）
        elo_diff  = feat.get("elo_diff",     0) / 400   # 归一化
        rank_diff = -(feat.get("rank_diff",  0) / 100)  # 负值=主队好
        mv_diff   = feat.get("mv_ratio_log", 0)
        feat["composite_strength"] = (
            0.5 * elo_diff + 0.3 * rank_diff + 0.2 * mv_diff
        )

        return feat

    def build(self, competitions: list = None, seasons: list = None) -> pd.DataFrame:
        """构建全量特征矩阵。"""
        m = self.matches.copy()
        if competitions:
            m = m[m["competition"].isin(competitions)]
        if seasons:
            m = m[m["season"].isin(seasons)]

        print(f"\n开始构建特征（{len(m):,} 场）...")
        rows = []
        for i, (_, row) in enumerate(m.iterrows(), 1):
            rows.append(self.build_row(row))
            if i % 100 == 0 or i == len(m):
                print(f"  进度: {i}/{len(m)} ({i/len(m)*100:.1f}%)", end="\r")

        print("\n合并特征...")
        df = pd.DataFrame(rows)
        path = PROC / "features.parquet"
        df.to_parquet(path, index=False)
        print(f"✅ 保存至 {path}  ({len(df):,} 行 × {len(df.columns)} 列)")
        return df


# ══════════════════════════════════════════════════════════════════════════════
# 工具命令
# ══════════════════════════════════════════════════════════════════════════════

def cmd_inspect():
    path = PROC / "features.parquet"
    if not path.exists():
        print("特征文件不存在，请先运行 --build")
        return
    df = pd.read_parquet(path)
    print(f"\n特征矩阵概览: {len(df):,} 行 × {len(df.columns)} 列")
    print(f"\n结果分布:\n{df['result'].value_counts()}")
    print(f"\n赛事分布:\n{df['competition'].value_counts()}")
    print(f"\n特征缺失率（前20）:")
    miss = df.isnull().mean().sort_values(ascending=False).head(20)
    print(miss.to_string())
    print(f"\n数值特征统计:\n{df.select_dtypes(include='number').describe().T[['mean','std','min','max']].round(3).to_string()}")


def cmd_validate():
    """检查数据泄露：标签列不能出现在特征列里。"""
    path = PROC / "features.parquet"
    if not path.exists():
        print("特征文件不存在"); return

    df = pd.read_parquet(path)
    label_cols = {"result", "result_num", "home_goals", "away_goals",
                  "went_to_et", "went_to_pen"}
    feature_cols = set(df.columns) - label_cols - {
        "match_id", "utc_date", "competition", "season",
        "stage", "home_team", "away_team"
    }

    issues = []
    for fc in feature_cols:
        if df[fc].dtype == object:
            continue
        corr = df[fc].corr(df["result_num"])
        if abs(corr) > 0.9:
            issues.append((fc, corr))

    if issues:
        print("⚠️  以下特征与标签相关性过高（可能泄露）：")
        for fc, c in issues:
            print(f"  {fc}: {c:.3f}")
    else:
        print("✅ 未发现明显数据泄露")

    miss = df[list(feature_cols)].isnull().mean()
    high_miss = miss[miss > 0.5]
    if not high_miss.empty:
        print(f"\n⚠️  以下特征缺失率超 50%：")
        print(high_miss.to_string())
    else:
        print("✅ 所有特征缺失率均在 50% 以内")


def main():
    parser = argparse.ArgumentParser(description="特征工程")
    parser.add_argument("--build",    action="store_true", help="构建特征矩阵")
    parser.add_argument("--inspect",  action="store_true", help="查看特征概览")
    parser.add_argument("--validate", action="store_true", help="检查数据质量")
    parser.add_argument("--comp",     nargs="+", help="只处理指定赛事")
    parser.add_argument("--season",   nargs="+", type=int, help="只处理指定赛季")
    args = parser.parse_args()

    if args.build:
        pipe = FeaturePipeline()
        pipe.build(competitions=args.comp, seasons=args.season)
    if args.inspect:
        cmd_inspect()
    if args.validate:
        cmd_validate()
    if not any(vars(args).values()):
        parser.print_help()


if __name__ == "__main__":
    main()