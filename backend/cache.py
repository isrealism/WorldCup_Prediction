"""
cache.py — 内存缓存（TTL）
轻量实现，不依赖 Redis，适合单机部署。
"""

import time
import hashlib
import json
from typing import Any

class TTLCache:
    def __init__(self):
        self._store: dict[str, tuple[Any, float]] = {}

    def _key(self, *args, **kwargs) -> str:
        raw = json.dumps({"a": args, "k": kwargs}, sort_keys=True, default=str)
        return hashlib.md5(raw.encode()).hexdigest()

    def get(self, key: str) -> Any | None:
        if key in self._store:
            val, expires = self._store[key]
            if time.time() < expires:
                return val
            del self._store[key]
        return None

    def set(self, key: str, value: Any, ttl: int = 3600):
        self._store[key] = (value, time.time() + ttl)

    def delete(self, key: str):
        self._store.pop(key, None)

    def clear(self):
        self._store.clear()

    def make_key(self, *args, **kwargs) -> str:
        return self._key(*args, **kwargs)

cache = TTLCache()