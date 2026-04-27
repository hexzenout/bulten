import os, requests, json, time
from datetime import datetime, timedelta

# GitHub Secrets'tan gelen şifre havuzu
ODDS_API_POOL = [k.strip() for k in os.getenv("ODDS_KEYS", "").split(",") if k.strip()]

# --- 15 FUTBOL + 12 BASKETBOL MAJÖR RADARI ---
LIGLER = [
    {"k":"soccer_turkey_super_league", "n":"SUPER LIG", "t":"futbol", "f":"tr"},
    {"k":"soccer_epl", "n":"PREMIER LEAGUE", "t":"futbol", "f":"gb-eng"},
    {"k":"soccer_spain_la_liga", "n":"LA LIGA", "t":"futbol", "f":"es"},
    {"k":"soccer_germany_bundesliga", "n":"BUNDESLIGA", "t":"futbol", "f":"de"},
    {"k":"soccer_italy_serie_a", "n":"SERIE A", "t":"futbol", "f":"it"},
    {"k":"soccer_france_ligue_one", "n":"LIGUE 1", "t":"futbol", "f":"fr"},
    {"k":"soccer_uefa_champs_league", "n":"CHAMPIONS LEAGUE", "t":"futbol", "f":"eu"},
    {"k":"soccer_uefa_europa_league", "n":"EUROPA LEAGUE", "t":"futbol", "f":"eu"},
    {"k":"soccer_uefa_europa_conference_league", "n":"CONFERENCE LEAGUE", "t":"futbol", "f":"eu"},
    {"k":"soccer_efl_champ", "n":"CHAMPIONSHIP", "t":"futbol", "f":"gb-eng"},
    {"k":"soccer_netherlands_eredivisie", "n":"EREDIVISIE", "t":"futbol", "f":"nl"},
    {"k":"soccer_portugal_primeira_liga", "n":"PRIMEIRA LIGA", "t":"futbol", "f":"pt"},
    {"k":"soccer_brazil_campeonato", "n":"BRAZIL SERIE A", "t":"futbol", "f":"br"},
    {"k":"soccer_argentina_primera_division", "n":"ARGENTINA PRIMERA", "t":"futbol", "f":"ar"},
    {"k":"soccer_usa_mls", "n":"MLS", "t":"futbol", "f":"us"},
    {"k":"basketball_nba", "n":"NBA", "t":"basketbol", "f":"us"},
    {"k":"basketball_euroleague", "n":"EUROLEAGUE", "t":"basketbol", "f":"eu"},
    {"k":"basketball_wnba", "n":"WNBA", "t":"basketbol", "f":"us"},
    {"k":"basketball_ncaab", "n":"NCAA", "t":"basketbol", "f":"us"},
    {"k":"basketball_turkey_bsl", "n":"BSL", "t":"basketbol", "f":"tr"},
    {"k":"basketball_spain_liga_endesa", "n":"LIGA ACB", "t":"basketbol", "f":"es"},
    {"k":"basketball_italy_lega_a", "n":"LEGA A", "t":"basketbol", "f":"it"},
    {"k":"basketball_france_lnb_pro_a", "n":"LNB PRO A", "t":"basketbol", "f":"fr"},
    {"k":"basketball_germany_bbl", "n":"BBL", "t":"basketbol", "f":"de"},
    {"k":"basketball_eurocup", "n":"EUROCUP", "t":"basketbol", "f":"eu"},
    {"k":"basketball_champions_league", "n":"BCL", "t":"basketbol", "f":"eu"},
    {"k":"basketball_vtb_united_league", "n":"VTB", "t":"basketbol", "f":"ru"}
]

class V19Master:
    def __init__(self):
        self.key_index = 0
        self.results = []
        self.stats = {l['n']: 0 for l in LIGLER}

    def fetch(self, lig_key):
        while self.key_index < len(ODDS_API_POOL):
            key = ODDS_API_POOL[self.key_index]
            url = f"https://api.the-odds-api.com/v4/sports/{lig_key}/odds/?apiKey={key}&regions=eu"
            try:
                r = requests.get(url, timeout=10)
                if r.status_code == 200: return r.json()
                elif r.status_code in [401, 429]: self.key_index += 1
                else: break
            except: break
        return []

    def run(self):
        if not ODDS_API_POOL:
            # Şifre yoksa uyarı bas
            self.results.append({"t": "futbol", "l": "SİSTEM UYARISI", "f": "un", "m": "API ŞİFRESİ GİRİLMEDİ", "dt": datetime.now().strftime("%Y-%m-%d"), "tm": "00:00"})
            self.stats["SİSTEM UYARISI"] = 1
        else:
            for lig in LIGLER:
                data = self.fetch(lig['k'])
                for m in data:
                    try:
                        dt = datetime.strptime(m['commence_time'].replace("Z",""), "%Y-%m-%dT%H:%M:%S") + timedelta(hours=3)
                        self.results.append({
                            "t": lig['t'], "l": lig['n'], "f": lig['f'],
                            "m": f"{m['home_team']} - {m['away_team']}",
                            "dt": dt.strftime("%Y-%m-%d"), "tm": dt.strftime("%H:%M")
                        })
                        self.stats[lig['n']] += 1
                    except: continue
                time.sleep(0.5)

        with open("v19_rapor.json", "w", encoding="utf-8") as f:
            json.dump({"up": datetime.now().strftime("%H:%M"), "veriler": self.results, "sayac": self.stats}, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    V19Master().run()
