import os
import requests
import json
from datetime import datetime
import time

# ==========================================
# 1. ŞİFRELERİ KASADAN (SECRETS) ÇEKME
# ==========================================
odds_keys_env = os.getenv("ODDS_KEYS", "")
ODDS_API_POOL = [k.strip() for k in odds_keys_env.split(",") if k.strip()]

# ==========================================
# 2. ALTIN LİSTELER (KIRMIZI ÇİZGİLER)
# ==========================================
ALTIN_FUTBOL = ["Super Lig", "Premier League", "La Liga", "Bundesliga", "Serie A", "Ligue 1", "Eredivisie", "Primeira Liga", "Champions League", "Europa League", "Conference League", "Championship", "MLS"]
ALTIN_BASKET = ["NBA", "Euroleague", "BSL", "Liga ACB", "Lega A", "EuroCup", "NCAA"]

# ==========================================
# 3. GERÇEK V19 KOMUTA ZEKASI
# ==========================================
class V19Intelligence:
    def __init__(self):
        self.odds_index = 0

    def kategori_bul(self, lig_adi, spor_turu):
        if spor_turu == "soccer":
            if any(x.lower() in lig_adi.lower() for x in ALTIN_FUTBOL): return "ALTIN"
            return "GÜMÜŞ"
        elif spor_turu == "basketball":
            if any(x.lower() in lig_adi.lower() for x in ALTIN_BASKET): return "ALTIN"
            return "GÜMÜŞ"
        return "BRONZ"

    def oran_cek(self, api_sport_key):
        """The Odds API'den Ban Korumalı Gerçek Veri Çeker"""
        while self.odds_index < len(ODDS_API_POOL):
            key = ODDS_API_POOL[self.odds_index]
            url = f"https://api.the-odds-api.com/v4/sports/{api_sport_key}/odds/?apiKey={key}&regions=eu&markets=h2h"
            try:
                res = requests.get(url, timeout=10)
                if res.status_code == 200:
                    return res.json()
                elif res.status_code in [401, 429]:
                    print(f"[!] {self.odds_index + 1}. Şifre Limiti Doldu. Diğerine geçiliyor...")
                    self.odds_index += 1
                else:
                    break
            except:
                break
        return []

    def operasyon_baslat(self):
        print("V19 BEYNİ: GERÇEK ZAMANLI API TARAMASI BAŞLADI...")
        alarmlar = []
        
        # Tarama Yapılacak Tüm Hedef Ligler (Gerçek API Kodlarıyla)
        hedef_ligler = [
            # --- FUTBOL (ALTIN & GÜMÜŞ LİGLER) ---
            {"key": "soccer_turkey_super_league", "isim": "Super Lig", "tur": "soccer"},
            {"key": "soccer_epl", "isim": "Premier League", "tur": "soccer"},
            {"key": "soccer_spain_la_liga", "isim": "La Liga", "tur": "soccer"},
            {"key": "soccer_germany_bundesliga", "isim": "Bundesliga", "tur": "soccer"},
            {"key": "soccer_italy_serie_a", "isim": "Serie A", "tur": "soccer"},
            {"key": "soccer_france_ligue_one", "isim": "Ligue 1", "tur": "soccer"},
            {"key": "soccer_uefa_champs_league", "isim": "Champions League", "tur": "soccer"},
            {"key": "soccer_uefa_europa_league", "isim": "Europa League", "tur": "soccer"},
            {"key": "soccer_uefa_europa_conference_league", "isim": "Conference League", "tur": "soccer"},
            {"key": "soccer_efl_champ", "isim": "Championship", "tur": "soccer"},
            {"key": "soccer_netherlands_eredivisie", "isim": "Eredivisie", "tur": "soccer"},
            {"key": "soccer_portugal_primeira_liga", "isim": "Primeira Liga", "tur": "soccer"},
            {"key": "soccer_brazil_campeonato", "isim": "Serie A (Brazil)", "tur": "soccer"},
            {"key": "soccer_argentina_primera_division", "isim": "Primera Division (Argentina)", "tur": "soccer"},
            
            # --- BASKETBOL (ALTIN & GÜMÜŞ LİGLER) ---
            {"key": "basketball_nba", "isim": "NBA", "tur": "basketball"},
            {"key": "basketball_euroleague", "isim": "Euroleague", "tur": "basketball"},
            {"key": "basketball_ncaab", "isim": "NCAA", "tur": "basketball"},
            {"key": "basketball_wnba", "isim": "WNBA", "tur": "basketball"},
            {"key": "basketball_spain_liga_acb", "isim": "Liga ACB", "tur": "basketball"},
            {"key": "basketball_italy_lega_a", "isim": "Lega A", "tur": "basketball"},
            {"key": "basketball_germany_bbl", "isim": "BBL", "tur": "basketball"},
            {"key": "basketball_france_lnb_pro_a", "isim": "LNB Pro A", "tur": "basketball"},
            {"key": "basketball_eurocup", "isim": "EuroCup", "tur": "basketball"}
        ]
        for hedef in hedef_ligler:
            print(f"> {hedef['isim']} taranıyor...")
            maclar = self.oran_cek(hedef["key"])
            
            if maclar:
                # API limitini yememek için şimdilik lig başına ilk 5 maçı çekiyoruz
                for mac in maclar[:5]: 
                    home = mac.get('home_team', 'Bilinmiyor')
                    away = mac.get('away_team', 'Bilinmiyor')
                    
                    # Başlangıç saatini hesapla
                    baslangic_utc = mac.get('commence_time', '')
                    saat_metni = "Saat Belirsiz"
                    if baslangic_utc:
                        try:
                            dt = datetime.strptime(baslangic_utc, "%Y-%m-%dT%H:%M:%SZ")
                            saat_metni = f"Maç Saati: {dt.strftime('%H:%M')} (UTC)"
                        except:
                            pass

                    kategori = self.kategori_bul(hedef["isim"], hedef["tur"])
                    
                    alarmlar.append({
                        "kategori": kategori,
                        "lig": hedef["isim"].upper(),
                        "mac": f"{home} - {away}",
                        "uyari": f"📡 ORAN RADARI AKTİF | {saat_metni} | Büroların açılış oranları sisteme kaydedildi. Değişimler bekleniyor."
                    })
            
            # API'yi çok yormamak için ligler arası ufak bekleme
            time.sleep(1)

        rapor = {
            "son_guncelleme": datetime.now().strftime("%d-%m-%Y %H:%M:%S"),
            "veriler": alarmlar
        }
        
        with open("v19_rapor.json", "w", encoding="utf-8") as f:
            json.dump(rapor, f, ensure_ascii=False, indent=4)
        print(f"[+] Operasyon Tamam! Toplam {len(alarmlar)} maç bulundu.")

if __name__ == "__main__":
    v19 = V19Intelligence()
    v19.operasyon_baslat()
