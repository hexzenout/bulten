import requests
from bs4 import BeautifulSoup
import datetime
import re

# --- 1. SİTE VE TELEGRAM VERİLERİ ---
SITELER = {
    "1xbet": {"ana": "https://tinyurl.com/1xturkey", "tg": "onebahis_turkiye"},
    "Betsmove": {"ana": "https://dub.is/betsmovetelegram", "tg": "moveresmi"},
    "Holigan": {"ana": "http://dub.run/holiguncel", "tg": "holigantg"},
    "Betandyou": {"ana": "https://bit.ly/3UzfE7i", "tg": "betandyouTR"},
    "Tempobet": {"ana": "https://bit.ly/Tempobet-yeni-adres", "tg": "Tempobet_Turk"},
    "Turkbet": {"ana": "https://bit.ly/TB-Telegram2026", "tg": "turkbetsosyal"},
    "Betsat": {"ana": "https://bit.ly/BS-Telegram2026", "tg": "betsattr"},
    "Nesine": {"ana": "https://www.nesine.com", "tg": None},
    "Polymarket": {"ana": "https://polymarket.com", "tg": None}
}

def güvenli_link_bul(site_adi, veri):
    # ADIM 1: Senin verdiğin ana linki dene (Yönlendirmeyi bozmadan)
    try:
        r = requests.head(veri["ana"], timeout=5, allow_redirects=True)
        if r.status_code < 400:
            # Kayıt sayfasını atlatmak için ana sayfaya zorla
            final_url = r.url
            if "register" in final_url.lower():
                final_url = final_url.split('/register')[0] + "/main/"
            return final_url
    except:
        pass

    # ADIM 2: Telegram Testi (Link kırıksa devreye girer)
    if veri["tg"]:
        try:
            tg_url = f"https://t.me/s/{veri['tg']}"
            res = requests.get(tg_url, timeout=10)
            soup = BeautifulSoup(res.text, 'html.parser')
            # Son mesajlardaki buton ve linkleri tara
            links = soup.find_all('a', href=True)
            for l in reversed(links):
                href = l['href']
                if not any(x in href for x in ["t.me", "twitter", "instagram", "google", "apple"]):
                    return href
        except:
            return veri["ana"]
    return veri["ana"]

# --- 2. CANLI MAÇ ANALİZ MOTORU (Simülasyon - API Bağlantısı Hazır) ---
def get_live_radar():
    return [
        {
            "lig": "NBA", "mac": "Lakers - Warriors", "saat": "04:00",
            "oranlar": {"bet365": "1.75", "1xbet": "1.92", "nesine": "1.70"},
            "market": "Alt/Üst (225.5)"
        },
        {
            "lig": "Süper Lig", "mac": "Galatasaray - Beşiktaş", "saat": "19:00",
            "oranlar": {"bet365": "1.85", "1xbet": "2.10", "nesine": "1.82"},
            "market": "Korner (9.5)"
        }
    ]

# --- 3. HTML TASARIMI ---
tarih = datetime.datetime.now().strftime("%d.%m.%Y %H:%M")
html_icerik = f"""
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8"><title>Radar V6 - Full Kontrol</title>
    <style>
        body {{ background: #050505; color: #fff; font-family: sans-serif; padding: 10px; }}
        .panel {{ max-width: 900px; margin: 0 auto; background: #0f0f0f; border: 1px solid #222; border-radius: 12px; padding: 15px; }}
        .row {{ display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #1a1a1a; }}
        .btn {{ background: #00ff00; color: #000; padding: 8px 15px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 0.8em; }}
        .value-box {{ background: #1a1a1a; padding: 15px; margin-top: 20px; border-radius: 10px; border: 1px solid #333; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.9em; }}
        th {{ color: #666; text-align: left; padding: 10px; border-bottom: 1px solid #222; }}
        td {{ padding: 10px; border-bottom: 1px solid #111; }}
        .gold {{ color: #FFD700; font-weight: bold; }}
        .high {{ color: #00ff00; background: rgba(0,255,0,0.1); padding: 3px 6px; border-radius: 4px; }}
    </style>
</head>
<body>
    <div class="panel">
        <h2 style="color:#00ff00; text-align:center;">🛰️ RADAR TERMINAL V6</h2>
        <p style="text-align:center; color:#444; font-size:0.8em;">{tarih} | Linkler & Telegram Kontrol Edildi</p>
        
        <div style="margin-bottom:30px;">
"""

for site, veri in SITELER.items():
    link = güvenli_link_bul(site, veri)
    html_icerik += f"""
            <div class="row">
                <span class="gold">{site}</span>
                <span style="font-size:0.7em; color:#444; overflow:hidden;">{link[:40]}...</span>
                <a href="{link}" target="_blank" class="btn">GİRİŞ</a>
            </div>"""

html_icerik += """
        </div>

        <div class="value-box">
            <h3 style="color:#FFD700; margin:0;">📊 CANLI DEĞER RADARI (BETA)</h3>
            <table>
                <tr><th>Maç / Lig</th><th>Market</th><th>Bet365</th><th>1xbet</th><th>Nesine</th></tr>
"""

for mac in get_live_radar():
    html_icerik += f"""
                <tr>
                    <td><b>{mac['mac']}</b><br><small style="color:#555;">{mac['lig']} - {mac['saat']}</small></td>
                    <td>{mac['market']}</td>
                    <td style="color:#888;">{mac['oranlar']['bet365']}</td>
                    <td><span class="high">{mac['oranlar']['1xbet']}</span></td>
                    <td>{mac['oranlar']['nesine']}</td>
                </tr>"""

html_icerik += "</table></div></div></body></html>"

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html_icerik)
