import requests
from bs4 import BeautifulSoup
import datetime
import re

# --- 1. SİTE VERİLERİ (SENİN VERDİĞİN LİNKLER) ---
SITELER = {
    "1xbet": {"ana": "https://tinyurl.com/1xturkey", "tg": "onebahis_turkiye"},
    "Betsmove": {"ana": "https://dub.is/betsmovetelegram", "tg": "moveresmi"},
    "Holigan": {"ana": "http://dub.run/holiguncel", "tg": "holigantg"},
    "Betandyou": {"ana": "https://bit.ly/3UzfE7i", "tg": "betandyouTR"},
    "Tempobet": {"ana": "https://bit.ly/Tempobet-yeni-adres", "tg": "Tempobet_Turk"},
    "Turkbet": {"ana": "https://bit.ly/TB-Telegram2026", "tg": "turkbetsosyal"},
    "Betsat": {"ana": "https://bit.ly/BS-Telegram2026", "tg": "betsattr"},
    "Masterbetting": {"ana": "https://cutt.ly/Masterbetting", "tg": "masterbettingtr"},
    "Pusulabet": {"ana": "http://cutt.ly/PusulaTelegram", "tg": "pusulasocial"},
    "Gamdom": {"ana": "http://shrtio.com/GamdomTR", "tg": "GamdomTopluluk"},
    "Stake": {"ana": "https://t2m.io/stakeguncel", "tg": "NbaEngg"},
    "Nesine": {"ana": "https://www.nesine.com", "tg": None},
    "İddaa": {"ana": "https://www.iddaa.com", "tg": None},
    "Polymarket": {"ana": "https://polymarket.com", "tg": None}
}

def link_getir(site_adi, veri):
    # Kural: Önce senin verdiğin linki "KUTSAL" kabul et ve onu kullan.
    # Botun linki takip edip bozmasını (bonus8 vb.) engelliyoruz.
    ana_link = veri["ana"]
    
    try:
        # Sadece linkin "yaşayıp yaşamadığını" kontrol et, ama içeriğini kurcalama.
        r = requests.get(ana_link, timeout=5, allow_redirects=True)
        if r.status_code < 400:
            return ana_link # Link sağlamsa direkt senin verdiğin kısa link kalsın.
    except:
        pass

    # Eğer ana link kırıksa (B Planı) Telegram'dan en taze mesajı bul.
    if veri["tg"]:
        try:
            tg_url = f"https://t.me/s/{veri['tg']}"
            res = requests.get(tg_url, timeout=10)
            soup = BeautifulSoup(res.text, 'html.parser')
            links = soup.find_all('a', href=True)
            for l in reversed(links):
                href = l['href']
                if not any(x in href for x in ["t.me", "twitter", "instagram", "facebook", "bit.ly", "tinyurl"]):
                    return href
        except:
            return ana_link
            
    return ana_link

# --- HTML ÜRETİMİ ---
tarih = datetime.datetime.now().strftime("%d.%m.%Y %H:%M")
html_icerik = f"""
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Radar Terminal V4</title>
    <style>
        body {{ background: #050505; color: #fff; font-family: sans-serif; padding: 20px; }}
        .terminal {{ max-width: 850px; margin: 0 auto; background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 12px; }}
        .mac-row {{ display: flex; align-items: center; padding: 15px 25px; border-bottom: 1px solid #111; }}
        .site-name {{ flex: 1; font-weight: bold; color: #FFD700; }}
        .link-display {{ flex: 2; color: #444; font-size: 0.8em; font-family: monospace; }}
        .btn {{ background: #00ff00; color: #000; padding: 8px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; transition: 0.2s; }}
        .btn:hover {{ background: #fff; box-shadow: 0 0 10px #00ff00; }}
    </style>
</head>
<body>
    <div style="text-align:center; margin-bottom:30px;">
        <h1 style="color:#00ff00; margin:0; letter-spacing:3px;">🛰️ RADAR TERMINAL V4</h1>
        <p style="color:#333;">{tarih} | Manuel Link Öncelikli Mod</p>
    </div>
    <div class="terminal">
"""

for site, veri in SITELER.items():
    guncel = link_getir(site, veri)
    html_icerik += f"""
    <div class="mac-row">
        <div class="site-name">{site}</div>
        <div class="link-display">{guncel}</div>
        <div>
            <a href="{guncel}" target="_blank" class="btn">GİRİŞ YAP</a>
        </div>
    </div>
    """

html_icerik += "</div></body></html>"

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html_icerik)
