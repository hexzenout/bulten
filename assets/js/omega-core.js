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

        function omega_OpenRollingExcel(days) {
            _ACTIVE_EXCEL_DAYS = days;
            if(!_ROLLING_DB[days]) _ROLLING_DB[days] = { startBal: 100, targetBal: ROLLING_TARGETS[days], ops: {} };
            if(!_ROLLING_DB[days].targetBal) _ROLLING_DB[days].targetBal = ROLLING_TARGETS[days];
            document.getElementById('excel-modal-title').innerHTML = `${days} GÜNLÜK ROLLING`;
            document.getElementById('excel-start-bal').value = _ROLLING_DB[days].startBal;
            const targetInput = document.getElementById('excel-target-bal-input');
            if(targetInput) targetInput.value = _ROLLING_DB[days].targetBal;
            document.getElementById('rolling-excel-overlay').style.display = 'flex';
            setTimeout(() => { document.getElementById('rolling-excel-overlay').classList.add('show-modal'); }, 10);
            omega_RenderExcelTable();
        }

        function omega_CloseRollingExcel() {
            document.getElementById('rolling-excel-overlay').classList.remove('show-modal');
            setTimeout(() => { document.getElementById('rolling-excel-overlay').style.display = 'none'; }, 300);
        }

        function omega_UpdateExcelConfig() {
            const newBal = parseFloat(document.getElementById('excel-start-bal').value);
            const newTarget = parseFloat(document.getElementById('excel-target-bal-input')?.value);
            if(!_ROLLING_DB[_ACTIVE_EXCEL_DAYS]) _ROLLING_DB[_ACTIVE_EXCEL_DAYS] = { startBal: 100, targetBal: ROLLING_TARGETS[_ACTIVE_EXCEL_DAYS], ops: {} };
            if(!isNaN(newBal)) _ROLLING_DB[_ACTIVE_EXCEL_DAYS].startBal = newBal;
            if(!isNaN(newTarget) && newTarget > 0) _ROLLING_DB[_ACTIVE_EXCEL_DAYS].targetBal = newTarget;
            omega_SaveRollingDB();
            omega_RenderExcelTable();
        }

        function omega_SaveRollingDB() {
            localStorage.setItem('v19_rolling', JSON.stringify(_ROLLING_DB));
        }

        function omega_RenderExcelTable() {
            const wrapper = document.getElementById('excel-body-content');
            const currentPlan = _ROLLING_DB[_ACTIVE_EXCEL_DAYS];
            let runningBalance = currentPlan.startBal;
            let totalProfit = 0;
            let htmlBuffer = "";
            for (let day = 1; day <= _ACTIVE_EXCEL_DAYS; day++) {
                const dayOps = currentPlan.ops[day] || [];
                htmlBuffer += `
                <div class="day-row-capsule">
                    <div class="day-info"><h3>GÜN ${day}</h3><span>Sonuç</span></div>
                    <div class="capsule-container">`;
                for (let slot = 0; slot < 10; slot++) {
                    if (dayOps[slot]) {
                        const op = dayOps[slot];
                        const sign = op.res === 'win' ? '+' : '-';
                        const pnl = op.res === 'win' ? (op.amt * op.odds) - op.amt : op.amt;
                        if (op.res === 'win') { runningBalance += pnl; totalProfit += pnl; }
                        else { runningBalance -= pnl; totalProfit -= pnl; }
                        htmlBuffer += `
                            <div class="kapsul ${op.res}">
                                <button class="k-undo" onclick="omega_UndoExcelOp(${day}, ${slot})" title="Geri Al"><i class="fa-solid fa-xmark"></i></button>
                                <div class="k-result">
                                    <div class="k-note-show">${op.note || 'İşlem notu yok'}</div>
                                    <b>$${op.amt} x ${op.odds}</b>
                                    <span>${sign}$${pnl.toFixed(2)}</span>
                                </div>
                            </div>`;
                    } else {
                        htmlBuffer += `
                            <div class="kapsul">
                                <input type="text" class="k-note-input" id="e-n-${day}-${slot}" placeholder="Maç / coin / işlem notu">
                                <div class="k-inputs">
                                    <input type="number" id="e-a-${day}-${slot}" placeholder="Tutar">
                                    <input type="number" id="e-o-${day}-${slot}" placeholder="Oran / RR">
                                </div>
                                <div class="k-actions">
                                    <button class="k-btn w" onclick="omega_ResolveExcelOp(${day}, ${slot}, 'win')">KAZANDI</button>
                                    <button class="k-btn l" onclick="omega_ResolveExcelOp(${day}, ${slot}, 'loss')">KAYBETTİ</button>
                                </div>
                            </div>`;
                    }
                }
                htmlBuffer += `</div><div class="day-result">$${runningBalance.toFixed(2)}</div></div>`;
            }
            wrapper.innerHTML = htmlBuffer;
            document.getElementById('excel-current-bal').innerText = `$${runningBalance.toFixed(2)}`;
            const pnlElement = document.getElementById('excel-pnl');
            pnlElement.innerText = (totalProfit >= 0 ? "+" : "") + "$" + totalProfit.toFixed(2);
            pnlElement.style.color = totalProfit >= 0 ? 'var(--green)' : 'var(--red)';
            const targetBal = currentPlan.targetBal || ROLLING_TARGETS[_ACTIVE_EXCEL_DAYS];
            const progressPercentage = Math.min((runningBalance / targetBal) * 100, 100);
            const progressBar = document.getElementById('excel-progress-bar');
            if(progressBar) progressBar.style.width = progressPercentage + "%";
            omega_SaveRollingDB();
        }

        function omega_ResolveExcelOp(day, slot, result) {
            const note = (document.getElementById(`e-n-${day}-${slot}`)?.value || '').trim();
            const amt = parseFloat(document.getElementById(`e-a-${day}-${slot}`).value);
            const odds = parseFloat(document.getElementById(`e-o-${day}-${slot}`).value);
            if (isNaN(amt) || isNaN(odds)) {
                if (typeof omega_ShowFinanceToast === 'function') omega_ShowFinanceToast('Tutar ve oran/RR alanını doldur.');
                return;
            }
            const currentPlan = _ROLLING_DB[_ACTIVE_EXCEL_DAYS];
            if (!currentPlan.ops[day]) currentPlan.ops[day] = [];
            currentPlan.ops[day][slot] = { note, amt, odds, res: result };
            omega_SaveRollingDB();
            omega_RenderExcelTable();
        }

        function omega_UndoExcelOp(day, slot) {
            const currentPlan = _ROLLING_DB[_ACTIVE_EXCEL_DAYS];
            if (currentPlan.ops[day] && currentPlan.ops[day][slot]) {
                currentPlan.ops[day].splice(slot, 1);
                omega_SaveRollingDB();
                omega_RenderExcelTable();
            }
        }


        // ================= KASA SIMPLE TERMINAL V2 JS =================
        const FINANCE_SETTINGS_KEY = 'v27_finance_settings';
        const FINANCE_DAILY_KEY = 'v27_finance_daily_slots';
        const FINANCE_BARRIERS = [500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
        let _FINANCE_MODE = localStorage.getItem('v27_finance_mode') || 'bet';
        let _FINANCE_SETTINGS = JSON.parse(localStorage.getItem(FINANCE_SETTINGS_KEY) || '{}');
        let _DAILY_SLOTS = JSON.parse(localStorage.getItem(FINANCE_DAILY_KEY) || '{}');
        const CRYPTO_TOP_SYMBOLS = ['BTC','ETH','BNB','SOL','XRP','DOGE','ADA','TRX','AVAX','LINK','TON','SHIB','SUI','DOT','BCH','LTC','UNI','NEAR','APT','ICP','ETC','XLM','HBAR','FIL','ARB','OP','INJ','ATOM','IMX','VET','TIA','SEI','AAVE','ALGO','GRT','RUNE','MKR','QNT','FTM','LDO','JUP','PYTH','WIF','PEPE','BONK','FLOKI','ENA','ORDI','TAO','RENDER','FET','AGIX','WLD','SAND','MANA','AXS','GALA','CHZ','APE','DYDX','SNX','CRV','COMP','SUSHI','YFI','CAKE','1INCH','ZRX','BAT','ENJ','ROSE','KAVA','KSM','EGLD','XTZ','MINA','IOTA','FLOW','KAS','STX','CFX','BLUR','STRK','MANTA','ZK','ZRO','NOT','TURBO','MEW','PENDLE','ETHFI','AEVO','W','ALT','PIXEL','PORTAL','ARKM','CYBER','SAGA','DYM','OMNI','ACE','NTRN','BIGTIME','MEME','GMT','LPT','SSV','GMX','MAGIC','MASK','API3','ANKR','SKL','CKB','RVN','QTUM','ONT','ZIL','ONE','HOT','CELO','ICX','IOST','DASH','ZEC','WAVES','KNC','BAND','STORJ','COTI','OCEAN','IO','JASMY','TWT','ILV','METIS','ALICE','LRC','RSR','DENT','ACH','SPELL','PEOPLE','HIGH','CELR','ONG','PHA','ID','EDU','RDNT','HOOK','LQTY','C98'];
        let _CRYPTO_LIVE_CACHE = {};
        let _CRYPTO_REFRESHING = false;
        let _CRYPTO_TIMER = null;

        function omega_TodayKey() {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        }

        function omega_DefaultFinanceSettings() {
            return {
                startBank: _BALANCE_HISTORY[0] || _WALLET_BALANCE || 100,
                targetPct: 30,
                tradeCount: 20,
                defaultOdds: 1.30,
                riskModel: 'target',
                splitCount: 20,
                cryptoSplitCount: 20,
                cryptoTargetPct: 30,
                cryptoTradeCount: 20,
                cryptoTpPct: 1,
                cryptoLeverage: 10,
                cryptoDefaultExchange: 'binance',
                cryptoDefaultQuote: 'USDT',
                cryptoDefaultSymbol: 'BTC',
                cryptoDefaultSide: 'long'
            };
        }

        function omega_NewSlot(i) {
            return { id: Date.now()+i, index:i+1, type:_FINANCE_MODE, name:'', stake:'', odds:_FINANCE_SETTINGS.defaultOdds || 1.30, status:'empty', pnl:0, exchange:_FINANCE_SETTINGS.cryptoDefaultExchange || 'binance', quote:_FINANCE_SETTINGS.cryptoDefaultQuote || 'USDT', symbol:_FINANCE_SETTINGS.cryptoDefaultSymbol || 'BTC', side:_FINANCE_SETTINGS.cryptoDefaultSide || 'long', entry:'', liq:'', stop:'', takeProfits:'', track:false };
        }

        function omega_EnsureFinanceSettings() {
            _FINANCE_SETTINGS = { ...omega_DefaultFinanceSettings(), ..._FINANCE_SETTINGS };
            if (!_DAILY_SLOTS[omega_TodayKey()]) _DAILY_SLOTS[omega_TodayKey()] = Array.from({length:20}, (_,i) => omega_NewSlot(i));
        }

        function omega_SaveFinanceAll() {
            localStorage.setItem(FINANCE_SETTINGS_KEY, JSON.stringify(_FINANCE_SETTINGS));
            localStorage.setItem(FINANCE_DAILY_KEY, JSON.stringify(_DAILY_SLOTS));
            localStorage.setItem('v27_finance_mode', _FINANCE_MODE);
            omega_PersistData();
        }

        function omega_SetVal(id, val) { const el = document.getElementById(id); if(el) el.value = val; }
        function omega_Text(id, val, color) { const el = document.getElementById(id); if(el){ el.innerText = val; if(color) el.style.color = color; } }

        function omega_LoadFinanceInputs() {
            omega_EnsureFinanceSettings();
            omega_SetVal('finance-start-bank', _FINANCE_SETTINGS.startBank);
            omega_SetVal('finance-current-bank', Number(_WALLET_BALANCE || 0).toFixed(2));
            omega_SetVal('finance-target-pct', _FINANCE_SETTINGS.targetPct);
            omega_SetVal('finance-trade-count', _FINANCE_SETTINGS.tradeCount);
            omega_SetVal('finance-split-count', _FINANCE_SETTINGS.splitCount);
            omega_SetVal('finance-default-odds', _FINANCE_SETTINGS.defaultOdds);
            const rm = document.getElementById('finance-risk-model'); if(rm) rm.value = _FINANCE_SETTINGS.riskModel;
            omega_SetVal('crypto-start-bank', _FINANCE_SETTINGS.startBank);
            omega_SetVal('crypto-current-bank', Number(_WALLET_BALANCE || 0).toFixed(2));
            omega_SetVal('crypto-target-pct', _FINANCE_SETTINGS.cryptoTargetPct);
            omega_SetVal('crypto-trade-count', _FINANCE_SETTINGS.cryptoTradeCount);
            omega_SetVal('crypto-split-count', _FINANCE_SETTINGS.cryptoSplitCount);
            omega_SetVal('crypto-tp-pct', _FINANCE_SETTINGS.cryptoTpPct);
            omega_SetVal('crypto-leverage', _FINANCE_SETTINGS.cryptoLeverage);
            omega_SetVal('crypto-default-symbol', _FINANCE_SETTINGS.cryptoDefaultSymbol || 'BTC');
            const exSel = document.getElementById('crypto-default-exchange'); if(exSel) exSel.value = _FINANCE_SETTINGS.cryptoDefaultExchange || 'binance';
            const qSel = document.getElementById('crypto-default-quote'); if(qSel) qSel.value = _FINANCE_SETTINGS.cryptoDefaultQuote || 'USDT';
            const sideSel = document.getElementById('crypto-default-side'); if(sideSel) sideSel.value = _FINANCE_SETTINGS.cryptoDefaultSide || 'long';
            omega_RenderCryptoSymbolDatalist();
            const todayLabel = document.getElementById('finance-today-label');
            if(todayLabel) todayLabel.innerText = new Date().toLocaleDateString('tr-TR', { weekday:'long', day:'2-digit', month:'long' }).toUpperCase();
            omega_SetFinanceMode(_FINANCE_MODE, false);
        }

        function omega_SetFinanceMode(mode, refresh = true) {
            _FINANCE_MODE = mode;
            document.querySelectorAll('.finance-tab').forEach(x => x.classList.remove('active'));
            document.querySelectorAll('.finance-tab-panel').forEach(x => x.classList.remove('active'));
            const tab = document.getElementById('finance-tab-' + mode);
            const panel = document.getElementById('finance-panel-' + mode);
            if(tab) tab.classList.add('active');
            if(panel) panel.classList.add('active');
            if(refresh) { omega_SaveFinanceAll(); omega_CalculateStakePlan(); omega_RenderDailyTradeGrid(); }
        }

        function omega_UpdateFinanceSettings() {
            _FINANCE_SETTINGS.startBank = parseFloat(document.getElementById('finance-start-bank')?.value) || 100;
            _FINANCE_SETTINGS.targetPct = parseFloat(document.getElementById('finance-target-pct')?.value) || 0;
            _FINANCE_SETTINGS.tradeCount = Math.min(20, Math.max(1, parseInt(document.getElementById('finance-trade-count')?.value) || 20));
            _FINANCE_SETTINGS.splitCount = Math.min(100, Math.max(1, parseInt(document.getElementById('finance-split-count')?.value) || 20));
            _FINANCE_SETTINGS.defaultOdds = parseFloat(document.getElementById('finance-default-odds')?.value) || 1.30;
            _FINANCE_SETTINGS.riskModel = document.getElementById('finance-risk-model')?.value || 'target';
            omega_SaveFinanceAll(); omega_CalculateStakePlan(); omega_RefreshFinanceDashboard();
        }

        function omega_UpdateCryptoSettings() {
            _FINANCE_SETTINGS.startBank = parseFloat(document.getElementById('crypto-start-bank')?.value) || _FINANCE_SETTINGS.startBank || 100;
            _FINANCE_SETTINGS.cryptoTargetPct = parseFloat(document.getElementById('crypto-target-pct')?.value) || 0;
            _FINANCE_SETTINGS.cryptoTradeCount = Math.min(20, Math.max(1, parseInt(document.getElementById('crypto-trade-count')?.value) || 20));
            _FINANCE_SETTINGS.cryptoSplitCount = Math.min(100, Math.max(1, parseInt(document.getElementById('crypto-split-count')?.value) || 20));
            _FINANCE_SETTINGS.cryptoTpPct = parseFloat(document.getElementById('crypto-tp-pct')?.value) || 1;
            _FINANCE_SETTINGS.cryptoLeverage = parseFloat(document.getElementById('crypto-leverage')?.value) || 1;
            _FINANCE_SETTINGS.cryptoDefaultExchange = document.getElementById('crypto-default-exchange')?.value || 'binance';
            _FINANCE_SETTINGS.cryptoDefaultQuote = document.getElementById('crypto-default-quote')?.value || 'USDT';
            _FINANCE_SETTINGS.cryptoDefaultSymbol = (document.getElementById('crypto-default-symbol')?.value || 'BTC').toUpperCase().replace(/[^A-Z0-9]/g,'');
            _FINANCE_SETTINGS.cryptoDefaultSide = document.getElementById('crypto-default-side')?.value || 'long';
            omega_SaveFinanceAll(); omega_CalculateStakePlan(); omega_RefreshFinanceDashboard(); omega_RenderDailyTradeGrid(); omega_RefreshCryptoLive(true);
        }

        function omega_SetCurrentBankroll() {
            const val = parseFloat(document.getElementById('finance-current-bank')?.value);
            if(isNaN(val) || val < 0) return;
            _WALLET_BALANCE = val;
            if(_BALANCE_HISTORY.length === 0) _BALANCE_HISTORY.push(val); else _BALANCE_HISTORY[_BALANCE_HISTORY.length - 1] = val;
            omega_SaveFinanceAll(); omega_RefreshFinanceDashboard(); omega_RenderApexSupremeChart();
        }
        function omega_SetCurrentBankrollFromCrypto() {
            const val = parseFloat(document.getElementById('crypto-current-bank')?.value);
            if(isNaN(val) || val < 0) return;
            _WALLET_BALANCE = val;
            if(_BALANCE_HISTORY.length === 0) _BALANCE_HISTORY.push(val); else _BALANCE_HISTORY[_BALANCE_HISTORY.length - 1] = val;
            omega_SaveFinanceAll(); omega_RefreshFinanceDashboard(); omega_RenderApexSupremeChart();
        }

        function omega_CalculateRecommendedStake() {
            omega_EnsureFinanceSettings();
            const bank = Number(_WALLET_BALANCE || 0);
            if(_FINANCE_MODE === 'crypto') {
                const targetProfit = bank * ((_FINANCE_SETTINGS.cryptoTargetPct || 0) / 100);
                const count = Math.max(1, _FINANCE_SETTINGS.cryptoTradeCount || 20);
                const splitCount = Math.max(1, _FINANCE_SETTINGS.cryptoSplitCount || 20);
                const tpPct = Math.max(.01, _FINANCE_SETTINGS.cryptoTpPct || 1);
                const lev = Math.max(1, _FINANCE_SETTINGS.cryptoLeverage || 1);
                const profitRate = (tpPct / 100) * lev;
                const stakeByTarget = targetProfit / count / profitRate;
                const stakeBySplit = bank / splitCount;
                const stake = stakeBySplit;
                const syntheticOdds = 1 + profitRate;
                return { mode:'crypto', bank, targetProfit, count, splitCount, odds:syntheticOdds, stake, stakeByTarget, stakeBySplit, tpPct, lev, profitRate };
            }
            const targetProfit = bank * ((_FINANCE_SETTINGS.targetPct || 0) / 100);
            const count = Math.max(1, _FINANCE_SETTINGS.tradeCount || 20);
            const splitCount = Math.max(1, _FINANCE_SETTINGS.splitCount || 20);
            const odds = Math.max(1.01, _FINANCE_SETTINGS.defaultOdds || 1.30);
            let stake = 0;
            if(_FINANCE_SETTINGS.riskModel === 'split') stake = bank / splitCount;
            else if(_FINANCE_SETTINGS.riskModel === 'equal') stake = bank / count;
            else if(_FINANCE_SETTINGS.riskModel === 'percent') stake = bank * 0.02;
            else stake = targetProfit / count / (odds - 1);
            const stakeByTarget = targetProfit / count / (odds - 1);
            const stakeBySplit = bank / splitCount;
            return { mode:'bet', bank, targetProfit, count, splitCount, odds, stake, stakeByTarget, stakeBySplit, riskModel:_FINANCE_SETTINGS.riskModel };
        }

        function omega_FinanceToast(msg) {
            let t = document.getElementById('finance-toast');
            if(!t) {
                t = document.createElement('div');
                t.id = 'finance-toast';
                t.className = 'finance-toast';
                document.body.appendChild(t);
            }
            t.innerText = msg;
            t.classList.add('show');
            clearTimeout(window.__financeToastTimer);
            window.__financeToastTimer = setTimeout(() => t.classList.remove('show'), 2200);
        }

        function omega_CalculateStakePlan() {
            const r = omega_CalculateRecommendedStake();
            window.__lastFinancePlan = r;
            const box = document.getElementById('finance-strategy-result');
            if(!box) return r.stake;
            let perProfit, label, detail;
            if(r.mode === 'crypto') {
                perProfit = r.stake * r.profitRate;
                label = 'MARJİN';
                detail = `%${r.tpPct} TP · ${r.lev}x`;
            } else {
                perProfit = r.stake * (r.odds - 1);
                label = 'STAKE';
                detail = `${r.splitCount} parçaya böl · @${r.odds.toFixed(2)}`;
            }
            box.innerHTML = `
                <div class="plan-metric main"><span>Önerilen ${label}</span><b>$${r.stake.toFixed(2)}</b></div>
                <div class="plan-metric"><span>İşlem Başı Kâr</span><b>$${perProfit.toFixed(2)}</b></div>
                <div class="plan-metric"><span>Günlük Hedef</span><b>$${r.targetProfit.toFixed(2)}</b></div>
                <div class="plan-metric good"><span>Model</span><b>${detail}</b></div>
            `;
            return r.stake;
        }

        function omega_GetTodaySlots() { omega_EnsureFinanceSettings(); return _DAILY_SLOTS[omega_TodayKey()]; }

        function omega_ApplyStakeToEmptySlots() {
            const r = omega_CalculateRecommendedStake();
            window.__lastFinancePlan = r;
            const slots = omega_GetTodaySlots();
            let applied = 0;
            slots.forEach((slot, idx) => {
                if(slot.status !== 'win' && slot.status !== 'loss') {
                    slot.type = _FINANCE_MODE;
                    if(!slot.name) slot.name = '';
                    slot.stake = Number(r.stake.toFixed(2));
                    slot.odds = Number(r.odds.toFixed(4));
                    if(_FINANCE_MODE === 'crypto') {
                        slot.exchange = _FINANCE_SETTINGS.cryptoDefaultExchange || 'binance';
                        slot.quote = _FINANCE_SETTINGS.cryptoDefaultQuote || 'USDT';
                        slot.symbol = (_FINANCE_SETTINGS.cryptoDefaultSymbol || 'BTC').toUpperCase();
                        slot.side = _FINANCE_SETTINGS.cryptoDefaultSide || 'long';
                        slot.entry = slot.entry || '';
                    }
                    slot.status = 'pending';
                    applied++;
                }
            });
            omega_SaveFinanceAll();
            omega_RenderDailyTradeGrid();
            omega_RefreshFinanceDashboard();
            omega_CalculateStakePlan();
            omega_FinanceToast(`${applied} satıra önerilen tutar yazıldı.`);
        }

        function omega_StatusText(status) {
            if(status === 'win') return 'KAZANDI';
            if(status === 'loss') return 'KAYBETTİ';
            if(status === 'pending') return 'BEKLEMEDE';
            return 'BOŞ';
        }
        function omega_TypeText(type) { return type === 'crypto' ? 'KRİPTO' : 'BAHİS'; }


        function omega_RenderCryptoSymbolDatalist() {
            const dl = document.getElementById('crypto-symbol-list');
            if(!dl || dl.dataset.ready === '1') return;
            dl.innerHTML = CRYPTO_TOP_SYMBOLS.map(s => `<option value="${s}"></option>`).join('');
            dl.dataset.ready = '1';
        }

        function omega_CryptoInst(slot) {
            const symbol = String(slot.symbol || 'BTC').toUpperCase().replace(/[^A-Z0-9]/g,'') || 'BTC';
            const quote = slot.quote || 'USDT';
            const exchange = slot.exchange || 'binance';
            if(exchange === 'okx') return `${symbol}-${quote}`;
            return `${symbol}${quote}`;
        }

        function omega_CryptoCacheKey(slot) {
            return `${slot.exchange || 'binance'}:${slot.symbol || 'BTC'}:${slot.quote || 'USDT'}`;
        }

        function omega_BuildCryptoLiveCell(slot, idx) {
            const key = omega_CryptoCacheKey(slot);
            const data = _CRYPTO_LIVE_CACHE[key];
            const price = data && data.price ? Number(data.price) : null;
            const entry = parseFloat(slot.entry);
            const stake = parseFloat(slot.stake);
            const side = slot.side || 'long';
            let pnlText = 'Giriş bekleniyor';
            let pnlCls = '';
            if(price && !isNaN(entry) && entry > 0 && !isNaN(stake) && stake > 0) {
                const change = side === 'short' ? (entry - price) / entry : (price - entry) / entry;
                const pnl = stake * change;
                pnlText = `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} · ${(change*100).toFixed(2)}%`;
                pnlCls = pnl >= 0 ? 'live-pnl-pos' : 'live-pnl-neg';
            }
            const status = data && data.error ? `<span class="crypto-live-pill err">Veri yok</span>` : `<span class="crypto-live-pill ok">Canlı</span>`;
            return `<div class="live-track-card" id="live-card-${idx}">
                <div class="live-track-main">
                    <b>${slot.symbol || 'BTC'}/${slot.quote || 'USDT'} · ${(slot.exchange || 'binance').toUpperCase()}</b>
                    <span>Fiyat: ${price ? '$' + omega_FormatCryptoPrice(price) : 'yükleniyor'} ${status}</span>
                    <span class="${pnlCls}">${pnlText}</span>
                </div>
                <canvas class="sparkline" id="spark-${idx}" width="196" height="84"></canvas>
            </div>`;
        }

        function omega_FormatCryptoPrice(price) {
            price = Number(price);
            if(price >= 1000) return price.toLocaleString('en-US', {maximumFractionDigits:2});
            if(price >= 1) return price.toFixed(4);
            return price.toPrecision(5);
        }

        async function omega_FetchCryptoMarket(slot) {
            const exchange = slot.exchange || 'binance';
            const key = omega_CryptoCacheKey(slot);
            try {
                if(exchange === 'okx') {
                    const inst = omega_CryptoInst(slot);
                    const [tickerRes, candleRes] = await Promise.all([
                        fetch(`https://www.okx.com/api/v5/market/ticker?instId=${encodeURIComponent(inst)}`),
                        fetch(`https://www.okx.com/api/v5/market/candles?instId=${encodeURIComponent(inst)}&bar=1m&limit=30`)
                    ]);
                    const ticker = await tickerRes.json();
                    const candles = await candleRes.json();
                    const price = Number(ticker?.data?.[0]?.last);
                    const closes = (candles?.data || []).map(x => Number(x[4])).filter(Boolean).reverse();
                    if(!price) throw new Error('OKX fiyat yok');
                    _CRYPTO_LIVE_CACHE[key] = { price, closes, ts: Date.now() };
                } else {
                    const inst = omega_CryptoInst(slot);
                    const [tickerRes, candleRes] = await Promise.all([
                        fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${encodeURIComponent(inst)}`),
                        fetch(`https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(inst)}&interval=1m&limit=30`)
                    ]);
                    const ticker = await tickerRes.json();
                    const candles = await candleRes.json();
                    const price = Number(ticker?.price);
                    const closes = Array.isArray(candles) ? candles.map(x => Number(x[4])).filter(Boolean) : [];
                    if(!price) throw new Error('Binance fiyat yok');
                    _CRYPTO_LIVE_CACHE[key] = { price, closes, ts: Date.now() };
                }
            } catch(e) {
                _CRYPTO_LIVE_CACHE[key] = { error:true, message:e.message, closes:[], ts:Date.now() };
            }
        }

        async function omega_RefreshCryptoLive(force=false) {
            if(_CRYPTO_REFRESHING) return;
            const slots = omega_GetTodaySlots().filter(s => s.type === 'crypto' && s.symbol);
            if(slots.length === 0) return;
            _CRYPTO_REFRESHING = true;
            const uniq = [];
            const seen = new Set();
            slots.forEach(s => { const k=omega_CryptoCacheKey(s); if(!seen.has(k)){ seen.add(k); uniq.push(s); } });
            for(const slot of uniq.slice(0, 12)) {
                const old = _CRYPTO_LIVE_CACHE[omega_CryptoCacheKey(slot)];
                if(force || !old || Date.now() - old.ts > 20000) await omega_FetchCryptoMarket(slot);
            }
            _CRYPTO_REFRESHING = false;
            omega_RenderDailyTradeGrid();
        }

        function omega_DrawAllCryptoSparklines() {
            const slots = omega_GetTodaySlots();
            slots.forEach((slot, idx) => {
                if(slot.type !== 'crypto') return;
                const canvas = document.getElementById('spark-' + idx);
                const data = _CRYPTO_LIVE_CACHE[omega_CryptoCacheKey(slot)];
                if(canvas) omega_DrawSparkline(canvas, data?.closes || []);
            });
        }

        function omega_DrawSparkline(canvas, values) {
            const ctx = canvas.getContext('2d');
            const w = canvas.width, h = canvas.height;
            ctx.clearRect(0,0,w,h);
            ctx.fillStyle = '#050505'; ctx.fillRect(0,0,w,h);
            if(!values || values.length < 2) {
                ctx.strokeStyle = '#333'; ctx.beginPath(); ctx.moveTo(0,h/2); ctx.lineTo(w,h/2); ctx.stroke(); return;
            }
            const min = Math.min(...values), max = Math.max(...values);
            const range = max - min || 1;
            const up = values[values.length-1] >= values[0];
            ctx.strokeStyle = up ? '#10b981' : '#ef4444';
            ctx.lineWidth = 3;
            ctx.beginPath();
            values.forEach((v,i) => {
                const x = (i/(values.length-1))*w;
                const y = h - ((v-min)/range)*(h-10) - 5;
                if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
            });
            ctx.stroke();
            ctx.strokeStyle = 'rgba(251,191,36,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0,h/2); ctx.lineTo(w,h/2); ctx.stroke();
        }

        function omega_StartCryptoTimer() {
            if(_CRYPTO_TIMER) return;
            _CRYPTO_TIMER = setInterval(() => {
                if(_ACTIVE_TAB === 'finance') omega_RefreshCryptoLive(false);
            }, 25000);
            setTimeout(() => omega_RefreshCryptoLive(true), 400);
        }

        function omega_RenderDailyTradeGrid() {
            const grid = document.getElementById('daily-trade-grid'); if(!grid) return;
            omega_RenderCryptoSymbolDatalist();
            const slots = omega_GetTodaySlots();
            let html = `<table class="trade-table"><thead><tr><th>#</th><th>Tür</th><th>İşlem / Not</th><th>Tutar</th><th>Oran / Çarpan</th><th>Canlı Takip</th><th>Durum</th><th>K/Z</th><th>Sonuç</th></tr></thead><tbody>`;
            slots.forEach((slot, idx) => {
                const pnl = Number(slot.pnl || 0);
                const pnlClass = pnl >= 0 ? 'pnl-pos' : 'pnl-neg';
                const typeCls = slot.type === 'crypto' ? 'slot-type-crypto' : 'slot-type-bet';
                const statusCls = slot.status === 'win' ? 'status-win' : slot.status === 'loss' ? 'status-loss' : slot.status === 'pending' ? 'status-pending' : 'status-empty';
                const liveHtml = slot.type === 'crypto' ? omega_BuildCryptoLiveCell(slot, idx) : `<span class="crypto-live-pill">Skor modülü sonra</span>`;
                const nameHtml = slot.type === 'crypto' ? `
                    <div class="slot-symbol-row">
                        <select class="slot-mini-input" onchange="omega_UpdateSlot(${idx}, 'exchange', this.value)"><option value="binance" ${slot.exchange !== 'okx' ? 'selected' : ''}>Binance</option><option value="okx" ${slot.exchange === 'okx' ? 'selected' : ''}>OKX</option></select>
                        <select class="slot-mini-input" onchange="omega_UpdateSlot(${idx}, 'quote', this.value)"><option value="USDT" ${(slot.quote || 'USDT') === 'USDT' ? 'selected' : ''}>USDT</option><option value="USDC" ${(slot.quote || 'USDT') === 'USDC' ? 'selected' : ''}>USDC</option></select>
                        <input class="slot-mini-input" list="crypto-symbol-list" value="${slot.symbol || ''}" placeholder="BTC" onchange="omega_UpdateSlot(${idx}, 'symbol', this.value)">
                        <select class="slot-mini-input" onchange="omega_UpdateSlot(${idx}, 'side', this.value)"><option value="long" ${(slot.side || 'long') === 'long' ? 'selected' : ''}>LONG</option><option value="short" ${slot.side === 'short' ? 'selected' : ''}>SHORT</option></select>
                    </div>
                    <input type="text" value="${slot.name || ''}" placeholder="Not: BTC breakout, ETH long..." onchange="omega_UpdateSlot(${idx}, 'name', this.value)" style="margin-top:6px;">
                    <input class="slot-mini-input" type="number" value="${slot.entry || ''}" placeholder="Giriş fiyatı" onchange="omega_UpdateSlot(${idx}, 'entry', this.value)" style="margin-top:6px;">
                ` : `<input type="text" value="${slot.name || ''}" placeholder="Maç adı veya bahis notu" onchange="omega_UpdateSlot(${idx}, 'name', this.value)">`;
                html += `<tr>
                    <td style="font-family:'JetBrains Mono'; color:var(--muted); font-weight:900;">${idx+1}</td>
                    <td><select class="${typeCls}" onchange="omega_UpdateSlot(${idx}, 'type', this.value)"><option value="bet" ${slot.type === 'bet' ? 'selected' : ''}>BAHİS</option><option value="crypto" ${slot.type === 'crypto' ? 'selected' : ''}>KRİPTO</option></select></td>
                    <td>${nameHtml}</td>
                    <td><input class="slot-money-input" type="number" value="${slot.stake || ''}" placeholder="0.00" onchange="omega_UpdateSlot(${idx}, 'stake', this.value)"></td>
                    <td><input class="slot-odds-input" type="number" value="${slot.odds || ''}" step="0.01" placeholder="1.30" onchange="omega_UpdateSlot(${idx}, 'odds', this.value)"></td>
                    <td class="live-cell">${liveHtml}</td>
                    <td><span class="status-badge ${statusCls}">${omega_StatusText(slot.status)}</span></td>
                    <td class="${pnlClass}">${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}</td>
                    <td><div class="mini-actions"><button class="w" onclick="omega_ResolveDailySlot(${idx}, 'win')">KAZANDI</button><button class="l" onclick="omega_ResolveDailySlot(${idx}, 'loss')">KAYBETTİ</button><button class="r" onclick="omega_ResetDailySlot(${idx})">TEMİZLE</button></div></td>
                </tr>`;
            });
            html += `</tbody></table>`;
            grid.innerHTML = html;
            omega_DrawAllCryptoSparklines();
            omega_StartCryptoTimer();
        }

        function omega_UpdateSlot(index, field, value) {
            const slots = omega_GetTodaySlots(); if(!slots[index]) return;
            if(['stake','odds','entry'].includes(field)) value = parseFloat(value) || '';
            if(['symbol'].includes(field)) value = String(value || '').toUpperCase().replace(/[^A-Z0-9]/g,'');
            slots[index][field] = value;
            if(field === 'type' && value === 'crypto') {
                slots[index].exchange = slots[index].exchange || _FINANCE_SETTINGS.cryptoDefaultExchange || 'binance';
                slots[index].quote = slots[index].quote || _FINANCE_SETTINGS.cryptoDefaultQuote || 'USDT';
                slots[index].symbol = slots[index].symbol || _FINANCE_SETTINGS.cryptoDefaultSymbol || 'BTC';
                slots[index].side = slots[index].side || _FINANCE_SETTINGS.cryptoDefaultSide || 'long';
            }
            if(slots[index].status === 'empty' && (slots[index].stake || slots[index].name || slots[index].symbol)) slots[index].status = 'pending';
            omega_SaveFinanceAll();
            omega_RefreshFinanceDashboard();
            if(['type','exchange','quote','symbol','side','entry'].includes(field)) {
                omega_RenderDailyTradeGrid();
                omega_RefreshCryptoLive(true);
            }
        }

        function omega_ResolveDailySlot(index, result) {
            const slot = omega_GetTodaySlots()[index]; if(!slot) return;
            const stake = parseFloat(slot.stake); const odds = parseFloat(slot.odds);
            if(isNaN(stake) || stake <= 0) { alert('Tutar / marjin gir.'); return; }
            if(isNaN(odds) || odds <= 1) { alert('Oran / katsayı gir.'); return; }
            const pnl = result === 'win' ? stake * (odds - 1) : -stake;
            slot.status = result; slot.pnl = pnl; slot.resolvedAt = Date.now(); slot.name = slot.name || `${slot.type === 'crypto' ? 'CRYPTO' : 'BAHİS'} #${index+1}`;
            _WALLET_BALANCE += pnl; _BALANCE_HISTORY.push(Number(_WALLET_BALANCE.toFixed(2)));
            _COMPLETED_LEDGER.unshift({ id: slot.resolvedAt, name: slot.name, type: slot.type, amt: stake, odds, res: result, pnl, bal: _WALLET_BALANCE });
            omega_SaveFinanceAll(); omega_RenderDailyTradeGrid(); omega_RefreshFinanceDashboard(); omega_RenderApexSupremeChart();
        }

        function omega_ResetDailySlot(index) { const slots=omega_GetTodaySlots(); slots[index]=omega_NewSlot(index); omega_SaveFinanceAll(); omega_RenderDailyTradeGrid(); omega_RefreshFinanceDashboard(); }
        function omega_ClearTodaySlots() { if(!confirm('Bugünün 20 işlem tablosu temizlensin mi?')) return; _DAILY_SLOTS[omega_TodayKey()] = Array.from({length:20}, (_,i)=>omega_NewSlot(i)); omega_SaveFinanceAll(); omega_RenderDailyTradeGrid(); omega_RefreshFinanceDashboard(); }
        function omega_ResetFinanceAll() { if(!confirm('Tüm kasa ve işlem geçmişi sıfırlansın mı?')) return; const start=parseFloat(document.getElementById(_FINANCE_MODE==='crypto'?'crypto-start-bank':'finance-start-bank')?.value)||100; _WALLET_BALANCE=start; _BALANCE_HISTORY=[start]; _PENDING_OPS=[]; _COMPLETED_LEDGER=[]; _DAILY_SLOTS={}; omega_SaveFinanceAll(); omega_LoadFinanceInputs(); omega_RenderDailyTradeGrid(); omega_RefreshFinanceDashboard(); omega_RenderApexSupremeChart(); }
        function omega_AddManualOperationFromTop() { omega_ApplyStakeToEmptySlots(); }
        function omega_CommitNewOperation() { omega_ApplyStakeToEmptySlots(); }

        function omega_RenderBarriers() {
            const strip = document.getElementById('finance-barrier-strip');
            if(!strip) return;
            const bal = Number(_WALLET_BALANCE || 0);
            const next = FINANCE_BARRIERS.find(x => x > bal) || FINANCE_BARRIERS[FINANCE_BARRIERS.length-1];
            const prev = [...FINANCE_BARRIERS].reverse().find(x => x <= bal) || 0;
            strip.innerHTML = FINANCE_BARRIERS.map(x => `<span class="barrier-pill ${bal >= x ? 'done' : x === next ? 'next' : ''}">$${x.toLocaleString('en-US')}</span>`).join('');
            const fill = document.getElementById('barrier-progress-fill');
            const text = document.getElementById('barrier-progress-text');
            const pct = next === prev ? 100 : Math.max(0, Math.min(100, ((bal - prev) / (next - prev)) * 100));
            if(fill) fill.style.width = pct + '%';
            if(text) text.innerText = bal >= FINANCE_BARRIERS[FINANCE_BARRIERS.length-1] ? 'Son bariyer geçildi.' : `Sonraki bariyer: $${next.toLocaleString('en-US')} · Kalan: $${Math.max(0,next-bal).toFixed(2)}`;
        }

        function omega_RefreshFinanceDashboard() {
            omega_EnsureFinanceSettings(); omega_LoadFinanceInputs();
            const todaySlots = omega_GetTodaySlots();
            const dayPnl = todaySlots.reduce((sum,x)=>sum+(Number(x.pnl)||0),0);
            const netProfit = _COMPLETED_LEDGER.reduce((sum,item)=>sum+(item.pnl||0),0);
            const activeRisk = todaySlots.filter(x=>x.status==='pending').reduce((sum,x)=>sum+(parseFloat(x.stake)||0),0) + _PENDING_OPS.reduce((sum,item)=>sum+item.amt,0);
            const wins = _COMPLETED_LEDGER.filter(x=>x.res==='win').length + todaySlots.filter(x=>x.status==='win').length;
            const losses = _COMPLETED_LEDGER.filter(x=>x.res==='loss').length + todaySlots.filter(x=>x.status==='loss').length;
            const totalDone = wins + losses;
            const initialBalance = _BALANCE_HISTORY[0] || _FINANCE_SETTINGS.startBank || 100;
            const currentRoi = initialBalance ? ((_WALLET_BALANCE - initialBalance) / initialBalance * 100) : 0;
            omega_Text('finance-hero-balance', '$' + Number(_WALLET_BALANCE||0).toFixed(2));
            omega_Text('kpi-val-w', Number(_WALLET_BALANCE||0).toFixed(2));
            omega_Text('kpi-day-pnl', (dayPnl >= 0 ? '+' : '') + dayPnl.toFixed(2), dayPnl >= 0 ? 'var(--green)' : 'var(--red)');
            omega_Text('kpi-val-p', (netProfit >= 0 ? '+' : '') + netProfit.toFixed(2), netProfit >= 0 ? 'var(--green)' : 'var(--red)');
            omega_Text('kpi-val-risk', activeRisk.toFixed(2));
            omega_Text('kpi-winrate', totalDone ? '%' + ((wins/totalDone)*100).toFixed(1) : '%0');
            omega_Text('kpi-val-roi', '%' + currentRoi.toFixed(1), currentRoi >= 0 ? 'var(--green)' : 'var(--red)');
            omega_CalculateStakePlan(); omega_RenderDailyTradeGrid(); omega_RenderSupremeLedgerTable(); omega_RenderBarriers();
        }

        function omega_RenderSupremeLedgerTable() {
            const tableElement = document.getElementById('omega-data-table'); if(!tableElement) return;
            let headerHtml = `<tr><th>TARİH</th><th>TÜR</th><th>KOD</th><th>STAKE</th><th>ORAN</th><th>DURUM</th><th>P/L</th><th>KASA</th></tr>`;
            let rowsHtml = '';
            const list = [..._PENDING_OPS.map(x=>({...x,pending:true})), ..._COMPLETED_LEDGER.slice(0,40)];
            if(list.length===0) rowsHtml = `<tr><td colspan="8" style="text-align:center; padding:28px; color:var(--muted); font-weight:900;">Henüz işlem yok.</td></tr>`;
            list.forEach(item=>{
                const dateStr = new Date(item.id).toLocaleDateString('tr-TR');
                const statusBadge = item.pending ? `<span style="color:var(--gold); font-weight:900;">BEKLEMEDE</span>` : item.res==='win' ? `<b style="color:var(--green)">KAZANDI</b>` : `<b style="color:var(--red)">KAYBETTİ</b>`;
                const pnlDisplay = item.pending ? '-' : `<span style="color:${item.pnl>=0?'var(--green)':'var(--red)'}; font-weight:900;">${item.pnl>=0?'+':''}${item.pnl.toFixed(2)}</span>`;
                rowsHtml += `<tr><td>${dateStr}</td><td>${omega_TypeText(item.type||'bet')}</td><td style="color:#fff; font-weight:800;">${item.name}</td><td>$${Number(item.amt||0).toFixed(2)}</td><td>@${Number(item.odds||0).toFixed(2)}</td><td>${statusBadge}</td><td>${pnlDisplay}</td><td>${item.bal?'$'+Number(item.bal).toFixed(2):'-'}</td></tr>`;
            });
            tableElement.innerHTML = headerHtml + rowsHtml;
        }

        function omega_ResolveOperation(id, result) {
            const operation = _PENDING_OPS.find(x=>x.id===id); if(!operation) return;
            const pnl = result==='win' ? (operation.amt*operation.odds)-operation.amt : -operation.amt;
            _WALLET_BALANCE += pnl; _BALANCE_HISTORY.push(Number(_WALLET_BALANCE.toFixed(2)));
            _COMPLETED_LEDGER.unshift({ ...operation, res:result, pnl, bal:_WALLET_BALANCE });
            _PENDING_OPS = _PENDING_OPS.filter(x=>x.id!==id);
            omega_SaveFinanceAll(); omega_RefreshFinanceDashboard(); omega_RenderApexSupremeChart();
        }

        function omega_PersistData() {
            localStorage.setItem('v19_w', _WALLET_BALANCE);
            localStorage.setItem('v19_h', JSON.stringify(_BALANCE_HISTORY));
            localStorage.setItem('v19_p', JSON.stringify(_PENDING_OPS));
            localStorage.setItem('v19_l', JSON.stringify(_COMPLETED_LEDGER));
        }

        let _SUPREME_CHART_INSTANCE;
        function omega_RenderApexSupremeChart() {
            const chartDiv = document.querySelector('#omega-apex-chart-main'); if(!chartDiv) return;
            if(_SUPREME_CHART_INSTANCE) _SUPREME_CHART_INSTANCE.destroy();
            const balanceData = (_BALANCE_HISTORY && _BALANCE_HISTORY.length) ? _BALANCE_HISTORY.map(Number) : [Number(_WALLET_BALANCE||100)];
            const pnlData = balanceData.map((v, i) => i === 0 ? 0 : Number((v - balanceData[i-1]).toFixed(2)));
            const labels = balanceData.map((_, i) => i === 0 ? 'Başlangıç' : `${i}. işlem`);
            const minBal = Math.min(...balanceData);
            const maxBal = Math.max(...balanceData);
            const visibleBarriers = FINANCE_BARRIERS.filter(x => x >= minBal * 0.80 && x <= Math.max(maxBal * 1.25, 1000));
            const annotations = { yaxis: visibleBarriers.map(v => ({ y:v, borderColor:'#34343a', strokeDashArray:5, label:{ text:'$'+v.toLocaleString('en-US'), style:{ background:'#151515', color:'#c8c8c8', fontSize:'10px' } } })) };
            const chartOptions = {
                series:[
                    { name:'Kasa', type:'line', data: balanceData },
                    { name:'P/L', type:'column', data: pnlData }
                ],
                chart:{ type:'line', height:'100%', toolbar:{show:false}, background:'transparent', animations:{enabled:true, speed:420}, stacked:false },
                theme:{ mode:'dark' },
                colors:['#fbbf24', '#10b981'],
                stroke:{ width:[4,0], curve:'straight' },
                plotOptions:{ bar:{ columnWidth:'42%', borderRadius:3, colors:{ ranges:[{ from:-999999999, to:-0.01, color:'#ef4444' }, { from:-0.009, to:0.009, color:'#fbbf24' }, { from:0.01, to:999999999, color:'#10b981' }] } } },
                fill:{ opacity:[1,.42], type:['solid','solid'] },
                annotations,
                labels,
                xaxis:{ labels:{show:false}, axisBorder:{show:false}, axisTicks:{show:false} },
                yaxis:[
                    { seriesName:'Kasa', opposite:true, labels:{ style:{colors:'#a1a1aa', fontSize:'11px', fontFamily:'JetBrains Mono'}, formatter:v=>'$'+Number(v).toFixed(0) } },
                    { seriesName:'P/L', show:false }
                ],
                grid:{ borderColor:'#252525', strokeDashArray:4 },
                legend:{ show:true, labels:{ colors:'#aaa' } },
                tooltip:{ theme:'dark', shared:true, y:{ formatter:v=>'$'+Number(v).toFixed(2) } }
            };
            _SUPREME_CHART_INSTANCE = new ApexCharts(chartDiv, chartOptions); _SUPREME_CHART_INSTANCE.render(); omega_RenderBarriers();
        }

        /* ================= KASA CANLI TAKİP MERKEZİ V6 ================= */
        let _WATCH_FILTER = 'all';
        let _LIVE_SCORES_CACHE = null;
        let _LIVE_SCORES_TS = 0;

        function omega_SetWatchFilter(filter) {
            _WATCH_FILTER = filter;
            document.querySelectorAll('.watch-tab').forEach(x => x.classList.remove('active'));
            const tab = document.getElementById('watch-tab-' + filter);
            if(tab) tab.classList.add('active');
            omega_RenderLiveWatchCenter();
        }

        function omega_SlotLabel(slot, idx) {
            if(slot.type === 'crypto') return `${(slot.symbol || 'BTC').toUpperCase()}${slot.quote || 'USDT'} ${String(slot.side || 'long').toUpperCase()}`;
            return slot.name || `Bahis / Maç #${idx + 1}`;
        }

        function omega_ToggleTrackSlot(index) {
            const slots = omega_GetTodaySlots();
            if(!slots[index]) return;
            slots[index].track = !slots[index].track;
            if(slots[index].track && slots[index].status === 'empty') slots[index].status = 'pending';
            omega_SaveFinanceAll();
            omega_RenderDailyTradeGrid();
            omega_RenderLiveWatchCenter();
            omega_RefreshLiveCenter(true);
        }

        async function omega_LoadLiveScores(force=false) {
            if(!force && _LIVE_SCORES_CACHE && Date.now() - _LIVE_SCORES_TS < 45000) return _LIVE_SCORES_CACHE;
            try {
                const r = await fetch('live_scores.json?nocache=' + Date.now());
                if(!r.ok) throw new Error('live_scores.json yok');
                _LIVE_SCORES_CACHE = await r.json();
                _LIVE_SCORES_TS = Date.now();
            } catch(e) {
                _LIVE_SCORES_CACHE = { live: [], error: true };
                _LIVE_SCORES_TS = Date.now();
            }
            return _LIVE_SCORES_CACHE;
        }

        function omega_FindScoreForSlot(slot) {
            const db = _LIVE_SCORES_CACHE;
            if(!db || !Array.isArray(db.live)) return null;
            const name = String(slot.name || '').toLowerCase();
            if(!name) return null;
            return db.live.find(x => {
                const home = String(x.home || x.ev_sahibi || '').toLowerCase();
                const away = String(x.away || x.deplasman || '').toLowerCase();
                const match = `${home} - ${away}`;
                return name.includes(home) || name.includes(away) || match.includes(name);
            }) || null;
        }

        function omega_BuildWatchCryptoCard(slot, idx) {
            const key = omega_CryptoCacheKey(slot);
            const data = _CRYPTO_LIVE_CACHE[key];
            const price = data && data.price ? data.price : null;
            const entry = parseFloat(slot.entry);
            const stake = parseFloat(slot.stake) || 0;
            const leverage = parseFloat(slot.odds) || (_FINANCE_SETTINGS.cryptoLeverage || 1);
            let pnl = 0;
            if(price && entry) {
                const diffPct = ((price - entry) / entry) * 100;
                const direction = (slot.side || 'long') === 'short' ? -1 : 1;
                pnl = stake * (diffPct / 100) * leverage * direction;
            }
            const closes = data?.closes || [];
            const change = closes.length > 1 ? ((closes[closes.length-1] - closes[0]) / closes[0]) * 100 : 0;
            const changeCls = change >= 0 ? 'up' : 'down';
            setTimeout(() => {
                const canvas = document.getElementById('watch-spark-' + idx);
                if(canvas) omega_DrawSparkline(canvas, closes);
            }, 0);
            return `<div class="watch-card crypto">
                <div class="watch-card-top">
                    <div class="watch-title"><b>${omega_SlotLabel(slot, idx)}</b><span>${(slot.exchange || 'binance').toUpperCase()} · ${slot.quote || 'USDT'} · #${idx+1}</span></div>
                    <div class="watch-price"><b>${price ? omega_FormatCryptoPrice(price) : 'Veri bekleniyor'}</b><span class="${changeCls}">${change >= 0 ? '+' : ''}${change.toFixed(2)}%</span></div>
                </div>
                <canvas id="watch-spark-${idx}" class="watch-spark" width="460" height="90"></canvas>
                <div class="watch-metrics">
                    <div class="watch-metric"><span>Giriş</span><b>${entry ? omega_FormatCryptoPrice(entry) : '-'}</b></div>
                    <div class="watch-metric"><span>Marjin</span><b>$${stake.toFixed(2)}</b></div>
                    <div class="watch-metric ${pnl >= 0 ? 'good' : 'bad'}"><span>Canlı PnL</span><b>${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}</b></div>
                </div>
            </div>`;
        }

        function omega_BuildWatchBetCard(slot, idx) {
            const score = omega_FindScoreForSlot(slot);
            const scoreText = score ? `${score.home_score ?? score.ev ?? 0} - ${score.away_score ?? score.dep ?? 0}` : 'Skor bekleniyor';
            const minute = score ? (score.minute || score.dakika || score.status || 'Canlı') : 'live_scores.json bağlanınca aktif';
            return `<div class="watch-card bet">
                <div class="watch-card-top">
                    <div class="watch-title"><b>${slot.name || 'Maç adı girilmedi'}</b><span>BAHİS · #${idx+1}</span></div>
                    <div class="watch-price"><b>${scoreText}</b><span class="up">${minute}</span></div>
                </div>
                <div class="football-score-box">
                    <div class="football-score-main"><b>Canlı Skor</b><span>${scoreText}</span></div>
                    <div class="football-score-sub">Şimdilik takip kartı hazır. Sonraki adımda API-Football / RapidAPI motoru live_scores.json üretecek ve bu alan otomatik güncellenecek.</div>
                </div>
                <div class="watch-metrics">
                    <div class="watch-metric"><span>Tutar</span><b>$${(parseFloat(slot.stake)||0).toFixed(2)}</b></div>
                    <div class="watch-metric"><span>Oran</span><b>${slot.odds || '-'}</b></div>
                    <div class="watch-metric"><span>Durum</span><b>${omega_StatusText(slot.status)}</b></div>
                </div>
            </div>`;
        }

        function omega_RenderLiveWatchCenter() {
            const box = document.getElementById('live-watch-list');
            if(!box) return;
            const slots = omega_GetTodaySlots();
            const tracked = slots.map((slot, idx) => ({slot, idx})).filter(x => x.slot.track);
            const cryptoCount = tracked.filter(x => x.slot.type === 'crypto').length;
            const betCount = tracked.filter(x => x.slot.type !== 'crypto').length;
            omega_Text('watch-crypto-count', cryptoCount);
            omega_Text('watch-bet-count', betCount);
            const filtered = _WATCH_FILTER === 'live' ? tracked.filter(x => x.slot.status === 'pending' || x.slot.status === 'empty') : tracked;
            if(filtered.length === 0) {
                box.innerHTML = `<div class="watch-empty">Takip listesi boş. Günlük işlem tablosunda bir satır için TAKİP butonuna bas.</div>`;
                return;
            }
            box.innerHTML = filtered.map(({slot, idx}) => slot.type === 'crypto' ? omega_BuildWatchCryptoCard(slot, idx) : omega_BuildWatchBetCard(slot, idx)).join('');
        }

        async function omega_RefreshLiveCenter(force=false) {
            await omega_LoadLiveScores(force);
            await omega_RefreshCryptoLive(force);
            omega_RenderLiveWatchCenter();
        }

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
