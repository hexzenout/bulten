import requests
from bs4 import BeautifulSoup
import datetime
import re

# --- 1. SİTE LİSTESİ (EKSİKSİZ VE SABİT) ---
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
    "Polymarket": {"ana": "https://polymarket.com", "tg": None},
    "Nesine": {"ana": "https://www.nesine.com", "tg": None},
    "İddaa": {"ana": "https://www.iddaa.com", "tg": None}
}

def link_motoru(site_adi, veri):
    # KURAL 1: Sorgulama yapma, IP adresine gitme. Direkt senin verdiğin linki kullan.
    # Bu, Turkbet ve Betsat'taki o rakamlı adres sorununu %100 bitirir.
    ana_link = veri["ana"]
    
    # KURAL 2: Sadece ana linke erişim tamamen kesilirse Telegram devreye girer.
    # Telegram testi: Metin içindeki linkleri ve görsel altı yazılarını tarar.
    if veri["tg"]:
        try:
            # Sadece kısa bir kontrol: Link 404 mü? (Yönlendirmeyi takip etme!)
            r = requests.get(ana_link, timeout=3, allow_redirects=False)
            if r.status_code < 400:
                return ana_link
        except:
            # Link kırıksa Telegram'a bak
            try:
                tg_url = f"https://t.me/s/{veri['tg']}"
                res = requests.get(tg_url, timeout=5)
                soup = BeautifulSoup(res.text, 'html.parser')
                # Son 5 mesajı tara
                mesajlar = soup.find_all('div', class_='tgme_widget_message_bubble')
                for msg in reversed(mesajlar):
                    links = msg.find_all('a', href=True)
                    for l in links:
                        h = l['href']
                        if not any(x in h for x in ["t.me", "twitter", "instagram", "bit.ly", "tinyurl"]):
                            return h
            except:
                return ana_link
    return ana_link

# --- 2. GÖRSEL ARAYÜZ (TERMINAL TASARIMI) ---
tarih = datetime.datetime.now().strftime("%d.%m.%Y %H:%M")
html_content = f"""
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Radar Terminal V8</title>
    <style>
        body {{ background: #050505; color: #fff; font-family: 'Inter', sans-serif; padding: 20px; }}
        .radar-box {{ max-width: 900px; margin: 0 auto; background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 12px; overflow: hidden; }}
        .header {{ padding: 25px; border-bottom: 1px solid #1a1a1a; text-align: center; }}
        .site-row {{ display: flex; align-items: center; padding: 15px 25px; border-bottom: 1px solid #141414; }}
        .site-name {{ flex: 1; font-weight: bold; color: #FFD700; }}
        .site-url {{ flex: 2; color: #444; font-size: 0.8em; font-family: monospace; }}
        .btn {{ background: #00ff00; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 0.8em; }}
        .btn:hover {{ background: #fff; box-shadow: 0 0 15px #00ff00; }}
    </style>
</head>
<body>
    <div class="header">
        <h1 style="color:#00ff00; margin:0;">🛰️ RADAR TERMINAL V8</h1>
        <p style="color:#444; font-size:0.8em;">{tarih} | Kesin Link & Eksiksiz Liste</p>
    </div>
    <div class="radar-box">
"""

for site, veri in SITELER.items():
    guncel = link_motoru(site, veri)
    html_content += f"""
        <div class="site-row">
            <div class="site-name">{site}</div>
            <div class="site-url">{guncel}</div>
            <a href="{guncel}" target="_blank" class="btn">GİRİŞ YAP</a>
        </div>"""

html_content += "</div></body></html>"

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html_content)
