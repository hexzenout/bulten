import datetime

# --- 1. SİTELER VE TV LİNK MERKEZİ (14/14 SABİT) ---
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

tarih = datetime.datetime.now().strftime("%d.%m.%Y %H:%M")

# --- 2. HTML: CANLI VERİ BAĞLANTILI V18 ---
html = f"""
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RADAR MASTER V18</title>
    <style>
        :root {{ --neon: #00ff00; --gold: #FFD700; --silver: #C0C0C0; --bronze: #CD7F32; --bg: #020202; }}
        body {{ background: var(--bg); color: #fff; font-family: 'Inter', sans-serif; margin: 0; padding: 0; overflow-x: hidden; }}
        
        /* SIDEBAR (Aynı) */
        .sidebar {{ position: fixed; left: -320px; top: 0; width: 300px; height: 100%; background: #0a0a0a; border-right: 1px solid #222; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 1000; padding: 25px; pointer-events: none; opacity: 0; overflow-y: auto; }}
        .sidebar.active {{ left: 0; pointer-events: auto; opacity: 1; }}
        .menu-btn {{ position: fixed; top: 20px; left: 20px; background: #111; color: var(--neon); border: 1px solid #333; padding: 12px 20px; cursor: pointer; border-radius: 8px; font-weight: bold; z-index: 1100; transition: 0.2s; }}
        .menu-btn:hover {{ background: var(--neon); color: #000; box-shadow: 0 0 15px var(--neon); }}
        .side-title {{ color: var(--gold); font-size: 0.9em; letter-spacing: 2px; margin: 30px 0 15px 0; border-bottom: 1px solid #222; padding-bottom: 10px; }}
        .menu-item {{ display: block; padding: 12px; color: #999; text-decoration: none; font-size: 0.85em; border-bottom: 1px solid #111; }}
        .menu-item:hover {{ background: #111; color: var(--neon); padding-left: 15px; border-color: #222; }}

        /* MAIN & TABLO (Aynı) */
        .main {{ padding: 100px 20px; max-width: 1000px; margin: 0 auto; }}
        .section {{ background: #080808; border: 1px solid #1a1a1a; border-radius: 15px; padding: 25px; margin-bottom: 40px; border-top: 2px solid #222; }}
        .section h3 {{ color: #555; text-transform: uppercase; letter-spacing: 2px; font-size: 0.9em; border-bottom: 1px solid #111; padding-bottom: 15px; margin-bottom: 0; }}
        
        .tier-altin {{ color: var(--gold); font-weight: bold; text-shadow: 0 0 5px rgba(255,215,0,0.2); }}
        .tier-gumus {{ color: var(--silver); font-weight: bold; }}
        .tier-bronz {{ color: var(--bronze); }}

        table {{ width: 100%; border-collapse: collapse; }}
        tr {{ border-bottom: 1px solid #111; transition: 0.2s; }}
        tr:hover {{ background: #0d0d0d; cursor: pointer; }} /* Tıklanabilir efekti eklendi */
        td {{ padding: 16px 10px; font-size: 0.9em; }}
        .time {{ color: var(--neon); font-family: monospace; width: 65px; font-weight: bold; }}
        .siteler {{ color: #555; font-size: 0.85em; }}
        .tv-link {{ border: 1px solid #333; color: #888; padding: 5px 15px; border-radius: 20px; text-decoration: none; font-size: 0.7em; transition: 0.3s; font-weight: bold; pointer-events: none; }} /* TV linkleri şimdilik pasif */

        /* SON GÜNCELLEME ALANI */
        .update-box {{ background: #111; color: #888; display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 0.7em; border: 1px solid #333; margin-top: 15px; }}
        .update-box span {{ color: var(--neon); font-weight: bold; }}
    </style>
</head>
<body>

    <div class="menu-btn" onclick="toggleMenu()">☰ SİSTEM MENÜSÜ</div>

    <div class="sidebar" id="sidebar">
        <div style="height: 50px;"></div>
        <div class="side-title">GİRİŞ TERMİNALİ</div>
        {"".join([f'<a href="{l}" target="_blank" class="menu-item">{s}</a>' for s, l in SITELER])}
        
        <div class="side-title">TV KANALLARI</div>
        {"".join([f'<a href="{l}" target="_blank" class="menu-item">{s}</a>' for s, l in TV_KANALLARI])}
    </div>

    <div class="main">
        <div style="text-align:center; margin-bottom:50px;">
            <h1 style="color:var(--neon); letter-spacing:6px; margin:0; font-size:2.5em;">RADAR MASTER</h1>
            <p style="color:#444; font-size:0.8em; margin-top:10px;">{tarih} | V18 CANLI VERİ</p>
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
            <h3>👑 FUTBOL: TOP 10 LİG (ALTIN)</h3>
            <table id="futbolAltinTablo">
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

        // --- ASIL SİHİR BURADA: CANLI VERİYİ ÇEKME ---
        async function veriyiGetir() {{
            try {{
                // GitHub Pages'teki canli_oranlar.json dosyasını okuyoruz
                // Cache engellemek için sonuna rastgele sayı ekledim
                const response = await fetch('canli_oranlar.json?t=' + new Date().getTime());
                if (!response.ok) throw new Error("Veri çekilemedi");
                
                const data = await response.json();
                
                // 1. Son Güncelleme Zamanını Yazdır
                document.getElementById('sonGuncellemeYazisi').innerHTML = `Son Tarama: <span>${{data.son_guncelleme}}</span>`;
                
                // 2. Canlı Tabloyu Doldur
                const tablo = document.getElementById('canliTablo');
                tablo.innerHTML = ""; // Yükleniyor yazısını sil
                
                data.maclar.forEach(mac => {{
                    // Botumuzun (motor.py) oluşturduğu sahte Arsenal maçını buraya yazdırıyoruz
                    let marketDetayi = "";
                    if(mac.marketler.toplam_korner_9_5_ust) {{
                         marketDetayi = `Korner 9.5 Üst - B365: ${mac.marketler.toplam_korner_9_5_ust.bet365} | 1x: ${mac.marketler.toplam_korner_9_5_ust['1xbet']}`;
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

        // Sayfa açıldığında veriyi çek
        window.onload = veriyiGetir;
        
        // Her 30 saniyede bir sayfayı yenilemeden arka planda veriyi güncelle
        setInterval(veriyiGetir, 30000); 
    </script>
</body>
</html>
"""

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)
