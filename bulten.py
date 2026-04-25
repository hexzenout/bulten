import datetime

# 1. LİG SINIFLANDIRMALARI (Hata payını sıfıra indiren anahtar kelimeler)
TIER_1_KEYWORDS = [
    "super lig", "süper lig", "champions league", "premier league", 
    "la liga", "serie a", "bundesliga", "eredivisie", "liga nos", 
    "nba", "euroleague", "cba", "nbl", "besiktas", "galatasaray", "fenerbahce"
]

TIER_2_KEYWORDS = ["championship", "tff 1", "serie b", "ligue 2", "bundesliga 2"]

def get_tier(league_name):
    # İsmi tamamen küçük harfe çeviriyoruz ki 'Super' ile 'super' fark etmesin
    name_low = league_name.lower()
    
    # Tier 1 Kontrolü
    if any(key in name_low for key in TIER_1_KEYWORDS):
        return "#FFD700", "Altın"
    
    # Tier 2 Kontrolü
    if any(key in name_low for key in TIER_2_KEYWORDS):
        return "#C0C0C0", "Gümüş"
        
    return "#CD7F32", "Bronz"

# Test Maçları (Gerçek veri formatında)
test_data = [
    {"saat": "19:00", "lig": "Turkish Super Lig", "ev": "Galatasaray", "dep": "Beşiktaş", "tip": "Futbol"},
    {"saat": "21:00", "lig": "English Premier League", "ev": "Liverpool", "dep": "Chelsea", "tip": "Futbol"},
    {"saat": "18:00", "lig": "TFF 1. Lig", "ev": "Sakaryaspor", "dep": "Kocaelispor", "tip": "Futbol"},
    {"saat": "04:00", "lig": "NBA", "ev": "Lakers", "dep": "Warriors", "tip": "Basketbol"}
]

# HTML ÜRETİMİ (Tasarımı daha da iyileştirdik)
tarih = datetime.datetime.now().strftime("%d.%m.%Y %H:%M")
html_icerik = f"""
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Canlı Veri Radarı</title>
    <style>
        body {{ font-family: 'Segoe UI', sans-serif; background: #0a0a0a; color: white; padding: 20px; }}
        .header {{ text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }}
        .mac-karti {{ 
            background: #161616; border-radius: 10px; padding: 18px; margin-bottom: 12px; 
            display: flex; justify-content: space-between; align-items: center;
            border-left: 10px solid; transition: 0.3s;
        }}
        .lig-bilgi {{ font-size: 0.85em; color: #888; text-transform: uppercase; }}
        .takimlar {{ font-size: 1.25em; font-weight: bold; margin-top: 5px; color: #fff; }}
        .saat {{ font-family: monospace; color: #00ff00; font-size: 1.3em; background: #222; padding: 5px 12px; border-radius: 5px; }}
        h1 {{ color: #FFD700; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 CANLI VERİ RADARI</h1>
        <p>GÜNCELLEME: {tarih}</p>
    </div>
"""

for mac in test_data:
    renk, tier_adi = get_tier(mac["lig"])
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
