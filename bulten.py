import datetime

# --- 1. SİTELER (14/14 - ASLA EKSİLMEYECEK) ---
SITELER = {
    "1xbet": "https://tinyurl.com/1xturkey", "Betsmove": "https://dub.is/betsmovetelegram",
    "Holigan": "http://dub.run/holiguncel", "Betandyou": "https://bit.ly/3UzfE7i",
    "Tempobet": "https://bit.ly/Tempobet-yeni-adres", "Turkbet": "https://bit.ly/TB-Telegram2026",
    "Betsat": "https://bit.ly/BS-Telegram2026", "Masterbetting": "https://cutt.ly/Masterbetting",
    "Pusulabet": "http://cutt.ly/PusulaTelegram", "Gamdom": "http://shrtio.com/GamdomTR",
    "Stake": "https://t2m.io/stakeguncel", "Nesine": "https://www.nesine.com",
    "İddaa": "https://www.iddaa.com", "Polymarket": "https://polymarket.com"
}

# --- 2. TV KANALLARI ---
TV_KANALLARI = {
    "1xbet TV": "https://1xbahis-tv.com", "Betsmove TV": "https://betsmovetv.site",
    "Holigan TV": "https://holigantv.app", "Turkbet TV": "https://turkbettv.com",
    "Betsat TV": "https://betsattv.com", "Nesine Canlı": "https://www.nesine.com/canli-izle"
}

# --- 3. LİG HİYERARŞİSİ VE TIER SİSTEMİ ---
FUTBOL_TOP10 = [
    ("İngiltere Premier Lig", "Altın"), ("Trendyol Süper Lig", "Altın"), ("İspanya La Liga", "Altın"),
    ("Almanya Bundesliga", "Gümüş"), ("İtalya Serie A", "Gümüş"), ("Fransa Ligue 1", "Gümüş"),
    ("Hollanda Eredivisie", "Bronz"), ("Portekiz Liga", "Bronz"), ("Brezilya Serie A", "Bronz"), ("Arjantin Prim.", "Bronz")
]
TURNUVALAR = [("Şampiyonlar Ligi", "Altın"), ("Avrupa Ligi", "Gümüş"), ("Konferans Ligi", "Bronz"), ("Dünya Kupası", "Altın")]
BASKETBOL = [
    ("NBA", "Altın"), ("Euroleague", "Altın"), ("Avustralya NBL", "Gümüş"), 
    ("Türkiye BSL", "Gümüş"), ("Çin CBA", "Bronz"), ("İspanya ACB", "Gümüş")
]

tarih = datetime.datetime.now().strftime("%d.%m.%Y %H:%M")

html = f"""
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>RADAR MASTER V14</title>
    <style>
        :root {{ --neon: #00ff00; --gold: #FFD700; --silver: #C0C0C0; --bronze: #CD7F32; --bg: #020202; }}
        body {{ background: var(--bg); color: #fff; font-family: 'Inter', sans-serif; margin: 0; overflow-x: hidden; }}
        
        /* SIDEBAR AYARLARI */
        .sidebar {{ position: fixed; left: -300px; top: 0; width: 280px; height: 100%; background: #0a0a0a; border-right: 1px solid #222; transition: 0.3s; z-index: 1000; padding: 20px; visibility: hidden; }}
        .sidebar.active {{ left: 0; visibility: visible; }}
        
        .menu-triggers {{ position: fixed; top: 20px; left: 20px; display: flex; gap: 10px; z-index: 1100; }}
        .t-btn {{ background: #111; color: var(--neon); border: 1px solid #333; padding: 10px 15px; cursor: pointer; border-radius: 8px; font-weight: bold; font-size: 0.8em; }}
        .t-btn:hover {{ background: var(--neon); color: #000; }}

        /* İÇERİK */
        .main {{ padding: 100px 20px; max-width: 1000px; margin: 0 auto; }}
        .section {{ background: #080808; border: 1px solid #1a1a1a; border-radius: 12px; padding: 20px; margin-bottom: 30px; }}
        .section h3 {{ border-bottom: 1px solid #222; padding-bottom: 10px; font-size: 1em; display: flex; align-items: center; justify-content: space-between; }}
        
        /* TIER RENKLERİ */
        .tier-Altın {{ color: var(--gold); }}
        .tier-Gümüş {{ color: var(--silver); }}
        .tier-Bronz {{ color: var(--bronze); }}

        table {{ width: 100%; border-collapse: collapse; }}
        td {{ padding: 15px 10px; border-bottom: 1px solid #111; font-size: 0.85em; }}
        .time {{ color: var(--neon); font-family: monospace; width: 60px; }}
        .tv-link {{ border: 1px solid var(--neon); color: var(--neon); padding: 4px 12px; border-radius: 15px; text-decoration: none; font-size: 0.7em; }}
        
        .sidebar h2 {{ color: var(--gold); font-size: 1em; margin-bottom: 20px; border-bottom: 1px solid #222; padding-bottom: 10px; }}
        .menu-item {{ display: block; padding: 10px; color: #888; text-decoration: none; border-bottom: 1px solid #111; font-size: 0.85em; }}
        .menu-item:hover {{ color: var(--neon); background: #111; }}
    </style>
</head>
<body>

    <div class="menu-triggers">
        <div class="t-btn" onclick="toggleSide('sites')">☰ SİTELER</div>
        <div class="t-btn" onclick="toggleSide('tv')">📺 TV KANALLARI</div>
    </div>

    <div class="sidebar" id="sites-menu">
        <h2>GİRİŞ LİNKLERİ</h2>
        {" ".join([f'<a href="{l}" target="_blank" class="menu-item">{s}</a>' for s, l in SITELER.items()])}
    </div>

    <div class="sidebar" id="tv-menu">
        <h2>TV KANALLARI</h2>
        {" ".join([f'<a href="{l}" target="_blank" class="menu-item">{s}</a>' for s, l in TV_KANALLARI.items()])}
    </div>

    <div class="main">
        <div style="text-align:center; margin-bottom:50px;">
            <h1 style="color:var(--neon); letter-spacing:5px; margin:0;">RADAR MASTER V14</h1>
            <p style="color:#333; font-size:0.7em;">{tarih} | Tier-Sıralı Komuta Merkezi</p>
        </div>

        <div class="section">
            <h3>⚽ FUTBOL: TOP LİGLER</h3>
            <table>
                {" ".join([f'<tr><td class="time">20:45</td><td class="lig-name tier-{t}">{l}</td><td style="color:#444;">1xbet, Holigan</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>' for l, t in FUTBOL_TOP10])}
            </table>
        </div>

        <div class="section">
            <h3>🏆 TURNUVALAR</h3>
            <table>
                {" ".join([f'<tr><td class="time">22:00</td><td class="lig-name tier-{t}">{l}</td><td style="color:#444;">Turkbet, Betsat</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>' for l, t in TURNUVALAR])}
            </table>
        </div>

        <div class="section">
            <h3>🏀 BASKETBOL (NBA/NBL/EURO)</h3>
            <table>
                {" ".join([f'<tr><td class="time">03:00</td><td class="lig-name tier-{t}">{l}</td><td style="color:#444;">Nesine, Stake</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>' for l, t in BASKETBOL])}
            </table>
        </div>
    </div>

    <script>
        function toggleSide(id) {{
            const sites = document.getElementById('sites-menu');
            const tv = document.getElementById('tv-menu');
            if(id === 'sites') {{
                sites.classList.toggle('active');
                tv.classList.remove('active');
            }} else {{
                tv.classList.toggle('active');
                sites.classList.remove('active');
            }}
        }}

        document.addEventListener('click', (e) => {{
            if(!e.target.closest('.sidebar') && !e.target.closest('.t-btn')) {{
                document.querySelectorAll('.sidebar').forEach(s => s.classList.remove('active'));
            }}
        }});
    </script>
</body>
</html>
"""

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)
