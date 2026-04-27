import os, requests, json, time
from datetime import datetime, timedelta

ODDS_API_POOL = [k.strip() for k in os.getenv("ODDS_KEYS", "").split(",") if k.strip()]
BASKET_KEY = os.getenv("BASKET_KEY", "").strip()
BETSAPI_TOKEN = os.getenv("BETSAPI_TOKEN", "").strip()

ALTIN_LIGLER = ["SUPER LIG", "PREMIER LEAGUE", "LA LIGA", "BUNDESLIGA", "SERIE A", "LIGUE 1", "CHAMPIONS LEAGUE", "EUROPA LEAGUE", "NBA", "EUROLEAGUE", "BSL", "LIGA ACB"]
GUMUS_LIGLER = ["CHAMPIONSHIP", "EREDIVISIE", "PRIMEIRA LIGA", "BRAZIL", "ARGENTINA", "MLS", "EUROCUP", "BCL", "VTB", "NCAA", "WNBA", "PRO A", "BBL"]

class V19Intelligence:
    def __init__(self):
        self.odds_index, self.kalan_hak = 0, "500"
        self.sonuclar = []
        self.eklenen_maclar = set()

    def get_odds_key(self):
        if self.odds_index < len(ODDS_API_POOL): return ODDS_API_POOL[self.odds_index]
        return None

    def kategori_bul(self, lig_adi):
        l_up = lig_adi.upper()
        if any(x in l_up for x in ALTIN_LIGLER): return "ALTIN"
        if any(x in l_up for x in GUMUS_LIGLER): return "GÜMÜŞ"
        return "BRONZ"

    def format_zaman(self, raw_zaman, kaynak):
        try:
            if kaynak == "odds": dt_utc = datetime.strptime(raw_zaman, "%Y-%m-%dT%H:%M:%SZ")
            elif kaynak == "api-sport": dt_utc = datetime.strptime(raw_zaman.split("+")[0], "%Y-%m-%dT%H:%M:%S")
            elif kaynak == "betsapi": dt_utc = datetime.utcfromtimestamp(int(raw_zaman))
            else: return "BİLİNMİYOR", "00:00"
            
            dt_tsi = dt_utc + timedelta(hours=3) # UTC+3 Betonlama
            return dt_tsi.strftime("%Y-%m-%d"), dt_tsi.strftime("%H:%M")
        except Exception as e:
            return "BİLİNMİYOR", "00:00"

    def mac_ekle(self, kategori, lig, tur, mac_adi, tarih, saat, uyari):
        mac_id = f"{mac_adi}-{tarih}"
        if mac_id not in self.eklenen_maclar:
            self.sonuclar.append({"kategori": kategori, "lig": lig, "tur": tur, "mac": mac_adi, "tarih": tarih, "saat": saat, "uyari": uyari})
            self.eklenen_maclar.add(mac_id)

    def operasyon(self):
        print("V19 RADAR: ZIRHLI TARAMA BAŞLADI...")
        
        # 1. MOTOR: THE ODDS API (Ana Damar - Asla Çökmemeli)
        print("--- THE ODDS API TARANIYOR ---")
        garanti_ligler = [
            {"key": "soccer_turkey_super_league", "n": "Süper Lig", "t": "soccer"},
            {"key": "soccer_epl", "n": "Premier League", "t": "soccer"},
            {"key": "soccer_spain_la_liga", "n": "La Liga", "t": "soccer"},
            {"key": "soccer_germany_bundesliga", "n": "Bundesliga", "t": "soccer"},
            {"key": "soccer_italy_serie_a", "n": "Serie A", "t": "soccer"},
            {"key": "soccer_france_ligue_one", "n": "Ligue 1", "t": "soccer"},
            {"key": "soccer_uefa_champs_league", "n": "Champions League", "t": "soccer"},
            {"key": "basketball_nba", "n": "NBA", "t": "basketball"},
            {"key": "basketball_euroleague", "n": "Euroleague", "t": "basketball"}
        ]
        
        for h in garanti_ligler:
            curr_key = self.get_odds_key()
            if not curr_key: break
            try:
                r = requests.get(f"https://api.the-odds-api.com/v4/sports/{h['key']}/odds/?apiKey={curr_key}&regions=eu&markets=h2h", timeout=10)
                if r.status_code == 200:
                    self.kalan_hak = r.headers.get('x-requests-remaining', self.kalan_hak)
                    for m in r.json():
                        tarih, saat = self.format_zaman(m.get('commence_time'), "odds")
                        tur = "basketbol" if h['t'] == "basketball" else "futbol"
                        mac_adi = f"{m.get('home_team')} - {m.get('away_team')}"
                        self.mac_ekle(self.kategori_bul(h['n']), h['n'].upper(), tur, mac_adi, tarih, saat, "📊 TheOdds Radar")
                elif r.status_code in [401, 429]: self.odds_index += 1
            except Exception as e: print(f"Odds API Hatası ({h['n']}): {e}")
            time.sleep(0.5)

        # 2. MOTOR: BETSAPI (Tsunami Modu - Hata yapsa da diğerlerini bozmaz)
        if BETSAPI_TOKEN:
            print("--- BETSAPI TARANIYOR ---")
            for sport_id, tur in [("1", "futbol"), ("18", "basketbol")]:
                try:
                    r = requests.get(f"https://api.bfin.com/v1/events/upcoming?sport_id={sport_id}&token={BETSAPI_TOKEN}&day={datetime.now().strftime('%Y%m%d')}", timeout=10)
                    if r.status_code == 200 and r.json().get('success') == 1:
                        for m in r.json().get('results', []):
                            tarih, saat = self.format_zaman(m['time'], "betsapi")
                            lig_adi = m['league']['name']
                            mac_adi = f"{m['home']['name']} - {m['away']['name']}"
                            self.mac_ekle(self.kategori_bul(lig_adi), lig_adi.upper(), tur, mac_adi, tarih, saat, "📡 BetsAPI Radar")
                except Exception as e: print(f"BetsAPI Hatası: {e}")
                time.sleep(1)

        # 3. MOTOR: API-BASKETBALL (Yedek Basketbol)
        if BASKET_KEY:
            print("--- API-BASKETBALL TARANIYOR ---")
            hedef_basket = [{"id": "2", "n": "LNB Pro A"}, {"id": "117", "n": "Liga ACB"}, {"id": "31", "n": "BSL"}, {"id": "1", "n": "BBL"}, {"id": "10", "n": "Heba A1"}, {"id": "4", "n": "VTB"}, {"id": "6", "n": "BCL"}]
            for h in hedef_basket:
                try:
                    r = requests.get(f"https://v1.basketball.api-sports.io/games?league={h['id']}&season=2025-2026", headers={'x-apisports-key': BASKET_KEY, 'x-rapidapi-host': 'v1.basketball.api-sports.io'}, timeout=10)
                    if r.status_code == 200:
                        for m in [g for g in r.json().get('response', []) if g['status']['short'] == 'NS']:
                            tarih, saat = self.format_zaman(m['date'], "api-sport")
                            mac_adi = f"{m['teams']['home']['name']} - {m['teams']['away']['name']}"
                            self.mac_ekle(self.kategori_bul(h['n']), h['n'].upper(), "basketbol", mac_adi, tarih, saat, "🏀 API-Sport Radar")
                except Exception as e: print(f"API-Basketball Hatası ({h['n']}): {e}")
                time.sleep(1)

        # RAPOR KAYDI (Eğer sonuç boşsa eski dosyayı bozma)
        if len(self.sonuclar) > 0:
            with open("v19_rapor.json", "w", encoding="utf-8") as f:
                json.dump({"son_guncelleme": datetime.now().strftime("%d-%m-%Y %H:%M:%S"), "kalan_hak": self.kalan_hak, "veriler": self.sonuclar}, f, ensure_ascii=False, indent=4)
        else:
            print("KRİTİK UYARI: Hiçbir veri çekilemedi. Rapor güncellenmedi.")

if __name__ == "__main__":
    V19Intelligence().operasyon()
