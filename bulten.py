import requests
from bs4 import BeautifulSoup
import datetime
import re

# --- 1. SİTE VE TELEGRAM LİSTESİ ---
# Senin verdiğin tüm kanalları buraya profesyonelce ekledik
SITELER = {
    "1xbet": "onebahis_turkiye",
    "Betsmove": "moveresmi",
    "Holigan": "holigantg",
    "Betandyou": "betandyouTR",
    "Tempobet": "Tempobet_Turk",
    "Turkbet": "turkbetsosyal",
    "Betsat": "betsattr",
    "Masterbetting": "masterbettingtr",
    "Pusulabet": "pusulasocial",
    "Gamdom": "GamdomTopluluk",
    "Stake": "NbaEngg"
}

# --- 2. GELİŞMİŞ DOMAİN AVCI FONKSİYONU ---
def telegramdan_link_bul(kanal):
    if not kanal: return "Sabit Link"
    try:
        url = f"https://t.me/s/{kanal}"
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        res = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # Önce metin içindeki domainleri tara (Tempobet usulü rakamlılar dahil)
        mesajlar = soup.find_all('div', class_='tgme_widget_message_text')
        for mesaj in reversed(mesajlar):
            text = mesaj.get_text().lower()
            # Regex: Domain formatını yakala (örn: 1140tempobet.com)
            found = re.findall(r'([a-z0-9-]+\.[a-z]{2,3}(?:\.[a-z]{2})?)', text)
            for domain in found:
                if not any(x in domain for x in ["t.me", "instagram", "twitter", "bit.ly", "google", "youtube"]):
                    return domain

        # Alternatif: Butonlardaki linkleri tara
        links = soup.find_all('a', href=True)
        for link in reversed(links):
            href = link['href']
            if "t.me" not in href and "http" in href:
                clean = re.search(r'https?://(?:www\.)?([^/]+)', href)
                if clean:
                    domain = clean.group(1)
                    if domain not in ["tinyurl.com", "bit.ly", "cutt.ly", "dub.sh", "t.me"]:
                        return domain
        return "Adres Bulunamadı"
    except:
        return "Bağlantı Hatası"

# --- 3. HTML ÜRETİMİ (GÖRSEL ARAYÜZ) ---
tarih = datetime.datetime.now().strftime("%d.%m.%Y %H:%M")
html_icerik = f"""
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Radar Terminal V1</title>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #050505; color: #00ff00; padding: 20px; line-height: 1.6; }}
        .header {{ text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 20px; margin-bottom: 30px; }}
        .container {{ max-width: 900px; margin: 0 auto; background: #0a0a0a; border-radius: 15px; border: 1px solid #1a1a1a; padding: 20px; box-shadow: 0 0 20px rgba(0,255,0,0.05); }}
        .row {{ display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #111; transition: 0.3s; }}
        .row:hover {{ background: #0f0f0f; }}
        .site-name {{ color: #FFD700; font-weight: bold; font-size: 1.1em; width: 30%; }}
        .tg-link {{ color: #555; font-size: 0.8em; width: 30%; }}
        .domain-box {{ width: 40%; text-align: right; }}
        .link-btn {{ display: inline-block; padding: 6px 15px; background: transparent; border: 1px solid #00ff00; color: #00ff00; text-decoration: none; border-radius: 5px; font-size: 0.9em; transition: 0.3s; }}
        .link-btn:hover {{ background: #00ff00; color: #000; box-shadow: 0 0 10px #00ff00; }}
        .error {{ border-color: #ff4444; color: #ff4444; }}
        .footer {{ text-align: center; margin-top: 30px; color: #333; font-size: 0.8em; }}
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin:0; font-size: 2em; letter-spacing: 2px;">🛰️ RADAR DOMAIN TERMİNALİ</h1>
        <p style="color: #666; margin-top: 5px;">Tüm Kanallar Canlı Olarak Taranıyor...</p>
    </div>

    <div class="container">
        <div style="display: flex; color: #444; font-size: 0.7em; text-transform: uppercase; padding: 0 15px 10px 15px; font-weight: bold;">
            <div style="width:30%">SİTE ADI</div>
            <div style="width:30%">KAYNAK KANAL</div>
            <div style="width:40%; text-align:right;">GÜNCEL GİRİŞ ADRESİ</div>
        </div>
"""

for site, kanal in SITELER.items():
    link = telegramdan_link_bul(kanal)
    is_error = "Bulunamadı" in link or "Hata" in link
    btn_class = "link-btn error" if is_error else "link-btn"
    
    html_icerik += f"""
        <div class="row">
            <div class="site-name">{site}</div>
            <div class="tg-link">@{kanal}</div>
            <div class="domain-box">
                <a href="https://{link}" target="_blank" class="{btn_class}">{link}</a>
            </div>
        </div>
    """

html_icerik += f"""
    </div>
    <div class="footer">
        Son Güncelleme: {tarih} | Otomatik Tarama Modu: Aktif (30dk)
    </div>
</body>
</html>
"""

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html_icerik)
