import requests
from bs4 import BeautifulSoup
import datetime
import re

# --- 1. SİTE VERİLERİ (KESİN LİNKLER) ---
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

def link_dogrula(site_adi, veri):
    # ADIM 1: Ana linkin çalışıp çalışmadığını sessizce kontrol et
    try:
        # allow_redirects=False yaparak IP adresine kadar gitmesini engelliyoruz, linki olduğu gibi koruyoruz.
        r = requests.head(veri["ana"], timeout=5)
        if r.status_code < 405: # Link ayaktaysa direkt senin verdiğini döndür
            return veri["ana"]
    except:
        pass

    # ADIM 2: Eğer ana link kırıksa Telegram'dan GERÇEK domaini bul
    if veri["tg"]:
        try:
            tg_url = f"https://t.me/s/{veri['tg']}"
            res = requests.get(tg_url, timeout=10)
            soup = BeautifulSoup(res.text, 'html.parser')
            
            # Mesajlardaki linkleri ve butonları tara
            all_links = soup.find_all('a', href=True)
            for l in reversed(all_links):
                href = l['href']
                # Sosyal medya ve kısaltma servislerini ayıkla
                if not any(x in href for x in ["t.me", "twitter.com", "instagram.com", "bit.ly", "dub.", "tinyurl", "cutt.ly"]):
                    # Sadece temiz domaini döndür
                    clean = re.search(r'https?://[a-zA-Z0-9.-]+', href)
                    if clean: return clean.group(0)
        except:
            return veri["ana"] # Telegram hatasında bile senin ana linkine geri dön
            
    return veri["ana"]

# --- HTML ÜRETİMİ ---
tarih = datetime.datetime.now().strftime("%d.%m.%Y %H:%M")
html_icerik = f"""
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Radar Terminal V3.1</title>
    <style>
        body {{ background: #080808; color: #fff; font-family: sans-serif; padding: 20px; }}
        .terminal {{ max-width: 900px; margin: 0 auto; background: #111; border-radius: 10px; border: 1px solid #222; overflow: hidden; }}
        .row {{ display: flex; align-items: center; padding: 15px 25px; border-bottom: 1px solid #1a1a1a; }}
        .site-name {{ flex: 1; font-weight: bold; color: #FFD700; }}
        .link-text {{ flex: 2; color: #666; font-size: 0.85em; overflow: hidden; text-overflow: ellipsis; }}
        .btn {{ background: #00ff00; color: #000; padding: 8px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; }}
        .btn:hover {{ background: #00cc00; }}
    </style>
</head>
<body>
    <div style="text-align:center; margin-bottom:20px;">
        <h1 style="color:#00ff00;">🛰️ RADAR TERMINAL V3.1</h1>
        <p style="color:#444;">{tarih} | Manuel Link + Otomatik Telegram Yedekleme</p>
    </div>
    <div class="terminal">
"""

for site, veri in SITELER.items():
    guncel = link_dogrula(site, veri)
    html_icerik += f"""
    <div class="row">
        <div class="site-name">{site}</div>
        <div class="link-text">{guncel}</div>
        <div>
            <a href="{guncel}" target="_blank" class="btn">GİRİŞ YAP</a>
        </div>
    </div>
    """

html_icerik += "</div></body></html>"

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html_icerik)
