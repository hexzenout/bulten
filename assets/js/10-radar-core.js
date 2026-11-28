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
            return ["NBA", "EUROLEAGUE", "KBSL", "BSL", "ACB", "LEGA A", "LNB", "BBL", "EUROCUP", "BCL", "VTB", "NCAA", "WNBA", "B.LEAGUE", "P.LEAGUE", "MPBL", "PBA", "NBL", "FIBA", "BSN", "DPB", "BASKET"].some(x => l.toUpperCase().includes(x));
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
            if(s.includes("JAPONYA")) return "jp";
            if(s.includes("AVUSTRALYA")) return "au";
            if(s.includes("TAYVAN")) return "tw";
            if(s.includes("FİLİPİNLER")) return "ph";
            if(s.includes("PORTO RİKO")) return "pr";
            if(s.includes("KOLOMBİYA")) return "co";
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


        function omega_HardHideRollingV493() {
            const rollingBlock = document.getElementById('omega-rolling-block');
            if (rollingBlock) {
                rollingBlock.style.display = 'none';
                rollingBlock.style.visibility = 'hidden';
                rollingBlock.style.height = '0';
                rollingBlock.style.maxHeight = '0';
                rollingBlock.style.overflow = 'hidden';
                rollingBlock.removeAttribute('data-visible');
                rollingBlock.setAttribute('aria-hidden', 'true');
            }
            document.body.classList.remove('omega-tab-rolling', 'rolling-active');
            document.documentElement.classList.remove('rolling-hash-boot');
        }

        function omega_SwitchMainTab(targetModule, clickedElement, updateHistory = true) {
            const keepRollingOpen = (targetModule === 'finance' || targetModule === 'rolling') && /^#(finance|rolling)\/rolling\/\d+/.test(String(location.hash || ''));
            if (!keepRollingOpen) omega_CloseRollingExcel(true);
            omega_CloseChannelManager();
            if (targetModule !== 'rolling') omega_HardHideRollingV493();

            const topMenu = document.getElementById('main-dropdown-nav');
            if(topMenu) topMenu.classList.remove('active-menu');

            if (updateHistory) history.pushState({ tab: targetModule }, '', '#' + targetModule);

            document.body.classList.remove('omega-tab-futbol','omega-tab-basketbol','omega-tab-rolling','omega-tab-kasa-challenge','omega-tab-stream','omega-tab-favs','omega-tab-live','omega-tab-odds','omega-tab-crypto','omega-tab-finance');
            document.body.classList.add('omega-tab-' + targetModule);

            document.querySelectorAll('.nav-link').forEach(i => i.classList.remove('active'));
            if(clickedElement) clickedElement.classList.add('active');

            const radarBlock = document.getElementById('omega-radar-block');
            const favsBlock = document.getElementById('omega-favs-block');
            const streamBlock = document.getElementById('omega-stream-block');
            const liveBlock = document.getElementById('omega-live-block');
            const liveCenterBlock = document.getElementById('omega-live-center-block');
            const rollingBlock = document.getElementById('omega-rolling-block');
            const kasaChallengeBlock = document.getElementById('omega-kasa-challenge-block');
            const cryptoBlock = document.getElementById('omega-crypto-block');
            const financeBlock = document.getElementById('v19-finance-block');
            const oddsBlock = document.getElementById('omega-odds-block');

            if (radarBlock) radarBlock.style.display = 'none';
            if (favsBlock) favsBlock.style.display = 'none';
            if (streamBlock) streamBlock.style.display = 'none';
            if (liveBlock) liveBlock.style.display = 'none';
            if (liveCenterBlock) liveCenterBlock.style.display = 'none';
            if (cryptoBlock) cryptoBlock.style.display = 'none';
            if (oddsBlock) oddsBlock.style.display = 'none';
            if (kasaChallengeBlock && targetModule !== 'kasa-challenge') {
                if (typeof window.omega_DeactivateKasaChallenge === 'function') window.omega_DeactivateKasaChallenge();
                else kasaChallengeBlock.style.display = 'none';
            }
            if (rollingBlock) {
                rollingBlock.style.display = 'none';
                rollingBlock.removeAttribute('data-visible');
                rollingBlock.setAttribute('aria-hidden', 'true');
            }
            if (!keepRollingOpen) document.documentElement.classList.remove('rolling-hash-boot');
            document.body.classList.remove('rolling-active');
            if (financeBlock) financeBlock.classList.remove('active');

            const centerWrapper = document.querySelector('.center-wrapper');
            if(centerWrapper) {
                if(targetModule === 'kasa-challenge') centerWrapper.style.maxWidth = '100%';
                else if(targetModule === 'stream') centerWrapper.style.maxWidth = '1800px';
                else if(targetModule === 'finance' || targetModule === 'rolling') centerWrapper.style.maxWidth = '1700px';
                else if(targetModule === 'crypto' || targetModule === 'odds') centerWrapper.style.maxWidth = '1850px';
                else centerWrapper.style.maxWidth = '1000px';
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

                if (radarBlock) radarBlock.style.display = 'block';
                if (titleElem) {
                    titleElem.innerHTML = targetModule === 'futbol'
                        ? '<span style="color:var(--green)">/ FUTBOL</span>'
                        : '<span style="color:var(--orange)">/ BASKETBOL</span>';
                }
                omega_BuildUIComponents();
                omega_ExecuteRadarFilter();

            } else if(targetModule === 'rolling') {
                _ACTIVE_TAB = 'rolling';
                if (rollingBlock) {
                    rollingBlock.setAttribute('data-visible', 'true');
                    rollingBlock.removeAttribute('aria-hidden');
                    rollingBlock.style.visibility = 'visible';
                    rollingBlock.style.height = 'auto';
                    rollingBlock.style.maxHeight = 'none';
                    rollingBlock.style.overflow = 'visible';
                    rollingBlock.style.display = 'block';
                }
                if (titleElem) titleElem.innerHTML = '<span class="module-title-rolling" style="color:#7E22CE">/ ROLLING</span>';
                if (typeof omega_RenderRollingModule === 'function') omega_RenderRollingModule();

            } else if(targetModule === 'kasa-challenge') {
                _ACTIVE_TAB = 'kasa-challenge';
                if (titleElem) titleElem.innerHTML = '<span class="v508-title-kasa-challenge" style="color:#f97316">/ KASA CHALLENGE</span>';
                if (typeof window.omega_ActivateKasaChallenge === 'function') window.omega_ActivateKasaChallenge();
                else if (kasaChallengeBlock) kasaChallengeBlock.style.display = 'block';

            } else if(targetModule === 'favs') {
                _ACTIVE_TAB = 'favs';
                if (favsBlock) favsBlock.style.display = 'block';
                if (titleElem) titleElem.innerHTML = '<span style="color:var(--red)">/ FAVORİLERİM</span>';
                omega_ExecuteRadarFilter();

            } else if(targetModule === 'stream') {
                _ACTIVE_TAB = 'stream';
                if (streamBlock) streamBlock.style.display = 'block';
                if (titleElem) titleElem.innerHTML = '<span class="module-title-stream" style="color:#3b82f6">/ CANLI YAYIN</span>';
                setTimeout(() => {
                    if (typeof omega_BootStreamV49 === 'function') omega_BootStreamV49(true);
                    else if (typeof omega_BuildStreamMatrix === 'function') omega_BuildStreamMatrix(1);
                }, 40);

            } else if(targetModule === 'crypto') {
                _ACTIVE_TAB = 'crypto';
                if (rollingBlock) {
                    rollingBlock.style.display = 'none';
                    rollingBlock.removeAttribute('data-visible');
                    rollingBlock.setAttribute('aria-hidden', 'true');
                }
                document.body.classList.remove('omega-tab-rolling','rolling-active');
                document.documentElement.classList.remove('rolling-hash-boot');
                if (cryptoBlock) cryptoBlock.style.display = 'block';
                if (titleElem) titleElem.innerHTML = '<span style="color:#f97316">/ KRİPTO TERMİNAL</span>';
                if (typeof window.omega_TVRefreshCryptoChart === 'function') setTimeout(() => window.omega_TVRefreshCryptoChart(true), 80);
                if (typeof window.omega_RefreshCryptoLive === 'function') setTimeout(() => window.omega_RefreshCryptoLive(true), 160);

            } else if(targetModule === 'live') {
                _ACTIVE_TAB = 'live';
                const liveBlock = document.getElementById('omega-live-center-block') || document.getElementById('omega-live-block');
                if (liveBlock) liveBlock.style.display = 'block';
                if (titleElem) titleElem.innerHTML = '<span style="color:#3b82f6">/ CANLI TAKİP</span>';

            } else if(targetModule === 'finance') {
                _ACTIVE_TAB = 'finance';
                if (financeBlock) financeBlock.classList.add('active');
                if (titleElem) titleElem.innerHTML = '<span style="color:var(--green)">/ KASA YÖNETİMİ</span>';
                if (typeof omega_RefreshFinanceDashboard === 'function') omega_RefreshFinanceDashboard();
                if (typeof omega_RenderApexSupremeChart === 'function') setTimeout(omega_RenderApexSupremeChart, 250);
                if (typeof omega_RenderDailyTradeGrid === 'function' || typeof omega_RefreshCryptoLive === 'function') {
                    setTimeout(() => {
                        if (typeof omega_RenderDailyTradeGrid === 'function') omega_RenderDailyTradeGrid();
                        if (typeof omega_RefreshCryptoLive === 'function') omega_RefreshCryptoLive(true);
                    }, 450);
                }
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
                        const hasCustomStream = Boolean(omega_GetMatchStream(mID)?.url);
                        const flagCode = omega_GetFlagCode(m.l);
                        const safeMatchLabel = String(m.m || '').replace(/'/g, "\\'");
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
                                    ${omega_RenderMatchStreamActions(mID, m.m, m.l)}
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
                            const hasCustomStream = Boolean(omega_GetMatchStream(mID)?.url);
                            const safeMatchLabel = String(m.m || '').replace(/'/g, "\\'");
                            finalHtmlBuffer += `
                                <div class="match-row-pro">
                                    <i class="fa-solid fa-star fav-star-box ${isFav?'active':''}" onclick="omega_ToggleFavoriteMatch(event, '${mID}')"></i>
                                    <div class="match-clock-sup">${m.tm}</div>
                                    <div class="match-teams-main">${m.m}</div>
                                    ${omega_RenderMatchStreamActions(mID, m.m, m.l)}
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

        function omega_NormalizeTeamTokens(str) {
            const norm = String(str || '').toLowerCase()
                .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
                .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
                .replace(/[^a-z0-9\s]/g, ' ');
            const stop = new Set(['sk','fc','bc','fk','as','ac','sc','cf','cd','club','spor','basket','basketball','team','vs','canli','live','yayin','maci']);
            return norm.split(/\s+/).filter(w => w.length >= 4 && !stop.has(w));
        }

        function omega_MatchLiveYouTube(matchTitle) {
            const streams = Array.isArray(window.__omegaLiveYtStreams) ? window.__omegaLiveYtStreams : [];
            if (!streams.length) return null;
            const tokens = omega_NormalizeTeamTokens(matchTitle);
            if (!tokens.length) return null;
            for (const s of streams) {
                const titleNorm = omega_NormalizeTeamTokens(s.title).join(' ');
                const hits = tokens.filter(t => titleNorm.includes(t));
                if (hits.length >= 2 || (tokens.length <= 2 && hits.length >= 1 && hits[0].length >= 5)) {
                    return s;
                }
            }
            return null;
        }

        function omega_IsNesineLeague(lig) {
            const u = String(lig || '').toUpperCase();
            if (/TÜRKİYE - SÜPER LİG|PREMIER LEAGUE/.test(u)) return false;
            return /LA LIGA|SERIE A|BUNDESLIGA|LIGUE 1|EREDIVISIE|CHAMPIONSHIP|PORTEKİZ|LIGA PORTUGAL|BELÇİKA|İSKOÇYA|BREZİLYA|ARJANTİN|\bMLS\b|\bNBA\b|EUROLEAGUE|\bNCAA\b|\bACB\b|\bBBL\b|LEGA A|\bLNB\b|\bVTB\b|BASKETBOL SÜPER LİGİ|BSL/.test(u);
        }

        function omega_RenderMatchStreamActions(mID, matchTitle, leagueName) {
            const custom = omega_GetMatchStream(mID);
            const hasCustomStream = Boolean(custom?.url);
            const safeMatchLabel = String(matchTitle || '').replace(/'/g, "\\'");
            // Only show YouTube / TRT / A Spor when an actual live stream matching this match is confirmed!
            const ytMatch = omega_MatchLiveYouTube(matchTitle);
            const showNesine = omega_IsNesineLeague(leagueName);

            const parts = [];
            if (ytMatch) {
                const chName = String(ytMatch.channelName || 'YouTube');
                const isTrt = /TRT|A SPOR|HT SPOR/i.test(chName);
                if (isTrt) {
                    parts.push(`<button type="button" class="btn-match-trt" title="${chName.replace(/"/g,'')} Canlı İzle" onclick="omega_PlayMatchedYt(event, '${ytMatch.embedUrl}')">${chName.slice(0, 10)}</button>`);
                } else {
                    parts.push(`<button type="button" class="btn-match-yt live" title="Canlı Yayın: ${chName.replace(/"/g,'')}" onclick="omega_PlayMatchedYt(event, '${ytMatch.embedUrl}')"><i class="fa-brands fa-youtube"></i><span>${chName.slice(0, 8)}</span></button>`);
                }
            }
            if (showNesine) {
                parts.push(`<button type="button" class="btn-match-nesine" title="Nesine Canlı'da Aç" onclick="omega_OpenNesineMatch(event)"><img src="assets/icons/nesine-logo.jpg" alt="Nesine"></button>`);
            }
            if (hasCustomStream || !parts.length) {
                parts.push(`<button type="button" class="btn-match-watch ${hasCustomStream ? 'has-link' : ''}" title="TV / Canlı Yayın (Sağ tık: link ekle)" oncontextmenu="omega_OpenMatchStreamModal(event, '${mID}', '${safeMatchLabel}');return false;" onclick="omega_WatchMatchStream(event, '${mID}')"><i class="fa-solid fa-tv"></i></button>`);
            }
            return `<div class="match-stream-actions">${parts.join('')}</div>`;
        }

        function omega_PlayMatchedYt(event, embedUrl) {
            if (event) event.stopPropagation();
            if (typeof window.omega_PlayMatchStream === 'function') {
                window.omega_PlayMatchStream(embedUrl, false);
            }
        }

        async function omega_FetchYtLiveApi(query = '') {
            const qParam = query ? `?q=${encodeURIComponent(query)}` : '';
            const endpoints = [`/api/yt-live${qParam}`, `https://thematrika.vercel.app/api/yt-live${qParam}`];
            for (const url of endpoints) {
                try {
                    const r = await fetch(url, { cache: 'no-store' });
                    if (!r.ok) continue;
                    const j = await r.json();
                    if (j && j.ok && Array.isArray(j.streams)) return j.streams;
                } catch (_) {}
            }
            return [];
        }

        async function omega_SearchMatchYt(event, matchTitle) {
            if (event) event.stopPropagation();
            const btn = event?.currentTarget;
            if (btn) btn.style.opacity = '0.5';
            const streams = await omega_FetchYtLiveApi(matchTitle);
            if (btn) btn.style.opacity = '1';
            if (streams.length && typeof window.omega_PlayMatchStream === 'function') {
                window.omega_PlayMatchStream(streams[0].embedUrl, false);
            } else {
                const q = encodeURIComponent(String(matchTitle || '') + ' canlı');
                window.open(`https://www.youtube.com/results?search_query=${q}&sp=EgJAAQ%253D%253D`, '_blank', 'noopener');
            }
        }

        function omega_OpenNesineMatch(event) {
            if (event) event.stopPropagation();
            window.open('https://www.nesine.com/iddaa/canli-bahis', '_blank', 'noopener');
        }

        (function initYtLiveScanner(){
            const refresh = async () => {
                const streams = await omega_FetchYtLiveApi('');
                if (streams.length) {
                    window.__omegaLiveYtStreams = streams;
                    if (typeof omega_ExecuteRadarFilter === 'function') omega_ExecuteRadarFilter();
                }
            };
            setTimeout(refresh, 1500);
            setInterval(refresh, 120000);
        })();

        function omega_GetMatchStreamMap() {
            try { return JSON.parse(localStorage.getItem('v19_match_streams') || '{}') || {}; } catch(_) { return {}; }
        }
        function omega_GetMatchStream(matchID) {
            return omega_GetMatchStreamMap()[matchID] || null;
        }
        function omega_WatchMatchStream(event, matchID) {
            if (event) event.stopPropagation();
            const saved = omega_GetMatchStream(matchID);
            if (saved?.url && typeof window.omega_PlayMatchStream === 'function') {
                window.omega_PlayMatchStream(saved.url, Boolean(saved.external));
                return;
            }
            const fallbackUrl = (typeof _CHANNELS_DB !== 'undefined' && _CHANNELS_DB[0]?.url) || 'https://www.canlitribun939.top/';
            window.open(fallbackUrl, '_blank', 'noopener');
        }
        function omega_OpenMatchStreamModal(event, matchID, matchTitle) {
            if (event) event.stopPropagation();
            let modal = document.getElementById('omega-match-stream-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'omega-match-stream-modal';
                modal.className = 'match-stream-modal-bg';
                modal.innerHTML = `
                    <div class="match-stream-modal-card">
                        <div class="match-stream-modal-head">
                            <b id="ms-modal-title">Maç Yayın Linki</b>
                            <button type="button" id="ms-modal-close">×</button>
                        </div>
                        <input type="text" id="ms-modal-url" class="select-supreme" style="width:100%;min-width:0;" placeholder="https://www.canlitribun939.top/...">
                        <label class="ms-modal-chk"><input type="checkbox" id="ms-modal-ext"> <span>Site içinde açılmazsa doğrudan yeni sekmede aç</span></label>
                        <div class="match-stream-modal-foot">
                            <button type="button" id="ms-modal-clear" class="ms-btn-sec">Temizle</button>
                            <button type="button" id="ms-modal-save" class="ms-btn-pri">Kaydet ve İzle</button>
                        </div>
                    </div>`;
                document.body.appendChild(modal);
                modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
                document.getElementById('ms-modal-close').onclick = () => { modal.style.display = 'none'; };
            }
            const cur = omega_GetMatchStream(matchID);
            document.getElementById('ms-modal-title').textContent = matchTitle || 'Maç Yayın Linki';
            const urlInp = document.getElementById('ms-modal-url');
            const extChk = document.getElementById('ms-modal-ext');
            urlInp.value = cur?.url || '';
            extChk.checked = Boolean(cur?.external);
            modal.style.display = 'flex';
            setTimeout(() => urlInp.focus(), 30);

            document.getElementById('ms-modal-save').onclick = () => {
                const map = omega_GetMatchStreamMap();
                const raw = urlInp.value.trim();
                if (raw) {
                    map[matchID] = { url: raw, external: extChk.checked };
                } else {
                    delete map[matchID];
                }
                localStorage.setItem('v19_match_streams', JSON.stringify(map));
                modal.style.display = 'none';
                omega_ExecuteRadarFilter();
                if (raw && typeof window.omega_PlayMatchStream === 'function') {
                    window.omega_PlayMatchStream(raw, extChk.checked);
                }
            };
            document.getElementById('ms-modal-clear').onclick = () => {
                const map = omega_GetMatchStreamMap();
                delete map[matchID];
                localStorage.setItem('v19_match_streams', JSON.stringify(map));
                modal.style.display = 'none';
                omega_ExecuteRadarFilter();
            };
        }
