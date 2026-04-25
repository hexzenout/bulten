import datetime

tarih = datetime.datetime.now().strftime("%d.%m.%Y %H:%M")

html = f"""
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RADAR MASTER V19</title>
    <style>
        :root {{ --neon: #00ff00; --gold: #FFD700; --silver: #C0C0C0; --bronze: #CD7F32; --cyan: #00FFFF; --bg: #020202; }}
        body {{ background: var(--bg); color: #fff; font-family: 'Inter', sans-serif; margin: 0; padding: 0; overflow-x: hidden; }}
        
        /* SIDEBAR */
        .sidebar {{ position: fixed; left: -320px; top: 0; width: 300px; height: 100%; background: #0a0a0a; border-right: 1px solid #222; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 1000; padding: 25px; pointer-events: none; opacity: 0; overflow-y: auto; }}
        .sidebar.active {{ left: 0; pointer-events: auto; opacity: 1; }}
        .menu-btn {{ position: fixed; top: 20px; left: 20px; background: #111; color: var(--neon); border: 1px solid #333; padding: 12px 20px; cursor: pointer; border-radius: 8px; font-weight: bold; z-index: 1100; transition: 0.2s; }}
        .menu-btn:hover {{ background: var(--neon); color: #000; box-shadow: 0 0 15px var(--neon); }}
        .side-title {{ color: var(--gold); font-size: 0.9em; letter-spacing: 2px; margin: 30px 0 15px 0; border-bottom: 1px solid #222; padding-bottom: 10px; }}
        .menu-item {{ display: block; padding: 12px; color: #999; text-decoration: none; font-size: 0.85em; border-bottom: 1px solid #111; }}
        .menu-item:hover {{ background: #111; color: var(--neon); padding-left: 15px; border-color: #222; }}

        /* MAIN & TABLO */
        .main {{ padding: 100px 20px; max-width: 1000px; margin: 0 auto; }}
        .section {{ background: #080808; border: 1px solid #1a1a1a; border-radius: 15px; padding: 25px; margin-bottom: 40px; border-top: 2px solid #222; }}
        .section h3 {{ color: #555; text-transform: uppercase; letter-spacing: 2px; font-size: 0.9em; border-bottom: 1px solid #111; padding-bottom: 15px; margin-bottom: 0; }}
        
        .tier-altin {{ color: var(--gold); font-weight: bold; text-shadow: 0 0 5px rgba(255,215,0,0.2); }}
        .tier-gumus {{ color: var(--silver); font-weight: bold; }}
        .tier-bronz {{ color: var(--bronze); }}
        .tier-turnuva {{ color: var(--cyan); font-weight: bold; text-shadow: 0 0 8px rgba(0,255,255,0.3); }}

        table {{ width: 100%; border-collapse: collapse; }}
        tr {{ border-bottom: 1px solid #111; transition: 0.2s; }}
        tr:hover {{ background: #0d0d0d; cursor: pointer; }}
        td {{ padding: 16px 10px; font-size: 0.9em; }}
        .time {{ color: var(--neon); font-family: monospace; width: 65px; font-weight: bold; }}
        .siteler {{ color: #555; font-size: 0.85em; }}
        .tv-link {{ border: 1px solid #333; color: #888; padding: 5px 15px; border-radius: 20px; text-decoration: none; font-size: 0.7em; transition: 0.3s; font-weight: bold; pointer-events: none; }} 

        .update-box {{ background: #111; color: #888; display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 0.7em; border: 1px solid #333; margin-top: 15px; }}
        .update-box span {{ color: var(--neon); font-weight: bold; }}
    </style>
</head>
<body>

    <div class="menu-btn" onclick="toggleMenu()">☰ SİSTEM MENÜSÜ</div>

    <div class="sidebar" id="sidebar">
        <div style="height: 50px;"></div>
        <div class="side-title">GİRİŞ TERMİNALİ</div>
        <a href="https://tinyurl.com/1xturkey" target="_blank" class="menu-item">1xbet</a>
        <a href="https://dub.is/betsmovetelegram" target="_blank" class="menu-item">Betsmove</a>
        <a href="http://dub.run/holiguncel" target="_blank" class="menu-item">Holigan</a>
        <a href="https://bit.ly/3UzfE7i" target="_blank" class="menu-item">Betandyou</a>
        <a href="https://bit.ly/Tempobet-yeni-adres" target="_blank" class="menu-item">Tempobet</a>
        <a href="https://bit.ly/TB-Telegram2026" target="_blank" class="menu-item">Turkbet</a>
        <a href="https://bit.ly/BS-Telegram2026" target="_blank" class="menu-item">Betsat</a>
        <a href="https://cutt.ly/Masterbetting" target="_blank" class="menu-item">Masterbetting</a>
        <a href="http://cutt.ly/PusulaTelegram" target="_blank" class="menu-item">Pusulabet</a>
        <a href="http://shrtio.com/GamdomTR" target="_blank" class="menu-item">Gamdom</a>
        <a href="https://t2m.io/stakeguncel" target="_blank" class="menu-item">Stake</a>
        <a href="https://www.nesine.com" target="_blank" class="menu-item">Nesine</a>
        <a href="https://www.iddaa.com" target="_blank" class="menu-item">İddaa</a>
        <a href="https://polymarket.com" target="_blank" class="menu-item">Polymarket</a>
        
        <div class="side-title">TV KANALLARI</div>
        <a href="https://1xbahis-tv.com" target="_blank" class="menu-item">1xbet TV</a>
        <a href="https://betsmovetv.site" target="_blank" class="menu-item">Betsmove TV</a>
        <a href="https://holigantv.app" target="_blank" class="menu-item">Holigan TV</a>
        <a href="https://turkbettv.com" target="_blank" class="menu-item">Turkbet TV</a>
        <a href="https://betsattv.com" target="_blank" class="menu-item">Betsat TV</a>
        <a href="https://www.nesine.com/canli-izle" target="_blank" class="menu-item">Nesine Canlı</a>
    </div>

    <div class="main">
        <div style="text-align:center; margin-bottom:50px;">
            <h1 style="color:var(--neon); letter-spacing:6px; margin:0; font-size:2.5em;">RADAR MASTER</h1>
            <p style="color:#444; font-size:0.8em; margin-top:10px;">{tarih} | V19 KUSURSUZ SABİT ŞABLON</p>
            <div class="update-box" id="sonGuncellemeYazisi">Veri Bekleniyor...</div>
        </div>

        <div class="section" style="border-top-color: var(--neon);">
            <h3>📡 CANLI RADAR (BOT VERİSİ)</h3>
            <table>
                <tbody id="canliTablo">
                    <tr><td colspan="4" style="text-align:center; color:#555;">Bot verisi yükleniyor...</td></tr>
                </tbody>
            </table>
        </div>

        <div class="section" style="border-top-color: var(--gold);">
            <h3>👑 FUTBOL: ANA MERKEZ (LİGLER VE TURNUVALAR)</h3>
            <table>
                <tr><td class="time">18:00</td><td class="tier-altin">İngiltere Premier Lig</td><td class="siteler">1xbet, Betsmove</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">19:00</td><td class="tier-altin">İspanya La Liga</td><td class="siteler">Holigan, Betsat</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">20:45</td><td class="tier-altin">İtalya Serie A</td><td class="siteler">Turkbet, 1xbet</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">21:00</td><td class="tier-altin">Almanya Bundesliga</td><td class="siteler">Betandyou</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">22:00</td><td class="tier-altin">Fransa Ligue 1</td><td class="siteler">Pusulabet</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">19:00</td><td class="tier-altin">Trendyol Süper Lig</td><td class="siteler">Turkbet, Betsat</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">22:30</td><td class="tier-altin">Portekiz Primeira Liga</td><td class="siteler">1xbet, Holigan</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">21:00</td><td class="tier-altin">Hollanda Eredivisie</td><td class="siteler">Betsmove</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">00:00</td><td class="tier-altin">Brezilya Serie A</td><td class="siteler">1xbet</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">01:00</td><td class="tier-altin">Arjantin Primera</td><td class="siteler">Holigan</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                
                <tr><td colspan="4" style="border-bottom: 2px dashed #222; padding: 5px;"></td></tr>
                
                <tr><td class="time">22:00</td><td class="tier-turnuva">Şampiyonlar Ligi</td><td class="siteler">1xbet, Masterbetting</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">22:00</td><td class="tier-gumus">Avrupa Ligi</td><td class="siteler">Holigan, Betsmove</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">22:00</td><td class="tier-bronz">Konferans Ligi</td><td class="siteler">Turkbet</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">18:00</td><td class="tier-turnuva">Dünya Kupası</td><td class="siteler">1xbet, Nesine</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
            </table>
        </div>

        <div class="section" style="border-top-color: var(--gold);">
            <h3>🏀 BASKETBOL: ELİT KOMUTA MERKEZİ (ALTIN)</h3>
            <table>
                <tr><td class="time">03:30</td><td class="tier-altin">NBA (USA)</td><td class="siteler">Stake, 1xbet</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">21:00</td><td class="tier-altin">Euroleague</td><td class="siteler">Holigan, Betsat</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">19:00</td><td class="tier-altin">Türkiye Basketbol Ligi (BSL)</td><td class="siteler">Nesine, Turkbet</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">21:00</td><td class="tier-altin">İspanya Liga ACB</td><td class="siteler">Turkbet</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">20:30</td><td class="tier-altin">Fransa LNB Pro A</td><td class="siteler">1xbet, Betsmove</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">21:30</td><td class="tier-altin">İtalya Lega Basket Serie A</td><td class="siteler">Betandyou</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">20:00</td><td class="tier-altin">Almanya BBL</td><td class="siteler">1xbet</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">20:15</td><td class="tier-altin">Yunanistan Erkekler Ligi (GBL)</td><td class="siteler">Betsmove</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">11:30</td><td class="tier-altin">Avustralya NBL</td><td class="siteler">1xbet</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">14:00</td><td class="tier-altin">Çin CBA</td><td class="siteler">Holigan</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
                <tr><td class="time">12:00</td><td class="tier-altin">Güney Kore KBL</td><td class="siteler">Pusulabet</td><td style="text-align:right;"><a href="#" class="tv-link">İZLE</a></td></tr>
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

        // CANLI VERİ MOTORU BAĞLANTISI
        async function veriyiGetir() {{
            try {{
                const response = await fetch('canli_oranlar.json?t=' + new Date().getTime());
                if (!response.ok) throw new Error("Veri çekilemedi");
                const data = await response.json();
                
                document.getElementById('sonGuncellemeYazisi').innerHTML = `Son Tarama: <span>${{data.son_guncelleme}}</span>`;
                const tablo = document.getElementById('canliTablo');
                tablo.innerHTML = ""; 
                
                data.maclar.forEach(mac => {{
                    let marketDetayi = "";
                    if(mac.marketler.toplam_korner_9_5_ust) {{
                         marketDetayi = `Korner 9.5 Üst - B365: ${{mac.marketler.toplam_korner_9_5_ust.bet365}} | 1x: ${{mac.marketler.toplam_korner_9_5_ust['1xbet']}}`;
                    }}

                    const row = `<tr>
                        <td class="time">CANLI</td>
                        <td class="tier-altin">${{mac.lig}}<br><span style="color:#fff; font-size:1.1em;">${{mac.ev_sahibi}} - ${{mac.deplasman}}</span></td>
                        <td class="siteler">${{marketDetayi}}</td>
                        <td style="text-align:right;"><a href="#" class="tv-link">ANALİZ ET</a></td>
                    </tr>`;
                    tablo.innerHTML += row;
                }});

            }} catch (error) {{
                console.error("Hata:", error);
                document.getElementById('canliTablo').innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">Veri bağlantı hatası! Github Actions'ı kontrol et.</td></tr>`;
            }}
        }}
        window.onload = veriyiGetir;
        setInterval(veriyiGetir, 30000); 
    </script>
</body>
</html>
"""

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)
