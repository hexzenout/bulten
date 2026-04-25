import requests
from bs4 import BeautifulSoup
import datetime
import re

# --- 1. TÜM SİTELER, LİNKLER VE TV ADRESLERİ (EKSİKSİZ) ---
SITELER = {
    "1xbet": {"ana": "https://tinyurl.com/1xturkey", "tg": "onebahis_turkiye", "tv": "https://1xbahis-tv.com"},
    "Betsmove": {"ana": "https://dub.is/betsmovetelegram", "tg": "moveresmi", "tv": "https://betsmovetv.site"},
    "Holigan": {"ana": "http://dub.run/holiguncel", "tg": "holigantg", "tv": "https://holigantv.app"},
    "Betandyou": {"ana": "https://bit.ly/3UzfE7i", "tg": "betandyouTR", "tv": "https://betandyou-tv.com"},
    "Tempobet": {"ana": "https://bit.ly/Tempobet-yeni-adres", "tg": "Tempobet_Turk", "tv": "https://tempobet-tv.com"},
    "Turkbet": {"ana": "https://bit.ly/TB-Telegram2026", "tg": "turkbetsosyal", "tv": "https://turkbettv.com"},
    "Betsat": {"ana": "https://bit.ly/BS-Telegram2026", "tg": "betsattr", "tv": "https://betsattv.com"},
    "Masterbetting": {"ana": "https://cutt.ly/Masterbetting", "tg": "masterbettingtr", "tv": "https://masterbettingtv.com"},
    "Pusulabet": {"ana": "http://cutt.ly/PusulaTelegram", "tg": "pusulasocial", "tv": "https://pusulabettv.com"},
    "Gamdom": {"ana": "http://shrtio.com/GamdomTR", "tg": "GamdomTopluluk", "tv": "#"},
    "Stake": {"ana": "https://t2m.io/stakeguncel", "tg": "NbaEngg", "tv": "#"},
    "Nesine": {"ana": "https://www.nesine.com", "tg": None, "tv": "https://www.nesine.com/canli-izle"},
    "İddaa": {"ana": "https://www.iddaa.com", "tg": None, "tv": "#"},
    "Polymarket": {"ana": "https://polymarket.com", "tg": None, "tv": "#"}
}

# --- 2. AKILLI LİNK VE TELEGRAM DEDEKTİFİ ---
def link_servisi(site_adi, veri):
    ana_link = veri["ana"]
    # IP adresi ve bonus sayfası hatalarını engellemek için redirect takibini sınırladık
    try:
        r = requests.head(ana_link, timeout=3, allow_redirects=False)
        if r.status_code < 400: return ana_link
    except:
        pass
    
    # Ana link patlarsa Telegram'dan görsel altı ve buton taraması
    if veri["tg"]:
        try:
            res = requests.get(f"https://t.me/s/{veri['tg']}", timeout=5)
            soup = BeautifulSoup(res.text, 'html.parser')
            for l in reversed(soup.find_all('a', href=True)):
                h = l['href']
                if not any(x in h for x in ["t.me", "twitter", "instagram", "bit.ly", "tinyurl"]):
                    return h
        except: return ana_link
    return ana_link

# --- 3. ANALİZ MOTORU (TAÇ, FAUL, ŞUT, OYUNCU) ---
# Bu kısım gerçek verilerle beslenecek şekilde simüle edildi
def get_analysis():
    return [
        {"lig": "İngiltere", "mac": "Arsenal - Liverpool", "mkt": "Toplam Taç (38.5)", "b365": "1.80", "senin": "2.05", "val": "%14"},
        {"lig": "İspanya", "mac": "Barcelona - Real Madrid", "mkt": "Faul Sayısı (26.5)", "b365": "1.72", "senin": "1.95", "val": "%13"},
        {"lig": "NBA", "mac": "Lakers - Suns", "mkt": "Oyuncu Şut: LeBron 25.5+", "b365": "1.83", "senin": "2.10", "val": "%15"}
    ]

# --- 4. İNANILMAZ TASARIM (SİBER TERMİNAL V10) ---
tarih = datetime.datetime.now().strftime("%d.%m.%Y %H:%M")
html = f"""
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>RADAR TERMİNAL V10</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        body {{ background: #020202; color: #fff; font-family: 'JetBrains Mono', monospace; margin: 0; padding: 20px; }}
        .wrapper {{ max-width: 1200px; margin: 0 auto; }}
        .header {{ border-left: 5px solid #00ff00; padding: 20px; background: #0a0a0a; margin-bottom: 30px; }}
        .site-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px; }}
        .card {{ background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 8px; padding: 15px; position: relative; }}
        .card:hover {{ border-color: #00ff00; }}
        .name {{ color: #FFD700; font-size: 1.2em; font-weight: bold; margin-bottom: 15px; display: block; }}
        .btn-box {{ display: flex; gap: 8px; }}
        .btn {{ flex: 1; padding: 10px; text-align: center; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 0.75em; }}
        .btn-g {{ background: #00ff00; color: #000; }}
        .btn-t {{ border: 1px solid #00ff00; color: #00ff00; }}
        .analysis-sec {{ margin-top: 50px; background: #0a0a0a; border-radius: 12px; padding: 25px; border: 1px solid #222; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
        th {{ text-align: left; color: #444; padding: 12px; border-bottom: 1px solid #222; font-size: 0.8em; }}
        td {{ padding: 15px 12px; border-bottom: 1px solid #111; font-size: 0.9em; }}
        .val {{ color: #00ff00; background: rgba(0,255,0,0.1); padding: 4px 8px; border-radius: 4px; font-weight: bold; }}
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1 style="margin:0; font-size: 1.8em;">🛰️ RADAR TERMİNAL V10 PRO</h1>
            <p style="color:#444; margin:5px 0 0 0;">{tarih} | Taç, Faul, Şut, Korner Aktif</p>
        </div>

        <div class="site-grid">
"""

for s, v in SITELER.items():
    link = link_servisi(s, v)
    html += f"""
            <div class="card">
                <span class="name">{s}</span>
                <div class="btn-box">
                    <a href="{link}" target="_blank" class="btn btn-g">GİRİŞ YAP</a>
                    <a href="{v['tv']}" target="_blank" class="btn btn-t">📺 TV</a>
                </div>
            </div>"""

html += """
        </div>

        <div class="analysis-sec">
            <h2 style="color:#00ff00; margin-top:0;">📊 DERİN ANALİZ (TAÇ/FAUL/ŞUT)</h2>
            <table>
                <thead>
                    <tr><th>MAÇ</th><th>MARKET</th><th>BET365</th><th>SENİN SİTEN</th><th>VALUE</th></tr>
                </thead>
                <tbody>
"""

for a in get_analysis():
    html += f"""
                    <tr>
                        <td>{a['mac']}<br><small style="color:#444;">{a['lig']}</small></td>
                        <td>{a['mkt']}</td>
                        <td style="color:#666;">{a['b365']}</td>
                        <td style="color:#00ff00; font-weight:bold;">{a['senin']}</td>
                        <td><span class="val">{a['val']}</span></td>
                    </tr>"""

html += "</tbody></table></div></div></body></html>"

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)
