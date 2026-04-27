import os, requests, json, time
from datetime import datetime, timedelta

# --- API ANAHTARLARI ---
ODDS_API_POOL = [k.strip() for k in os.getenv("ODDS_KEYS", "").split(",") if k.strip()]

# --- MAJÖR LİGLER ---
F_LIGLER = [
    {"k":"soccer_turkey_super_league", "n":"SUPER LIG", "c":"ALTIN"},
    {"k":"soccer_epl", "n":"PREMIER LEAGUE", "c":"ALTIN"},
    {"k":"soccer_spain_la_liga", "n":"LA LIGA", "c":"ALTIN"},
    {"k":"soccer_germany_bundesliga", "n":"BUNDESLIGA", "c":"ALTIN"},
    {"k":"soccer_italy_serie_a", "n":"SERIE A", "c":"ALTIN"},
    {"k":"soccer_france_ligue_one", "n":"LIGUE 1", "c":"ALTIN"},
    {"k":"soccer_uefa_champs_league", "n":"CHAMPIONS LEAGUE", "c":"ALTIN"},
    {"k":"soccer_uefa_europa_league", "n":"EUROPA LEAGUE", "c":"ALTIN"},
    {"k":"soccer_uefa_europa_conference_league", "n":"CONFERENCE LEAGUE", "c":"ALTIN"}
]

B_LIGLER = [
    {"k":"basketball_nba", "n":"NBA", "c":"ALTIN"},
    {"k":"basketball_euroleague", "n":"EUROLEAGUE", "c":"ALTIN"}
]

class V19Motor:
    def __init__(self):
        self.sonuclar = []
        self.lig_sayac = {}

    def format_ts(self, raw):
        try:
            dt = datetime.strptime(raw.replace("Z",""), "%Y-%m-%dT%H:%M:%S")
            dt_tsi = dt + timedelta(hours=3) # TSİ
            return dt_tsi.strftime("%Y-%m-%d"), dt_tsi.strftime("%H:%M")
        except: return "2026-01-01", "00:00"

    def run(self):
        key = ODDS_API_POOL[0] if ODDS_API_POOL else None
        api_basarili = False

        if key:
            # 1. FUTBOL
            for f in F_LIGLER:
                try:
                    r = requests.get(f"https://api.the-odds-api.com/v4/sports/{f['k']}/odds/?apiKey={key}&regions=eu,uk", timeout=10)
                    if r.status_code == 200:
                        api_basarili = True
                        for m in r.json():
                            t, s = self.format_ts(m['commence_time'])
                            self.sonuclar.append({"k": f['c'], "l": f['n'], "t": "futbol", "m": f"{m['home_team']} - {m['away_team']}", "dt": t, "tm": s})
                            self.lig_sayac[f['n']] = self.lig_sayac.get(f['n'], 0) + 1
                except: pass
            
            # 2. BASKETBOL
            for b in B_LIGLER:
                try:
                    r = requests.get(f"https://api.the-odds-api.com/v4/sports/{b['k']}/odds/?apiKey={key}&regions=eu,uk", timeout=10)
                    if r.status_code == 200:
                        api_basarili = True
                        for m in r.json():
                            t, s = self.format_ts(m['commence_time'])
                            self.sonuclar.append({"k": b['c'], "l": b['n'], "t": "basketbol", "m": f"{m['home_team']} - {m['away_team']}", "dt": t, "tm": s})
                            self.lig_sayac[b['n']] = self.lig_sayac.get(b['n'], 0) + 1
                except: pass

        # SİSTEM KORUMASI: Eğer veri çekilemediyse ekranı boş bırakma, uyarı bas!
        if not api_basarili or len(self.sonuclar) == 0:
            bugun = datetime.now().strftime("%Y-%m-%d")
            saat = datetime.now().strftime("%H:%M")
            self.sonuclar.append({
                "k": "ALTIN", "l": "SİSTEM UYARISI", "t": "futbol", 
                "m": "API Şifresi Hatalı veya Bülten Boş", "dt": bugun, "tm": saat
            })
            self.sonuclar.append({
                "k": "ALTIN", "l": "SİSTEM UYARISI", "t": "basketbol", 
                "m": "API Şifresi Hatalı veya Bülten Boş", "dt": bugun, "tm": saat
            })
            self.lig_sayac["SİSTEM UYARISI"] = 2

        with open("v19_rapor.json", "w", encoding="utf-8") as f:
            json.dump({"up": datetime.now().strftime("%H:%M"), "sayac": self.lig_sayac, "veriler": self.sonuclar}, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    V19Motor().run()
