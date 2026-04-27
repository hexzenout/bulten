import os, requests, json, time
from datetime import datetime, timedelta

# --- ŞİFRE HAVUZU ---
ODDS_API_POOL = [k.strip() for k in os.getenv("ODDS_KEYS", "").split(",") if k.strip()]
BASKET_KEY = os.getenv("BASKET_KEY", "").strip()

# --- KESİN LİG NİZAMI (SABİT RADAR) ---
ALTIN_F = ["SUPER LIG", "PREMIER LEAGUE", "LA LIGA", "BUNDESLIGA", "SERIE A", "LIGUE 1", "CHAMPIONS LEAGUE", "EUROPA LEAGUE", "CONFERENCE LEAGUE"]
ALTIN_B = ["NBA", "EUROLEAGUE", "BSL", "LIGA ACB", "LEGA A", "BBL"]

class V19Intelligence:
    def __init__(self):
        self.odds_index = 0
        self.sonuclar = []
        self.lig_sayac = {l: 0 for l in ALTIN_F + ALTIN_B}

    def get_odds_key(self):
        if self.odds_index < len(ODDS_API_POOL): return ODDS_API_POOL[self.odds_index]
        return None

    def format_zaman(self, raw):
        try:
            # UTC'den TSİ'ye (+3) Sabitleme
            dt = datetime.strptime(raw.replace("Z",""), "%Y-%m-%dT%H:%M:%S")
            dt_tsi = dt + timedelta(hours=3)
            return dt_tsi.strftime("%Y-%m-%d"), dt_tsi.strftime("%H:%M")
        except: return "2026-01-01", "00:00"

    def operasyon(self):
        key = self.get_odds_key()
        if not key: return

        # FUTBOL TARAMASI (THE ODDS API)
        f_ligler = [
            {"k": "soccer_turkey_super_league", "n": "SUPER LIG"},
            {"k": "soccer_epl", "n": "PREMIER LEAGUE"},
            {"k": "soccer_spain_la_liga", "n": "LA LIGA"},
            {"k": "soccer_germany_bundesliga", "n": "BUNDESLIGA"},
            {"k": "soccer_italy_serie_a", "n": "SERIE A"},
            {"k": "soccer_france_ligue_one", "n": "LIGUE 1"},
            {"k": "soccer_uefa_champs_league", "n": "CHAMPIONS LEAGUE"}
        ]

        for lig in f_ligler:
            try:
                r = requests.get(f"https://api.the-odds-api.com/v4/sports/{lig['k']}/odds/?apiKey={key}&regions=eu", timeout=10).json()
                for m in r:
                    t, s = self.format_zaman(m['commence_time'])
                    mac_adi = f"{m['home_team']} - {m['away_team']}"
                    self.sonuclar.append({
                        "kategori": "ALTIN", "lig": lig['n'], "tur": "futbol",
                        "mac": mac_adi, "tarih": t, "saat": s, "uyari": "📡 RADAR AKTİF"
                    })
                    if lig['n'] in self.lig_sayac: self.lig_sayac[lig['n']] += 1
            except: pass
            time.sleep(0.5)

        # BASKETBOL TARAMASI (NBA & EUROLEAGUE)
        b_ligler = [{"k": "basketball_nba", "n": "NBA"}, {"k": "basketball_euroleague", "n": "EUROLEAGUE"}]
        for lig in b_ligler:
            try:
                r = requests.get(f"https://api.the-odds-api.com/v4/sports/{lig['k']}/odds/?apiKey={key}&regions=eu", timeout=10).json()
                for m in r:
                    t, s = self.format_zaman(m['commence_time'])
                    mac_adi = f"{m['home_team']} - {m['away_team']}"
                    self.sonuclar.append({
                        "kategori": "ALTIN", "lig": lig['n'], "tur": "basketbol",
                        "mac": mac_adi, "tarih": t, "saat": s, "uyari": "🏀 POTADA"
                    })
                    if lig['n'] in self.lig_sayac: self.lig_sayac[lig['n']] += 1
            except: pass
            time.sleep(0.5)

        # RAPOR KAYDI
        with open("v19_rapor.json", "w", encoding="utf-8") as f:
            json.dump({
                "son_guncelleme": datetime.now().strftime("%d-%m-%Y %H:%M:%S"),
                "lig_sayac": self.lig_sayac,
                "veriler": self.sonuclar
            }, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    V19Intelligence().operasyon()
