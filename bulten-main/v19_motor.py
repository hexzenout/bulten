import os
import json
import time
import requests
from datetime import datetime, timedelta, timezone

# ============================================================
# V19 RADAR MOTOR - API KALKANI + AKILLI JSON MOTORU
# ============================================================

ODDS_API_POOL = [
    k.strip()
    for k in os.getenv("ODDS_KEYS", "").split(",")
    if k.strip()
]

OUTPUT_FILE = "v19_rapor.json"
TR_TIME_OFFSET = 3
REQUEST_DELAY = 0.6
REQUEST_TIMEOUT = 12

LIGLER = [
    {"k": "soccer_turkey_super_league", "n": "SÜPER LİG", "t": "futbol", "f": "tr", "c": "TÜRKİYE", "vip": 100},
    {"k": "soccer_epl", "n": "PREMIER LEAGUE", "t": "futbol", "f": "gb-eng", "c": "İNGİLTERE", "vip": 99},
    {"k": "soccer_spain_la_liga", "n": "LA LIGA", "t": "futbol", "f": "es", "c": "İSPANYA", "vip": 98},
    {"k": "soccer_germany_bundesliga", "n": "BUNDESLIGA", "t": "futbol", "f": "de", "c": "ALMANYA", "vip": 97},
    {"k": "soccer_italy_serie_a", "n": "SERIE A", "t": "futbol", "f": "it", "c": "İTALYA", "vip": 96},
    {"k": "soccer_france_ligue_one", "n": "LIGUE 1", "t": "futbol", "f": "fr", "c": "FRANSA", "vip": 95},

    {"k": "soccer_uefa_champs_league", "n": "CHAMPIONS LEAGUE", "t": "futbol", "f": "eu", "c": "AVRUPA", "vip": 94},
    {"k": "soccer_uefa_europa_league", "n": "EUROPA LEAGUE", "t": "futbol", "f": "eu", "c": "AVRUPA", "vip": 93},
    {"k": "soccer_uefa_europa_conference_league", "n": "CONFERENCE LEAGUE", "t": "futbol", "f": "eu", "c": "AVRUPA", "vip": 92},

    {"k": "soccer_efl_champ", "n": "CHAMPIONSHIP", "t": "futbol", "f": "gb-eng", "c": "İNGİLTERE", "vip": 70},
    {"k": "soccer_netherlands_eredivisie", "n": "EREDIVISIE", "t": "futbol", "f": "nl", "c": "HOLLANDA", "vip": 69},
    {"k": "soccer_portugal_primeira_liga", "n": "PRIMEIRA LIGA", "t": "futbol", "f": "pt", "c": "PORTEKİZ", "vip": 68},
    {"k": "soccer_brazil_campeonato", "n": "BRAZIL SERIE A", "t": "futbol", "f": "br", "c": "BREZİLYA", "vip": 67},
    {"k": "soccer_argentina_primera_division", "n": "ARGENTINA PRIMERA", "t": "futbol", "f": "ar", "c": "ARJANTİN", "vip": 66},
    {"k": "soccer_usa_mls", "n": "MLS", "t": "futbol", "f": "us", "c": "AMERİKA", "vip": 65},

    {"k": "basketball_nba", "n": "NBA", "t": "basketbol", "f": "us", "c": "AMERİKA", "vip": 100},
    {"k": "basketball_euroleague", "n": "EUROLEAGUE", "t": "basketbol", "f": "eu", "c": "AVRUPA", "vip": 99},
    {"k": "basketball_wnba", "n": "WNBA", "t": "basketbol", "f": "us", "c": "AMERİKA", "vip": 90},
    {"k": "basketball_ncaab", "n": "NCAA", "t": "basketbol", "f": "us", "c": "AMERİKA", "vip": 80},
    {"k": "basketball_turkey_bsl", "n": "BSL", "t": "basketbol", "f": "tr", "c": "TÜRKİYE", "vip": 79},
    {"k": "basketball_spain_liga_endesa", "n": "LIGA ACB", "t": "basketbol", "f": "es", "c": "İSPANYA", "vip": 78},
    {"k": "basketball_italy_lega_a", "n": "LEGA A", "t": "basketbol", "f": "it", "c": "İTALYA", "vip": 77},
    {"k": "basketball_france_lnb_pro_a", "n": "LNB PRO A", "t": "basketbol", "f": "fr", "c": "FRANSA", "vip": 76},
    {"k": "basketball_germany_bbl", "n": "BBL", "t": "basketbol", "f": "de", "c": "ALMANYA", "vip": 75},
    {"k": "basketball_eurocup", "n": "EUROCUP", "t": "basketbol", "f": "eu", "c": "AVRUPA", "vip": 74},
    {"k": "basketball_champions_league", "n": "BCL", "t": "basketbol", "f": "eu", "c": "AVRUPA", "vip": 73},
    {"k": "basketball_vtb_united_league", "n": "VTB", "t": "basketbol", "f": "ru", "c": "RUSYA", "vip": 72},
]


class V19Master:
    def __init__(self):
        self.key_index = 0
        self.results = []
        self.logs = []
        self.stats = {self.league_name(lig): 0 for lig in LIGLER}

    def log(self, msg):
        line = f"[{self.tr_now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}"
        print(line)
        self.logs.append(line)

    def tr_now(self):
        return datetime.utcnow() + timedelta(hours=TR_TIME_OFFSET)

    def league_name(self, lig):
        return f"{lig['c']} - {lig['n']}"

    def load_old_json(self):
        if not os.path.exists(OUTPUT_FILE):
            return None

        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None

    def current_key(self):
        if self.key_index >= len(ODDS_API_POOL):
            return None
        return ODDS_API_POOL[self.key_index]

    def fetch_league(self, lig_key):
        while self.key_index < len(ODDS_API_POOL):
            key = self.current_key()

            url = (
                f"https://api.the-odds-api.com/v4/sports/{lig_key}/odds/"
                f"?apiKey={key}&regions=eu&markets=h2h&oddsFormat=decimal"
            )

            try:
                response = requests.get(url, timeout=REQUEST_TIMEOUT)

                remaining = response.headers.get("x-requests-remaining", "?")
                used = response.headers.get("x-requests-used", "?")

                if response.status_code == 200:
                    self.log(f"OK {lig_key} | key#{self.key_index + 1} | remaining={remaining} used={used}")
                    return response.json()

                if response.status_code in [401, 403, 429]:
                    self.log(f"KEY LIMIT/AUTH {lig_key} | status={response.status_code} | key#{self.key_index + 1} değişiyor")
                    self.key_index += 1
                    continue

                self.log(f"API HATA {lig_key} | status={response.status_code} | body={response.text[:150]}")
                return []

            except requests.exceptions.Timeout:
                self.log(f"TIMEOUT {lig_key} | key#{self.key_index + 1}")
                return []

            except Exception as e:
                self.log(f"REQUEST ERROR {lig_key} | {str(e)}")
                return []

        self.log(f"TÜM API KEYLER TÜKENDİ | {lig_key}")
        return []

    def parse_match_time(self, commence_time):
        raw = commence_time.replace("Z", "")
        dt = datetime.strptime(raw, "%Y-%m-%dT%H:%M:%S")
        dt = dt + timedelta(hours=TR_TIME_OFFSET)
        return dt

    def normalize_match(self, lig, match):
        dt = self.parse_match_time(match["commence_time"])
        lig_full_name = self.league_name(lig)

        home = match.get("home_team", "").strip()
        away = match.get("away_team", "").strip()

        if not home or not away:
            return None

        return {
            "t": lig["t"],
            "l": lig_full_name,
            "f": lig["f"],
            "m": f"{home} - {away}",
            "dt": dt.strftime("%Y-%m-%d"),
            "tm": dt.strftime("%H:%M"),
            "vip": lig.get("vip", 0),
        }

    def build_warning_json(self, message):
        today = self.tr_now().strftime("%Y-%m-%d")
        return {
            "up": self.tr_now().strftime("%H:%M"),
            "mode": "warning",
            "veriler": [
                {
                    "t": "futbol",
                    "l": "SİSTEM UYARISI",
                    "f": "un",
                    "m": message,
                    "dt": today,
                    "tm": "00:00",
                    "vip": 0,
                }
            ],
            "sayac": {"SİSTEM UYARISI": 1},
            "logs": self.logs[-50:],
        }

    def sort_results(self):
        self.results.sort(
            key=lambda x: (
                x.get("dt", "9999-99-99"),
                x.get("tm", "99:99"),
                -int(x.get("vip", 0)),
                x.get("l", ""),
            )
        )

    def should_preserve_old_json(self):
        old = self.load_old_json()
        if not old:
            return False

        old_items = old.get("veriler", [])
        if not old_items:
            return False

        return True

    def save_json(self):
        self.sort_results()

        if len(self.results) == 0:
            if self.should_preserve_old_json():
                self.log("YENİ VERİ BOŞ GELDİ | Eski v19_rapor.json korunuyor.")
                return False

            payload = self.build_warning_json("API VERİSİ BOŞ GELDİ")
        else:
            payload = {
                "up": self.tr_now().strftime("%H:%M"),
                "mode": "fixture",
                "veriler": self.results,
                "sayac": self.stats,
                "logs": self.logs[-80:],
            }

        old = self.load_old_json()

        if old:
            old_compare = {
                "veriler": old.get("veriler", []),
                "sayac": old.get("sayac", {}),
            }
            new_compare = {
                "veriler": payload.get("veriler", []),
                "sayac": payload.get("sayac", {}),
            }

            if old_compare == new_compare:
                self.log("DEĞİŞİKLİK YOK | JSON yeniden yazılmadı.")
                return False

        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=4)

        self.log(f"JSON GÜNCELLENDİ | toplam maç: {len(self.results)}")
        return True

    def run(self):
        self.log("V19 RADAR MOTOR BAŞLADI")

        if not ODDS_API_POOL:
            self.log("ODDS_KEYS BULUNAMADI")
            self.results = []
            self.stats = {}
            payload = self.build_warning_json("API ŞİFRESİ EKSİK")

            with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False, indent=4)

            return

        for lig in LIGLER:
            lig_full_name = self.league_name(lig)
            self.log(f"LİG TARAMA BAŞLADI | {lig_full_name}")

            data = self.fetch_league(lig["k"])

            count = 0
            for item in data:
                try:
                    normalized = self.normalize_match(lig, item)
                    if normalized:
                        self.results.append(normalized)
                        self.stats[lig_full_name] += 1
                        count += 1
                except Exception as e:
                    self.log(f"MAÇ PARSE HATASI | {lig_full_name} | {str(e)}")
                    continue

            self.log(f"LİG TAMAMLANDI | {lig_full_name} | {count} maç")

            time.sleep(REQUEST_DELAY)

        self.save_json()
        self.log("V19 RADAR MOTOR BİTTİ")


if __name__ == "__main__":
    V19Master().run()
