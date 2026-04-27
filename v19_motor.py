import os, requests, json, time
from datetime import datetime, timedelta

ODDS_KEYS = [k.strip() for k in os.getenv("ODDS_KEYS", "").split(",") if k.strip()]
BASKET_KEY = os.getenv("BASKET_KEY", "").strip()

# --- 15 FUTBOL MAJÖRÜ ---
F_LIGLER = [
    {"k":"soccer_turkey_super_league", "n":"SUPER LIG", "c":"ALTIN"},
    {"k":"soccer_epl", "n":"PREMIER LEAGUE", "c":"ALTIN"},
    {"k":"soccer_spain_la_liga", "n":"LA LIGA", "c":"ALTIN"},
    {"k":"soccer_germany_bundesliga", "n":"BUNDESLIGA", "c":"ALTIN"},
    {"k":"soccer_italy_serie_a", "n":"SERIE A", "c":"ALTIN"},
    {"k":"soccer_france_ligue_one", "n":"LIGUE 1", "c":"ALTIN"},
    {"k":"soccer_uefa_champs_league", "n":"CHAMPIONS LEAGUE", "c":"ALTIN"},
    {"k":"soccer_uefa_europa_league", "n":"EUROPA LEAGUE", "c":"ALTIN"},
    {"k":"soccer_uefa_europa_conference_league", "n":"CONFERENCE LEAGUE", "c":"ALTIN"},
    {"k":"soccer_efl_champ", "n":"CHAMPIONSHIP", "c":"GÜMÜŞ"},
    {"k":"soccer_netherlands_eredivisie", "n":"EREDIVISIE", "c":"GÜMÜŞ"},
    {"k":"soccer_portugal_primeira_liga", "n":"PRIMEIRA LIGA", "c":"GÜMÜŞ"},
    {"k":"soccer_brazil_campeonato", "n":"BRAZIL SERIE A", "c":"GÜMÜŞ"},
    {"k":"soccer_argentina_primera_division", "n":"ARGENTINA PRIMERA", "c":"GÜMÜŞ"},
    {"k":"soccer_usa_mls", "n":"MLS", "c":"GÜMÜŞ"}
]

# --- 12 BASKETBOL MAJÖRÜ ---
B_LIGLER_ODDS = [
    {"k":"basketball_nba", "n":"NBA", "c":"ALTIN"},
    {"k":"basketball_euroleague", "n":"EUROLEAGUE", "c":"ALTIN"},
    {"k":"basketball_wnba", "n":"WNBA", "c":"GÜMÜŞ"},
    {"k":"basketball_ncaab", "n":"NCAA", "c":"GÜMÜŞ"}
]

# Basketbol için yerel Avrupa Ligleri (API-Sports / RapidAPI)
B_LIGLER_API = [
    {"id":"31", "n":"BSL", "c":"ALTIN"},
    {"id":"117", "n":"LIGA ACB", "c":"ALTIN"},
    {"id":"12", "n":"LEGA A", "c":"ALTIN"},
    {"id":"2", "n":"LNB PRO A", "c":"ALTIN"},
    {"id":"1", "n":"BBL", "c":"ALTIN"},
    {"id":"114", "n":"EUROCUP", "c":"ALTIN"},
    {"id":"6", "n":"BCL", "c":"ALTIN"},
    {"id":"4", "n":"VTB", "c":"ALTIN"}
]

class V19Motor:
    def __init__(self):
        self.sonuclar = []
        self.lig_sayac = {}
        # Bültende maç olmasa bile 27 ligi 0 olarak sayaca ekle (Sabit kalması için)
        for l in F_LIGLER + B_LIGLER_ODDS + B_LIGLER_API:
            self.lig_sayac[l['n']] = 0

    def format_ts(self, raw, is_odds=True):
        try:
            if is_odds: dt = datetime.strptime(raw.replace("Z",""), "%Y-%m-%dT%H:%M:%S")
            else: dt = datetime.strptime(raw.split("+")[0], "%Y-%m-%dT%H:%M:%S")
            dt_tsi = dt + timedelta(hours=3) # Türkiye Saati (TSİ)
            return dt_tsi.strftime("%Y-%m-%d"), dt_tsi.strftime("%H:%M")
        except: return "2026-01-01", "00:00"

    def run(self):
        key = ODDS_KEYS[0] if ODDS_KEYS else None
        if key:
            # 1. FUTBOL TARAMASI
            for f in F_LIGLER:
                try:
                    r = requests.get(f"https://api.the-odds-api.com/v4/sports/{f['k']}/odds/?apiKey={key}&regions=eu", timeout=10).json()
                    for m in r:
                        if 'commence_time' not in m: continue
                        t, s = self.format_ts(m['commence_time'], True)
                        self.sonuclar.append({"k": f['c'], "l": f['n'], "t": "futbol", "m": f"{m['home_team']} - {m['away_team']}", "dt": t, "tm": s})
                        self.lig_sayac[f['n']] += 1
                except: pass
            
            # 2. BASKETBOL TARAMASI (NBA & EUROLEAGUE)
            for b in B_LIGLER_ODDS:
                try:
                    r = requests.get(f"https://api.the-odds-api.com/v4/sports/{b['k']}/odds/?apiKey={key}&regions=eu", timeout=10).json()
                    for m in r:
                        if 'commence_time' not in m: continue
                        t, s = self.format_ts(m['commence_time'], True)
                        self.sonuclar.append({"k": b['c'], "l": b['n'], "t": "basketbol", "m": f"{m['home_team']} - {m['away_team']}", "dt": t, "tm": s})
                        self.lig_sayac[b['n']] += 1
                except: pass

        # 3. BASKETBOL TARAMASI (AVRUPA LİGLERİ / RAPID-API)
        if BASKET_KEY:
            for b in B_LIGLER_API:
                try:
                    r = requests.get(f"https://v1.basketball.api-sports.io/games?league={b['id']}&season=2025-2026", headers={'x-apisports-key': BASKET_KEY, 'x-rapidapi-host': 'v1.basketball.api-sports.io'}, timeout=10).json()
                    if 'response' in r:
                        for m in r['response']:
                            if m['status']['short'] == 'NS':
                                t, s = self.format_ts(m['date'], False)
                                self.sonuclar.append({"k": b['c'], "l": b['n'], "t": "basketbol", "m": f"{m['teams']['home']['name']} - {m['teams']['away']['name']}", "dt": t, "tm": s})
                                self.lig_sayac[b['n']] += 1
                except: pass

        with open("v19_rapor.json", "w", encoding="utf-8") as f:
            json.dump({"up": datetime.now().strftime("%H:%M"), "sayac": self.lig_sayac, "veriler": self.sonuclar}, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    V19Motor().run()
