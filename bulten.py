import requests
from bs4 import BeautifulSoup
import datetime

# --- GÜNCEL TELEGRAM LİSTESİ ---
SITELER = {
    "1xbet": "onebahis_turkiye",
    "Betsmove": "moveresmi",
    "Holigan": "holigantg",
    "Betandyou": "betandyouTR",
    "Tempobet": "Tempobet_Turk",
    "Turkbet": "turkbetsosyal",
    "Betsat": "betsattr",
    "Masterbetting": "masterbettingtr",
    "Pusulabet": "pusulasocial"
}

def telegramdan_link_bul(kanal):
    try:
        # Telegram'ın web önizleme sayfasını çekiyoruz
        url = f"https://t.me/s/{kanal}"
        headers = {'User-Agent': 'Mozilla/5.0'}
        res = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # Son mesajlardaki tüm linkleri topla
        mesajlar = soup.find_all('div', class_='tgme_widget_message_text')
        for mesaj in reversed(mesajlar):
            # Mesajın içindeki linkleri veya 'domain.com' formatındaki yazıları ara
            text = mesaj.get_text()
            match = re.search(r'[a-zA-Z0-9-]+\.[a-z]{2,}', text)
            if match:
                domain = match.group(0)
                # Yaygın alakasız domainleri ele
                if domain not in ["t.me", "google.com", "twitter.com"]:
                    return domain
        return "Adres Bulunamadı"
    except:
        return "Bağlantı Hatası"

import re # Re modülünü eklemeyi unutmayalım

# --- HTML ÜRETİMİ ---
tarih = datetime.datetime.now().strftime("%d.%m.%Y %H:%M")
html_icerik = f"""
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8"><title>Radar Giriş Terminali</title>
    <style>
        body {{ background: #050505; color: #00ff00; font-family: monospace; padding: 20px; }}
        .domain-row {{ border-bottom: 1px solid #222; padding: 10px; display: flex; justify-content: space-between; }}
        .site-adi {{ color: #FFD700; font-weight: bold; }}
        .aktif-link {{ color: #fff; text-decoration: none; border: 1px solid #00ff00; padding: 2px 5px; border-radius: 4px; }}
        .aktif-link:hover {{ background: #00ff00; color: #000; }}
    </style>
</head>
<body>
    <h1>🛰️ RADAR GİRİŞ TERMİNALİ (DOMAIN TAKİBİ)</h1>
    <p>Son Tarama: {tarih}</p>
    <div style="background: #111; border-radius: 10px; padding: 10px;">
"""

for site, kanal in SITELER.items():
    bulunan_link = telegramdan_link_bul(kanal)
    html_icerik += f"""
    <div class="domain-row">
        <span class="site-adi">{site}</span>
        <span>{kanal}</span>
        <a href="https://{bulunan_link}" target="_blank" class="aktif-link">{bulunan_link}</a>
    </div>
    """

html_icerik += "</div></body></html>"

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html_icerik)
