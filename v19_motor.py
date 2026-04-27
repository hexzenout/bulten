import os, requests, json, time
from datetime import datetime, timedelta

ODDS_API_POOL = [k.strip() for k in os.getenv("ODDS_KEYS", "").split(",") if k.strip()]

# KATEGORİLEME İÇİN ANAHTAR KELİMELER (Artık taramayı kısıtlamaz, sadece rütbe takar)
ALTIN_LIGLER = ["SUPER LIG", "PREMIER LEAGUE", "LA LIGA", "BUNDESLIGA", "SERIE A", "LIGUE 1", "CHAMPIONS LEAGUE", "EUROPA LEAGUE", "NBA", "EUROLEAGUE", "BSL", "LIGA ACB"]
GUMUS_LIGLER = ["CHAMPIONSHIP", "EREDIVISIE", "PRIMEIRA LIGA", "BRAZIL", "ARGENTINA", "MLS", "EUROCUP", "BCL", "VTB", "NCAA", "WNBA", "PRO A", "BBL"]

class V19Intelligence:
    def __init__(self):
        self.odds_index, self.kalan_hak = 0, "500"
        self.sonuclar = []

    def get_key(self):
        return ODDS_API_POOL[self.odds_index] if self.odds_index < len(ODDS_API_POOL) else None

    def kategori_bul(self, lig_adi):
        l_up = lig_adi.upper()
        if any(x in l_up for x in ALTIN_LIGLER): return "ALTIN"
        if any(x in l_up for x in GUMUS_LIGLER): return "GÜMÜŞ"
        return "BRONZ"

    def operasyon(self):
        key = self.get_key()
        if not key: return

        # 1. BÜLTENDEKİ TÜM SPORLARI ÇEK (SINIRLAMA YOK)
        try:
            sports_res = requests.get(f"https://api.the-odds-api.com/v4/sports/?apiKey={key}", timeout=10)
            self.kalan_hak = sports_res.headers.get('x-requests-remaining', self.kalan_hak)
            active_sports = [s for s in sports_res.json() if 'soccer' in s['key'] or 'basketball' in s['key']]
        except:
            active_sports = []

        # 2. AKTİF OLAN HER LİGİ TEK TEK TARA
        for s in active_sports:
            current_key = self.get_key()
            if not current_key: break
            
            url = f"https://api.the-odds-api.com/v4/sports/{s['key']}/odds/?apiKey={current_key}&regions=eu&markets=h2h"
            try:
                r = requests.get(url, timeout=10)
                if r.status_code == 200:
                    self.kalan_hak = r.headers.get('x-requests-remaining', self.kalan_hak)
                    for m in r.json():
                        # TSİ SAAT VE TARİHİ PYTHON'DA BETONLUYORUZ (Bug Riski Sıfırlandı)
                        raw_time = m.get('commence_time')
                        try:
                            dt_utc = datetime.strptime(raw_time, "%Y-%m-%dT%H:%M:%SZ")
                            dt_tsi = dt_utc + timedelta(hours=3) # UTC + 3 Saat
                            tarih_tsi = dt_tsi.strftime("%Y-%m-%d")
                            saat_tsi = dt_tsi.strftime("%H:%M")
                        except:
                            tarih_tsi, saat_tsi = "BİLİNMİYOR", "00:00"

                        tur = "basketbol" if "basketball" in s['key'] else "futbol"
                        self.sonuclar.append({
                            "kategori": self.kategori_bul(s['title']),
                            "lig": s['title'].upper(),
                            "tur": tur,
                            "mac": f"{m.get('home_team')} - {m.get('away_team')}",
                            "tarih": tarih_tsi,
                            "saat": saat_tsi,
                            "uyari": "📡 Analiz Aktif"
                        })
                elif r.status_code in [401, 429]:
                    self.odds_index += 1
            except: pass
            time.sleep(0.5)

        with open("v19_rapor.json", "w", encoding="utf-8") as f:
            json.dump({
                "son_guncelleme": datetime.now().strftime("%d-%m-%Y %H:%M:%S"), 
                "kalan_hak": self.kalan_hak, 
                "veriler": self.sonuclar
            }, f, ensure_ascii=False, indent=4)

if __name__ == "__main__": V19Intelligence().operasyon()
