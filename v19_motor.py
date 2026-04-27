import os, requests, json, time
from datetime import datetime, timedelta

ODDS_API_POOL = [k.strip() for k in os.getenv("ODDS_KEYS", "").split(",") if k.strip()]

# Tam 27 Liglik Liste
LIGLER = [
    {"k":"soccer_turkey_super_league", "n":"SÜPER LİG", "t":"futbol", "f":"tr", "c":"TÜRKİYE"},
    {"k":"soccer_epl", "n":"PREMIER LEAGUE", "t":"futbol", "f":"gb-eng", "c":"İNGİLTERE"},
    {"k":"soccer_spain_la_liga", "n":"LA LIGA", "t":"futbol", "f":"es", "c":"İSPANYA"},
    {"k":"soccer_germany_bundesliga", "n":"BUNDESLIGA", "t":"futbol", "f":"de", "c":"ALMANYA"},
    {"k":"soccer_italy_serie_a", "n":"SERIE A", "t":"futbol", "f":"it", "c":"İTALYA"},
    {"k":"soccer_france_ligue_one", "n":"LIGUE 1", "t":"futbol", "f":"fr", "c":"FRANSA"},
    {"k":"soccer_uefa_champs_league", "n":"CHAMPIONS LEAGUE", "t":"futbol", "f":"eu", "c":"AVRUPA"},
    {"k":"soccer_uefa_europa_league", "n":"EUROPA LEAGUE", "t":"futbol", "f":"eu", "c":"AVRUPA"},
    {"k":"soccer_uefa_europa_conference_league", "n":"CONFERENCE LEAGUE", "t":"futbol", "f":"eu", "c":"AVRUPA"},
    {"k":"soccer_efl_champ", "n":"CHAMPIONSHIP", "t":"futbol", "f":"gb-eng", "c":"İNGİLTERE"},
    {"k":"soccer_usa_mls", "n":"MLS", "t":"futbol", "f":"us", "c":"AMERİKA"},
    {"k":"basketball_nba", "n":"NBA", "t":"basketbol", "f":"us", "c":"AMERİKA"},
    {"k":"basketball_euroleague", "n":"EUROLEAGUE", "t":"basketbol", "f":"eu", "c":"AVRUPA"},
    {"k":"basketball_turkey_bsl", "n":"BSL", "t":"basketbol", "f":"tr", "c":"TÜRKİYE"},
    {"k":"basketball_spain_liga_endesa", "n":"LIGA ACB", "t":"basketbol", "f":"es", "c":"İSPANYA"}
]

class V19Master:
    def __init__(self):
        self.key_index = 0
        self.results = []
        self.stats = {f"{l['c']} - {l['n']}": 0 for l in LIGLER}

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
        if not ODDS_API_POOL: return
        for lig in LIGLER:
            data = self.fetch(lig['k'])
            lig_full_name = f"{lig['c']} - {lig['n']}"
            for m in data:
                try:
                    dt = datetime.strptime(m['commence_time'].replace("Z",""), "%Y-%m-%dT%H:%M:%S") + timedelta(hours=3)
                    self.results.append({
                        "t": lig['t'], "l": lig_full_name, "f": lig['f'],
                        "m": f"{m['home_team']} - {m['away_team']}",
                        "dt": dt.strftime("%Y-%m-%d"), "tm": dt.strftime("%H:%M")
                    })
                    self.stats[lig_full_name] = self.stats.get(lig_full_name, 0) + 1
                except: continue
            time.sleep(0.5)

        with open("v19_rapor.json", "w", encoding="utf-8") as f:
            json.dump({"veriler": self.results, "sayac": self.stats}, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    V19Master().run()
