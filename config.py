"""
config.py  —  全局配置
"""

# ── API 密钥 ──────────────────────────────────────────────────────────────────
# football-data.org  免费注册：https://www.football-data.org/client/register
FOOTBALL_DATA_API_KEY = "b34fb24079ef4fc6ad0647eedfa56abf"

# API-Football (RapidAPI)  免费100次/天：https://rapidapi.com/api-sports/api/api-football
API_FOOTBALL_KEY = "v3.football.api-sports.io"

# The Odds API  免费500次/月：https://the-odds-api.com
ODDS_API_KEY = "aa1034581cf47957327ec5338265f0c0"

# NewsAPI  免费100次/天：https://newsapi.org
NEWS_API_KEY = "YOUR_NEWS_API_KEY"

# ── football-data.org 赛事代码 ────────────────────────────────────────────────
# 文档：https://docs.football-data.org/general/competition-codes
FD_COMPETITIONS = {
    # 免费套餐可用
    "world_cup":   "WC",
    "euro":        "EC",
    # 以下需 Tier 1（付费）或用 API-Football 补充
    "copa_america": None,
    "africa_cup":   None,
    "asia_cup":     None,
}

# 拉取的历史赛季年份（WC 是举办年，EC 同）
FD_SEASONS = {
    "world_cup": [2006, 2010, 2014, 2018, 2022],
    "euro":      [2008, 2012, 2016, 2020, 2024],
}

# ── API-Football 赛事 ID ──────────────────────────────────────────────────────
# 查询：https://v3.football.api-sports.io/leagues
AF_COMPETITIONS = {
    "copa_america":            {"id": 9,   "seasons": [2019, 2021, 2024]},
    "africa_cup":              {"id": 6,   "seasons": [2019, 2021, 2023]},
    "asia_cup":                {"id": 5,   "seasons": [2019, 2023]},
    "gold_cup":                {"id": 29,  "seasons": [2019, 2021, 2023]},
    "nations_league_uefa":     {"id": 8,   "seasons": [2020, 2022, 2024]},
    "wc_qual_europe":          {"id": 32,  "seasons": [2022, 2026]},
    "wc_qual_south_america":   {"id": 31,  "seasons": [2022, 2026]},
    "wc_qual_africa":          {"id": 30,  "seasons": [2022, 2026]},
    "wc_qual_asia":            {"id": 33,  "seasons": [2022, 2026]},
    "wc_qual_concacaf":        {"id": 34,  "seasons": [2022, 2026]},
    "international_friendlies":{"id": 10,  "seasons": [2022, 2023, 2024]},
}

# ── 2026 世界杯场馆 ───────────────────────────────────────────────────────────
VENUES_2026 = [
    {"city": "New York/NJ",  "stadium": "MetLife Stadium",        "lat": 40.8135,  "lon": -74.0745,  "altitude_m": 3},
    {"city": "Los Angeles",  "stadium": "SoFi Stadium",           "lat": 33.9535,  "lon": -118.3392, "altitude_m": 26},
    {"city": "Dallas",       "stadium": "AT&T Stadium",           "lat": 32.7479,  "lon": -97.0928,  "altitude_m": 182},
    {"city": "San Francisco","stadium": "Levi's Stadium",         "lat": 37.4033,  "lon": -121.9694, "altitude_m": 6},
    {"city": "Seattle",      "stadium": "Lumen Field",            "lat": 47.5952,  "lon": -122.3316, "altitude_m": 3},
    {"city": "Boston",       "stadium": "Gillette Stadium",       "lat": 42.0909,  "lon": -71.2643,  "altitude_m": 8},
    {"city": "Miami",        "stadium": "Hard Rock Stadium",      "lat": 25.9580,  "lon": -80.2389,  "altitude_m": 2},
    {"city": "Atlanta",      "stadium": "Mercedes-Benz Stadium",  "lat": 33.7553,  "lon": -84.4006,  "altitude_m": 301},
    {"city": "Houston",      "stadium": "NRG Stadium",            "lat": 29.6847,  "lon": -95.4107,  "altitude_m": 13},
    {"city": "Philadelphia", "stadium": "Lincoln Financial Field", "lat": 39.9008,  "lon": -75.1675,  "altitude_m": 8},
    {"city": "Kansas City",  "stadium": "Arrowhead Stadium",      "lat": 39.0489,  "lon": -94.4839,  "altitude_m": 323},
    {"city": "Toronto",      "stadium": "BMO Field",              "lat": 43.6333,  "lon": -79.4185,  "altitude_m": 76},
    {"city": "Vancouver",    "stadium": "BC Place",               "lat": 49.2767,  "lon": -123.1115, "altitude_m": 10},
    {"city": "Mexico City",  "stadium": "Estadio Azteca",         "lat": 19.3029,  "lon": -99.1505,  "altitude_m": 2240},
    {"city": "Guadalajara",  "stadium": "Estadio Akron",          "lat": 20.7063,  "lon": -103.4573, "altitude_m": 1650},
    {"city": "Monterrey",    "stadium": "Estadio BBVA",           "lat": 25.6693,  "lon": -100.2462, "altitude_m": 538},
]

# ── Transfermarkt 国家队配置 ──────────────────────────────────────────────────
TM_NATIONAL_TEAMS = {
    "Brazil":      {"slug": "brasilien",          "id": 3980},
    "France":      {"slug": "frankreich",         "id": 3377},
    "Germany":     {"slug": "deutschland",        "id": 3262},
    "Spain":       {"slug": "spanien",            "id": 3375},
    "Argentina":   {"slug": "argentinien",        "id": 3437},
    "England":     {"slug": "england",            "id": 3518},
    "Portugal":    {"slug": "portugal",           "id": 3462},
    "Netherlands": {"slug": "niederlande",        "id": 3396},
    "Belgium":     {"slug": "belgien",            "id": 3382},
    "USA":         {"slug": "vereinigte-staaten", "id": 3438},
    "Mexico":      {"slug": "mexiko",             "id": 3439},
    "Canada":      {"slug": "kanada",             "id": 10703},
    "Japan":       {"slug": "japan",              "id": 3476},
    "South Korea": {"slug": "südkorea",           "id": 3499},
    "Morocco":     {"slug": "marokko",            "id": 3490},
    "Senegal":     {"slug": "senegal",            "id": 3491},
    "Croatia":     {"slug": "kroatien",           "id": 3556},
    "Uruguay":     {"slug": "uruguay",            "id": 3444},
    "Switzerland": {"slug": "schweiz",            "id": 3438},
    "Denmark":     {"slug": "dänemark",           "id": 3384},
}

# ── StatsBomb 开放赛事 ────────────────────────────────────────────────────────
STATSBOMB_COMPETITIONS = {
    "world_cup_2018":    {"competition_id": 43, "season_id": 3},
    "euro_2020":         {"competition_id": 55, "season_id": 43},
    "euro_2016":         {"competition_id": 55, "season_id": 44},
    "copa_america_2021": {"competition_id": 223,"season_id": 44},
    "africa_cup_2021":   {"competition_id": 6,  "season_id": 44},
}

DATA_DIR  = "data/raw"
CACHE_DIR = ".cache"