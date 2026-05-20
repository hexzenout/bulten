// ===============================
// V30 DAILY TRADE CORE
// Günlük işlem tablosu, takip butonu ve V7 TP/SL/LIQ takip geliştirmeleri.
// Bu dosya V30 modülerleştirme adımıdır; davranış değiştirmez.
// ===============================

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
