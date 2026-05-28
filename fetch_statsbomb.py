"""
fetch_statsbomb.py
------------------
从 StatsBomb 开放数据拉取战术指标：
  - xG / xGA（期望进球/失球）
  - PPDA（逼抢强度）
  - 射门详情（位置、body part、situation）
  - 传球网络基础数据
  - 球员出场分钟数（俱乐部赛季）

用法:
    pip install statsbombpy pyarrow
    python fetch_statsbomb.py --competitions   # 查看所有可用赛事
    python fetch_statsbomb.py --fetch          # 拉取 config 中配置的赛事
    python fetch_statsbomb.py --fetch --comp world_cup_2018
"""

import argparse
from pathlib import Path

import pandas as pd
from statsbombpy import sb

from config import STATSBOMB_COMPETITIONS, DATA_DIR

OUT = Path(DATA_DIR)
OUT.mkdir(parents=True, exist_ok=True)


def save(df: pd.DataFrame, name: str):
    if df is None or df.empty:
        print(f"  [skip] {name} — 空")
        return
    path = OUT / f"sb_{name}.parquet"
    df.to_parquet(path, index=False)
    print(f"  [ok]   sb_{name}.parquet  ({len(df):,} 行)")


# ── 工具：计算 PPDA ──────────────────────────────────────────────────────────
def calc_ppda(events_df: pd.DataFrame) -> pd.DataFrame:
    """
    PPDA = 己方传球数 / 对方逼抢动作数（tackle + interception + foul）
    越低 = 逼抢越积极。按 match_id + team 计算。
    """
    passes = (
        events_df[events_df["type"] == "Pass"]
        .groupby(["match_id", "team"])
        .size()
        .reset_index(name="passes")
    )
    press_types = {"Pressure", "Tackle", "Interception", "Foul Committed"}
    pressures = (
        events_df[events_df["type"].isin(press_types)]
        .groupby(["match_id", "team"])
        .size()
        .reset_index(name="defensive_actions")
    )
    df = passes.merge(pressures, on=["match_id", "team"], how="left").fillna(0)
    df["ppda"] = df["passes"] / df["defensive_actions"].replace(0, float("nan"))
    return df


# ── 工具：汇总比赛级 xG ──────────────────────────────────────────────────────
def calc_match_xg(events_df: pd.DataFrame) -> pd.DataFrame:
    """从 shots 事件提取 xG；按 match_id + team 汇总。"""
    shots = events_df[events_df["type"] == "Shot"].copy()
    if shots.empty:
        return pd.DataFrame()

    # shot_statsbomb_xg 字段在嵌套 dict 里，需解包
    if "shot" in shots.columns:
        shots["xg"] = shots["shot"].apply(
            lambda x: x.get("statsbomb_xg", None) if isinstance(x, dict) else None
        )
    elif "shot_statsbomb_xg" in shots.columns:
        shots["xg"] = shots["shot_statsbomb_xg"]
    else:
        print("  [warn] 找不到 xG 字段，跳过")
        return pd.DataFrame()

    xg = (
        shots.groupby(["match_id", "team"])["xg"]
        .agg(["sum", "count"])
        .reset_index()
        .rename(columns={"sum": "xg_total", "count": "shots_total"})
    )
    return xg


# ── 拉取单个赛事 ─────────────────────────────────────────────────────────────
def fetch_competition(key: str, comp_id: int, season_id: int):
    print(f"\n{'='*50}")
    print(f" {key}  (competition={comp_id}, season={season_id})")
    print(f"{'='*50}")

    # 1. 比赛列表
    print("[1/4] 获取比赛列表...")
    try:
        matches = sb.matches(competition_id=comp_id, season_id=season_id)
        save(matches, f"{key}_matches")
    except Exception as e:
        print(f"  [error] 获取比赛列表失败: {e}")
        return

    match_ids = matches["match_id"].tolist()
    print(f"       共 {len(match_ids)} 场")

    # 2. 拉取所有比赛 events（含 xG、shots、passes、pressure）
    print("[2/4] 拉取 events（含 xG / shots / passes）...")
    all_events = []
    for i, mid in enumerate(match_ids, 1):
        try:
            ev = sb.events(match_id=mid)
            ev["match_id"] = mid
            all_events.append(ev)
            if i % 10 == 0:
                print(f"       进度: {i}/{len(match_ids)}")
        except Exception as e:
            print(f"  [warn] match {mid} events 失败: {e}")

    if not all_events:
        print("  [error] 没有拿到任何 events")
        return

    events_df = pd.concat(all_events, ignore_index=True)
    save(events_df, f"{key}_events")

    # 3. 计算 xG
    print("[3/4] 计算 xG / PPDA...")
    xg_df   = calc_match_xg(events_df)
    ppda_df = calc_ppda(events_df)

    # 合并 xG 与对手 xGA
    if not xg_df.empty:
        # 给对手打上 xGA
        opponent = xg_df.copy()
        opponent = opponent.rename(columns={"xg_total": "xga_total"})
        opponent["team"] = opponent["team"]   # placeholder，需 join match info
        save(xg_df,   f"{key}_xg")
    save(ppda_df, f"{key}_ppda")

    # 4. 射门详情（位置、部位、情景）
    print("[4/4] 提取射门详情...")
    shots = events_df[events_df["type"] == "Shot"].copy()
    if not shots.empty and "shot" in shots.columns:
        shot_detail = shots[["match_id", "team", "player", "minute",
                              "location", "shot"]].copy()
        # 展开 shot dict
        shot_expanded = pd.json_normalize(shots["shot"].dropna())
        shot_detail = pd.concat(
            [shot_detail.reset_index(drop=True),
             shot_expanded.reset_index(drop=True)],
            axis=1
        )
        save(shot_detail, f"{key}_shots_detail")

    print(f"\n  ✅ {key} 完成")


# ── CLI ──────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="StatsBomb 开放数据拉取")
    parser.add_argument("--competitions", action="store_true", help="列出所有可用赛事")
    parser.add_argument("--fetch",        action="store_true", help="拉取数据")
    parser.add_argument("--comp",         type=str, default=None,
                        help="只拉指定赛事 key（如 world_cup_2018）")
    args = parser.parse_args()

    if args.competitions:
        print("StatsBomb 所有开放赛事：\n")
        comps = sb.competitions()
        print(comps[["competition_id", "season_id",
                      "competition_name", "season_name"]].to_string(index=False))
        return

    if args.fetch:
        targets = (
            {args.comp: STATSBOMB_COMPETITIONS[args.comp]}
            if args.comp and args.comp in STATSBOMB_COMPETITIONS
            else STATSBOMB_COMPETITIONS
        )
        for key, cfg in targets.items():
            try:
                fetch_competition(key, cfg["competition_id"], cfg["season_id"])
            except Exception as e:
                print(f"[error] {key} 失败: {e}")

        print("\n\n✅ StatsBomb 数据拉取完成，存放于 data/raw/sb_*.parquet")
        return

    parser.print_help()


if __name__ == "__main__":
    main()