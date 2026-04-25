import datetime

# --- 1. EKSİKSİZ SİTE LİSTESİ (LİNK VE TELEGRAM) ---
# Burada 14 sitenin tamamı yer alıyor, hiçbirini eksik bırakmadım.
SITELER = {
    "1xbet": "https://tinyurl.com/1xturkey",
    "Betsmove": "https://dub.is/betsmovetelegram",
    "Holigan": "http://dub.run/holiguncel",
    "Betandyou": "https://bit.ly/3UzfE7i",
    "Tempobet": "https://bit.ly/Tempobet-yeni-adres",
    "Turkbet": "https://bit.ly/TB-Telegram2026",
    "Betsat": "https://bit.ly/BS-Telegram2026",
    "Masterbetting": "https://cutt.ly/Masterbetting",
    "Pusulabet": "http://cutt.ly/PusulaTelegram",
    "Gamdom": "http://shrtio.com/GamdomTR",
    "Stake": "https://t2m.io/stakeguncel",
    "Nesine": "https://www.nesine.com",
    "İddaa": "https://www.iddaa.com",
    "Polymarket": "https://polymarket.com"
}

# --- 2. YAYIN MERKEZİ (PROFESYONEL GRUPLAMA) ---
FUTBOL_TOP10 = [
    "İngiltere Premier Lig", "Trendyol Süper Lig", "İspanya La Liga", 
    "Almanya Bundesliga", "İtalya Serie A", "Fransa Ligue 1", 
    "Hollanda Eredivisie", "Portekiz Liga", "Brezilya Serie A", "Arjantin Prim."
]
TURNUVALAR = [
    "Şampiyonlar Ligi", "Avrupa Ligi", "Konferans Ligi", 
    "Dünya Kupası", "Euro 2024 / 2026"
]
BASKETBOL = [
    "NBA", "Euroleague", "Türkiye Basketbol Ligi (BSL)", 
    "Çin CBA", "İspanya ACB", "Yunanistan GBL"
]

tarih = datetime.datetime.now().strftime("%d.%m.%Y %H:%M")

html = f"""
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RADAR DASHBOARD V13</title>
    <style>
        :root {{ --neon: #00ff00; --gold: #FFD700; --bg: #020202; --card: #0a0a0a; --gray: #555; }}
        body {{ background: var(--bg); color: #fff; font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; overflow-x: hidden; }}
        
        /* HAMBURGER SIDEBAR */
        .sidebar {{ position: fixed; left: -280px; top: 0; width: 280px; height: 100%; background: var(--card); border-right: 1px solid #222; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); z-index: 1000; padding: 20px; box-shadow: 10px 0 30px rgba(0,0,0,0.8); }}
        .sidebar.active {{ left: 0; }}
        .menu-btn {{ position: fixed; top: 20px; left: 20px; font-size: 28px; cursor: pointer; color: var(--neon); z-index: 1100; background: rgba(0,0,0,0.7); padding: 8px 12px; border-radius: 8px; border: 1px solid #333; }}
        .sidebar h2 {{ color: var(--gold); border-bottom: 1px solid #222; padding-bottom: 10px; margin-top: 50px; font-size: 1.2em; }}
        .menu-link {{ display: block; padding: 12px; color: #bbb; text-decoration: none; border-bottom: 1px solid #111; font-size: 0.9em; transition: 0.2s; }}
        .menu-link:hover {{ color: var(--neon); background: #151515; padding-left: 20px; }}

        /* ANA İÇERİK ALANI */
        .content {{ padding: 90px 20px 40px 20px; max-width: 1000px; margin: 0 auto; }}
        .header-title {{ text-align: center; margin-bottom: 50px; }}
        .header-title h1 {{ color: var(--neon); font-size: 2.2em; letter-spacing: 5px; margin: 0; text-shadow: 0 0 15px rgba(0,255,0,0.3); }}
        
        /* GRUPLANDIRILMIŞ BÖLÜMLER */
        .section {{ background: var(--card); border: 1px solid #1a1a1a; border-radius: 15px; padding: 25px; margin-bottom: 35px; border-top: 3px solid var(--neon); }}
        .section h3 {{ color: var(--gold); margin-top: 0; margin-bottom: 25px; font-size: 1.1em; display: flex; align-items: center; }}
        .section h3::before {{ content: '●'; color: var(--neon); margin-right: 10px; font-size: 0.8em; }}

        /* YAYIN TABLOLARI */
        table {{ width: 100%; border-collapse: collapse; }}
        tr {{ border-bottom: 1px solid #161616; transition: 0.2s; }}
        tr:hover {{ background: #111; }}
        td {{ padding: 16px 10px; }}
        .lig-name {{ font-weight: bold; color: #eee; width: 40%; }}
        .siteler {{ color: var(--gray); font-size: 0.8em; width: 40%; }}
        .tv-link {{ background: transparent; border: 1px solid var(--neon); color: var(--neon); padding: 6px 16px; border-radius: 20px; text-decoration: none; font-size: 0.75em; font-weight: bold; transition: 0.3s; white-space: nowrap; }}
        .tv-link:hover {{ background: var(--neon); color: #000; box-shadow: 0 0 15px var(--neon); }}

        /* MOBİL UYUM */
        @media (max-width: 600px) {{
            .lig-name {{ width: 50%; }}
            .siteler {{ display: none; }}
        }}
    </style>
</head>
<body>

    <div class="menu-btn" onclick="toggleMenu()">☰</div>

    <div class="sidebar" id="sidebar">
        <h2>GİRİŞ TERMİNALİ</h2>
"""

# Yan menüye 14 sitenin tamamını ekliyoruz
for s, l in SITELER.items():
    html += f'<a href="{l}" target="_blank" class="menu-link">{s}</a>'

html += f"""
    </div>

    <div class="content">
        <div class="header-title">
            <h1>RADAR PRO V13</h1>
            <p style="color:#444; font-size:0.8em; margin-top:10px;">{tarih} | Kesin Liste & Hiyerarşik Rehber</p>
        </div>

        <div class="section">
            <h3>FUTBOL: TOP 10 LİG</h3>
            <table>
"""
for lig in FUTBOL_TOP10:
    html += f'<tr><td class="lig-name">{lig}</td><td class="siteler">1xbet, Betsmove, Holigan</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>'

html += """
            </table>
        </div>

        <div class="section">
            <h3>FUTBOL: ELİT TURNUVALAR</h3>
            <table>
"""
for trn in TURNUVALAR:
    html += f'<tr><td class="lig-name">{trn}</td><td class="siteler">Turkbet, Betsat, Holigan</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>'

html += """
            </table>
        </div>

        <div class="section">
            <h3>BASKETBOL: NBA & EUROLEAGUE</h3>
            <table>
"""
for bsk in BASKETBOL:
    html += f'<tr><td class="lig-name">{bsk}</td><td class="siteler">1xbet, Nesine, Stake</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>'

html += """
            </table>
        </div>
    </div>

    <script>
        function toggleMenu() {{
            document.getElementById('sidebar').classList.toggle('active');
        }}
        // Dışarı tıklandığında menüyü kapat
        document.addEventListener('click', function(event) {{
            var isClickInside = document.getElementById('sidebar').contains(event.target);
            var isMenuBtn = document.querySelector('.menu-btn').contains(event.target);
            if (!isClickInside && !isMenuBtn) {{
                document.getElementById('sidebar').classList.remove('active');
            }}
        }});
    </script>
</body>
</html>
"""

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)
