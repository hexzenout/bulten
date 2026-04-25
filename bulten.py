import datetime

# 1. ELİT LİG ANAHTAR KELİMELERİ (Altın)
TIER_1_LIGLER = [
    "super lig", "süper lig", "premier league", "la liga", "serie a", 
    "bundesliga", "eredivisie", "liga nos", "nba", "euroleague", "cba", "nbl"
]

# 2. KARA LİSTE (Altın olmasını engelleyen, altyapı/yedek takım belirteçleri)
# Senin dediğin Jong, United (altyapı), II gibi durumları burada yakalıyoruz.
KARA_LISTE = [
    "u19", "u21", "u23", "u17", "gelişim", "koleji", "b takımı", "youth", 
    "academy", "jong", "castilla", " ii", "sub-", "reserve", "reserves"
]

# 3. ELİT TAKIMLAR (Lig ismi geçmese bile takımdan dolayı Altın yapacaklar)
ELIT_TAKIMLAR = ["fenerbahce", "galatasaray", "besiktas", "real madrid", "barcelona", "lakers", "warriors"]

def get_tier(league_name, home_team, away_team):
    league_low = league_name.lower()
    teams_low = (home_team + " " + away_team).lower()
    
    # KONTROL 1: ALTYAPI / YEDEK TAKIM MI? (Önce Çöpleri Ayıkla)
    # Eğer ligde veya takım adında kara liste kelimesi varsa direkt BRONZ yapıyoruz.
    if any(ek in teams_low for ek in KARA_LISTE) or any(ek in league_low for ek in KARA_LISTE):
        return "#CD7F32", "Bronz (Altyapı/Yedek)"

    # KONTROL 2: ELİT LİG Mİ?
    if any(key in league_low for key in TIER_1_LIGLER):
        return "#FFD700", "Altın (Elit Lig)"

    # KONTROL 3: ELİT TAKIM MI? (A Takım olduğu kesinleştiği için bakıyoruz)
    if any(team in teams_low for team in ELIT_TAKIMLAR):
        return "#FFD700", "Altın (Elit Takım)"

    # KONTROL 4: GÜMÜŞ LİGLER
    if any(key in league_low for key in ["championship", "tff 1", "serie b", "ligue 2"]):
        return "#C0C0C0", "Gümüş"
        
    # HİÇBİRİNE UYMUYORSA
    return "#CD7F32", "Bronz"

# TEST VERİLERİ (Senin verdiğin örneklere göre hazırlandı)
test_data = [
    {"saat": "19:00", "lig": "Turkish Super Lig", "ev": "Galatasaray", "dep": "Beşiktaş", "tip": "Futbol"},
    {"saat": "14:00", "lig": "Hollanda Eerste Divisie", "ev": "Jong Ajax", "dep": "Utrecht II", "tip": "Futbol"},
    {"saat": "16:00", "lig": "İspanya 3. Lig", "ev": "Real Madrid Castilla", "dep": "Alcorcon", "tip": "Futbol"},
    {"saat": "21:00", "lig": "English Premier League", "ev": "Liverpool", "dep": "Chelsea", "tip": "Futbol"},
    {"saat": "12:00", "lig": "Türkiye Gelişim Ligi", "ev": "Fenerbahçe U19", "dep": "Beşiktaş U19", "tip": "Futbol"},
    {"saat": "04:00", "lig": "NBA", "ev": "Lakers", "dep": "Warriors", "tip": "Basketbol"}
]

# HTML ÜRETİMİ
tarih = datetime.datetime.now().strftime("%d.%m.%Y %H:%M")
html_icerik = f"""
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gelişmiş Veri Radarı</title>
    <style>
        body {{ font-family: 'Segoe UI', sans-serif; background: #0a0a0a; color: white; padding: 20px; }}
        .header {{ text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }}
        .mac-karti {{ 
            background: #161616; border-radius: 10px; padding: 18px; margin-bottom: 12px; 
            display: flex; justify-content: space-between; align-items: center;
            border-left: 10px solid; transition: 0.3s;
        }}
        .lig-bilgi {{ font-size: 0.85em; color: #888; text-transform: uppercase; }}
        .takimlar {{ font-size: 1.25em; font-weight: bold; margin-top: 5px; }}
        .saat {{ font-family: monospace; color: #00ff00; font-size: 1.3em; background: #222; padding: 5px 12px; border-radius: 5px; }}
        h1 {{ color: #FFD700; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 GELİŞMİŞ VERİ RADARI</h1>
        <p>SON GÜNCELLEME: {tarih}</p>
    </div>
"""

for mac in test_data:
    renk, tier_adi = get_tier(mac["lig"], mac["ev"], mac["dep"])
    html_icerik += f"""
    <div class="mac-karti" style="border-left-color: {renk};">
        <div>
            <div class="lig-bilgi">{mac['tip']} | {mac['lig']} ({tier_adi})</div>
            <div class="takimlar">{mac['ev']} - {mac['dep']}</div>
        </div>
        <div class="saat">{mac['saat']}</div>
    </div>
    """

html_icerik += "</body></html>"

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html_icerik)
