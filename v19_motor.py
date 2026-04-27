import os, requests, json, time
from datetime import datetime, timedelta

ODDS_KEYS = [k.strip() for k in os.getenv("ODDS_KEYS", "").split(",") if k.strip()]
BASKET_KEY = os.getenv("BASKET_KEY", "").strip()

# --- 27 MAJÖR LİGİN TAM LİSTESİ ---
F_LIGLER = [
    {"k":"soccer_turkey_super_league", "n":"SUPER LIG", "f":"tr"},
    {"k":"soccer_epl", "n":"PREMIER LEAGUE", "f":"gb-eng"},
    {"k":"soccer_spain_la_liga", "n":"LA LIGA", "f":"es"},
    {"k":"soccer_germany_bundesliga", "n":"BUNDESLIGA", "f":"de"},
    {"k":"soccer_italy_serie_a", "n":"SERIE A", "f":"it"},
    {"k":"soccer_france_ligue_one", "n":"LIGUE 1", "f":"fr"},
    {"k":"soccer_uefa_champs_league", "n":"CHAMPIONS LEAGUE", "f":"eu"},
    {"k":"soccer_uefa_europa_league", "n":"EUROPA LEAGUE", "f":"eu"},
    {"k":"soccer_uefa_europa_conference_league", "n":"CONFERENCE LEAGUE", "f":"eu"},
    {"k":"soccer_efl_champ", "n":"CHAMPIONSHIP", "f":"gb-eng"},
    {"k":"soccer_netherlands_eredivisie", "n":"EREDIVISIE", "f":"nl"},
    {"k":"soccer_portugal_primeira_liga", "n":"PRIMEIRA LIGA", "f":"pt"},
    {"k":"soccer_brazil_campeonato", "n":"BRAZIL SERIE A", "f":"br"},
    {"k":"soccer_argentina_primera_division", "n":"ARGENTINA PRIMERA", "f":"ar"},
    {"k":"soccer_usa_mls", "n":"MLS", "f":"us"}
]

B_LIGLER = [
    {"k":"basketball_nba", "n":"NBA", "f":"us"},
    {"k":"basketball_euroleague", "n":"EUROLEAGUE", "f":"eu"},
    {"k":"basketball_wnba", "n":"WNBA", "f":"us"},
    {"k":"basketball_ncaab", "n":"NCAA", "f":"us"}
]

class V19MasterMotor:
    def __init__(self):
        self.sonuclar = []
        self.lig_sayac = {l['n']: 0 for l in F_LIGLER + B_LIGLER}

    def format_tsi(self, raw):
        try:
            dt = datetime.strptime(raw.replace("Z",""), "%Y-%m-%dT%H:%M:%S")
            dt_tsi = dt + timedelta(hours=3)
            return dt_tsi.strftime("%Y-%m-%d"), dt_tsi.strftime("%H:%M")
        except: return "2026-04-28", "00:00"

    def run(self):
        key = ODDS_KEYS[0] if ODDS_KEYS else None
        if not key: return

        # FUTBOL TARAMASI
        for f in F_LIGLER:
            try:
                r = requests.get(f"https://api.the-odds-api.com/v4/sports/{f['k']}/odds/?apiKey={key}&regions=eu", timeout=10).json()
                for m in r:
                    t, s = self.format_tsi(m['commence_time'])
                    self.sonuclar.append({"k":"ALTIN", "l":f['n'], "t":"futbol", "m":f"{m['home_team']} - {m['away_team']}", "dt":t, "tm":s, "f":f['f']})
                    self.lig_sayac[f['n']] += 1
            except: pass

        # BASKETBOL TARAMASI
        for b in B_LIGLER:
            try:
                r = requests.get(f"https://api.the-odds-api.com/v4/sports/{b['k']}/odds/?apiKey={key}&regions=eu", timeout=10).json()
                for m in r:
                    t, s = self.format_tsi(m['commence_time'])
                    self.sonuclar.append({"k":"ALTIN", "l":b['n'], "t":"basketbol", "m":f"{m['home_team']} - {m['away_team']}", "dt":t, "tm":s, "f":b['f']})
                    self.lig_sayac[b['n']] += 1
            except: pass

        with open("v19_rapor.json", "w", encoding="utf-8") as f:
            json.dump({"up": datetime.now().strftime("%H:%M"), "sayac": self.lig_sayac, "veriler": self.sonuclar}, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    V19MasterMotor().run()
