import datetime

# LİG SINIFLANDIRMALARI (TIER SİSTEMİ)
TIER_1 = ["Şampiyonlar Ligi", "Premier Lig", "NBA", "Euroleague"] 
TIER_2 = ["Championship", "Türkiye Süper Ligi", "Basketbol Süper Ligi"] 
TIER_3 = ["TFF 1. Lig", "Almanya Reg. Lig"] 

# Örnek Maç Verileri (Burayı yakında canlı API'ye bağlayacağız)
maclar = [
    {"saat": "21:45", "lig": "Şampiyonlar Ligi", "ev": "Real Madrid", "dep": "Barcelona", "tip": "Futbol"},
    {"saat": "22:00", "lig": "Premier Lig", "ev": "Arsenal", "dep": "Man City", "tip": "Futbol"},
    {"saat": "19:00", "lig": "Türkiye Süper Ligi", "ev": "Fenerbahçe", "dep": "Galatasaray", "tip": "Futbol"},
    {"saat": "03:00", "lig": "NBA", "ev": "Lakers", "dep": "Celtics", "tip": "Basketbol"},
    {"saat": "20:30", "lig": "Euroleague", "ev": "Anadolu Efes", "dep": "Panathinaikos", "tip": "Basketbol"}
]

def get_tier_color(lig_adi):
    if lig_adi in TIER_1: return "#FFD700" 
    elif lig_adi in TIER_2: return "#C0C0C0" 
    else: return "#CD7F32" 

html_icerik = f"""
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Günlük Değer Radarı</title>
    <style>
        body {{ font-family: Arial, sans-serif; background-color: #121212; color: #ffffff; padding: 20px; }}
        .header {{ text-align: center; margin-bottom: 30px; }}
        .mac-karti {{ background-color: #1e1e1e; border-radius: 8px; padding: 15px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; border-left: 5px solid; }}
        .lig-ismi {{ font-size: 0.9em; color: #888; }}
        .takimlar {{ font-size: 1.2em; font-weight: bold; margin: 5px 0; }}
        .saat {{ background-color: #333; padding: 5px 10px; border-radius: 5px; font-weight: bold; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 Günlük Değer Radarı</h1>
        <p>Son Güncelleme: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
    </div>
"""

for mac in maclar:
    renk = get_tier_color(mac["lig"])
    html_icerik += f"""
    <div class="mac-karti" style="border-left-color: {renk};">
        <div>
            <div class="lig-ismi">{mac['tip']} | {mac['lig']}</div>
            <div class="takimlar">{mac['ev']} - {mac['dep']}</div>
        </div>
        <div class="saat">{mac['saat']}</div>
    </div>
    """

html_icerik += "</body></html>"

with open("index.html", "w", encoding="utf-8") as dosya:
    dosya.write(html_icerik)
