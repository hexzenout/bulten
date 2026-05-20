let _MASTER_DB = [];
        let _LEAGUE_STATS_DB = {};
        let _ACTIVE_SPORT = 'futbol';
        let _ACTIVE_TAB = 'bulletin';
        let _ACTIVE_LEAGUE_FILTER = 'ALL';
        let _ACTIVE_SORT_MODE = 'league';
        let _ACTIVE_EXCEL_DAYS = 7;

        let _WALLET_BALANCE = parseFloat(localStorage.getItem('v19_w')) || 100.0;
        let _BALANCE_HISTORY = JSON.parse(localStorage.getItem('v19_h')) || [100.0];
        let _PENDING_OPS = JSON.parse(localStorage.getItem('v19_p')) || [];
        let _COMPLETED_LEDGER = JSON.parse(localStorage.getItem('v19_l')) || [];
        let _FAV_MATCHES = JSON.parse(localStorage.getItem('v19_fav_m')) || [];
        let _ROLLING_DB = JSON.parse(localStorage.getItem('v19_rolling')) || {};
        let _CHANNELS_DB = JSON.parse(localStorage.getItem('v19_channels')) || [];
        let _ACTIVE_LAYOUT = parseInt(localStorage.getItem('v19_layout')) || 6;
        let _ACTIVE_STREAMS = JSON.parse(localStorage.getItem('v19_streams')) || ["","","","","",""];

        const HIERARCHY_SCORES = {
            "TÜRKİYE - SÜPER LİG": 4000, "İNGİLTERE - PREMIER LEAGUE": 3900, "İSPANYA - LA LIGA": 3800,
            "ALMANYA - BUNDESLIGA": 3700, "İITALYA - SERIE A": 3600, "FRANSA - LIGUE 1": 3500,
            "AVRUPA - CHAMPIONS LEAGUE": 3400, "AVRUPA - EUROPA LEAGUE": 3300, "AVRUPA - CONFERENCE LEAGUE": 3200,
            "AVRUPA - EUROLEAGUE": 4900, "AMERİKA - NBA": 4800, "TÜRKİYE - BSL": 4700,
            "İSPANYA - LIGA ACB": 4600, "İTALYA - LEGA A": 4500, "FRANSA - LNB PRO A": 4400,
            "ALMANYA - BBL": 4300, "AVRUPA - EUROCUP": 4200, "AVRUPA - BCL": 4100,
            "AMERİKA - NCAA": 4000, "RUSYA - VTB": 3900, "AMERİKA - WNBA": 3800
        };

        const GOLD_BASKET_LIST = [
            "AMERİKA - NBA", "AVRUPA - EUROLEAGUE", "TÜRKİYE - BSL", "İSPANYA - LIGA ACB",
            "İTALYA - LEGA A", "FRANSA - LNB PRO A", "ALMANYA - BBL", "AVRUPA - EUROCUP",
            "AVRUPA - BCL", "AMERİKA - NCAA", "RUSYA - VTB", "AMERİKA - WNBA"
        ];

        const ROLLING_TARGETS = { 7: 1000, 15: 5000, 30: 15000, 60: 40000, 90: 100000 };

        window.addEventListener('DOMContentLoaded', () => {
            const hash = window.location.hash.replace('#', '') || 'futbol';
            const validTabs = ['futbol', 'basketbol', 'stream', 'favs', 'live', 'crypto', 'finance'];
            if (validTabs.includes(hash)) {
                omega_SwitchMainTab(hash, document.getElementById('nav-' + hash), false);
            } else {
                omega_SwitchMainTab('futbol', document.getElementById('nav-futbol'), false);
            }
            omega_InitializeEngine();
        });

        window.addEventListener('popstate', (e) => {
            if(e.state && e.state.tab) {
                const el = document.getElementById('nav-' + e.state.tab);
                if(el) omega_SwitchMainTab(e.state.tab, el, false);
            }
        });

        async function omega_InitializeEngine() {
            try {
                const response = await fetch('v19_rapor.json?nocache=' + Date.now());
                const data = await response.json();
                _MASTER_DB = data.veriler || [];
                _LEAGUE_STATS_DB = data.sayac || {};
                omega_BuildUIComponents();
                omega_ExecuteRadarFilter();
                omega_RefreshFinanceDashboard();
            } catch (err) {
                document.getElementById('radar-render-output').innerHTML = `
                    <div style="padding:100px 0; text-align:center;">
                        <i class="fa-solid fa-triangle-exclamation" style="font-size:4em; color:var(--red); margin-bottom:20px;"></i>
                        <h2 style="font-weight:900; letter-spacing:2px; color:#fff;">RADAR ÇEVRİMDIŞI</h2>
                        <p style="color:var(--muted); margin-top:10px; font-size:0.9em;">v19_rapor.json dosyasına ulaşılamıyor.</p>
                    </div>`;
            }
        }

        function omega_IsBasketballLeague(l) {
            return ["NBA", "EUROLEAGUE", "BSL", "ACB", "LEGA A", "LNB", "BBL", "EUROCUP", "BCL", "VTB", "NCAA", "WNBA"].some(x => l.toUpperCase().includes(x));
        }

        function omega_GetFlagCode(l) {
            const s = l.toUpperCase();
            if(s.includes("TÜRKİYE")) return "tr";
            if(s.includes("İNGİLTERE")) return "gb-eng";
            if(s.includes("İSPANYA")) return "es";
            if(s.includes("ALMANYA")) return "de";
            if(s.includes("İTALYA")) return "it";
            if(s.includes("FRANSA")) return "fr";
            if(s.includes("HOLLANDA")) return "nl";
            if(s.includes("PORTEKİZ")) return "pt";
            if(s.includes("BREZİLYA")) return "br";
            if(s.includes("ARJANTİN")) return "ar";
            if(s.includes("RUSYA")) return "ru";
            if(s.includes("AMERİKA") || s.includes("NBA")) return "us";
            if(s.includes("AVRUPA")) return "eu";
            return "un";
        }

        function omega_FormatHumanDate(ds) {
            if(!ds) return "";
            const p = ds.split('-');
            const dObj = new Date(p[0], p[1] - 1, p[2]);
            const today = new Date();
            today.setHours(0,0,0,0);
            const diff = Math.round((dObj - today) / 86400000);
            if(diff === 0) return "BUGÜN";
            if(diff === 1) return "YARIN";
            const months = ["OCAK","ŞUBAT","MART","NİSAN","MAYIS","HAZİRAN","TEMMUZ","AĞUSTOS","EYLÜL","EKİM","KASIM","ARALIK"];
            return p[2] + " " + months[parseInt(p[1]) - 1];
        }

        function omega_GenerateMatchID(m) {
            return `${m.dt}_${m.tm}_${m.m.replace(/[^a-zA-Z0-9]/g, '')}`;
        }

        function omega_ToggleSidebar(e) {
            if(e) e.stopPropagation();
            const menu = document.getElementById('main-dropdown-nav');
            if(menu) menu.classList.toggle('active-menu');
        }

        function omega_ToggleLeagueDrop(e) {
            e.stopPropagation();
            const menu = document.getElementById('drop-menu-list');
            if(menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
        }

        document.addEventListener('click', (event) => {
            const dropMenu = document.getElementById('drop-menu-list');
            const dropTrigger = document.getElementById('drop-trigger');
            if (dropMenu && dropMenu.style.display === 'block') {
                if (dropTrigger && !dropTrigger.contains(event.target) && !dropMenu.contains(event.target)) {
                    dropMenu.style.display = 'none';
                }
            }
            const accordionMenu = document.getElementById('main-dropdown-nav');
            const menuBtn = document.getElementById('menu-trigger-btn');
            if (accordionMenu && accordionMenu.classList.contains('active-menu')) {
                if (!accordionMenu.contains(event.target) && !menuBtn.contains(event.target)) {
                    accordionMenu.classList.remove('active-menu');
                }
            }
        });

        function omega_SwitchMainTab(targetModule, clickedElement, updateHistory = true) {
            omega_CloseRollingExcel();
            omega_CloseChannelManager();

            const topMenu = document.getElementById('main-dropdown-nav');
            if(topMenu) topMenu.classList.remove('active-menu');

            if (updateHistory) history.pushState({ tab: targetModule }, '', '#' + targetModule);

            document.querySelectorAll('.nav-link').forEach(i => i.classList.remove('active'));
            if(clickedElement) clickedElement.classList.add('active');

            document.getElementById('omega-radar-block').style.display = 'none';
            document.getElementById('omega-favs-block').style.display = 'none';
            document.getElementById('omega-stream-block').style.display = 'none';
            document.getElementById('v19-finance-block').classList.remove('active');

            const centerWrapper = document.querySelector('.center-wrapper');

            if(targetModule === 'stream') {
                centerWrapper.style.maxWidth = '1800px';
                omega_BuildStreamMatrix(_ACTIVE_LAYOUT);
            } else if(targetModule === 'finance') {
                centerWrapper.style.maxWidth = '1700px';
            } else if(targetModule === 'crypto') {
                centerWrapper.style.maxWidth = '1850px';
            } else {
                centerWrapper.style.maxWidth = '1000px';
            }

            const titleElem = document.getElementById('active-module-name');

            if(targetModule === 'futbol' || targetModule === 'basketbol') {
                const sportChanged = _ACTIVE_SPORT !== targetModule;

                _ACTIVE_SPORT = targetModule;
                _ACTIVE_TAB = 'bulletin';

                if (sportChanged) {
                    _ACTIVE_LEAGUE_FILTER = 'ALL';

                    const dateSelect = document.getElementById('v19-date-select');
                    if (dateSelect) dateSelect.value = 'ALL';

                    const dropLabel = document.getElementById('drop-text-label');
                    if (dropLabel) dropLabel.innerHTML = 'TÜM LİGLER';
                }

                document.getElementById('omega-radar-block').style.display = 'block';

                titleElem.innerHTML = targetModule === 'futbol'
                    ? '<span style="color:var(--green)">/ FUTBOL</span>'
                    : '<span style="color:var(--orange)">/ BASKETBOL</span>';

                omega_BuildUIComponents();
                omega_ExecuteRadarFilter();

            } else if(targetModule === 'favs') {
                _ACTIVE_TAB = 'favs';
                document.getElementById('omega-favs-block').style.display = 'block';
                titleElem.innerHTML = '<span style="color:var(--red)">/ FAVORİLERİM</span>';
                omega_ExecuteRadarFilter();

            } else if(targetModule === 'stream') {
                _ACTIVE_TAB = 'stream';
                document.getElementById('omega-stream-block').style.display = 'block';
                titleElem.innerHTML = '<span style="color:#7E22CE">/ CANLI YAYIN</span>';

            } else if(targetModule === 'finance') {
                _ACTIVE_TAB = 'finance';
                document.getElementById('v19-finance-block').classList.add('active');
                titleElem.innerHTML = '<span style="color:var(--green)">/ KASA YÖNETİMİ</span>';
                omega_RefreshFinanceDashboard();
                setTimeout(omega_RenderApexSupremeChart, 250);
                setTimeout(() => { omega_RenderDailyTradeGrid(); omega_RefreshCryptoLive(true); }, 450);
            }
        }

        function omega_BuildUIComponents() {
            const dateSelectElement = document.getElementById('v19-date-select');
            const dropdownMenuArea = document.getElementById('drop-menu-list');
            if (!dateSelectElement || !dropdownMenuArea) return;

            const previousDate = dateSelectElement.value || 'ALL';
            let dateHtml = '<option value="ALL">TÜM TARİHLER</option>';

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Bugün dahil 10 günlük sabit tarih listesi
            for (let i = 0; i < 10; i++) {
                const d = new Date(today);
                d.setDate(today.getDate() + i);

                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const value = `${y}-${m}-${day}`;

                dateHtml += `<option value="${value}">${omega_FormatHumanDate(value)}</option>`;
            }

            dateSelectElement.innerHTML = dateHtml;

            const stillExists = [...dateSelectElement.options].some(opt => opt.value === previousDate);
            dateSelectElement.value = stillExists ? previousDate : 'ALL';

            let leagueHtml = `<div class="league-drop-item" onclick="omega_HandleLeagueSelection('ALL', 'TÜM LİGLER')">TÜM LİGLER</div>`;

            const statsArray = _ACTIVE_SPORT === 'basketbol'
                ? GOLD_BASKET_LIST
                : Object.keys(_LEAGUE_STATS_DB).filter(l => !omega_IsBasketballLeague(l));

            statsArray.forEach(ligName => {
                const matchCount = _LEAGUE_STATS_DB[ligName] || 0;
                leagueHtml += `
                    <div class="league-drop-item" onclick="omega_HandleLeagueSelection('${ligName}', this.innerHTML)">
                        <img src="https://flagcdn.com/w40/${omega_GetFlagCode(ligName)}.png">
                        <span>${ligName} (${matchCount})</span>
                    </div>`;
            });

            dropdownMenuArea.innerHTML = leagueHtml;
        }

        function omega_HandleLeagueSelection(val, htmlContent) {
            _ACTIVE_LEAGUE_FILTER = val;
            document.getElementById('drop-text-label').innerHTML = htmlContent;
            document.getElementById('drop-menu-list').style.display = 'none';
            omega_ExecuteRadarFilter();
        }

        function omega_SetSortMode(mode) {
            _ACTIVE_SORT_MODE = mode;
            document.querySelectorAll('.btn-mode-supreme').forEach(b => b.classList.remove('active'));
            document.getElementById('btn-sort-' + mode).classList.add('active');
            omega_ExecuteRadarFilter();
        }

        function omega_ExecuteRadarFilter() {
            const targetID = (_ACTIVE_TAB === 'favs') ? 'favs-render-output' : 'radar-render-output';
            const renderArea = document.getElementById(targetID);
            if(!renderArea) return;
            const selectedDate = document.getElementById('v19-date-select').value;

            // GEÇMİŞ MAÇLARI ENGELLE
            const todayMidnight = new Date();
            todayMidnight.setHours(0, 0, 0, 0);

            let filteredData = _MASTER_DB.filter(m => {
                const isBasket = omega_IsBasketballLeague(m.l);
                const sportMatch = (_ACTIVE_SPORT === 'basketbol' && isBasket) || (_ACTIVE_SPORT === 'futbol' && !isBasket);
                const dateMatch = (selectedDate === 'ALL' || m.dt === selectedDate);
                const leagueMatch = (_ACTIVE_LEAGUE_FILTER === 'ALL' || m.l === _ACTIVE_LEAGUE_FILTER);
                const p = m.dt.split('-');
                const matchDate = new Date(p[0], p[1] - 1, p[2]);
                const notPast = matchDate >= todayMidnight;
                if(_ACTIVE_TAB === 'favs') {
                    const mID = omega_GenerateMatchID(m);
                    return _FAV_MATCHES.includes(mID) && dateMatch && notPast;
                }
                return sportMatch && dateMatch && leagueMatch && notPast;
            });

            let finalHtmlBuffer = "";
            const groupedByDay = {};
            filteredData.forEach(m => {
                if(!groupedByDay[m.dt]) groupedByDay[m.dt] = [];
                groupedByDay[m.dt].push(m);
            });

            Object.keys(groupedByDay).sort().forEach(day => {
                finalHtmlBuffer += `<div style="color:var(--gold); font-size:0.85em; font-weight:900; margin:25px 0 15px 0; letter-spacing:1px; text-transform:uppercase;">${omega_FormatHumanDate(day)}</div>`;
                if(_ACTIVE_SORT_MODE === 'time') {
                    groupedByDay[day].sort((a,b) => a.tm.localeCompare(b.tm)).forEach(m => {
                        const mID = omega_GenerateMatchID(m);
                        const isFav = _FAV_MATCHES.includes(mID);
                        const flagCode = omega_GetFlagCode(m.l);
                        finalHtmlBuffer += `
                            <div class="league-container-pro" style="margin-bottom:12px; border-radius:8px;">
                                <div class="league-header-bar" style="padding:10px 20px; font-size:0.7em; background:#1f1f1f; border-bottom:1px solid #2a2a2a; color:var(--muted);">
                                    <div style="display:flex; align-items:center;">
                                        <img src="https://flagcdn.com/w40/${flagCode}.png" style="width:16px; border-radius:2px; margin-right:12px;">
                                        <span>${m.l}</span>
                                    </div>
                                </div>
                                <div class="match-row-pro" style="padding:12px 20px;">
                                    <i class="fa-solid fa-star fav-star-box ${isFav?'active':''}" onclick="omega_ToggleFavoriteMatch(event, '${mID}')"></i>
                                    <div class="match-clock-sup" style="width:60px;">${m.tm}</div>
                                    <div class="match-teams-main">${m.m}</div>
                                </div>
                            </div>`;
                    });
                } else {
                    const leagueGroups = {};
                    groupedByDay[day].forEach(m => {
                        if(!leagueGroups[m.l]) leagueGroups[m.l] = [];
                        leagueGroups[m.l].push(m);
                    });
                    Object.keys(leagueGroups).sort((a,b) => {
                        const scoreA = HIERARCHY_SCORES[a] || 0;
                        const scoreB = HIERARCHY_SCORES[b] || 0;
                        if(scoreA !== scoreB) return scoreB - scoreA;
                        let timeA = leagueGroups[a].reduce((min, x) => x.tm < min ? x.tm : min, "23:59");
                        let timeB = leagueGroups[b].reduce((min, x) => x.tm < min ? x.tm : min, "23:59");
                        return timeA.localeCompare(timeB);
                    }).forEach(ligName => {
                        const flagCode = omega_GetFlagCode(ligName);
                        finalHtmlBuffer += `
                            <div class="league-container-pro">
                                <div class="league-header-bar">
                                    <div>
                                        <img src="https://flagcdn.com/w40/${flagCode}.png" style="width:20px; border-radius:2px; margin-right:12px; vertical-align:middle;">
                                        <span>${ligName}</span>
                                    </div>
                                </div>
                                <div class="league-content">`;
                        leagueGroups[ligName].sort((a,b) => a.tm.localeCompare(b.tm)).forEach(m => {
                            const mID = omega_GenerateMatchID(m);
                            const isFav = _FAV_MATCHES.includes(mID);
                            finalHtmlBuffer += `
                                <div class="match-row-pro">
                                    <i class="fa-solid fa-star fav-star-box ${isFav?'active':''}" onclick="omega_ToggleFavoriteMatch(event, '${mID}')"></i>
                                    <div class="match-clock-sup">${m.tm}</div>
                                    <div class="match-teams-main">${m.m}</div>
                                </div>`;
                        });
                        finalHtmlBuffer += `</div></div>`;
                    });
                }
            });

            renderArea.innerHTML = finalHtmlBuffer || "";
        }

        function omega_ToggleFavoriteMatch(event, matchID) {
            event.stopPropagation();
            if(_FAV_MATCHES.includes(matchID)) {
                _FAV_MATCHES = _FAV_MATCHES.filter(id => id !== matchID);
            } else {
                _FAV_MATCHES.push(matchID);
            }
            localStorage.setItem('v19_fav_m', JSON.stringify(_FAV_MATCHES));
            omega_ExecuteRadarFilter();
        }

        
        /* Stream module functions moved to assets/js/stream-core.js */

        
        /* Finance module functions moved to assets/js/finance-core.js */

        
        /* Live center functions moved to assets/js/live-center-core.js */

        function omega_RenderDailyTradeGrid() {
            const grid = document.getElementById('daily-trade-grid'); if(!grid) return;
            omega_RenderCryptoSymbolDatalist();
            const slots = omega_GetTodaySlots();
            let html = `<table class="trade-table"><thead><tr><th>#</th><th>Tür</th><th>İşlem / Not</th><th>Tutar</th><th>Oran / Çarpan</th><th>Takip</th><th>Durum</th><th>K/Z</th><th>Sonuç</th></tr></thead><tbody>`;
            slots.forEach((slot, idx) => {
                const pnl = Number(slot.pnl || 0);
                const pnlClass = pnl >= 0 ? 'pnl-pos' : 'pnl-neg';
                const typeCls = slot.type === 'crypto' ? 'slot-type-crypto' : 'slot-type-bet';
                const statusCls = slot.status === 'win' ? 'status-win' : slot.status === 'loss' ? 'status-loss' : slot.status === 'pending' ? 'status-pending' : 'status-empty';
                const trackCls = slot.track ? 'track-btn active' : 'track-btn';
                const nameHtml = slot.type === 'crypto' ? `
                    <div class="slot-symbol-row">
                        <select class="slot-mini-input" onchange="omega_UpdateSlot(${idx}, 'exchange', this.value)"><option value="binance" ${slot.exchange !== 'okx' ? 'selected' : ''}>Binance</option><option value="okx" ${slot.exchange === 'okx' ? 'selected' : ''}>OKX</option></select>
                        <select class="slot-mini-input" onchange="omega_UpdateSlot(${idx}, 'quote', this.value)"><option value="USDT" ${(slot.quote || 'USDT') === 'USDT' ? 'selected' : ''}>USDT</option><option value="USDC" ${(slot.quote || 'USDT') === 'USDC' ? 'selected' : ''}>USDC</option></select>
                        <input class="slot-mini-input" list="crypto-symbol-list" value="${slot.symbol || ''}" placeholder="BTC" onchange="omega_UpdateSlot(${idx}, 'symbol', this.value)">
                        <select class="slot-mini-input" onchange="omega_UpdateSlot(${idx}, 'side', this.value)"><option value="long" ${(slot.side || 'long') === 'long' ? 'selected' : ''}>LONG</option><option value="short" ${slot.side === 'short' ? 'selected' : ''}>SHORT</option></select>
                    </div>
                    <input type="text" value="${slot.name || ''}" placeholder="Not: BTC long, ETH destek..." onchange="omega_UpdateSlot(${idx}, 'name', this.value)" style="margin-top:6px;">
                    <input class="slot-mini-input" type="number" value="${slot.entry || ''}" placeholder="Giriş fiyatı" onchange="omega_UpdateSlot(${idx}, 'entry', this.value)" style="margin-top:6px;">
                    <div class="slot-compact-note">Grafik ve canlı fiyat bu satırda değil, üstteki Canlı Takip Merkezi’nde görünür.</div>
                ` : `<input type="text" value="${slot.name || ''}" placeholder="Maç adı veya bahis notu" onchange="omega_UpdateSlot(${idx}, 'name', this.value)"><div class="slot-compact-note">Canlı skor için TAKİP’e al. Skor motoru bağlanınca otomatik güncellenir.</div>`;
                html += `<tr>
                    <td style="font-family:'JetBrains Mono'; color:var(--muted); font-weight:900;">${idx+1}</td>
                    <td><select class="${typeCls}" onchange="omega_UpdateSlot(${idx}, 'type', this.value)"><option value="bet" ${slot.type === 'bet' ? 'selected' : ''}>BAHİS</option><option value="crypto" ${slot.type === 'crypto' ? 'selected' : ''}>KRİPTO</option></select></td>
                    <td>${nameHtml}</td>
                    <td><input class="slot-money-input" type="number" value="${slot.stake || ''}" placeholder="0.00" onchange="omega_UpdateSlot(${idx}, 'stake', this.value)"></td>
                    <td><input class="slot-odds-input" type="number" value="${slot.odds || ''}" step="0.01" placeholder="1.30 / x10" onchange="omega_UpdateSlot(${idx}, 'odds', this.value)"></td>
                    <td><button class="${trackCls}" onclick="omega_ToggleTrackSlot(${idx})">${slot.track ? 'TAKİPTE' : 'TAKİP'}</button></td>
                    <td><span class="status-badge ${statusCls}">${omega_StatusText(slot.status)}</span></td>
                    <td class="${pnlClass}">${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}</td>
                    <td><div class="mini-actions"><button class="w" onclick="omega_ResolveDailySlot(${idx}, 'win')">KAZANDI</button><button class="l" onclick="omega_ResolveDailySlot(${idx}, 'loss')">KAYBETTİ</button><button class="r" onclick="omega_ResetDailySlot(${idx})">TEMİZLE</button></div></td>
                </tr>`;
            });
            html += `</tbody></table>`;
            grid.innerHTML = html;
            omega_StartCryptoTimer();
            omega_RenderLiveWatchCenter();
        }

        const _oldOmegaUpdateSlotV6 = omega_UpdateSlot;
        omega_UpdateSlot = function(index, field, value) {
            _oldOmegaUpdateSlotV6(index, field, value);
            omega_RenderLiveWatchCenter();
        };

        const _oldOmegaResolveDailySlotV6 = omega_ResolveDailySlot;
        omega_ResolveDailySlot = function(index, result) {
            _oldOmegaResolveDailySlotV6(index, result);
            omega_RenderLiveWatchCenter();
        };

        const _oldOmegaResetDailySlotV6 = omega_ResetDailySlot;
        omega_ResetDailySlot = function(index) {
            _oldOmegaResetDailySlotV6(index);
            omega_RenderLiveWatchCenter();
        };


        /* ================= LIVE CENTER V7 OVERRIDES - ANLIK KRİPTO + TP/SL/LIQ + SKOR ================= */
        function omega_ParseTpList(slot) {
            return String(slot.takeProfits || '')
                .split(/[;,\s]+/)
                .map(x => parseFloat(String(x).replace(',', '.')))
                .filter(x => !isNaN(x) && x > 0)
                .slice(0, 8);
        }

        function omega_EffectiveLeverage(slot) {
            const lev = parseFloat(slot.odds);
            return (!isNaN(lev) && lev > 0) ? lev : (_FINANCE_SETTINGS.cryptoLeverage || 1);
        }

        function omega_EstimatedLiq(slot) {
            const manual = parseFloat(slot.liq);
            if(!isNaN(manual) && manual > 0) return manual;
            const entry = parseFloat(slot.entry);
            const lev = omega_EffectiveLeverage(slot);
            if(isNaN(entry) || entry <= 0 || !lev) return null;
            if((slot.side || 'long') === 'short') return entry * (1 + (1 / lev));
            return entry * (1 - (1 / lev));
        }

        function omega_LevelPnl(slot, targetPrice) {
            const entry = parseFloat(slot.entry);
            const stake = parseFloat(slot.stake) || 0;
            const lev = omega_EffectiveLeverage(slot);
            if(isNaN(entry) || entry <= 0 || !targetPrice || !stake) return 0;
            const dir = (slot.side || 'long') === 'short' ? -1 : 1;
            const diffPct = ((targetPrice - entry) / entry) * dir;
            return stake * diffPct * lev;
        }

        function omega_DrawSparklineWithLevels(canvas, values, slot) {
            const ctx = canvas.getContext('2d');
            const w = canvas.width, h = canvas.height;
            ctx.clearRect(0,0,w,h);
            ctx.fillStyle = '#050505'; ctx.fillRect(0,0,w,h);
            const levels = [];
            const entry = parseFloat(slot.entry);
            const stop = parseFloat(slot.stop);
            const liq = omega_EstimatedLiq(slot);
            if(entry > 0) levels.push({v:entry, c:'rgba(251,191,36,.65)', label:'GİRİŞ'});
            if(stop > 0) levels.push({v:stop, c:'rgba(239,68,68,.72)', label:'STOP'});
            if(liq > 0) levels.push({v:liq, c:'rgba(249,115,22,.72)', label:'LİQ'});
            omega_ParseTpList(slot).forEach((tp,i)=>levels.push({v:tp, c:'rgba(16,185,129,.72)', label:'TP'+(i+1)}));
            const allVals = [...(values||[]), ...levels.map(x=>x.v)].filter(Boolean);
            if(allVals.length < 2) {
                ctx.strokeStyle = '#333'; ctx.beginPath(); ctx.moveTo(0,h/2); ctx.lineTo(w,h/2); ctx.stroke(); return;
            }
            const min = Math.min(...allVals), max = Math.max(...allVals);
            const range = max - min || 1;
            const yFor = v => h - ((v-min)/range)*(h-12) - 6;
            if(values && values.length > 1) {
                const up = values[values.length-1] >= values[0];
                ctx.strokeStyle = up ? '#10b981' : '#ef4444';
                ctx.lineWidth = 3;
                ctx.beginPath();
                values.forEach((v,i) => {
                    const x = (i/(values.length-1))*w;
                    const y = yFor(v);
                    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
                });
                ctx.stroke();
            }
            levels.forEach(l => {
                const y = yFor(l.v);
                ctx.strokeStyle = l.c; ctx.lineWidth = 1; ctx.setLineDash([5,4]);
                ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); ctx.setLineDash([]);
                ctx.fillStyle = l.c; ctx.font = '10px JetBrains Mono, monospace';
                ctx.fillText(l.label, 6, Math.max(10, y-3));
            });
        }

        omega_BuildWatchCryptoCard = function(slot, idx) {
            const key = omega_CryptoCacheKey(slot);
            const data = _CRYPTO_LIVE_CACHE[key];
            const price = data && data.price ? Number(data.price) : null;
            const entry = parseFloat(slot.entry);
            const stake = parseFloat(slot.stake) || 0;
            const leverage = omega_EffectiveLeverage(slot);
            let pnl = 0;
            if(price && entry) pnl = omega_LevelPnl(slot, price);
            const closes = data?.closes || [];
            const change = closes.length > 1 ? ((closes[closes.length-1] - closes[0]) / closes[0]) * 100 : 0;
            const changeCls = change >= 0 ? 'up' : 'down';
            const liq = omega_EstimatedLiq(slot);
            const stop = parseFloat(slot.stop);
            const tpList = omega_ParseTpList(slot);
            setTimeout(() => {
                const canvas = document.getElementById('watch-spark-' + idx);
                if(canvas) omega_DrawSparklineWithLevels(canvas, closes, slot);
            }, 0);
            const tpHtml = tpList.length ? tpList.map((tp,i)=>{
                const p = omega_LevelPnl(slot,tp);
                return `<div class="tp-pill"><span>TP ${i+1} · ${omega_FormatCryptoPrice(tp)}</span><b>${p>=0?'+':''}$${p.toFixed(2)}</b></div>`;
            }).join('') : `<div class="tp-pill"><span>Kâr Al</span><b>TP noktası gir</b></div>`;
            const slHtml = stop>0 ? `<div class="tp-pill sl-pill"><span>Stop · ${omega_FormatCryptoPrice(stop)}</span><b>${omega_LevelPnl(slot,stop)>=0?'+':''}$${omega_LevelPnl(slot,stop).toFixed(2)}</b></div>` : `<div class="tp-pill sl-pill"><span>Stop</span><b>Girilmedi</b></div>`;
            const liqHtml = liq>0 ? `<div class="tp-pill liq-pill"><span>Likidasyon</span><b>${omega_FormatCryptoPrice(liq)}</b></div>` : `<div class="tp-pill liq-pill"><span>Likidasyon</span><b>-</b></div>`;
            const fresh = data?.ts ? Math.max(0, Math.round((Date.now()-data.ts)/1000)) : null;
            return `<div class="watch-card crypto live-fresh">
                <div class="watch-card-top">
                    <div class="watch-title"><b>${omega_SlotLabel(slot, idx)}</b><span>${(slot.exchange || 'binance').toUpperCase()} · ${slot.quote || 'USDT'} · ${String(slot.side||'long').toUpperCase()} · x${leverage}</span></div>
                    <div class="watch-price"><b>${price ? '$'+omega_FormatCryptoPrice(price) : 'Veri bekleniyor'}</b><span class="${changeCls}">${change >= 0 ? '+' : ''}${change.toFixed(2)}%</span></div>
                </div>
                <canvas id="watch-spark-${idx}" class="watch-spark" width="460" height="110"></canvas>
                <div class="watch-metrics">
                    <div class="watch-metric"><span>Giriş</span><b>${entry ? omega_FormatCryptoPrice(entry) : '-'}</b></div>
                    <div class="watch-metric"><span>Marjin</span><b>$${stake.toFixed(2)}</b></div>
                    <div class="watch-metric ${pnl >= 0 ? 'good' : 'bad'}"><span>Canlı PnL</span><b>${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}</b></div>
                </div>
                <div class="tp-line-list">${tpHtml}${slHtml}${liqHtml}</div>
                <div class="watch-refresh-mini">Son fiyat yenileme: ${fresh===null?'bekleniyor':fresh+' sn önce'} · otomatik yenileme açık</div>
            </div>`;
        };

        omega_BuildWatchBetCard = function(slot, idx) {
            const score = omega_FindScoreForSlot(slot);
            const scoreText = score ? `${score.home_score ?? score.ev ?? 0} - ${score.away_score ?? score.dep ?? 0}` : 'Skor bekleniyor';
            const minute = score ? (score.minute || score.elapsed || score.dakika || score.status || 'Canlı') : 'Skor motoru bekleniyor';
            const status = score ? (score.status || score.long_status || 'Canlı') : 'live_scores.json bulunamazsa burada bekler';
            return `<div class="watch-card bet">
                <div class="watch-card-top">
                    <div class="watch-title"><b>${slot.name || 'Maç adı girilmedi'}</b><span>BAHİS · #${idx+1}</span></div>
                    <div class="watch-price"><b>${scoreText}</b><span class="${score?'up':'down'}">${minute}</span></div>
                </div>
                <div class="football-score-box ${score?'live':'wait'}">
                    <div class="football-score-main"><b>Canlı Skor</b><span>${scoreText}</span></div>
                    <div class="football-score-sub">${status}${score?.league ? ' · '+score.league : ''}${score?.home && score?.away ? '<br>'+score.home+' - '+score.away : ''}</div>
                </div>
                <div class="watch-metrics">
                    <div class="watch-metric"><span>Tutar</span><b>$${(parseFloat(slot.stake)||0).toFixed(2)}</b></div>
                    <div class="watch-metric"><span>Oran</span><b>${slot.odds || '-'}</b></div>
                    <div class="watch-metric"><span>Durum</span><b>${omega_StatusText(slot.status)}</b></div>
                </div>
            </div>`;
        };

        const _omegaRenderDailyTradeGridV7Base = omega_RenderDailyTradeGrid;
        omega_RenderDailyTradeGrid = function() {
            const grid = document.getElementById('daily-trade-grid'); if(!grid) return;
            omega_RenderCryptoSymbolDatalist();
            const slots = omega_GetTodaySlots();
            let html = `<table class="trade-table"><thead><tr><th>#</th><th>Tür</th><th>İşlem / Not</th><th>Tutar</th><th>Oran / x</th><th>Takip</th><th>Durum</th><th>K/Z</th><th>Sonuç</th></tr></thead><tbody>`;
            slots.forEach((slot, idx) => {
                const pnl = Number(slot.pnl || 0);
                const pnlClass = pnl >= 0 ? 'pnl-pos' : 'pnl-neg';
                const typeCls = slot.type === 'crypto' ? 'slot-type-crypto' : 'slot-type-bet';
                const statusCls = slot.status === 'win' ? 'status-win' : slot.status === 'loss' ? 'status-loss' : slot.status === 'pending' ? 'status-pending' : 'status-empty';
                const trackCls = slot.track ? 'track-btn active' : 'track-btn';
                const nameHtml = slot.type === 'crypto' ? `
                    <div class="slot-symbol-row">
                        <select class="slot-mini-input" onchange="omega_UpdateSlot(${idx}, 'exchange', this.value)"><option value="binance" ${slot.exchange !== 'okx' ? 'selected' : ''}>Binance</option><option value="okx" ${slot.exchange === 'okx' ? 'selected' : ''}>OKX</option></select>
                        <select class="slot-mini-input" onchange="omega_UpdateSlot(${idx}, 'quote', this.value)"><option value="USDT" ${(slot.quote || 'USDT') === 'USDT' ? 'selected' : ''}>USDT</option><option value="USDC" ${(slot.quote || 'USDT') === 'USDC' ? 'selected' : ''}>USDC</option></select>
                        <input class="slot-mini-input" list="crypto-symbol-list" value="${slot.symbol || ''}" placeholder="BTC" onchange="omega_UpdateSlot(${idx}, 'symbol', this.value)">
                        <select class="slot-mini-input" onchange="omega_UpdateSlot(${idx}, 'side', this.value)"><option value="long" ${(slot.side || 'long') === 'long' ? 'selected' : ''}>LONG</option><option value="short" ${slot.side === 'short' ? 'selected' : ''}>SHORT</option></select>
                    </div>
                    <input type="text" value="${slot.name || ''}" placeholder="Not: BTC long, ETH destek..." onchange="omega_UpdateSlot(${idx}, 'name', this.value)" style="margin-top:6px;">
                    <div class="risk-grid-v7">
                        <input type="number" value="${slot.entry || ''}" placeholder="Giriş" onchange="omega_UpdateSlot(${idx}, 'entry', this.value)">
                        <input type="number" value="${slot.liq || ''}" placeholder="Likidasyon manuel" onchange="omega_UpdateSlot(${idx}, 'liq', this.value)">
                        <input type="number" value="${slot.stop || ''}" placeholder="Stop fiyatı" onchange="omega_UpdateSlot(${idx}, 'stop', this.value)">
                        <input type="text" value="${slot.takeProfits || ''}" placeholder="TP: 104000,105500,108000" onchange="omega_UpdateSlot(${idx}, 'takeProfits', this.value)">
                    </div>
                    <div class="slot-compact-note">TP noktalarını virgülle yaz. Takip kartında grafiğe çizilir ve her TP/Stop için tahmini K/Z hesaplanır.</div>
                ` : `<input type="text" value="${slot.name || ''}" placeholder="Maç adı: Arsenal - Chelsea" onchange="omega_UpdateSlot(${idx}, 'name', this.value)"><div class="slot-compact-note">Canlı skor için TAKİP’e al. live_scores.json geldikçe skor kartı güncellenir.</div>`;
                html += `<tr>
                    <td style="font-family:'JetBrains Mono'; color:var(--muted); font-weight:900;">${idx+1}</td>
                    <td><select class="${typeCls}" onchange="omega_UpdateSlot(${idx}, 'type', this.value)"><option value="bet" ${slot.type === 'bet' ? 'selected' : ''}>BAHİS</option><option value="crypto" ${slot.type === 'crypto' ? 'selected' : ''}>KRİPTO</option></select></td>
                    <td>${nameHtml}</td>
                    <td><input class="slot-money-input" type="number" value="${slot.stake || ''}" placeholder="0.00" onchange="omega_UpdateSlot(${idx}, 'stake', this.value)"></td>
                    <td><input class="slot-odds-input" type="number" value="${slot.odds || ''}" step="0.01" placeholder="1.30 / x10" onchange="omega_UpdateSlot(${idx}, 'odds', this.value)"></td>
                    <td><button class="${trackCls}" onclick="omega_ToggleTrackSlot(${idx})">${slot.track ? 'TAKİPTE' : 'TAKİP'}</button></td>
                    <td><span class="status-badge ${statusCls}">${omega_StatusText(slot.status)}</span></td>
                    <td class="${pnlClass}">${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}</td>
                    <td><div class="mini-actions"><button class="w" onclick="omega_ResolveDailySlot(${idx}, 'win')">KAZANDI</button><button class="l" onclick="omega_ResolveDailySlot(${idx}, 'loss')">KAYBETTİ</button><button class="r" onclick="omega_ResetDailySlot(${idx})">TEMİZLE</button></div></td>
                </tr>`;
            });
            html += `</tbody></table>`;
            grid.innerHTML = html;
            omega_StartCryptoTimer();
            omega_RenderLiveWatchCenter();
        };

        const _omegaUpdateSlotV7Base = omega_UpdateSlot;
        omega_UpdateSlot = function(index, field, value) {
            const numericFields = ['stake','odds','entry','liq','stop'];
            if(numericFields.includes(field)) value = parseFloat(value) || '';
            _omegaUpdateSlotV7Base(index, field, value);
            omega_RenderLiveWatchCenter();
        };

        omega_RefreshCryptoLive = async function(force=false) {
            if(_CRYPTO_REFRESHING) return;
            const slots = omega_GetTodaySlots().filter(s => s.type === 'crypto' && s.symbol && s.track);
            if(slots.length === 0) return;
            _CRYPTO_REFRESHING = true;
            const uniq = [];
            const seen = new Set();
            slots.forEach(s => { const k=omega_CryptoCacheKey(s); if(!seen.has(k)){ seen.add(k); uniq.push(s); } });
            for(const slot of uniq.slice(0, 16)) {
                const old = _CRYPTO_LIVE_CACHE[omega_CryptoCacheKey(slot)];
                if(force || !old || Date.now() - old.ts > 6500) await omega_FetchCryptoMarket(slot);
            }
            _CRYPTO_REFRESHING = false;
        };

        omega_StartCryptoTimer = function() {
            if(_CRYPTO_TIMER) return;
            _CRYPTO_TIMER = setInterval(() => {
                if(_ACTIVE_TAB === 'finance') omega_RefreshLiveCenter(false);
            }, 8000);
            setTimeout(() => omega_RefreshLiveCenter(true), 500);
        };

        omega_RefreshLiveCenter = async function(force=false) {
            await omega_LoadLiveScores(force);
            await omega_RefreshCryptoLive(force);
            omega_RenderLiveWatchCenter();
        };

        /* Crypto module functions moved to assets/js/crypto-core.js */
