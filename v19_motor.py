import os, requests, json, time
from datetime import datetime

# API ANAHTAR HAVUZU
ODDS_API_POOL = [k.strip() for k in os.getenv("ODDS_KEYS", "").split(",") if k.strip()]

# KATEGORİ BELİRLEYİCİ LİSTELER
ALTIN_FUTBOL = ["SUPER LIG", "PREMIER LEAGUE", "LA LIGA", "BUNDESLIGA", "SERIE A", "LIGUE 1", "EREDIVISIE", "PRIMEIRA LIGA", "CHAMPIONS LEAGUE", "EUROPA LEAGUE", "CONFERENCE LEAGUE", "CHAMPIONSHIP", "BRAZIL", "ARGENTINA", "MLS", "WORLD CUP"]
ALTIN_BASKET = ["NBA", "EUROLEAGUE", "BSL", "LIGA ACB", "LEGA A", "HEBA A1", "LNB PRO A", "BBL", "EUROCUP", "BCL", "VTB", "NCAA", "WNBA"]

class V19Intelligence:
    def __init__(self):
        self.odds_index, self.kalan_hak = 0, "500"

    def kategori_bul(self, lig_adi, spor_turu):
        l_up = lig_adi.upper()
        hedef = ALTIN_BASKET if spor_turu == "basketball" else ALTIN_FUTBOL
        return "ALTIN" if any(x in l_up for x in hedef) else "GÜMÜŞ"

    def veri_cek(self, sport_key):
        while self.odds_index < len(ODDS_API_POOL):
            key = ODDS_API_POOL[self.odds_index]
            url = f"https://api.the-odds-api.com/v4/sports/{sport_key}/odds/?apiKey={key}&regions=eu&markets=h2h"
            try:
                r = requests.get(url, timeout=15)
                self.kalan_hak = r.headers.get('x-requests-remaining', self.kalan_hak)
                if r.status_code == 200: return r.json()
                elif r.status_code in [401, 429]: self.odds_index += 1
                else: break
            except: break
        return []

    def operasyon(self):
        sonuclar = []
        hedef_ligler = [
            # FUTBOL (16)
            {"key": "soccer_turkey_super_league", "n": "Super Lig", "t": "soccer"},
            {"key": "soccer_epl", "n": "Premier League", "t": "soccer"},
            {"key": "soccer_spain_la_liga", "n": "La Liga", "t": "soccer"},
            {"key": "soccer_germany_bundesliga", "n": "Bundesliga", "t": "soccer"},
            {"key": "soccer_italy_serie_a", "n": "Serie A", "t": "soccer"},
            {"key": "soccer_france_ligue_one", "n": "Ligue 1", "t": "soccer"},
            {"key": "soccer_uefa_champs_league", "n": "Champions League", "t": "soccer"},
            {"key": "soccer_uefa_europa_league", "n": "Europa League", "t": "soccer"},
            {"key": "soccer_uefa_europa_conference_league", "n": "Conference League", "t": "soccer"},
            {"key": "soccer_efl_champ", "n": "Championship", "t": "soccer"},
            {"key": "soccer_netherlands_eredivisie", "n": "Eredivisie", "t": "soccer"},
            {"key": "soccer_portugal_primeira_liga", "n": "Primeira Liga", "t": "soccer"},
            {"key": "soccer_brazil_campeonato", "n": "Serie A (Brazil)", "t": "soccer"},
            {"key": "soccer_argentina_primera_division", "n": "Primera Division (Argentina)", "t": "soccer"},
            {"key": "soccer_usa_mls", "n": "MLS", "t": "soccer"},
            {"key": "soccer_fifa_world_cup", "n": "World Cup", "t": "soccer"},
            # BASKETBOL (13)
            {"key": "basketball_nba", "n": "NBA", "t": "basketball"},
            {"key": "basketball_euroleague", "n": "Euroleague", "t": "basketball"},
            {"key": "basketball_spain_liga_acb", "n": "Liga ACB", "t": "basketball"},
            {"key": "basketball_italy_lega_a", "n": "Lega A", "t": "basketball"},
            {"key": "basketball_germany_bbl", "n": "BBL", "t": "basketball"},
            {"key": "basketball_france_lnb_pro_a", "n": "LNB Pro A", "t": "basketball"},
            {"key": "basketball_eurocup", "n": "EuroCup", "t": "basketball"},
            {"key": "basketball_turkey_bsl", "n": "BSL", "t": "basketball"},
            {"key": "basketball_greece_a1", "n": "Heba A1", "t": "basketball"},
            {"key": "basketball_vtb_united_league", "n": "VTB", "t": "basketball"},
            {"key": "basketball_champions_league", "n": "BCL", "t": "basketball"},
            {"key": "basketball_ncaab", "n": "NCAA", "t": "basketball"},
            {"key": "basketball_wnba", "n": "WNBA", "t": "basketball"}
        ]

        for h in hedef_ligler:
            data = self.veri_cek(h['key'])
            if data:
                for m in data:
                    sonuclar.append({
                        "kategori": self.kategori_bul(h['n'], h['t']),
                        "lig": h['n'].upper(),
                        "mac": f"{m.get('home_team')} - {m.get('away_team')}",
                        "saat_raw": m.get('commence_time'),
                        "uyari": "📡 RADAR ANALİZİ AKTİF"
                    })
            time.sleep(1)

        with open("v19_rapor.json", "w", encoding="utf-8") as f:
            json.dump({"son_guncelleme": datetime.now().strftime("%d-%m-%Y %H:%M:%S"), "kalan_hak": self.kalan_hak, "veriler": sonuclar}, f, ensure_ascii=False, indent=4)

if __name__ == "__main__": V19Intelligence().operasyon()
