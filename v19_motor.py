import os, requests, json, time
from datetime import datetime, timedelta

# --- API ANAHTARLARI ---
ODDS_API_POOL = [k.strip() for k in os.getenv("ODDS_KEYS", "").split(",") if k.strip()]
BASKET_KEY = os.getenv("BASKET_KEY", "").strip()

# --- LİG HİYERARŞİSİ ---
ALTIN_F = ["SUPER LIG", "PREMIER LEAGUE", "LA LIGA", "BUNDESLIGA", "SERIE A", "LIGUE 1", "CHAMPIONS LEAGUE"]
ALTIN_B = ["NBA", "EUROLEAGUE", "BSL", "LIGA ACB", "LEGA A"]

class V19Intelligence:
    def __init__(self):
        self.odds_index = 0
        self.sonuclar = []
        self.lig_sayac = {l: 0 for l in ALTIN_F + ALTIN_B}

    def format_tsi(self, raw):
        try:
            dt = datetime.strptime(raw.replace("Z",""), "%Y-%m-%dT%H:%M:%S")
            dt_tsi = dt + timedelta(hours=3)
            return dt_tsi.strftime("%Y-%m-%d"), dt_tsi.strftime("%H:%M")
        except: return "2026-01-01", "00:00"

    def kategori_bul(self, lig):
        l_up = lig.upper()
        if any(x in l_up for x in ALTIN_F + ALTIN_B): return "ALTIN"
        if any(x in l_up for x in ["1. LIG", "SEGUNDA", "SERIE B"]): return "GÜMÜŞ"
        return "BRONZ"

    def operasyon(self):
        if not ODDS_API_POOL: return
        key = ODDS_API_POOL[0]

        # FUTBOL TARAMASI
        f_keys = ["soccer_turkey_super_league", "soccer_epl", "soccer_spain_la_liga", "soccer_germany_bundesliga", "soccer_italy_serie_a", "soccer_france_ligue_one", "soccer_uefa_champs_league"]
        for f_key in f_keys:
            try:
                r = requests.get(f"https://api.the-odds-api.com/v4/sports/{f_key}/odds/?apiKey={key}&regions=eu", timeout=10).json()
                for m in r:
                    t, s = self.format_tsi(m['commence_time'])
                    lig_adi = f_key.replace("soccer_","").replace("_"," ").upper()
                    self.sonuclar.append({
                        "kategori": self.kategori_bul(lig_adi), "lig": lig_adi, "tur": "futbol",
                        "mac": f"{m['home_team']} - {m['away_team']}", "tarih": t, "saat": s
                    })
                    if lig_adi in self.lig_sayac: self.lig_sayac[lig_adi] += 1
            except: pass

        # BASKETBOL TARAMASI
        b_keys = ["basketball_nba", "basketball_euroleague"]
        for b_key in b_keys:
            try:
                r = requests.get(f"https://api.the-odds-api.com/v4/sports/{b_key}/odds/?apiKey={key}&regions=eu", timeout=10).json()
                for m in r:
                    t, s = self.format_tsi(m['commence_time'])
                    lig_adi = b_key.replace("basketball_","").upper()
                    self.sonuclar.append({
                        "kategori": self.kategori_bul(lig_adi), "lig": lig_adi, "tur": "basketbol",
                        "mac": f"{m['home_team']} - {m['away_team']}", "tarih": t, "saat": s
                    })
                    if lig_adi in self.lig_sayac: self.lig_sayac[lig_adi] += 1
            except: pass

        # RAPORU KAYDET (Hata olsa bile bozuk dosya yazmaz)
        with open("v19_rapor.json", "w", encoding="utf-8") as f:
            json.dump({"up": datetime.now().strftime("%H:%M"), "veriler": self.sonuclar, "sayac": self.lig_sayac}, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    V19Intelligence().operasyon()
