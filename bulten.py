import datetime

# --- 1. EKSİKSİZ VERİ SETİ (HAFIZADAKİ SABİT LİSTE) ---
SITELER = [
    ("1xbet", "https://tinyurl.com/1xturkey"), ("Betsmove", "https://dub.is/betsmovetelegram"),
    ("Holigan", "http://dub.run/holiguncel"), ("Betandyou", "https://bit.ly/3UzfE7i"),
    ("Tempobet", "https://bit.ly/Tempobet-yeni-adres"), ("Turkbet", "https://bit.ly/TB-Telegram2026"),
    ("Betsat", "https://bit.ly/BS-Telegram2026"), ("Masterbetting", "https://cutt.ly/Masterbetting"),
    ("Pusulabet", "http://cutt.ly/PusulaTelegram"), ("Gamdom", "http://shrtio.com/GamdomTR"),
    ("Stake", "https://t2m.io/stakeguncel"), ("Nesine", "https://www.nesine.com"),
    ("İddaa", "https://www.iddaa.com"), ("Polymarket", "https://polymarket.com")
]

TV_KANALLARI = [
    ("1xbet TV", "https://1xbahis-tv.com"), ("Betsmove TV", "https://betsmovetv.site"),
    ("Holigan TV", "https://holigantv.app"), ("Turkbet TV", "https://turkbettv.com"),
    ("Betsat TV", "https://betsattv.com"), ("Nesine Canlı", "https://www.nesine.com/canli-izle")
]

# --- 2. HTML TASARIM (V15) ---
tarih = datetime.datetime.now().strftime("%d.%m.%Y %H:%M")

html = f"""
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RADAR MASTER V15</title>
    <style>
        :root {{ --neon: #00ff00; --gold: #FFD700; --silver: #C0C0C0; --bronze: #CD7F32; --bg: #020202; }}
        body {{ background: var(--bg); color: #fff; font-family: 'Inter', sans-serif; margin: 0; padding: 0; overflow-x: hidden; }}
        
        /* TEK SIDEBAR AYARI */
        .sidebar {{ position: fixed; left: -320px; top: 0; width: 300px; height: 100%; background: #0a0a0a; border-right: 1px solid #222; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 1000; padding: 25px; pointer-events: none; opacity: 0; overflow-y: auto; }}
        .sidebar.active {{ left: 0; pointer-events: auto; opacity: 1; }}
        
        /* MENU BUTONU */
        .menu-btn {{ position: fixed; top: 20px; left: 20px; background: #111; color: var(--neon); border: 1px solid #333; padding: 12px 20px; cursor: pointer; border-radius: 8px; font-weight: bold; z-index: 1100; transition: 0.2s; }}
        .menu-btn:hover {{ background: var(--neon); color: #000; box-shadow: 0 0 15px var(--neon); }}

        /* İÇERİK YAPISI */
        .main {{ padding: 100px 20px; max-width: 1000px; margin: 0 auto; }}
        .section {{ background: #080808; border: 1px solid #1a1a1a; border-radius: 15px; padding: 25px; margin-bottom: 40px; border-top: 1px solid #222; }}
        .section h3 {{ color: #444; text-transform: uppercase; letter-spacing: 2px; font-size: 0.8em; border-bottom: 1px solid #111; padding-bottom: 15px; margin-bottom: 20px; }}
        
        /* TIER SİSTEMİ RENKLERİ */
        .tier-altin {{ color: var(--gold); font-weight: bold; }}
        .tier-gumus {{ color: var(--silver); }}
        .tier-bronz {{ color: var(--bronze); }}

        table {{ width: 100%; border-collapse: collapse; }}
        tr {{ border-bottom: 1px solid #0f0f0f; transition: 0.2s; }}
        tr:hover {{ background: #0d0d0d; }}
        td {{ padding: 16px 10px; font-size: 0.9em; }}
        .time {{ color: var(--neon); font-family: monospace; width: 65px; font-weight: bold; }}
        .tv-link {{ border: 1px solid #333; color: #666; padding: 5px 12px; border-radius: 20px; text-decoration: none; font-size: 0.7em; transition: 0.3s; }}
        .tv-link:hover {{ border-color: var(--neon); color: var(--neon); }}
        
        /* MENÜ BAŞLIKLARI */
        .side-title {{ color: var(--gold); font-size: 0.9em; letter-spacing: 2px; margin: 30px 0 15px 0; border-bottom: 1px solid #222; padding-bottom: 10px; }}
        .menu-item {{ display: block; padding: 10px; color: #888; text-decoration: none; font-size: 0.85em; border-radius: 4px; }}
        .menu-item:hover {{ background: #111; color: var(--neon); padding-left: 15px; }}
    </style>
</head>
<body>

    <div class="menu-btn" onclick="toggleMenu()">☰ SİSTEM MENÜSÜ</div>

    <div class="sidebar" id="sidebar">
        <div style="height: 60px;"></div>
        <div class="side-title">SİTELER</div>
        {"".join([f'<a href="{l}" target="_blank" class="menu-item">{s}</a>' for s, l in SITELER])}
        
        <div class="side-title">TV KANALLARI</div>
        {"".join([f'<a href="{l}" target="_blank" class="menu-item">{s}</a>' for s, l in TV_KANALLARI])}
    </div>

    <div class="main">
        <div style="text-align:center; margin-bottom:60px;">
            <h1 style="color:var(--neon); letter-spacing:8px; margin:0; font-size:2.8em;">RADAR MASTER</h1>
            <p style="color:#222; font-size:0.8em; margin-top:10px;">{tarih} | V15 ENTERPRISE EDITION</p>
        </div>

        <div class="section">
            <h3>⚽ FUTBOL: ELİT LİGLER (ALTIN)</h3>
            <table>
                <tr><td class="time">18:00</td><td class="tier-altin">İngiltere Premier Lig</td><td>1xbet, Holigan</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">19:00</td><td class="tier-altin">Trendyol Süper Lig</td><td>Turkbet, Betsat</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">21:00</td><td class="tier-altin">Şampiyonlar Ligi</td><td>Masterbetting</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
            </table>
        </div>

        <div class="section">
            <h3>🥈 FUTBOL: ALT LİGLER (GÜMÜŞ & BRONZ)</h3>
            <table>
                <tr><td class="time">15:00</td><td class="tier-gumus">Almanya Bundesliga</td><td>Betsmove</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">17:00</td><td class="tier-bronz">Hollanda Eredivisie</td><td>Pusulabet</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">14:00</td><td class="tier-bronz">TFF 1. Lig</td><td>Nesine</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
            </table>
        </div>

        <div class="section">
            <h3>🏀 BASKETBOL KOMUTA MERKEZİ</h3>
            <table>
                <tr><td class="time">04:00</td><td class="tier-altin">NBA (USA)</td><td>Stake, 1xbet</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">20:30</td><td class="tier-altin">Euroleague</td><td>Holigan</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">21:00</td><td class="tier-gumus">İtalya Lega Basket Serie A</td><td>Betandyou</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">19:00</td><td class="tier-gumus">Yunanistan Erkekler Ligi (GBL)</td><td>1xbet</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">20:00</td><td class="tier-gumus">Almanya BBL</td><td>Turkbet</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">11:00</td><td class="tier-bronz">Güney Kore KBL</td><td>Pusulabet</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">12:30</td><td class="tier-bronz">Avustralya NBL</td><td>1xbet</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
            </table>
        </div>
    </div>

    <script>
        function toggleMenu() {{
            document.getElementById('sidebar').classList.toggle('active');
        }}
        document.addEventListener('click', (e) => {{
            if(!e.target.closest('.sidebar') && !e.target.closest('.menu-btn')) {{
                document.getElementById('sidebar').classList.remove('active');
            }}
        }});
    </script>
</body>
</html>
"""

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)
