import os, requests, json, time
from datetime import datetime, timedelta

ODDS_API_POOL = [k.strip() for k in os.getenv("ODDS_KEYS", "").split(",") if k.strip()]
BASKET_KEY = os.getenv("BASKET_KEY", "").strip()

ALTIN_LIGLER = ["SUPER LIG", "PREMIER LEAGUE", "LA LIGA", "BUNDESLIGA", "SERIE A", "LIGUE 1", "CHAMPIONS LEAGUE", "EUROPA LEAGUE", "NBA", "EUROLEAGUE", "BSL", "LIGA ACB"]
GUMUS_LIGLER = ["CHAMPIONSHIP", "EREDIVISIE", "PRIMEIRA LIGA", "BRAZIL", "ARGENTINA", "MLS", "EUROCUP", "BCL", "VTB", "NCAA", "WNBA", "PRO A", "BBL"]

class V19Intelligence:
    def __init__(self):
        self.odds_index = 0
        self.kalan_hak = "500"
        self.sonuclar = []

    def get_odds_key(self):
        if self.odds_index < len(ODDS_API_POOL):
            return ODDS_API_POOL[self.odds_index]
            return None

    def kategori_bul(self, lig_adi):
        l_up = lig_adi.upper()
        if any(x in l_up for x in ALTIN_LIGLER): return "ALTIN"
        if any(x in l_up for x in GUMUS_LIGLER): return "GÜMÜŞ"
        return "BRONZ"

    def format_zaman(self, raw_zaman, kaynak):
        # Saat dilimi hatalarını kökten çözmek için TSİ hesaplaması
        try:
            if kaynak == "odds":
                # The Odds API Format: 2026-04-28T18:45:00Z
                dt_utc = datetime.strptime(raw_zaman, "%Y-%m-%dT%H:%M:%SZ")
            elif kaynak == "api-sport":
                # API-Basketball Format: 2026-04-28T18:45:00+00:00
                clean_time = raw_zaman.split("+")[0]
                dt_utc = datetime.strptime(clean_time, "%Y-%m-%dT%H:%M:%S")
            
            dt_tsi = dt_utc + timedelta(hours=3) # Sabit Türkiye Saati (UTC+3)
            return dt_tsi.strftime("%Y-%m-%d"), dt_tsi.strftime("%H:%M")
        except:
            return "BİLİNMİYOR", "00:00"

    def operasyon(self):
        # --- MOTOR 1: THE ODDS API (SINIRSIZ TARAMA) ---
        key = self.get_odds_key()
        if key:
            try:
                sports_res = requests.get(f"https://api.the-odds-api.com/v4/sports/?apiKey={key}", timeout=10)
                self.kalan_hak = sports_res.headers.get('x-requests-remaining', self.kalan_hak)
                active_sports = [s for s in sports_res.json() if 'soccer' in s['key'] or 'basketball' in s['key']]
            except:
                active_sports = []

            for s in active_sports:
                curr_key = self.get_odds_key()
                if not curr_key: break
                
                url = f"https://api.the-odds-api.com/v4/sports/{s['key']}/odds/?apiKey={curr_key}&regions=eu&markets=h2h"
                try:
                    r = requests.get(url, timeout=10)
                    if r.status_code == 200:
                        self.kalan_hak = r.headers.get('x-requests-remaining', self.kalan_hak)
                        for m in r.json():
                            tarih, saat = self.format_zaman(m.get('commence_time'), "odds")
                            tur = "basketbol" if "basketball" in s['key'] else "futbol"
                            self.sonuclar.append({
                                "kategori": self.kategori_bul(s['title']),
                                "lig": s['title'].upper(),
                                "tur": tur,
                                "mac": f"{m.get('home_team')} - {m.get('away_team')}",
                                "tarih": tarih,
                                "saat": saat,
                                "uyari": "📡 Radar Analizi Aktif"
                            })
                    elif r.status_code in [401, 429]:
                        self.odds_index += 1
                except: pass
                time.sleep(0.5)

        # --- MOTOR 2: API-BASKETBALL (EKSİK AVRUPA LİGLERİ) ---
        if BASKET_KEY:
            hedef_basket = [
                {"id": "2", "n": "LNB Pro A"}, {"id": "117", "n": "Liga ACB"},
                {"id": "12", "n": "Lega A"}, {"id": "31", "n": "BSL"},
                {"id": "1", "n": "BBL"}, {"id": "10", "n": "Heba A1"},
                {"id": "4", "n": "VTB"}, {"id": "6", "n": "BCL"}
            ]
            headers = {'x-apisports-key': BASKET_KEY, 'x-rapidapi-host': 'v1.basketball.api-sports.io'}
            for h in hedef_basket:
                url = f"https://v1.basketball.api-sports.io/games?league={h['id']}&season=2025-2026"
                try:
                    r = requests.get(url, headers=headers, timeout=10)
                    if r.status_code == 200:
                        maclar = [g for g in r.json().get('response', []) if g['status']['short'] == 'NS']
                        for m in maclar:
                            tarih, saat = self.format_zaman(m['date'], "api-sport")
                            t1 = m['teams']['home']['name']
                            t2 = m['teams']['away']['name']
                            self.sonuclar.append({
                                "kategori": self.kategori_bul(h['n']),
                                "lig": h['n'].upper(),
                                "tur": "basketbol",
                                "mac": f"{t1} - {t2}",
                                "tarih": tarih,
                                "saat": saat,
                                "uyari": "📡 2. Motor Onaylı"
                            })
                except: pass
                time.sleep(1)

        # --- RAPORU KAYDET ---
        with open("v19_rapor.json", "w", encoding="utf-8") as f:
            json.dump({
                "son_guncelleme": datetime.now().strftime("%d-%m-%Y %H:%M:%S"),
                "kalan_hak": self.kalan_hak,
                "veriler": self.sonuclar
            }, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    V19Intelligence().operasyon()
