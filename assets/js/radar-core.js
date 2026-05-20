// ===============================
// V30 RADAR CORE
// Futbol/Basketbol bülten, filtre, lig/saat sıralama ve favoriler.
// Bu dosya V30 modülerleştirme adımıdır; davranış değiştirmez.
// ===============================

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
            const keepRollingOpen = targetModule === 'finance' && /^#finance\/rolling\/\d+/.test(String(location.hash || ''));
            if (!keepRollingOpen) omega_CloseRollingExcel();
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
