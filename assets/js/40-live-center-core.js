// ===============================
// V30 LIVE CENTER CORE
// Canlı Takip Merkezi, live_scores.json okuma ve takip kartları.
// Bu dosya V30 modülerleştirme adımıdır; davranış değiştirmez.
// ===============================

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
