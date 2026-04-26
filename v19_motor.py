import os
import requests
import time
import random
import json
from datetime import datetime

# ==========================================
# 1. ŞİFRELERİ KASADAN (SECRETS) ÇEKME
# ==========================================
odds_keys_env = os.getenv("ODDS_KEYS", "")
rapid_keys_env = os.getenv("RAPID_KEYS", "")

ODDS_API_POOL = [k.strip() for k in odds_keys_env.split(",") if k.strip()]
FOOTBALL_API_POOL = [k.strip() for k in rapid_keys_env.split(",") if k.strip()]

# ==========================================
# 2. ALTIN LİSTELER (KIRMIZI ÇİZGİLER)
# ==========================================
ALTIN_FUTBOL = ["Super Lig", "Premier League", "La Liga", "Bundesliga", "Serie A", "Ligue 1", "Eredivisie", "Primeira Liga", "Champions League", "Europa League", "Conference League", "Championship", "Serie A (Brazil)", "Primera Division (Argentina)", "MLS", "World Cup", "Euro"]
ALTIN_BASKET = ["NBA", "Euroleague", "BSL", "Liga ACB", "Lega A", "Heba A1", "LNB Pro A", "BBL", "EuroCup", "Champions League", "VTB", "NCAA", "WNBA"]

# ==========================================
# 3. V19 KOMUTA ZEKASI (MOTOR)
# ==========================================
class V19Intelligence:
    def __init__(self):
        self.odds_index = 0
        self.football_index = 0
        self.user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/114.0.0.0 Safari/537.36",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15"
        ]

    def kategori_bul(self, lig_adi, spor_turu):
        if spor_turu == "soccer":
            if any(x.lower() in lig_adi.lower() for x in ALTIN_FUTBOL): return "ALTIN"
            return "GÜMÜŞ"
        elif spor_turu == "basketball":
            if any(x.lower() in lig_adi.lower() for x in ALTIN_BASKET): return "ALTIN"
            return "GÜMÜŞ"
        return "BRONZ"

    def operasyon_baslat(self):
        print("V19 BEYNİ: Tarama Başlatılıyor...")
        alarmlar = []
        
        # Test ve Vitrin Görünümü İçin Örnek Veri Pompası (API'ler buraya eklenecek)
        alarmlar.append({
            "kategori": self.kategori_bul("Super Lig", "soccer"),
            "lig": "SÜPER LİG",
            "mac": "GALATASARAY - FENERBAHÇE",
            "uyari": "🚨 SARI KART FIRSATI: 18 Faul var, Kart 0."
        })
        
        alarmlar.append({
            "kategori": self.kategori_bul("NBA", "basketball"),
            "lig": "NBA",
            "mac": "LAKERS - CELTICS",
            "uyari": "🔥 HIZLI HÜCUM: Barem 220.5 Üst potansiyeli."
        })

        alarmlar.append({
            "kategori": self.kategori_bul("Championship", "soccer"),
            "lig": "CHAMPIONSHIP",
            "mac": "SUNDERLAND - MILLWALL",
            "uyari": "🚩 OFSAYT ÜST: Defans arkası sızıntı tespit edildi."
        })

        rapor = {
            "son_guncelleme": datetime.now().strftime("%d-%m-%Y %H:%M:%S"),
            "veriler": alarmlar
        }
        
        with open("v19_rapor.json", "w", encoding="utf-8") as f:
            json.dump(rapor, f, ensure_ascii=False, indent=4)
        print("[+] Operasyon Başarılı: Rapor dosyası oluşturuldu.")

if __name__ == "__main__":
    v19 = V19Intelligence()
    v19.operasyon_baslat()
