"""
routers/admin.py — 数据管理接口 + WebSocket 日志推送
"""

import sys, json, asyncio, subprocess
from pathlib import Path
from datetime import datetime
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from backend.cache import cache

router = APIRouter(prefix="/admin", tags=["管理"])

RAW  = Path("data/raw")
PROC = Path("data/processed")
ROOT = Path(__file__).parent.parent.parent


# ── 数据源定义 ─────────────────────────────────────────────────────────────────

DATA_SOURCES = {
    "football_data":  {
        "label":   "football-data.org",
        "cmd":     ["python", "fetch.py", "--fd"],
        "pattern": "matches_*_fd.parquet",
    },
    "api_football": {
        "label":   "API-Football",
        "cmd":     ["python", "fetch.py", "--af"],
        "pattern": "matches_*_af.parquet",
    },
    "statsbomb": {
        "label":   "StatsBomb",
        "cmd":     ["python", "fetch_statsbomb.py", "--fetch"],
        "pattern": "sb_*.parquet",
    },
    "transfermarkt": {
        "label":   "Transfermarkt",
        "cmd":     ["python", "fetch_transfermarkt.py", "--all"],
        "pattern": "tm_*.parquet",
    },
    "weather": {
        "label":   "Open-Meteo 天气",
        "cmd":     ["python", "fetch_external.py", "--weather"],
        "pattern": "weather_venues_2026.parquet",
    },
    "odds": {
        "label":   "The Odds API",
        "cmd":     ["python", "fetch_external.py", "--odds"],
        "pattern": "odds_*.parquet",
    },
    "rankings": {
        "label":   "FIFA 排名",
        "cmd":     ["python", "fetch_external.py", "--rankings"],
        "pattern": "fifa_rankings_history.parquet",
    },
}


# ── 响应模型 ──────────────────────────────────────────────────────────────────

class SourceStatus(BaseModel):
    key:          str
    label:        str
    status:       str          # "ok" | "stale" | "missing"
    last_updated: str | None
    row_count:    int
    size_kb:      float

class DataStatus(BaseModel):
    sources:        list[SourceStatus]
    features_built: bool
    model_trained:  bool
    last_feature_build: str | None
    last_model_train:   str | None


# ── 数据状态 ──────────────────────────────────────────────────────────────────

@router.get("/data/status", response_model=DataStatus)
def data_status():
    """返回所有数据源的状态快照。"""
    import pandas as pd

    sources = []
    for key, cfg in DATA_SOURCES.items():
        files   = sorted(RAW.glob(cfg["pattern"]))
        row_cnt = 0
        size_kb = 0.0
        updated = None

        for f in files:
            size_kb += f.stat().st_size / 1024
            mtime    = datetime.fromtimestamp(f.stat().st_mtime)
            if updated is None or mtime > datetime.fromisoformat(updated):
                updated = mtime.isoformat()
            try:
                row_cnt += len(pd.read_parquet(f))
            except Exception:
                pass

        # 状态判断：有文件 + 24h内更新 = ok，有文件但旧 = stale，无文件 = missing
        if not files:
            status = "missing"
        elif updated:
            age_h = (datetime.now() - datetime.fromisoformat(updated)).total_seconds() / 3600
            status = "ok" if age_h < 24 else "stale"
        else:
            status = "missing"

        sources.append(SourceStatus(
            key=key, label=cfg["label"], status=status,
            last_updated=updated, row_count=row_cnt,
            size_kb=round(size_kb, 1),
        ))

    feat_path  = PROC / "features.parquet"
    model_path = Path("models/classifier.pkl")

    def _mtime(p: Path) -> str | None:
        return datetime.fromtimestamp(p.stat().st_mtime).isoformat() if p.exists() else None

    return DataStatus(
        sources=sources,
        features_built=feat_path.exists(),
        model_trained=model_path.exists(),
        last_feature_build=_mtime(feat_path),
        last_model_train=_mtime(model_path),
    )


# ── WebSocket：数据刷新日志 ───────────────────────────────────────────────────

@router.websocket("/ws/refresh/{source_key}")
async def ws_refresh(ws: WebSocket, source_key: str):
    """
    触发指定数据源更新，实时推送日志。
    
    客户端接收：
      {"type": "log",  "line": "拉取中..."}
      {"type": "done", "success": true}
      {"type": "error","msg": "..."}
    """
    await ws.accept()

    if source_key not in DATA_SOURCES:
        await ws.send_json({"type": "error", "msg": f"未知数据源: {source_key}"})
        await ws.close()
        return

    cfg = DATA_SOURCES[source_key]
    await ws.send_json({"type": "log", "line": f"开始更新 {cfg['label']}..."})

    try:
        proc = await asyncio.create_subprocess_exec(
            *cfg["cmd"],
            cwd=str(ROOT),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )
        async for raw_line in proc.stdout:
            line = raw_line.decode("utf-8", errors="replace").rstrip()
            if line:
                await ws.send_json({"type": "log", "line": line})

        await proc.wait()
        success = proc.returncode == 0

        # 清除相关缓存
        cache.clear()

        await ws.send_json({
            "type":    "done",
            "success": success,
            "msg":     "更新成功" if success else f"更新失败（code={proc.returncode}）",
        })
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await ws.send_json({"type": "error", "msg": str(e)})
    finally:
        try:
            await ws.close()
        except Exception:
            pass


# ── WebSocket：特征重建 & 模型重训 ───────────────────────────────────────────

@router.websocket("/ws/rebuild/features")
async def ws_rebuild_features(ws: WebSocket):
    await ws.accept()
    await _run_script_ws(ws, ["python", "features.py", "--build"])


@router.websocket("/ws/rebuild/model")
async def ws_rebuild_model(ws: WebSocket):
    await ws.accept()
    await _run_script_ws(ws, ["python", "model.py", "--train"])


async def _run_script_ws(ws: WebSocket, cmd: list[str]):
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd, cwd=str(ROOT),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )
        async for raw_line in proc.stdout:
            line = raw_line.decode("utf-8", errors="replace").rstrip()
            if line:
                await ws.send_json({"type": "log", "line": line})
        await proc.wait()
        cache.clear()
        await ws.send_json({
            "type":    "done",
            "success": proc.returncode == 0,
        })
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await ws.send_json({"type": "error", "msg": str(e)})
    finally:
        try:
            await ws.close()
        except Exception:
            pass


# ── 模型评估数据 ──────────────────────────────────────────────────────────────

@router.get("/model/metrics")
def model_metrics():
    """返回交叉验证结果。"""
    import pandas as pd
    path = Path("models/cv_results.csv")
    if not path.exists():
        return {"error": "模型尚未训练，请先运行 model.py --train"}
    df = pd.read_csv(path)
    return df.to_dict(orient="records")


@router.get("/model/importance")
def feature_importance():
    """返回特征重要性。"""
    import pandas as pd
    path = Path("models/feature_importance.csv")
    if not path.exists():
        return {"error": "特征重要性文件不存在"}
    df = pd.read_csv(path)
    return df.to_dict(orient="records")