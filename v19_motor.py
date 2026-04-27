import os, requests, json, time
from datetime import datetime, timedelta

# --- ŞİFRE HAVUZU ---
ODDS_API_POOL = [k.strip() for k in os.getenv("ODDS_KEYS", "").split(",") if k.strip()]
BASKET_KEY = os.getenv("BASKET_KEY", "").strip()
BETSAPI_TOKEN = os.getenv("BETSAPI_TOKEN", "").strip()

ALTIN_LIGLER = ["SUPER LIG", "SUPER LEAGUE", "PREMIER LEAGUE", "LA LIGA", "BUNDESLIGA", "SERIE A", "LIGUE 1", "CHAMPIONS LEAGUE", "EUROPA LEAGUE", "NBA", "EUROLEAGUE", "BSL", "LIGA ACB"]
GUMUS_LIGLER = ["CHAMPIONSHIP", "EREDIVISIE", "PRIMEIRA LIGA", "BRAZIL", "ARGENTINA", "MLS", "EUROCUP", "BCL", "VTB", "NCAA", "WNBA", "PRO A", "BBL"]

class V19Intelligence:
    def __init__(self):
        self.odds_index = 0
        self.kalan_hak = "500"
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
        # SAAT KAYMASINI BİTİREN BETON HESAPLAMA (UTC + 3)
        try:
            if kaynak == "odds": # 2026-04-28T18:45:00Z
                dt_utc = datetime.strptime(raw_zaman, "%Y-%m-%dT%H:%M:%SZ")
            elif kaynak == "api-sport": # 2026-04-28T18:45:00+00:00
                clean_time = raw_zaman.split("+")[0]
                dt_utc = datetime.strptime(clean_time, "%Y-%m-%dT%H:%M:%S")
            elif kaynak == "betsapi": # 1714329900 (Unix)
                dt_utc = datetime.utcfromtimestamp(int(raw_zaman))
            
            dt_tsi = dt_utc + timedelta(hours=3) # Sabit TSİ
            return dt_tsi.strftime("%Y-%m-%d"), dt_tsi.strftime("%H:%M")
        except:
            return "BİLİNMİYOR", "00:00"

    def mac_ekle(self, kategori, lig, tur, mac_adi, tarih, saat, uyari):
        mac_id = f"{mac_adi}-{tarih}"
        if mac_id not in self.eklenen_maclar:
            self.sonuclar.append({"kategori": kategori, "lig": lig, "tur": tur, "mac": mac_adi, "tarih": tarih, "saat": saat, "uyari": uyari})
            self.eklenen_maclar.add(mac_id)

    def operasyon(self):
        print("V19 RADAR: 3 MOTORLU TARAMA BAŞLADI...")
        
        # 1. MOTOR: THE ODDS API (GARANTİLİ ANA LİGLER)
        # Önce Süper Lig ve devlerin kaybolmaması için nokta atışı tarama yapıyoruz
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
            url = f"https://api.the-odds-api.com/v4/sports/{h['key']}/odds/?apiKey={curr_key}&regions=eu&markets=h2h"
            try:
                r = requests.get(url, timeout=10)
                if r.status_code == 200:
                    self.kalan_hak = r.headers.get('x-requests-remaining', self.kalan_hak)
                    for m in r.json():
                        tarih, saat = self.format_zaman(m.get('commence_time'), "odds")
                        tur = "basketbol" if h['t'] == "basketball" else "futbol"
                        mac_adi = f"{m.get('home_team')} - {m.get('away_team')}"
                        self.mac_ekle(self.kategori_bul(h['n']), h['n'].upper(), tur, mac_adi, tarih, saat, "📊 TheOdds Aktif")
                elif r.status_code in [401, 429]: self.odds_index += 1
            except: pass
            time.sleep(0.5)

        # 2. MOTOR: BETSAPI (TSUNAMİ MODU - DÜNYADAKİ TÜM LİGLER)
        if BETSAPI_TOKEN:
            for sport_id, tur in [("1", "futbol"), ("18", "basketbol")]:
                # Sadece önümüzdeki 2 günü tarar ki sistem şişmesin
                for extra_day in [0, 1]: 
                    tarih_str = (datetime.now() + timedelta(days=extra_day)).strftime('%Y%m%d')
                    url = f"https://api.bfin.com/v1/events/upcoming?sport_id={sport_id}&token={BETSAPI_TOKEN}&day={tarih_str}"
                    try:
                        r = requests.get(url, timeout=10)
                        if r.status_code == 200 and r.json().get('success') == 1:
                            for m in r.json().get('results', []):
                                tarih, saat = self.format_zaman(m['time'], "betsapi")
                                lig_adi = m['league']['name']
                                mac_adi = f"{m['home']['name']} - {m['away']['name']}"
                                self.mac_ekle(self.kategori_bul(lig_adi), lig_adi.upper(), tur, mac_adi, tarih, saat, "📡 BetsAPI Radar")
                    except: pass
                    time.sleep(1)

        # 3. MOTOR: API-BASKETBALL (YEDEK AVRUPA)
        if BASKET_KEY:
            hedef_basket = [{"id": "2", "n": "LNB Pro A"}, {"id": "117", "n": "Liga ACB"}, {"id": "31", "n": "BSL"}, {"id": "1", "n": "BBL"}]
            headers = {'x-apisports-key': BASKET_KEY, 'x-rapidapi-host': 'v1.basketball.api-sports.io'}
            for h in hedef_basket:
                try:
                    r = requests.get(f"https://v1.basketball.api-sports.io/games?league={h['id']}&season=2025-2026", headers=headers, timeout=10)
                    if r.status_code == 200:
                        for m in [g for g in r.json().get('response', []) if g['status']['short'] == 'NS']:
                            tarih, saat = self.format_zaman(m['date'], "api-sport")
                            mac_adi = f"{m['teams']['home']['name']} - {m['teams']['away']['name']}"
                            self.mac_ekle(self.kategori_bul(h['n']), h['n'].upper(), "basketbol", mac_adi, tarih, saat, "📡 API-Sport Aktif")
                except: pass
                time.sleep(1)

        # RAPOR KAYDI
        with open("v19_rapor.json", "w", encoding="utf-8") as f:
            json.dump({"son_guncelleme": datetime.now().strftime("%d-%m-%Y %H:%M:%S"), "kalan_hak": self.kalan_hak, "veriler": self.sonuclar}, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    V19Intelligence().operasyon()
