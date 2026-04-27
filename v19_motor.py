import os, requests, json, time
from datetime import datetime, timedelta

# --- API ANAHTARLARI (GitHub Secrets üzerinden gelir) ---
ODDS_API_POOL = [k.strip() for k in os.getenv("ODDS_KEYS", "").split(",") if k.strip()]
BASKET_KEY = os.getenv("BASKET_KEY", "").strip()
BETSAPI_TOKEN = os.getenv("BETSAPI_TOKEN", "").strip()

# --- KESİN LİG NİZAMI ---
ALTIN_FUTBOL = ["SUPER LIG", "PREMIER LEAGUE", "LA LIGA", "BUNDESLIGA", "SERIE A", "LIGUE 1", "CHAMPIONS LEAGUE", "EUROPA LEAGUE", "CONFERENCE LEAGUE", "CHAMPIONSHIP", "EREDIVISIE", "PRIMEIRA LIGA", "BRAZIL", "ARGENTINA", "MLS"]
ALTIN_BASKET = ["NBA", "EUROLEAGUE", "BSL", "LIGA ACB", "LEGA A", "LNB PRO A", "BBL", "EUROCUP", "BCL", "VTB", "NCAA", "WNBA"]

class V19Intelligence:
    def __init__(self):
        self.odds_index = 0
        self.kalan_hak = "500"
        self.sonuclar = []
        self.eklenen_maclar = {}
        self.lig_sayac = {l: 0 for l in ALTIN_FUTBOL + ALTIN_BASKET}

    def get_odds_key(self):
        return ODDS_API_POOL[self.odds_index] if self.odds_index < len(ODDS_API_POOL) else None

    def kategori_bul(self, lig_adi):
        l_up = lig_adi.upper()
        if any(x in l_up for x in ALTIN_FUTBOL + ALTIN_BASKET): return "ALTIN"
        if any(x in l_up for x in ["1. LIG", "SEGUNDA", "SERIE B", "LIGUE 2"]): return "GÜMÜŞ"
        return "BRONZ"

    def format_zaman(self, raw, kaynak):
        try:
            if kaynak == "odds": dt = datetime.strptime(raw, "%Y-%m-%dT%H:%M:%SZ")
            elif kaynak == "api-sport": dt = datetime.strptime(raw.split("+")[0], "%Y-%m-%dT%H:%M:%S")
            elif kaynak == "betsapi": dt = datetime.utcfromtimestamp(int(raw))
            else: return "BİLİNMİYOR", "00:00"
            dt_tsi = dt + timedelta(hours=3)
            return dt_tsi.strftime("%Y-%m-%d"), dt_tsi.strftime("%H:%M")
        except: return "BİLİNMİYOR", "00:00"

    def mac_ekle(self, kategori, lig, tur, mac, tarih, saat, uyari, skor=""):
        mac_key = f"{mac}-{tarih}"
        if mac_key not in self.eklenen_maclar:
            lig_up = lig.upper()
            self.eklenen_maclar[mac_key] = {
                "kategori": kategori, "lig": lig_up, "tur": tur,
                "mac": mac, "tarih": tarih, "saat": saat, "uyari": uyari, "skor": skor
            }
            # Sabit lig sayacı güncelleme
            for s_lig in self.lig_sayac:
                if s_lig in lig_up: self.lig_sayac[s_lig] += 1

    def operasyon(self):
        # MOTOR 1: BETSAPI (CANLI VE GELECEK)
        if BETSAPI_TOKEN:
            for s_id, tur in [("1", "futbol"), ("18", "basketbol")]:
                # Canlı Skorlar
                try:
                    r = requests.get(f"https://api.bfin.com/v1/events/inplay?sport_id={s_id}&token={BETSAPI_TOKEN}", timeout=10).json()
                    if r.get('success') == 1:
                        for m in r.get('results', []):
                            t, s = self.format_zaman(m['time'], "betsapi")
                            self.mac_ekle(self.kategori_bul(m['league']['name']), m['league']['name'], tur, f"{m['home']['name']} - {m['away']['name']}", t, s, "🔴 CANLI", m.get('ss'))
                except: pass
                # Gelecek Bülten
                try:
                    r = requests.get(f"https://api.bfin.com/v1/events/upcoming?sport_id={s_id}&token={BETSAPI_TOKEN}", timeout=10).json()
                    if r.get('success') == 1:
                        for m in r.get('results', []):
                            t, s = self.format_zaman(m['time'], "betsapi")
                            self.mac_ekle(self.kategori_bul(m['league']['name']), m['league']['name'], tur, f"{m['home']['name']} - {m['away']['name']}", t, s, "📡 BetsAPI")
                except: pass

        # MOTOR 2: THE ODDS API (ALTIN LİG ORANLARI)
        key = self.get_odds_key()
        if key:
            try:
                r = requests.get(f"https://api.the-odds-api.com/v4/sports/soccer_turkey_super_league/odds/?apiKey={key}&regions=eu", timeout=10).json()
                for m in r:
                    t, s = self.format_zaman(m['commence_time'].replace("Z",""), "api-sport")
                    self.mac_ekle("ALTIN", "SUPER LIG", "futbol", f"{m['home_team']} - {m['away_team']}", t, s, "📊 Oran Analizi")
            except: pass

        with open("v19_rapor.json", "w", encoding="utf-8") as f:
            json.dump({
                "son_guncelleme": datetime.now().strftime("%d-%m-%Y %H:%M:%S"),
                "lig_sayac": self.lig_sayac,
                "veriler": list(self.eklenen_maclar.values())
            }, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    V19Intelligence().operasyon()
