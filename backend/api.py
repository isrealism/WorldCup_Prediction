"""
api.py — FastAPI 主入口

启动:
    uvicorn backend.api:app --reload --host 0.0.0.0 --port 8000
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.routers import predict, simulate, teams, admin

app = FastAPI(
    title="世界杯预测系统 API",
    version="1.0.0",
    description="泊松进球回归 + 蒙特卡洛赛程模拟",
)

# ── CORS（开发阶段放开，生产环境收紧）────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 路由挂载 ──────────────────────────────────────────────────────────────────
app.include_router(predict.router,  prefix="/api")
app.include_router(simulate.router, prefix="/api")
app.include_router(teams.router,    prefix="/api")
app.include_router(admin.router,    prefix="/api")

# ── 健康检查 ──────────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(status_code=500, content={"detail": str(exc)})