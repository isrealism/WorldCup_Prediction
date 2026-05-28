"""
run_all.py — 主控入口

用法:
    python run_all.py --status   # 查看已有数据
    python run_all.py --step 1   # 单步执行
    python run_all.py --all      # 全量
"""

import argparse, subprocess, sys
from pathlib import Path

STEPS = [
    {
        "step": 1, "name": "验证 API Key",
        "desc": "确认 football-data.org 和 API-Football 均可用",
        "cmd": ["python", "fetch.py", "--test"],
    },
    {
        "step": 2, "name": "比赛结果 — football-data.org",
        "desc": "世界杯 / 欧洲杯（历届）",
        "cmd": ["python", "fetch.py", "--fd"],
    },
    {
        "step": 3, "name": "比赛结果 — API-Football",
        "desc": "美洲杯 / 非洲杯 / 亚洲杯 / 欧国联 / 预选赛 / 友谊赛",
        "cmd": ["python", "fetch.py", "--af"],
    },
    {
        "step": 4, "name": "球队 & 球员",
        "desc": "阵容 / 球员档案 / 赛季统计 / 伤病",
        "cmd": ["python", "fetch_squads.py", "--all"],
    },
    {
        "step": 5, "name": "战术指标 — StatsBomb",
        "desc": "xG / xGA / PPDA / 射门详情（完全免费）",
        "cmd": ["python", "fetch_statsbomb.py", "--fetch"],
    },
    {
        "step": 6, "name": "外部数据",
        "desc": "天气（Open-Meteo）/ 赔率（The Odds API）/ FIFA 排名",
        "cmd": ["python", "fetch_external.py", "--all"],
    },
    {
        "step": 7, "name": "Transfermarkt",
        "desc": "球员市值 / 教练历史（爬虫，约 15 分钟）",
        "cmd": ["python", "fetch_transfermarkt.py", "--all"],
    },
]

def status():
    raw = Path("data/raw")
    if not raw.exists() or not list(raw.glob("*.parquet")):
        print("data/raw/ 暂无数据。"); return
    import pandas as pd
    files = sorted(raw.glob("*.parquet"))
    print(f"\n{'文件名':<48} {'行数':>8}  {'大小':>8}")
    print("-" * 70)
    total = 0
    for f in files:
        try:    rows = len(pd.read_parquet(f))
        except: rows = -1
        sz = f.stat().st_size; total += sz
        print(f"{f.name:<48} {rows:>8,}  {sz/1024:>6.1f} KB")
    print("-" * 70)
    print(f"共 {len(files)} 个文件，合计 {total/1024/1024:.1f} MB")

def run_step(s):
    print(f"\n{'='*55}\n步骤 {s['step']}: {s['name']}\n  {s['desc']}\n{'='*55}")
    r = subprocess.run(s["cmd"])
    print(f"\n  {'✅ 完成' if r.returncode == 0 else '❌ 失败'}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--step",   type=int)
    parser.add_argument("--all",    action="store_true")
    parser.add_argument("--status", action="store_true")
    args = parser.parse_args()

    if args.status:
        status(); return
    if args.step:
        cfg = next((s for s in STEPS if s["step"] == args.step), None)
        if not cfg: print(f"步骤 {args.step} 不存在"); sys.exit(1)
        run_step(cfg); return
    if args.all:
        print("⚠️  先完成步骤 1（验证 Key）再全量拉取\n")
        for s in STEPS: run_step(s)
        print("\n🎉 完成！运行 --status 查看数据概览")
        return

    print("\n执行计划：")
    for s in STEPS:
        print(f"  步骤 {s['step']}: {s['name']}")
        print(f"           {s['desc']}")
    print("\n  python run_all.py --step 1   # 从验证 Key 开始")
    print("  python run_all.py --all      # 全量")
    print("  python run_all.py --status   # 查看进度")

if __name__ == "__main__":
    main()