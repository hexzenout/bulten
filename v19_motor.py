import os, requests, json, time
from datetime import datetime, timedelta

# --- API ŞİFRE HAVUZU (Tüm 20-30 şifreyi okur) ---
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
        self.odds_index = 0 # Şifre sırası

    def format_ts(self, raw):
        try:
            dt = datetime.strptime(raw.replace("Z",""), "%Y-%m-%dT%H:%M:%S")
            dt_tsi = dt + timedelta(hours=3) # TSİ Çevrimi
            return dt_tsi.strftime("%Y-%m-%d"), dt_tsi.strftime("%H:%M")
        except: return "2026-01-01", "00:00"

    def fetch_data(self, endpoint):
        # ŞİFRE ROTASYONU: Biri patlarsa diğerine geçer
        while self.odds_index < len(ODDS_API_POOL):
            key = ODDS_API_POOL[self.odds_index]
            url = f"https://api.the-odds-api.com/v4/sports/{endpoint}/odds/?apiKey={key}&regions=eu"
            try:
                r = requests.get(url, timeout=10)
                if r.status_code == 200:
                    return r.json()
                elif r.status_code in [429, 401]:
                    # Kota bitti veya şifre yanlış, sıradaki şifreye geç!
                    self.odds_index += 1
                    continue
                else:
                    break
            except:
                break
        return []

    def run(self):
        if not ODDS_API_POOL:
            return # Şifre girilmediyse dur

        # 1. FUTBOL TARAMASI
        for f in F_LIGLER:
            data = self.fetch_data(f['k'])
            for m in data:
                t, s = self.format_ts(m['commence_time'])
                self.sonuclar.append({"k": f['c'], "l": f['n'], "t": "futbol", "m": f"{m['home_team']} - {m['away_team']}", "dt": t, "tm": s})
                self.lig_sayac[f['n']] = self.lig_sayac.get(f['n'], 0) + 1
            time.sleep(0.5)
        
        # 2. BASKETBOL TARAMASI
        for b in B_LIGLER:
            data = self.fetch_data(b['k'])
            for m in data:
                t, s = self.format_ts(m['commence_time'])
                self.sonuclar.append({"k": b['c'], "l": b['n'], "t": "basketbol", "m": f"{m['home_team']} - {m['away_team']}", "dt": t, "tm": s})
                self.lig_sayac[b['n']] = self.lig_sayac.get(b['n'], 0) + 1
            time.sleep(0.5)

        # Temiz veriyi JSON'a yazdır
        with open("v19_rapor.json", "w", encoding="utf-8") as f:
            json.dump({"up": datetime.now().strftime("%H:%M"), "sayac": self.lig_sayac, "veriler": self.sonuclar}, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    V19Motor().run()
