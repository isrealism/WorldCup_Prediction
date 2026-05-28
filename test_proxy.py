# test_proxy.py
import os
os.environ["http_proxy"] = "http://127.0.0.1:8899"
os.environ["https_proxy"] = "http://127.0.0.1:8899"

import requests
resp = requests.get("https://api.sofascore.com/api/v1/search/Brazil", timeout=10)
print(resp.status_code, resp.json())