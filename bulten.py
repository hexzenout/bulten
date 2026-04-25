import requests
from bs4 import BeautifulSoup
import datetime
import re

# --- 1. SİTE VE TELEGRAM KONFİGÜRASYONU ---
SITELER = {
    "1xbet": {"tg": "onebahis_turkiye", "base": "https://tinyurl.com/1xturkey", "type": "1x"},
    "Betsmove": {"tg": "moveresmi", "base": "https://dub.is/betsmovetelegram", "type": "mover"},
    "Holigan": {"tg": "holigantg", "base": "http://dub.run/holiguncel", "type": "holigan"},
    "Tempobet": {"tg": "Tempobet_Turk", "base": "https://bit.ly/Tempobet-yeni-adres", "type": "tempo"},
    "Nesine": {"tg": None, "base": "https://www.nesine.com", "type": "yasal"},
    "Stake": {"tg": "NbaEngg", "base": "https://t2m.io/stakeguncel", "type": "stake"}
}

# --- 2. TELEGRAM'DAN GÜNCEL DOMAIN ÇEKİCİ (DEDEKTİF) ---
def get_current_domain(tg_channel):
    if not tg_channel: return None
    try:
        url = f"https://t.me/s/{tg_channel}"
        res = requests.get(url, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')
        # Son mesajlardaki linkleri ara
        links = soup.find_all('a', href=True)
        for link in reversed(links):
            href = link['href']
            if "http" in href and "t.me" not in href:
                return href
        return None
    except:
        return None

# --- 3. AKILLI TIER SİSTEMİ (Önceki geliştirme) ---
KARA_LISTE = ["u19", "u21", "jong", "castilla", " ii", "gelişim"]
def get_tier(league, home, away):
    text = (league + " " + home + " " + away).lower()
    if any(x in text for x in KARA_LISTE): return "#CD7F32", "Bronz"
    if any(x in ["super lig", "nba", "euroleague", "premier league"] in text for x in [True]): return "#FFD700", "Altın"
    return "#C0C0C0", "Gümüş"

# --- 4. VERİ TOPLAMA SİMÜLASYONU (API Bağlantı Altyapısı) ---
# Burası bir sonraki adımda gerçek API verileriyle dolacak
def get_odds_data():
    return [
        {
            "saat": "20:30", "lig": "Euroleague", "ev": "Anadolu Efes", "dep": "Real Madrid", "tip": "Basketbol",
            "marketler": [
                {"market": "Barem (Alt/Üst)", "bet365": "162.5", "1xbet": "164.5", "nesine": "161.5", "status": "VALUE"},
                {"market": "MS 1 Oran", "bet365": "1.90", "1xbet": "2.05", "nesine": "1.78", "status": "TOP"}
            ]
        },
        {
            "saat": "19:00", "lig": "Turkish Super Lig", "ev": "Fenerbahçe", "dep": "Beşiktaş", "tip": "Futbol",
            "marketler": [
                {"market": "Maç Sonucu 1", "bet365": "1.75", "1xbet": "1.88", "nesine": "1.70", "status": "TOP"},
                {"market": "Korner (9.5)", "bet365": "1.83", "1xbet": "1.95", "nesine": "1.75", "status": "VALUE"}
            ]
        }
    ]

# --- 5. HTML ÜRETİMİ (GELİŞMİŞ ARAYÜZ) ---
tarih = datetime.datetime.now().strftime("%d.%m.%Y %H:%M")
html_icerik = f"""
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Radar Terminal V1</title>
    <style>
        body {{ font-family: 'Inter', sans-serif; background: #050505; color: #e0e0e0; padding: 15px; }}
        .radar-header {{ text-align: center; padding: 20px; border-bottom: 2px solid #1a1a1a; margin-bottom: 20px; }}
        .site-status {{ display: flex; overflow-x: auto; gap: 10px; margin-bottom: 20px; padding-bottom: 10px; }}
        .status-tag {{ background: #111; padding: 5px 10px; border-radius: 20px; font-size: 0.7em; border: 1px solid #333; white-space: nowrap; }}
        .online {{ color: #00ff00; border-color: #00ff00; }}
        .mac-karti {{ background: #0f0f0f; border: 1px solid #222; border-radius: 12px; margin-bottom: 15px; overflow: hidden; }}
        .mac-ana {{ padding: 15px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }}
        .tier-bar {{ width: 6px; height: 100%; position: absolute; left: 0; top: 0; }}
        .detay-tablo {{ display: none; background: #161616; padding: 15px; border-top: 1px solid #222; }}
        table {{ width: 100%; border-collapse: collapse; font-size: 0.85em; }}
        th {{ text-align: left; color: #666; padding: 8px; border-bottom: 1px solid #333; }}
        td {{ padding: 10px 8px; border-bottom: 1px solid #222; }}
        .high-odd {{ color: #00ff00; font-weight: bold; background: rgba(0,255,0,0.1); border-radius: 4px; padding: 2px 5px; }}
        .bet365-col {{ color: #ffcc00; font-weight: bold; }}
    </style>
</head>
<body>
    <div class="radar-header">
        <h1 style="color:#FFD700; margin:0;">🎯 RADAR TERMINAL V1</h1>
        <p style="font-size:0.8em; color:#555;">Sistem Aktif | {tarih}</p>
    </div>

    <div class="site-status">
"""

# Site durumlarını ekle
for site, info in SITELER.items():
    status_class = "online" if info["tg"] or site == "Nesine" else ""
    html_icerik += f'<div class="status-tag {status_class}">● {site}</div>'

html_icerik += '</div><div id="bulten">'

# Maçları ekle
for mac in get_odds_data():
    renk, tier = get_tier(mac["lig"], mac["ev"], mac["dep"])
    html_icerik += f"""
    <div class="mac-karti" onclick="toggleDetail(this)" style="position:relative; border-left: 6px solid {renk};">
        <div class="mac-ana">
            <div>
                <span style="font-size:0.7em; color:#888;">{mac['lig']} ({tier})</span>
                <div style="font-weight:bold; font-size:1.1em; margin-top:4px;">{mac['ev']} - {mac['dep']}</div>
            </div>
            <div style="text-align:right;">
                <div style="color:#00ff00; font-family:monospace;">{mac['saat']}</div>
                <div style="font-size:0.6em; color:#444;">TIKLA ANALİZ ET</div>
            </div>
        </div>
        <div class="detay-tablo">
            <table>
                <tr>
                    <th>Market</th>
                    <th class="bet365-col">Bet365 (Ref)</th>
                    <th>1xbet</th>
                    <th>Nesine</th>
                </tr>
    """
    for m in mac['marketler']:
        html_icerik += f"""
                <tr>
                    <td>{m['market']}</td>
                    <td class="bet365-col">{m['bet365']}</td>
                    <td class="{"high-odd" if float(m['1xbet'].split()[0]) > float(m['bet365'].split()[0]) else ""}">{m['1xbet']}</td>
                    <td>{m['nesine']}</td>
                </tr>
        """
    html_icerik += "</table></div></div>"

html_icerik += """
    </div>
    <script>
        function toggleDetail(el) {
            let detail = el.querySelector('.detay-tablo');
            detail.style.display = (detail.style.display === 'block') ? 'none' : 'block';
        }
    </script>
</body>
</html>
"""

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html_icerik)
