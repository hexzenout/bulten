import requests
from bs4 import BeautifulSoup
import datetime
import re

# --- 1. SİTE VERİLERİ (ANA LİNK + TELEGRAM YEDEĞİ) ---
SITELER = {
    "1xbet": {"ana_link": "https://tinyurl.com/1xturkey", "tg": "onebahis_turkiye"},
    "Betsmove": {"ana_link": "https://dub.is/betsmovetelegram", "tg": "moveresmi"},
    "Holigan": {"ana_link": "http://dub.run/holiguncel", "tg": "holigantg"},
    "Betandyou": {"ana_link": "https://bit.ly/3UzfE7i", "tg": "betandyouTR"},
    "Tempobet": {"ana_link": "https://bit.ly/Tempobet-yeni-adres", "tg": "Tempobet_Turk"},
    "Turkbet": {"ana_link": "https://bit.ly/TB-Telegram2026", "tg": "turkbetsosyal"},
    "Betsat": {"ana_link": "https://bit.ly/BS-Telegram2026", "tg": "betsattr"},
    "Masterbetting": {"ana_link": "https://cutt.ly/Masterbetting", "tg": "masterbettingtr"},
    "Pusulabet": {"ana_link": "http://cutt.ly/PusulaTelegram", "tg": "pusulasocial"},
    "Gamdom": {"ana_link": "http://shrtio.com/GamdomTR", "tg": "GamdomTopluluk"},
    "Stake": {"ana_link": "https://t2m.io/stakeguncel", "tg": "NbaEngg"},
    "Nesine": {"ana_link": "https://www.nesine.com", "tg": None},
    "İddaa": {"ana_link": "https://www.iddaa.com", "tg": None},
    "Polymarket": {"ana_link": "https://polymarket.com", "tg": None}
}

def link_cozucu(site_adi, veri):
    # ADIM 1: Önce senin verdiğin ana linki dene
    try:
        res = requests.head(veri["ana_link"], allow_redirects=True, timeout=5)
        # Eğer link yaşıyorsa (200 OK), o linki temizleyip döndür
        if res.status_code < 400:
            clean = re.search(r'(?:https?://)?(?:www\.)?([^/\?]+)', res.url)
            return clean.group(1) if clean else veri["ana_link"]
    except:
        pass # Ana link kırıksa burayı atla ve Telegram'a geç

    # ADIM 2: Ana link kırıksa Telegram'a bak (B Planı)
    if veri["tg"]:
        try:
            tg_url = f"https://t.me/s/{veri['tg']}"
            tg_res = requests.get(tg_url, timeout=10)
            soup = BeautifulSoup(tg_res.text, 'html.parser')
            links = soup.find_all('a', href=True)
            for link in reversed(links):
                href = link['href']
                if not any(x in href for x in ["t.me", "twitter", "instagram", "facebook", "google"]):
                    clean = re.search(r'(?:https?://)?(?:www\.)?([^/\?]+)', href)
                    if clean and len(clean.group(1)) > 5:
                        return clean.group(1)
        except:
            return "Telegram Taranamadı"
            
    return "Adres Bulunamadı"

# --- HTML ARAYÜZÜ ---
tarih = datetime.datetime.now().strftime("%d.%m.%Y %H:%M")
html_icerik = f"""
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Radar Terminal V3</title>
    <style>
        body {{ background: #0a0a0a; color: #fff; font-family: 'Segoe UI', sans-serif; padding: 20px; }}
        .terminal {{ max-width: 900px; margin: 0 auto; background: #111; border: 1px solid #333; border-radius: 8px; overflow: hidden; }}
        .row {{ display: flex; align-items: center; padding: 12px 20px; border-bottom: 1px solid #222; }}
        .site-name {{ flex: 1; font-weight: bold; color: #FFD700; }}
        .status-dot {{ width: 10px; height: 10px; border-radius: 50%; margin-right: 10px; }}
        .btn {{ background: #00ff00; color: #000; padding: 5px 15px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 0.85em; }}
        .btn:hover {{ background: #00cc00; }}
        .label {{ font-size: 0.7em; color: #666; text-transform: uppercase; }}
    </style>
</head>
<body>
    <div style="text-align:center; margin-bottom:30px;">
        <h1 style="color:#00ff00; margin:0;">🛰️ RADAR TERMINAL V3</h1>
        <p style="color:#555;">Akıllı Link Doğrulama Modu Aktif | {tarih}</p>
    </div>
    <div class="terminal">
        <div class="row" style="background:#1a1a1a; font-weight:bold; font-size:0.75em; color:#888;">
            <div style="flex:1;">SİTE</div><div style="flex:1;">DURUM</div><div style="flex:1; text-align:right;">ERİŞİM</div>
        </div>
"""

for site, veri in SITELER.items():
    guncel_link = link_cozucu(site, veri)
    durum_renk = "#00ff00" if "." in guncel_link else "#ff0000"
    
    html_icerik += f"""
    <div class="row">
        <div class="site-name">{site}</div>
        <div style="flex:1; display:flex; align-items:center;">
            <div class="status-dot" style="background:{durum_renk};"></div>
            <span style="font-size:0.8em; color:#888;">{guncel_link}</span>
        </div>
        <div style="flex:1; text-align:right;">
            <a href="https://{guncel_link}" target="_blank" class="btn">GİRİŞ YAP</a>
        </div>
    </div>
    """

html_icerik += "</div></body></html>"

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html_icerik)
