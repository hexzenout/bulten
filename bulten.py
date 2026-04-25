import requests
import datetime

# 1. LİG SINIFLANDIRMALARI (Senin kriterlerine göre)
TIER_1_KEYWORDS = [
    "Champions League", "Europa League", "Premier League", "Süper Lig", "La Liga", 
    "Serie A", "Bundesliga", "Eredivisie", "Liga NOS", "NBA", "Euroleague", "CBA", "NBL"
]

TIER_2_KEYWORDS = ["Championship", "TFF 1", "Serie B", "Ligue 2", "Bundesliga 2"]

def get_tier(league_name):
    """Lig ismine bakıp rengini ve önemini döner."""
    for key in TIER_1_KEYWORDS:
        if key.lower() in league_name.lower():
            return "#FFD700", "Altın" # Tier 1
    for key in TIER_2_KEYWORDS:
        if key.lower() in league_name.lower():
            return "#C0C0C0", "Gümüş" # Tier 2
    return "#CD7F32", "Bronz" # Tier 3

def get_live_data():
    """Canlı maç verilerini çeker (Örnek ücretsiz API üzerinden)."""
    # Not: Bu URL örnek bir veri kaynağıdır, profesyonel aşamada RapidAPI veya Flashscore API ile değişebilir.
    url = "https://www.thesportsdb.com/api/v1/json/3/all_leagues.php" 
    # Şimdilik sistemin çalışmasını görmek için bugünün maçlarını simüle eden bir veri çekme mantığı kuralım:
    try:
        # Gerçek dünyada burada bir requests.get(url) olurdu. 
        # Şimdilik yapıyı bozmadan gerçek bülten formatına uygun veriyi hazırlıyoruz.
        test_data = [
            {"saat": "21:00", "lig": "English Premier League", "ev": "Liverpool", "dep": "Chelsea", "tip": "Futbol"},
            {"saat": "19:00", "lig": "Turkish Super Lig", "ev": "Galatasaray", "dep": "Beşiktaş", "tip": "Futbol"},
            {"saat": "20:45", "lig": "Euroleague", "ev": "Real Madrid", "dep": "Fenerbahçe", "tip": "Basketbol"},
            {"saat": "22:00", "lig": "Portugal Liga NOS", "ev": "Benfica", "dep": "Porto", "tip": "Futbol"},
            {"saat": "04:00", "lig": "NBA", "ev": "Golden State", "dep": "Lakers", "tip": "Basketbol"},
            {"saat": "13:00", "lig": "China CBA", "ev": "Guangdong", "dep": "Beijing", "tip": "Basketbol"},
            {"saat": "18:00", "lig": "TFF 1. Lig", "ev": "Sakaryaspor", "dep": "Kocaelispor", "tip": "Futbol"},
            {"saat": "15:00", "lig": "Almanya 3. Liga", "ev": "Ulm", "dep": "Preussen", "tip": "Futbol"}
        ]
        return test_data
    except Exception as e:
        print(f"Veri çekme hatası: {e}")
        return []

# HTML ÜRETİMİ
maclar = get_live_data()
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
            border-left: 6px solid; transition: 0.3s;
        }}
        .mac-karti:hover {{ transform: scale(1.01); background: #222; }}
        .lig-bilgi {{ font-size: 0.8em; color: #777; text-transform: uppercase; }}
        .takimlar {{ font-size: 1.15em; font-weight: bold; margin-top: 5px; }}
        .saat {{ font-family: 'Courier New', monospace; color: #00ff00; font-size: 1.2em; background: #222; padding: 5px 10px; border-radius: 5px; }}
        h1 {{ color: #FFD700; letter-spacing: 2px; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 CANLI VERİ RADARI</h1>
        <p>GÜNCELLEME: {tarih}</p>
    </div>
"""

for mac in maclar:
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
