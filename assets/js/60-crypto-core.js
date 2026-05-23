// ===============================
// V30 CRYPTO CORE
// Kripto Terminal V10/V12/V14/V15 ana fonksiyonları.
// Bu dosya V30 modülerleştirme adımıdır; davranış değiştirmez.
// ===============================

/* ================= V10 MODULE SPLIT + HISTORICAL CRYPTO ENGINE ================= */
        const V10_TIMEFRAMES = [
            {id:'1m', label:'1 dk', binance:'1m', okx:'1m', limit:1000},
            {id:'3m', label:'3 dk', binance:'3m', okx:'3m', limit:1000},
            {id:'5m', label:'5 dk', binance:'5m', okx:'5m', limit:1000},
            {id:'15m', label:'15 dk', binance:'15m', okx:'15m', limit:1000},
            {id:'30m', label:'30 dk', binance:'30m', okx:'30m', limit:1000},
            {id:'1h', label:'1 saat', binance:'1h', okx:'1H', limit:1000},
            {id:'2h', label:'2 saat', binance:'2h', okx:'2H', limit:1000},
            {id:'4h', label:'4 saat', binance:'4h', okx:'4H', limit:1000},
            {id:'8h', label:'8 saat', binance:'8h', okx:'6H', limit:1000},
            {id:'12h', label:'12 saat', binance:'12h', okx:'12H', limit:1000},
            {id:'1d', label:'1 gün', binance:'1d', okx:'1D', limit:1000},
            {id:'3d', label:'3 gün', binance:'3d', okx:'3D', limit:700},
            {id:'1w', label:'1 hafta', binance:'1w', okx:'1W', limit:520},
            {id:'1M', label:'1 ay', binance:'1M', okx:'1M', limit:360}
        ];
        let _V10_TF = localStorage.getItem('v10_crypto_tf') || '1m';
        let _V10_CANDLES = [];
        let _V10_PRICE = null;
        let _V10_TIMER = null;

        function omega_InitV10Timeframes() {
            const box = document.getElementById('crypto-v10-timeframes');
            if(!box) return;
            box.innerHTML = V10_TIMEFRAMES.map(tf => `<button class="tf-v10 ${tf.id===_V10_TF?'active':''}" onclick="omega_V10SetTf('${tf.id}')">${tf.label}</button>`).join('');
        }

        function omega_V10SetTf(tf) {
            _V10_TF = tf;
            localStorage.setItem('v10_crypto_tf', tf);
            omega_InitV10Timeframes();
            omega_V10RefreshCrypto(true);
        }

        function omega_V10GetPlan() {
            const symbol = (document.getElementById('v10-symbol')?.value || 'BTC').trim().toUpperCase();
            const quote = document.getElementById('v10-quote')?.value || 'USDT';
            const exchange = document.getElementById('v10-exchange')?.value || 'binance';
            const side = document.getElementById('v10-side')?.value || 'long';
            const stake = parseFloat(document.getElementById('v10-stake')?.value) || 0;
            const lev = parseFloat(document.getElementById('v10-lev')?.value) || 1;
            const entryRaw = parseFloat(document.getElementById('v10-entry')?.value);
            const entry = entryRaw || _V10_PRICE || 0;
            const liq = parseFloat(document.getElementById('v10-liq')?.value) || 0;
            const stop = parseFloat(document.getElementById('v10-stop')?.value) || 0;
            const tps = [...document.querySelectorAll('.tp-v10-row')].map((row, i) => ({
                index: i + 1,
                price: parseFloat(row.querySelector('.tp-price')?.value) || 0,
                pct: parseFloat(row.querySelector('.tp-pct')?.value) || 0
            })).filter(x => x.price > 0 && x.pct > 0);
            return {symbol, quote, exchange, side, stake, lev, entry, liq, stop, tps};
        }

        function omega_V10Inst(plan) {
            return plan.exchange === 'okx' ? `${plan.symbol}-${plan.quote}` : `${plan.symbol}${plan.quote}`;
        }

        function omega_V10FormatPrice(v) {
            v = Number(v);
            if(!isFinite(v)) return '-';
            if(v >= 1000) return '$' + v.toLocaleString('en-US', {maximumFractionDigits:2});
            if(v >= 1) return '$' + v.toFixed(4);
            return '$' + v.toPrecision(6);
        }

        function omega_V10PnlAt(plan, price, pctClose=100) {
            if(!plan.entry || !price || !plan.stake) return 0;
            const dir = plan.side === 'short' ? -1 : 1;
            const diffPct = ((price - plan.entry) / plan.entry) * dir;
            return plan.stake * plan.lev * diffPct * (pctClose / 100);
        }

        async function omega_V10FetchCandles(plan) {
            const tf = V10_TIMEFRAMES.find(x => x.id === _V10_TF) || V10_TIMEFRAMES[0];
            if(plan.exchange === 'okx') {
                const inst = omega_V10Inst(plan);
                const [tickerRes, candleRes] = await Promise.all([
                    fetch(`https://www.okx.com/api/v5/market/ticker?instId=${encodeURIComponent(inst)}`),
                    fetch(`https://www.okx.com/api/v5/market/candles?instId=${encodeURIComponent(inst)}&bar=${tf.okx}&limit=${Math.min(tf.limit, 300)}`)
                ]);
                const ticker = await tickerRes.json();
                const candles = await candleRes.json();
                const price = Number(ticker?.data?.[0]?.last);
                const rows = (candles?.data || []).map(x => ({
                    time:Number(x[0]), open:Number(x[1]), high:Number(x[2]), low:Number(x[3]), close:Number(x[4])
                })).filter(x => x.close).reverse();
                if(!price || !rows.length) throw new Error('OKX geçmiş veri alınamadı');
                return {price, rows};
            } else {
                const inst = omega_V10Inst(plan);
                const [tickerRes, candleRes] = await Promise.all([
                    fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(inst)}`),
                    fetch(`https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(inst)}&interval=${tf.binance}&limit=${tf.limit}`)
                ]);
                const ticker = await tickerRes.json();
                const candles = await candleRes.json();
                const price = Number(ticker?.lastPrice || ticker?.price);
                const rows = Array.isArray(candles) ? candles.map(x => ({
                    time:Number(x[0]), open:Number(x[1]), high:Number(x[2]), low:Number(x[3]), close:Number(x[4])
                })).filter(x => x.close) : [];
                if(!price || !rows.length) throw new Error('Binance geçmiş veri alınamadı');
                return {price, rows, change24:Number(ticker?.priceChangePercent || 0)};
            }
        }

        async function omega_V10RefreshCrypto(force=false) {
            const status = document.getElementById('crypto-v10-status');
            try {
                if(status) { status.textContent = 'YÜKLENİYOR'; status.className = 'terminal-v10-live-dot'; }
                const plan = omega_V10GetPlan();
                const res = await omega_V10FetchCandles(plan);
                _V10_PRICE = res.price;
                _V10_CANDLES = res.rows;
                const tf = V10_TIMEFRAMES.find(x => x.id === _V10_TF) || V10_TIMEFRAMES[0];
                const title = document.getElementById('crypto-v10-title');
                const sub = document.getElementById('crypto-v10-subtitle');
                const priceEl = document.getElementById('crypto-v10-price');
                const chEl = document.getElementById('crypto-v10-change');
                if(title) title.textContent = omega_V10Inst(plan).replace('-', '');
                if(sub) sub.textContent = `${plan.exchange.toUpperCase()} · ${tf.label} · ${_V10_CANDLES.length} mum`;
                if(priceEl) priceEl.textContent = omega_V10FormatPrice(_V10_PRICE);
                const first = _V10_CANDLES[0]?.close || _V10_PRICE;
                const change = ((_V10_PRICE - first) / first) * 100;
                if(chEl) { chEl.textContent = `${change>=0?'+':''}${change.toFixed(2)}%`; chEl.className = change >= 0 ? 'up' : 'down'; }
                if(status) { status.textContent = 'CANLI'; status.className = 'terminal-v10-live-dot ok'; }
                omega_V10UpdateTpOutputs();
                omega_V10DrawChart();
            } catch(e) {
                if(status) { status.textContent = 'VERİ HATASI'; status.className = 'terminal-v10-live-dot err'; }
                const cap = document.getElementById('crypto-v10-caption');
                if(cap) cap.textContent = e.message || 'Grafik verisi alınamadı.';
            }
        }

        function omega_V10DrawChart() {
            const canvas = document.getElementById('crypto-v10-chart');
            if(!canvas) return;
            const ctx = canvas.getContext('2d');
            const w = canvas.width, h = canvas.height;
            ctx.clearRect(0,0,w,h);
            ctx.fillStyle = '#050505'; ctx.fillRect(0,0,w,h);

            const plan = omega_V10GetPlan();
            const candles = _V10_CANDLES || [];
            const levels = [];
            if(plan.entry) levels.push({v:plan.entry, c:'rgba(251,191,36,.9)', label:'GİRİŞ'});
            if(plan.stop) levels.push({v:plan.stop, c:'rgba(239,68,68,.9)', label:'STOP'});
            if(plan.liq) levels.push({v:plan.liq, c:'rgba(249,115,22,.9)', label:'LİQ'});
            if(_V10_PRICE) levels.push({v:_V10_PRICE, c:'rgba(59,130,246,.95)', label:'CANLI'});
            plan.tps.forEach(tp => levels.push({v:tp.price, c:'rgba(16,185,129,.9)', label:`TP${tp.index}`}));

            const all = [...candles.flatMap(c => [c.high, c.low]), ...levels.map(l=>l.v)].filter(Boolean);
            if(all.length < 2) return;
            const min = Math.min(...all), max = Math.max(...all);
            const pad = (max-min)*0.08 || 1;
            const lo = min - pad, hi = max + pad;
            const yFor = v => h - ((v - lo) / (hi - lo)) * (h - 44) - 22;

            ctx.strokeStyle = 'rgba(255,255,255,.04)';
            ctx.lineWidth = 1;
            for(let i=0;i<6;i++){ const y=22+i*(h-44)/5; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }

            const cw = Math.max(2, (w - 40) / candles.length * 0.58);
            candles.forEach((c,i) => {
                const x = 20 + (i/(candles.length-1 || 1))*(w-40);
                const yO = yFor(c.open), yC = yFor(c.close), yH = yFor(c.high), yL = yFor(c.low);
                const up = c.close >= c.open;
                ctx.strokeStyle = up ? '#10b981' : '#ef4444';
                ctx.fillStyle = up ? 'rgba(16,185,129,.72)' : 'rgba(239,68,68,.72)';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(x,yH); ctx.lineTo(x,yL); ctx.stroke();
                const top = Math.min(yO,yC), bh = Math.max(2, Math.abs(yC-yO));
                ctx.fillRect(x-cw/2, top, cw, bh);
            });

            levels.forEach(l => {
                const y = yFor(l.v);
                ctx.strokeStyle = l.c; ctx.lineWidth = 1.4; ctx.setLineDash([7,5]);
                ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); ctx.setLineDash([]);
                ctx.fillStyle = '#080808'; ctx.fillRect(8, Math.max(6,y-18), 118, 18);
                ctx.fillStyle = l.c; ctx.font = '12px JetBrains Mono, monospace';
                ctx.fillText(`${l.label} ${omega_V10FormatPrice(l.v)}`, 12, Math.max(18,y-5));
            });

            const cap = document.getElementById('crypto-v10-caption');
            if(cap) cap.textContent = `Geçmiş grafik: ${candles.length} mum · Son güncelleme: ${new Date().toLocaleTimeString('tr-TR')}`;
        }

        function omega_V10AddTpRow(price='', pct='25') {
            const box = document.getElementById('tp-v10-rows');
            if(!box) return;
            const idx = box.children.length + 1;
            const div = document.createElement('div');
            div.className = 'tp-v10-row';
            div.innerHTML = `<span>TP${idx}</span><input class="tp-price" type="number" value="${price}" placeholder="Fiyat" step="0.00000001" oninput="omega_V10UpdateTpOutputs()"><input class="tp-pct" type="number" value="${pct}" placeholder="%" step="1" oninput="omega_V10UpdateTpOutputs()"><b class="tp-out">$0.00</b><button onclick="this.closest('.tp-v10-row').remove(); omega_V10UpdateTpOutputs();">×</button>`;
            box.appendChild(div);
            omega_V10UpdateTpOutputs();
        }

        function omega_V10SeedTpRows() {
            const box = document.getElementById('tp-v10-rows');
            if(!box || box.children.length) return;
            omega_V10AddTpRow('', '25');
            omega_V10AddTpRow('', '25');
            omega_V10AddTpRow('', '25');
            omega_V10AddTpRow('', '25');
        }

        function omega_V10UpdateTpOutputs() {
            const plan = omega_V10GetPlan();
            let totalTp = 0;
            document.querySelectorAll('.tp-v10-row').forEach((row, i) => {
                const price = parseFloat(row.querySelector('.tp-price')?.value) || 0;
                const pct = parseFloat(row.querySelector('.tp-pct')?.value) || 0;
                const pnl = price ? omega_V10PnlAt(plan, price, pct) : 0;
                totalTp += pnl;
                const out = row.querySelector('.tp-out');
                if(out) { out.textContent = `${pnl>=0?'+':''}$${pnl.toFixed(2)}`; out.style.color = pnl >= 0 ? 'var(--green)' : 'var(--red)'; }
            });
            const livePnl = _V10_PRICE ? omega_V10PnlAt(plan, _V10_PRICE, 100) : 0;
            const stopPnl = plan.stop ? omega_V10PnlAt(plan, plan.stop, 100) : 0;
            const tpEl = document.getElementById('v10-tp-total');
            const liveEl = document.getElementById('v10-live-pnl');
            const stopEl = document.getElementById('v10-stop-pnl');
            const rrEl = document.getElementById('v10-rr');
            if(liveEl) { liveEl.textContent = `${livePnl>=0?'+':''}$${livePnl.toFixed(2)}`; liveEl.className = livePnl >= 0 ? 'good' : 'bad'; }
            if(stopEl) { stopEl.textContent = `${stopPnl>=0?'+':''}$${stopPnl.toFixed(2)}`; stopEl.className = stopPnl >= 0 ? 'good' : 'bad'; }
            if(tpEl) { tpEl.textContent = `${totalTp>=0?'+':''}$${totalTp.toFixed(2)}`; tpEl.className = totalTp >= 0 ? 'good' : 'bad'; }
            if(rrEl) {
                const risk = Math.abs(stopPnl);
                rrEl.textContent = risk > 0 ? `1:${Math.abs(totalTp/risk).toFixed(2)}` : '-';
            }
            omega_V10DrawChart();
        }

        function omega_V10UseLiveAsEntry() {
            if(!_V10_PRICE) return;
            const el = document.getElementById('v10-entry');
            if(el) el.value = _V10_PRICE;
            omega_V10UpdateTpOutputs();
        }

        function omega_StartV10Timer() {
            if(_V10_TIMER) clearInterval(_V10_TIMER);
            _V10_TIMER = setInterval(() => {
                if(_ACTIVE_TAB === 'crypto') omega_V10RefreshCrypto(false);
            }, 8000);
        }



        /* ================= V12 ADVANCED CHART CONTROLS + ALARMS ================= */
        let _V12_VIEW_START = 0;
        let _V12_VIEW_END = 1;
        let _V12_DRAW_MODE = null;
        let _V12_PENDING_TREND = null;
        let _V12_DRAWINGS = JSON.parse(localStorage.getItem('v12_crypto_drawings') || '[]');
        let _V12_ALARMS = JSON.parse(localStorage.getItem('v12_crypto_alarms') || '[]');
        let _V12_SHOW_MA = localStorage.getItem('v12_show_ma') !== '0';
        let _V12_AUTO_FIT = true;

        function omega_V12SaveDrawings(){ localStorage.setItem('v12_crypto_drawings', JSON.stringify(_V12_DRAWINGS)); }
        function omega_V12SaveAlarms(){ localStorage.setItem('v12_crypto_alarms', JSON.stringify(_V12_ALARMS)); }

        function omega_V12SymbolKey(plan){ return `${plan.exchange}:${plan.symbol}${plan.quote}`.toUpperCase(); }

        function omega_V12VisibleCandles(){
            const candles = _V10_CANDLES || [];
            if(!candles.length) return [];
            const n = candles.length;
            const start = Math.max(0, Math.floor(_V12_VIEW_START * (n-1)));
            const end = Math.min(n, Math.max(start+8, Math.ceil(_V12_VIEW_END * n)));
            return candles.slice(start, end);
        }

        function omega_V12Zoom(factor){
            const center = (_V12_VIEW_START + _V12_VIEW_END) / 2;
            const width = Math.min(1, Math.max(0.06, (_V12_VIEW_END - _V12_VIEW_START) * factor));
            _V12_VIEW_START = Math.max(0, center - width/2);
            _V12_VIEW_END = Math.min(1, center + width/2);
            if(_V12_VIEW_END - _V12_VIEW_START < width){
                if(_V12_VIEW_START === 0) _V12_VIEW_END = Math.min(1, width);
                if(_V12_VIEW_END === 1) _V12_VIEW_START = Math.max(0, 1-width);
            }
            _V12_AUTO_FIT = false;
            omega_V10DrawChart();
        }

        function omega_V12Pan(frac){
            const width = _V12_VIEW_END - _V12_VIEW_START;
            let shift = width * frac;
            let ns = _V12_VIEW_START + shift, ne = _V12_VIEW_END + shift;
            if(ns < 0){ ne -= ns; ns = 0; }
            if(ne > 1){ ns -= (ne-1); ne = 1; }
            _V12_VIEW_START = Math.max(0, ns);
            _V12_VIEW_END = Math.min(1, ne);
            _V12_AUTO_FIT = false;
            omega_V10DrawChart();
        }

        function omega_V12ResetView(){
            _V12_VIEW_START = 0; _V12_VIEW_END = 1; _V12_AUTO_FIT = true; _V12_PENDING_TREND = null;
            omega_V10DrawChart();
        }

        function omega_V12SetDrawMode(mode){
            _V12_DRAW_MODE = _V12_DRAW_MODE === mode ? null : mode;
            _V12_PENDING_TREND = null;
            document.querySelectorAll('.chart-tool-btn').forEach(b=>b.classList.remove('active'));
            const btn = document.getElementById(mode === 'hline' ? 'tool-hline' : 'tool-trend');
            if(_V12_DRAW_MODE && btn) btn.classList.add('active');
            const hint = document.getElementById('crypto-v12-hint');
            if(hint){ hint.textContent = _V12_DRAW_MODE === 'trend' ? 'Trend çizgisi için iki noktaya tıkla.' : (_V12_DRAW_MODE === 'hline' ? 'Yatay fiyat çizgisi için grafiğe tıkla.' : ''); hint.classList.toggle('show', !!_V12_DRAW_MODE); }
        }

        function omega_V12ToggleMA(){
            _V12_SHOW_MA = !_V12_SHOW_MA;
            localStorage.setItem('v12_show_ma', _V12_SHOW_MA ? '1' : '0');
            const b = document.getElementById('tool-ma');
            if(b) b.classList.toggle('active', _V12_SHOW_MA);
            omega_V10DrawChart();
        }

        function omega_V12UndoDrawing(){
            _V12_DRAWINGS.pop(); omega_V12SaveDrawings(); omega_V10DrawChart();
        }

        function omega_V12AttachCanvasEvents(){
            const canvas = document.getElementById('crypto-v10-chart');
            if(!canvas || canvas.dataset.v12Bound) return;
            canvas.dataset.v12Bound = '1';
            canvas.addEventListener('click', (ev)=>{
                if(!_V12_DRAW_MODE) return;
                const rect = canvas.getBoundingClientRect();
                const xPx = (ev.clientX - rect.left) * (canvas.width / rect.width);
                const yPx = (ev.clientY - rect.top) * (canvas.height / rect.height);
                const conv = omega_V12ChartConverters();
                if(!conv) return;
                const price = conv.priceForY(yPx);
                const timeIndex = conv.indexForX(xPx);
                const plan = omega_V10GetPlan();
                const key = omega_V12SymbolKey(plan);
                if(_V12_DRAW_MODE === 'hline'){
                    _V12_DRAWINGS.push({type:'hline', key, price, label:'Çizgi'});
                    omega_V12SaveDrawings();
                    omega_V12SetDrawMode(null);
                    omega_V10DrawChart();
                } else if(_V12_DRAW_MODE === 'trend'){
                    if(!_V12_PENDING_TREND){
                        _V12_PENDING_TREND = {x1:timeIndex, y1:price};
                        const hint = document.getElementById('crypto-v12-hint');
                        if(hint) hint.textContent = 'İkinci noktaya tıkla.';
                    } else {
                        _V12_DRAWINGS.push({type:'trend', key, x1:_V12_PENDING_TREND.x1, y1:_V12_PENDING_TREND.y1, x2:timeIndex, y2:price});
                        _V12_PENDING_TREND = null;
                        omega_V12SaveDrawings();
                        omega_V12SetDrawMode(null);
                        omega_V10DrawChart();
                    }
                }
            });
            canvas.addEventListener('wheel', (ev)=>{ ev.preventDefault(); omega_V12Zoom(ev.deltaY < 0 ? 0.82 : 1.18); }, {passive:false});
        }

        function omega_V12ChartConverters(){
            const canvas = document.getElementById('crypto-v10-chart');
            if(!canvas) return null;
            const w = canvas.width, h = canvas.height;
            const candles = omega_V12VisibleCandles();
            const plan = omega_V10GetPlan();
            const levels = [];
            if(plan.entry) levels.push(plan.entry); if(plan.stop) levels.push(plan.stop); if(plan.liq) levels.push(plan.liq); if(_V10_PRICE) levels.push(_V10_PRICE); plan.tps.forEach(tp=>levels.push(tp.price));
            const all = [...candles.flatMap(c => [c.high,c.low]), ...levels].filter(Boolean);
            if(all.length < 2 || !candles.length) return null;
            const min = Math.min(...all), max = Math.max(...all), pad = (max-min)*0.08 || 1, lo = min-pad, hi=max+pad;
            return {
                yFor:v => h - ((v - lo)/(hi-lo))*(h-44)-22,
                priceForY:y => lo + ((h - y - 22)/(h-44))*(hi-lo),
                xForIndex:i => 20 + (i/(candles.length-1 || 1))*(w-40),
                indexForX:x => Math.round(((x-20)/(w-40))*(candles.length-1 || 1)),
                candles, lo, hi
            };
        }

        function omega_V12DrawMA(ctx, conv){
            if(!_V12_SHOW_MA || !conv || conv.candles.length < 21) return;
            ctx.strokeStyle = 'rgba(251,191,36,.82)'; ctx.lineWidth = 2; ctx.beginPath();
            conv.candles.forEach((c,i)=>{
                if(i < 19) return;
                const avg = conv.candles.slice(i-19, i+1).reduce((s,x)=>s+x.close,0)/20;
                const x = conv.xForIndex(i), y = conv.yFor(avg);
                if(i===19) ctx.moveTo(x,y); else ctx.lineTo(x,y);
            });
            ctx.stroke();
        }

        function omega_V12DrawUserDrawings(ctx, conv){
            if(!conv) return;
            const plan = omega_V10GetPlan(); const key = omega_V12SymbolKey(plan);
            const drawings = _V12_DRAWINGS.filter(d => d.key === key);
            drawings.forEach(d=>{
                ctx.strokeStyle = 'rgba(255,255,255,.72)'; ctx.fillStyle='rgba(255,255,255,.78)'; ctx.lineWidth=1.5; ctx.setLineDash([4,4]);
                if(d.type === 'hline'){
                    const y = conv.yFor(d.price); ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(1200,y); ctx.stroke();
                    ctx.font='12px JetBrains Mono, monospace'; ctx.fillText(`ÇİZİM ${omega_V10FormatPrice(d.price)}`, 1010, y-6);
                } else if(d.type === 'trend'){
                    const x1 = conv.xForIndex(d.x1), y1 = conv.yFor(d.y1), x2 = conv.xForIndex(d.x2), y2 = conv.yFor(d.y2);
                    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
                }
                ctx.setLineDash([]);
            });
        }

        function omega_V12RequestNotify(){
            if(!('Notification' in window)) { omega_ShowFinanceToast && omega_ShowFinanceToast('Bu tarayıcı bildirim desteklemiyor.'); return; }
            Notification.requestPermission().then(p => { if(omega_ShowFinanceToast) omega_ShowFinanceToast(p === 'granted' ? 'Bildirim izni verildi.' : 'Bildirim izni verilmedi.'); });
        }

        function omega_V12AddAlarm(){
            const price = parseFloat(document.getElementById('v12-alarm-price')?.value);
            const dir = document.getElementById('v12-alarm-dir')?.value || 'above';
            const note = (document.getElementById('v12-alarm-note')?.value || '').trim();
            if(!price || price <= 0){ if(omega_ShowFinanceToast) omega_ShowFinanceToast('Alarm için geçerli fiyat gir.'); return; }
            const plan = omega_V10GetPlan();
            _V12_ALARMS.push({id:Date.now(), key:omega_V12SymbolKey(plan), symbol:`${plan.symbol}${plan.quote}`, exchange:plan.exchange, dir, price, note, hit:false, created:new Date().toISOString()});
            omega_V12SaveAlarms(); omega_V12RenderAlarms();
            const pe=document.getElementById('v12-alarm-price'); if(pe) pe.value='';
            if(omega_ShowFinanceToast) omega_ShowFinanceToast('Alarm eklendi.');
        }

        function omega_V12DeleteAlarm(id){ _V12_ALARMS = _V12_ALARMS.filter(a=>a.id!==id); omega_V12SaveAlarms(); omega_V12RenderAlarms(); }
        function omega_V12ClearHitAlarms(){ _V12_ALARMS = _V12_ALARMS.filter(a=>!a.hit); omega_V12SaveAlarms(); omega_V12RenderAlarms(); }

        function omega_V12RenderAlarms(){
            const box = document.getElementById('v12-alarm-list'); if(!box) return;
            const plan = omega_V10GetPlan(); const key = omega_V12SymbolKey(plan);
            const list = _V12_ALARMS.filter(a=>a.key===key);
            if(!list.length){ box.innerHTML = '<div class="alarm-v12-row"><span>Bu sembol için alarm yok.</span><span></span><span></span></div>'; return; }
            box.innerHTML = list.map(a=>`<div class="alarm-v12-row ${a.hit?'hit':''}"><div><b>${a.dir==='above'?'ÜST':'ALT'} ${omega_V10FormatPrice(a.price)}</b><br><span>${a.note || a.symbol} ${a.hit?'· ÇALDI':'· aktif'}</span></div><span>${a.exchange.toUpperCase()}</span><button onclick="omega_V12DeleteAlarm(${a.id})">SİL</button></div>`).join('');
        }

        function omega_V12CheckAlarms(){
            if(!_V10_PRICE) return;
            const plan = omega_V10GetPlan(); const key = omega_V12SymbolKey(plan);
            let changed=false;
            _V12_ALARMS.forEach(a=>{
                if(a.key !== key || a.hit) return;
                const hit = a.dir === 'above' ? _V10_PRICE >= a.price : _V10_PRICE <= a.price;
                if(hit){
                    a.hit = true; a.hitAt = new Date().toISOString(); changed=true;
                    const msg = `${a.symbol} ${a.dir==='above'?'üstüne çıktı':'altına düştü'}: ${omega_V10FormatPrice(a.price)}`;
                    if(omega_ShowFinanceToast) omega_ShowFinanceToast('ALARM: ' + msg);
                    if('Notification' in window && Notification.permission === 'granted') new Notification('Kasa Terminal Alarm', {body: msg});
                }
            });
            if(changed){ omega_V12SaveAlarms(); omega_V12RenderAlarms(); }
        }

        const _V10DrawChartOriginal = omega_V10DrawChart;
        omega_V10DrawChart = function(){
            const canvas = document.getElementById('crypto-v10-chart');
            if(!canvas) return;
            const ctx = canvas.getContext('2d');
            const w = canvas.width, h = canvas.height;
            ctx.clearRect(0,0,w,h);
            ctx.fillStyle = '#050505'; ctx.fillRect(0,0,w,h);
            const plan = omega_V10GetPlan();
            const candles = omega_V12VisibleCandles();
            const levels = [];
            if(plan.entry) levels.push({v:plan.entry, c:'rgba(251,191,36,.9)', label:'GİRİŞ'});
            if(plan.stop) levels.push({v:plan.stop, c:'rgba(239,68,68,.9)', label:'STOP'});
            if(plan.liq) levels.push({v:plan.liq, c:'rgba(249,115,22,.9)', label:'LİQ'});
            if(_V10_PRICE) levels.push({v:_V10_PRICE, c:'rgba(59,130,246,.95)', label:'CANLI'});
            plan.tps.forEach(tp => levels.push({v:tp.price, c:'rgba(16,185,129,.9)', label:`TP${tp.index}`}));
            const all = [...candles.flatMap(c => [c.high,c.low]), ...levels.map(l=>l.v)].filter(Boolean);
            if(all.length < 2) return;
            const min = Math.min(...all), max = Math.max(...all);
            const pad = (max-min)*0.08 || 1; const lo = min-pad, hi=max+pad;
            const yFor = v => h - ((v-lo)/(hi-lo))*(h-44)-22;
            ctx.strokeStyle='rgba(255,255,255,.04)'; ctx.lineWidth=1;
            for(let i=0;i<6;i++){ const y=22+i*(h-44)/5; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
            const cw = Math.max(2, (w-40)/(candles.length||1)*0.58);
            candles.forEach((c,i)=>{
                const x=20+(i/(candles.length-1||1))*(w-40);
                const yO=yFor(c.open), yC=yFor(c.close), yH=yFor(c.high), yL=yFor(c.low);
                const up=c.close>=c.open; ctx.strokeStyle=up?'#10b981':'#ef4444'; ctx.fillStyle=up?'rgba(16,185,129,.72)':'rgba(239,68,68,.72)';
                ctx.beginPath(); ctx.moveTo(x,yH); ctx.lineTo(x,yL); ctx.stroke();
                ctx.fillRect(x-cw/2, Math.min(yO,yC), cw, Math.max(2,Math.abs(yC-yO)));
            });
            const conv = omega_V12ChartConverters();
            omega_V12DrawMA(ctx, conv);
            omega_V12DrawUserDrawings(ctx, conv);
            levels.forEach(l=>{
                const y=yFor(l.v); ctx.strokeStyle=l.c; ctx.lineWidth=1.4; ctx.setLineDash([7,5]); ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); ctx.setLineDash([]);
                ctx.fillStyle='#080808'; ctx.fillRect(8, Math.max(6,y-18), 132, 18); ctx.fillStyle=l.c; ctx.font='12px JetBrains Mono, monospace'; ctx.fillText(`${l.label} ${omega_V10FormatPrice(l.v)}`,12,Math.max(18,y-5));
            });
            const cap=document.getElementById('crypto-v10-caption'); if(cap) cap.textContent=`Grafik: ${candles.length}/${(_V10_CANDLES||[]).length} mum · Zoom tekerlekle, çizim araçları üst menüde · ${new Date().toLocaleTimeString('tr-TR')}`;
        };

        const _V10RefreshOriginal = omega_V10RefreshCrypto;
        omega_V10RefreshCrypto = async function(force=false){
            await _V10RefreshOriginal(force);
            if(force || _V12_AUTO_FIT){ _V12_VIEW_START = 0; _V12_VIEW_END = 1; }
            omega_V12AttachCanvasEvents();
            omega_V12RenderAlarms();
            omega_V12CheckAlarms();
            const ma = document.getElementById('tool-ma'); if(ma) ma.classList.toggle('active', _V12_SHOW_MA);
            omega_V10DrawChart();
        };

        function omega_RenderLivePageMirror() {
            const target = document.getElementById('live-watch-list-page');
            const source = document.getElementById('live-watch-list');
            if(target && source) target.innerHTML = source.innerHTML;
            const slots = omega_GetTodaySlots ? omega_GetTodaySlots() : [];
            const cryptoCount = slots.filter(s => s.track && s.type === 'crypto').length;
            const betCount = slots.filter(s => s.track && s.type !== 'crypto').length;
            const a = document.getElementById('live-page-crypto-count');
            const b = document.getElementById('live-page-bet-count');
            if(a) a.textContent = cryptoCount;
            if(b) b.textContent = betCount;
        }

        const _omega_old_switch_v10 = omega_SwitchMainTab;
        omega_SwitchMainTab = function(targetModule, clickedElement, updateHistory = true) {
            if(targetModule !== 'live' && targetModule !== 'crypto') {
                const liveBlock = document.getElementById('omega-live-block');
                const cryptoBlock = document.getElementById('omega-crypto-block');
                if(liveBlock) liveBlock.style.display = 'none';
                if(cryptoBlock) cryptoBlock.style.display = 'none';
                return _omega_old_switch_v10(targetModule, clickedElement, updateHistory);
            }

            omega_CloseRollingExcel();
            omega_CloseChannelManager();
            const topMenu = document.getElementById('main-dropdown-nav');
            if(topMenu) topMenu.classList.remove('active-menu');
            if(updateHistory) history.pushState({ tab: targetModule }, '', '#' + targetModule);
            document.querySelectorAll('.nav-link').forEach(i => i.classList.remove('active'));
            if(clickedElement) clickedElement.classList.add('active');

            ['omega-radar-block','omega-favs-block','omega-stream-block','omega-live-block','omega-crypto-block'].forEach(id => {
                const el = document.getElementById(id);
                if(el) el.style.display = 'none';
            });
            const fin = document.getElementById('v19-finance-block');
            if(fin) fin.classList.remove('active');

            const centerWrapper = document.querySelector('.center-wrapper');
            if(centerWrapper) centerWrapper.style.maxWidth = targetModule === 'crypto' ? '1800px' : '1500px';
            const titleElem = document.getElementById('active-module-name');

            if(targetModule === 'live') {
                _ACTIVE_TAB = 'live';
                const liveBlock = document.getElementById('omega-live-block');
                if(liveBlock) liveBlock.style.display = 'block';
                if(titleElem) titleElem.innerHTML = '<span style="color:var(--blue-accent)">/ CANLI TAKİP</span>';
                omega_RefreshLiveCenter(true);
                setTimeout(omega_RenderLivePageMirror, 300);
            } else if(targetModule === 'crypto') {
                _ACTIVE_TAB = 'crypto';
                const cryptoBlock = document.getElementById('omega-crypto-block');
                if(cryptoBlock) cryptoBlock.style.display = 'block';
                if(titleElem) titleElem.innerHTML = '<span style="color:#f97316">/ KRİPTO TERMİNAL</span>';
                omega_InitV10Timeframes();
                omega_V10SeedTpRows();
                omega_V10RefreshCrypto(true);
                omega_StartV10Timer();
            }
        };

        const _omega_old_render_live_v10 = omega_RenderLiveWatchCenter;
        omega_RenderLiveWatchCenter = function() {
            _omega_old_render_live_v10();
            setTimeout(omega_RenderLivePageMirror, 0);
        };

        window.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                omega_InitV10Timeframes();
                omega_V10SeedTpRows();
                ['v10-exchange','v10-quote','v10-symbol','v10-side','v10-stake','v10-lev','v10-entry','v10-liq','v10-stop'].forEach(id => {
                    const el = document.getElementById(id);
                    if(el) el.addEventListener('change', () => omega_V10RefreshCrypto(true));
                    if(el) el.addEventListener('input', () => omega_V10UpdateTpOutputs());
                });
                omega_StartV10Timer();
            }, 600);
        });



        /* ================= V13 GRAPH AXIS + CLICK ALARM + CLEAN TOOLBAR ================= */
        let _V13_CROSSHAIR = null;

        function omega_V13FormatAxisTime(ts){
            const d = new Date(ts);
            const tf = _V10_TF || '1m';
            if(tf === '1M') return d.toLocaleDateString('tr-TR', {month:'short', year:'2-digit'});
            if(tf.endsWith('d') || tf.endsWith('w')) return d.toLocaleDateString('tr-TR', {day:'2-digit', month:'short', year:'2-digit'});
            return d.toLocaleString('tr-TR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'});
        }

        function omega_V13SetAlarmAtLive(){
            if(!_V10_PRICE){ if(omega_ShowFinanceToast) omega_ShowFinanceToast('Canlı fiyat henüz yok.'); return; }
            const priceEl = document.getElementById('v12-alarm-price');
            const dirEl = document.getElementById('v12-alarm-dir');
            const noteEl = document.getElementById('v12-alarm-note');
            if(priceEl) priceEl.value = _V10_PRICE;
            if(dirEl) dirEl.value = 'above';
            if(noteEl && !noteEl.value) noteEl.value = 'Canlı fiyat alarmı';
            omega_V12AddAlarm();
        }

        const _omega_V12SetDrawMode_v13_base = omega_V12SetDrawMode;
        omega_V12SetDrawMode = function(mode){
            _V12_DRAW_MODE = _V12_DRAW_MODE === mode ? null : mode;
            _V12_PENDING_TREND = null;
            document.querySelectorAll('.chart-tool-btn').forEach(b=>b.classList.remove('active'));
            let btnId = null;
            if(_V12_DRAW_MODE === 'hline') btnId = 'tool-hline';
            if(_V12_DRAW_MODE === 'trend') btnId = 'tool-trend';
            if(_V12_DRAW_MODE === 'alarm') btnId = 'tool-alarm';
            const btn = btnId ? document.getElementById(btnId) : null;
            if(_V12_DRAW_MODE && btn) btn.classList.add('active');
            const hint = document.getElementById('crypto-v12-hint');
            if(hint){
                let txt = '';
                if(_V12_DRAW_MODE === 'trend') txt = 'Trend çizgisi için iki noktaya tıkla.';
                if(_V12_DRAW_MODE === 'hline') txt = 'Fiyat çizgisi için grafikte bir seviyeye tıkla.';
                if(_V12_DRAW_MODE === 'alarm') txt = 'Alarm kurmak istediğin fiyat seviyesine tıkla. Yön otomatik seçilecek.';
                hint.textContent = txt;
                hint.classList.toggle('show', !!_V12_DRAW_MODE);
            }
        };

        const _omega_V12AttachCanvasEvents_v13_base = omega_V12AttachCanvasEvents;
        omega_V12AttachCanvasEvents = function(){
            const canvas = document.getElementById('crypto-v10-chart');
            if(!canvas || canvas.dataset.v13Bound) return;
            canvas.dataset.v13Bound = '1';
            canvas.addEventListener('click', (ev)=>{
                if(!_V12_DRAW_MODE) return;
                const rect = canvas.getBoundingClientRect();
                const xPx = (ev.clientX - rect.left) * (canvas.width / rect.width);
                const yPx = (ev.clientY - rect.top) * (canvas.height / rect.height);
                const conv = omega_V12ChartConverters();
                if(!conv) return;
                const price = conv.priceForY(yPx);
                const timeIndex = conv.indexForX(xPx);
                const plan = omega_V10GetPlan();
                const key = omega_V12SymbolKey(plan);
                if(_V12_DRAW_MODE === 'alarm'){
                    const dir = (_V10_PRICE && price > _V10_PRICE) ? 'above' : 'below';
                    _V12_ALARMS.push({id:Date.now(), key, symbol:`${plan.symbol}${plan.quote}`, exchange:plan.exchange, dir, price, note:'Grafikten alarm', hit:false, created:new Date().toISOString()});
                    omega_V12SaveAlarms();
                    omega_V12RenderAlarms();
                    omega_V12SetDrawMode(null);
                    omega_V10DrawChart();
                    if(omega_ShowFinanceToast) omega_ShowFinanceToast(`Grafikten alarm eklendi: ${omega_V10FormatPrice(price)}`);
                    return;
                }
                if(_V12_DRAW_MODE === 'hline'){
                    _V12_DRAWINGS.push({type:'hline', key, price, label:'Çizgi'});
                    omega_V12SaveDrawings();
                    omega_V12SetDrawMode(null);
                    omega_V10DrawChart();
                } else if(_V12_DRAW_MODE === 'trend'){
                    if(!_V12_PENDING_TREND){
                        _V12_PENDING_TREND = {x1:timeIndex, y1:price};
                        const hint = document.getElementById('crypto-v12-hint');
                        if(hint) hint.textContent = 'İkinci noktaya tıkla.';
                    } else {
                        _V12_DRAWINGS.push({type:'trend', key, x1:_V12_PENDING_TREND.x1, y1:_V12_PENDING_TREND.y1, x2:timeIndex, y2:price});
                        _V12_PENDING_TREND = null;
                        omega_V12SaveDrawings();
                        omega_V12SetDrawMode(null);
                        omega_V10DrawChart();
                    }
                }
            });
            canvas.addEventListener('mousemove', (ev)=>{
                const rect = canvas.getBoundingClientRect();
                _V13_CROSSHAIR = {x:(ev.clientX - rect.left) * (canvas.width / rect.width), y:(ev.clientY - rect.top) * (canvas.height / rect.height)};
                omega_V10DrawChart();
            });
            canvas.addEventListener('mouseleave', ()=>{ _V13_CROSSHAIR = null; omega_V10DrawChart(); });
            canvas.addEventListener('wheel', (ev)=>{ ev.preventDefault(); omega_V12Zoom(ev.deltaY < 0 ? 0.82 : 1.18); }, {passive:false});
        };

        omega_V12RenderAlarms = function(){
            const box = document.getElementById('v12-alarm-list'); if(!box) return;
            const plan = omega_V10GetPlan(); const key = omega_V12SymbolKey(plan);
            const list = _V12_ALARMS.filter(a=>a.key===key).sort((a,b)=>a.price-b.price);
            if(!list.length){ box.innerHTML = '<div class="alarm-v12-row"><span>Bu sembol için alarm yok. Manuel ekle veya Grafikten Alarm butonunu kullan.</span><span></span><span></span></div>'; return; }
            box.innerHTML = list.map(a=>`<div class="alarm-v12-row ${a.hit?'hit':''}"><div><b>${a.dir==='above'?'ÜSTÜNE ÇIKARSA':'ALTINA DÜŞERSE'} ${omega_V10FormatPrice(a.price)}</b><br><span>${a.note || a.symbol}</span></div><span class="alarm-status">${a.hit?'ÇALDI':'AKTİF'}</span><button onclick="omega_V12DeleteAlarm(${a.id})">SİL</button></div>`).join('');
        };

        omega_V10DrawChart = function(){
            const canvas = document.getElementById('crypto-v10-chart');
            if(!canvas) return;
            const ctx = canvas.getContext('2d');
            const w = canvas.width, h = canvas.height;
            ctx.clearRect(0,0,w,h);
            ctx.fillStyle = '#050505'; ctx.fillRect(0,0,w,h);
            const plan = omega_V10GetPlan();
            const candles = omega_V12VisibleCandles();
            const levels = [];
            if(plan.entry) levels.push({v:plan.entry, c:'rgba(251,191,36,.95)', label:'GİRİŞ'});
            if(plan.stop) levels.push({v:plan.stop, c:'rgba(239,68,68,.95)', label:'STOP'});
            if(plan.liq) levels.push({v:plan.liq, c:'rgba(249,115,22,.95)', label:'LİQ'});
            if(_V10_PRICE) levels.push({v:_V10_PRICE, c:'rgba(59,130,246,.98)', label:'CANLI'});
            plan.tps.forEach(tp => levels.push({v:tp.price, c:'rgba(16,185,129,.95)', label:`TP${tp.index}`}));
            const all = [...candles.flatMap(c => [c.high,c.low]), ...levels.map(l=>l.v)].filter(Boolean);
            if(all.length < 2){
                ctx.fillStyle='#aaa'; ctx.font='18px Inter, sans-serif'; ctx.fillText('Grafik verisi bekleniyor...', 32, 54);
                return;
            }
            const min = Math.min(...all), max = Math.max(...all);
            const pad = (max-min)*0.08 || 1; const lo = min-pad, hi=max+pad;
            const left = 58, right = 96, top = 24, bottom = 52;
            const plotW = w-left-right, plotH = h-top-bottom;
            const yFor = v => top + (hi-v)/(hi-lo)*plotH;
            const xFor = i => left + (i/(candles.length-1||1))*plotW;
            // background grid + price axis
            ctx.strokeStyle='rgba(255,255,255,.055)'; ctx.lineWidth=1; ctx.fillStyle='rgba(255,255,255,.55)'; ctx.font='12px JetBrains Mono, monospace';
            for(let i=0;i<6;i++){
                const y=top+i*plotH/5; const val=hi-(i/5)*(hi-lo);
                ctx.beginPath(); ctx.moveTo(left,y); ctx.lineTo(w-right,y); ctx.stroke();
                ctx.fillText(omega_V10FormatPrice(val), w-right+10, y+4);
            }
            // candles
            const cw = Math.max(2, plotW/(candles.length||1)*0.58);
            candles.forEach((c,i)=>{
                const x=xFor(i);
                const yO=yFor(c.open), yC=yFor(c.close), yH=yFor(c.high), yL=yFor(c.low);
                const up=c.close>=c.open; ctx.strokeStyle=up?'#10b981':'#ef4444'; ctx.fillStyle=up?'rgba(16,185,129,.76)':'rgba(239,68,68,.76)';
                ctx.beginPath(); ctx.moveTo(x,yH); ctx.lineTo(x,yL); ctx.stroke();
                ctx.fillRect(x-cw/2, Math.min(yO,yC), cw, Math.max(2,Math.abs(yC-yO)));
            });
            // time axis
            const labelCount = Math.min(7, candles.length);
            ctx.strokeStyle='rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(left,h-bottom+6); ctx.lineTo(w-right,h-bottom+6); ctx.stroke();
            ctx.fillStyle='rgba(255,255,255,.62)'; ctx.font='12px JetBrains Mono, monospace';
            for(let i=0;i<labelCount;i++){
                const idx = Math.round(i*(candles.length-1)/(labelCount-1||1));
                const x = xFor(idx); const label = omega_V13FormatAxisTime(candles[idx].time);
                ctx.fillText(label, Math.max(8, Math.min(w-right-92, x-42)), h-19);
            }
            const conv = omega_V12ChartConverters();
            omega_V12DrawMA(ctx, conv);
            omega_V12DrawUserDrawings(ctx, conv);
            // saved alarms as subtle lines
            const key = omega_V12SymbolKey(plan);
            _V12_ALARMS.filter(a=>a.key===key && !a.hit).forEach(a=>{
                const y=yFor(a.price); ctx.strokeStyle='rgba(251,191,36,.42)'; ctx.lineWidth=1; ctx.setLineDash([2,5]); ctx.beginPath(); ctx.moveTo(left,y); ctx.lineTo(w-right,y); ctx.stroke(); ctx.setLineDash([]);
                ctx.fillStyle='rgba(251,191,36,.82)'; ctx.font='11px JetBrains Mono, monospace'; ctx.fillText(`ALARM ${a.dir==='above'?'↑':'↓'} ${omega_V10FormatPrice(a.price)}`, left+8, y-5);
            });
            levels.forEach(l=>{
                const y=yFor(l.v); ctx.strokeStyle=l.c; ctx.lineWidth=1.5; ctx.setLineDash([7,5]); ctx.beginPath(); ctx.moveTo(left,y); ctx.lineTo(w-right,y); ctx.stroke(); ctx.setLineDash([]);
                ctx.fillStyle='#080808'; ctx.fillRect(left+6, Math.max(6,y-18), 150, 20); ctx.fillStyle=l.c; ctx.font='12px JetBrains Mono, monospace'; ctx.fillText(`${l.label} ${omega_V10FormatPrice(l.v)}`,left+11,Math.max(20,y-4));
            });
            if(_V13_CROSSHAIR){
                const x = Math.max(left, Math.min(w-right, _V13_CROSSHAIR.x));
                const y = Math.max(top, Math.min(h-bottom, _V13_CROSSHAIR.y));
                const idx = Math.round(((x-left)/plotW)*(candles.length-1||1));
                const price = hi - ((y-top)/plotH)*(hi-lo);
                ctx.strokeStyle='rgba(255,255,255,.28)'; ctx.lineWidth=1; ctx.setLineDash([4,4]);
                ctx.beginPath(); ctx.moveTo(left,y); ctx.lineTo(w-right,y); ctx.moveTo(x,top); ctx.lineTo(x,h-bottom); ctx.stroke(); ctx.setLineDash([]);
                ctx.fillStyle='rgba(0,0,0,.88)'; ctx.fillRect(x+10> w-250 ? x-230 : x+10, y-42<10 ? y+12 : y-42, 220, 34);
                ctx.fillStyle='#fff'; ctx.font='12px JetBrains Mono, monospace';
                const label = `${omega_V13FormatAxisTime(candles[idx]?.time || Date.now())}  ${omega_V10FormatPrice(price)}`;
                ctx.fillText(label, x+18> w-240 ? x-222 : x+18, y-20<28 ? y+34 : y-20);
            }
            const cap=document.getElementById('crypto-v10-caption');
            if(cap) cap.innerHTML=`<span>Grafik: ${candles.length}/${(_V10_CANDLES||[]).length} mum · Zaman: ${V10_TIMEFRAMES.find(x=>x.id===_V10_TF)?.label || _V10_TF}</span><span>Mouse: fiyat/saat · Tekerlek: zoom · Grafikten alarm: butona bas, seviyeye tıkla</span>`;
        };

        setTimeout(()=>{ omega_V12AttachCanvasEvents(); omega_V12RenderAlarms(); }, 900);


        /* ================= V14 CHART FIXES: SOLID TRENDS, TRASH, DEEP HISTORY, HASH FIX ================= */
        let _V14_TREND_COLOR = 'green';

        function omega_V14SetTrendTool(color){
            _V14_TREND_COLOR = color || 'green';
            omega_V12SetDrawMode('trend');
            document.querySelectorAll('#tool-trend-green,#tool-trend-red').forEach(b=>b.classList.remove('active'));
            const btn = document.getElementById(color === 'red' ? 'tool-trend-red' : 'tool-trend-green');
            if(_V12_DRAW_MODE === 'trend' && btn) btn.classList.add('active');
        }

        const _omega_v14_old_set_draw_mode = omega_V12SetDrawMode;
        omega_V12SetDrawMode = function(mode){
            _V12_DRAW_MODE = _V12_DRAW_MODE === mode ? null : mode;
            _V12_PENDING_TREND = null;
            document.querySelectorAll('.chart-tool-btn').forEach(b=>b.classList.remove('active'));
            let btnId = null;
            if(_V12_DRAW_MODE === 'alarm') btnId = 'tool-alarm';
            if(_V12_DRAW_MODE === 'hline') btnId = 'tool-hline';
            if(_V12_DRAW_MODE === 'trend') btnId = _V14_TREND_COLOR === 'red' ? 'tool-trend-red' : 'tool-trend-green';
            if(_V12_DRAW_MODE && btnId){ const b=document.getElementById(btnId); if(b) b.classList.add('active'); }
            const hint = document.getElementById('crypto-v12-hint');
            if(hint){
                let txt = '';
                if(_V12_DRAW_MODE === 'alarm') txt = 'Alarm kurmak istediğin fiyat seviyesine tıkla. Yön otomatik seçilecek.';
                if(_V12_DRAW_MODE === 'hline') txt = 'Yatay fiyat çizgisi için grafikte bir seviyeye tıkla.';
                if(_V12_DRAW_MODE === 'trend') txt = (_V14_TREND_COLOR === 'red' ? 'Kırmızı' : 'Yeşil') + ' trend çizgisi için iki noktaya tıkla.';
                hint.textContent = txt;
                hint.classList.toggle('show', !!_V12_DRAW_MODE);
            }
        };

        const _omega_v14_old_save_drawings = omega_V12SaveDrawings;
        omega_V12SaveDrawings = function(){
            _omega_v14_old_save_drawings();
            omega_V14RenderDrawingsPanel();
        };

        function omega_V14DeleteDrawing(id){
            _V12_DRAWINGS = _V12_DRAWINGS.filter(d => d.id !== id);
            omega_V12SaveDrawings();
            omega_V10DrawChart();
        }

        function omega_V14ClearDrawingsForSymbol(){
            const plan = omega_V10GetPlan();
            const key = omega_V12SymbolKey(plan);
            _V12_DRAWINGS = _V12_DRAWINGS.filter(d => d.key !== key);
            omega_V12SaveDrawings();
            omega_V10DrawChart();
            if(omega_ShowFinanceToast) omega_ShowFinanceToast('Bu semboldeki tüm çizimler silindi.');
        }

        function omega_V14RenderDrawingsPanel(){
            const box = document.getElementById('drawing-v14-panel');
            if(!box) return;
            const plan = omega_V10GetPlan();
            const key = omega_V12SymbolKey(plan);
            const rows = _V12_DRAWINGS.filter(d => d.key === key);
            if(!rows.length){ box.innerHTML=''; return; }
            box.innerHTML = rows.map((d,idx)=>{
                if(!d.id) d.id = Date.now() + idx;
                const cls = d.type === 'hline' ? 'hline' : (d.color === 'red' ? 'red' : 'green');
                const title = d.type === 'hline' ? 'Fiyat çizgisi' : `${d.color === 'red' ? 'Kırmızı' : 'Yeşil'} trend çizgisi`;
                const desc = d.type === 'hline' ? omega_V10FormatPrice(d.price) : `${omega_V10FormatPrice(d.y1)} → ${omega_V10FormatPrice(d.y2)}`;
                return `<div class="drawing-v14-row ${cls}"><div><b>${title}</b><br><span>${desc}</span></div><button onclick="omega_V14DeleteDrawing(${d.id})"><i class="fa-solid fa-trash"></i> Sil</button></div>`;
            }).join('');
            _omega_v14_old_save_drawings();
        }

        // Stronger visible candle/drawing renderer
        omega_V12DrawUserDrawings = function(ctx, conv){
            if(!conv) return;
            const plan = omega_V10GetPlan(); const key = omega_V12SymbolKey(plan);
            const drawings = _V12_DRAWINGS.filter(d => d.key === key);
            drawings.forEach(d=>{
                if(!d.id) d.id = Date.now() + Math.floor(Math.random()*1000);
                const col = d.type === 'hline' ? 'rgba(245,245,245,.90)' : (d.color === 'red' ? '#ef4444' : '#10b981');
                ctx.strokeStyle = col; ctx.fillStyle=col; ctx.lineWidth=d.type === 'trend' ? 4 : 2.5; ctx.setLineDash([]);
                if(d.type === 'hline'){
                    const y = conv.yFor(d.price); ctx.beginPath(); ctx.moveTo(58,y); ctx.lineTo(1104,y); ctx.stroke();
                    ctx.font='13px JetBrains Mono, monospace'; ctx.fillText(`ÇİZGİ ${omega_V10FormatPrice(d.price)}`, 74, y-7);
                } else if(d.type === 'trend'){
                    const x1 = conv.xForIndex(d.x1), y1 = conv.yFor(d.y1), x2 = conv.xForIndex(d.x2), y2 = conv.yFor(d.y2);
                    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
                    ctx.beginPath(); ctx.arc(x1,y1,4,0,Math.PI*2); ctx.arc(x2,y2,4,0,Math.PI*2); ctx.fill();
                }
            });
            ctx.setLineDash([]);
            omega_V14RenderDrawingsPanel();
        };

        // New canvas binding with colored trends + alarm from chart. Clone once to remove older click listeners.
        function omega_V14BindCanvasEvents(){
            const oldCanvas = document.getElementById('crypto-v10-chart');
            if(!oldCanvas || oldCanvas.dataset.v14Bound) return;
            const canvas = oldCanvas.cloneNode(true);
            oldCanvas.parentNode.replaceChild(canvas, oldCanvas);
            canvas.dataset.v14Bound = '1';
            canvas.addEventListener('click', (ev)=>{
                if(!_V12_DRAW_MODE) return;
                const rect = canvas.getBoundingClientRect();
                const xPx = (ev.clientX - rect.left) * (canvas.width / rect.width);
                const yPx = (ev.clientY - rect.top) * (canvas.height / rect.height);
                const conv = omega_V12ChartConverters();
                if(!conv) return;
                const price = conv.priceForY(yPx);
                const timeIndex = conv.indexForX(xPx);
                const plan = omega_V10GetPlan();
                const key = omega_V12SymbolKey(plan);
                if(_V12_DRAW_MODE === 'alarm'){
                    const dir = (_V10_PRICE && price > _V10_PRICE) ? 'above' : 'below';
                    _V12_ALARMS.push({id:Date.now(), key, symbol:`${plan.symbol}${plan.quote}`, exchange:plan.exchange, dir, price, note:'Grafikten alarm', hit:false, created:new Date().toISOString()});
                    omega_V12SaveAlarms(); omega_V12RenderAlarms(); omega_V12SetDrawMode(null); omega_V10DrawChart();
                    if(omega_ShowFinanceToast) omega_ShowFinanceToast(`Grafikten alarm eklendi: ${omega_V10FormatPrice(price)}`);
                    return;
                }
                if(_V12_DRAW_MODE === 'hline'){
                    _V12_DRAWINGS.push({id:Date.now(), type:'hline', key, price, label:'Çizgi'});
                    omega_V12SaveDrawings(); omega_V12SetDrawMode(null); omega_V10DrawChart();
                } else if(_V12_DRAW_MODE === 'trend'){
                    if(!_V12_PENDING_TREND){
                        _V12_PENDING_TREND = {x1:timeIndex, y1:price};
                        const hint = document.getElementById('crypto-v12-hint');
                        if(hint) hint.textContent = 'İkinci noktaya tıkla.';
                    } else {
                        _V12_DRAWINGS.push({id:Date.now(), type:'trend', key, color:_V14_TREND_COLOR, x1:_V12_PENDING_TREND.x1, y1:_V12_PENDING_TREND.y1, x2:timeIndex, y2:price});
                        _V12_PENDING_TREND = null;
                        omega_V12SaveDrawings(); omega_V12SetDrawMode(null); omega_V10DrawChart();
                    }
                }
            });
            canvas.addEventListener('mousemove', (ev)=>{
                const rect = canvas.getBoundingClientRect();
                _V13_CROSSHAIR = {x:(ev.clientX - rect.left) * (canvas.width / rect.width), y:(ev.clientY - rect.top) * (canvas.height / rect.height)};
                omega_V10DrawChart();
            });
            canvas.addEventListener('mouseleave', ()=>{ _V13_CROSSHAIR = null; omega_V10DrawChart(); });
            canvas.addEventListener('wheel', (ev)=>{ ev.preventDefault(); omega_V12Zoom(ev.deltaY < 0 ? 0.74 : 1.34); }, {passive:false});
            omega_V10DrawChart();
        }

        const _omega_v14_old_zoom = omega_V12Zoom;
        omega_V12Zoom = function(factor){
            const center = (_V12_VIEW_START + _V12_VIEW_END) / 2;
            const width = Math.min(1, Math.max(0.015, (_V12_VIEW_END - _V12_VIEW_START) * factor));
            _V12_VIEW_START = Math.max(0, center - width/2);
            _V12_VIEW_END = Math.min(1, center + width/2);
            if(_V12_VIEW_END - _V12_VIEW_START < width){
                if(_V12_VIEW_START === 0) _V12_VIEW_END = Math.min(1, width);
                if(_V12_VIEW_END === 1) _V12_VIEW_START = Math.max(0, 1-width);
            }
            _V12_AUTO_FIT = false;
            omega_V10DrawChart();
        };

        const _omega_v14_old_draw_chart = omega_V10DrawChart;
        omega_V10DrawChart = function(){
            _omega_v14_old_draw_chart();
            const canvas = document.getElementById('crypto-v10-chart');
            if(!canvas) return;
            const ctx = canvas.getContext('2d');
            const plan = omega_V10GetPlan();
            const candles = omega_V12VisibleCandles();
            if(!candles.length) return;
            // Make candles visually stronger by re-stroking bodies with crisp borders.
            const w=canvas.width,h=canvas.height,left=58,right=96,top=24,bottom=52,plotW=w-left-right,plotH=h-top-bottom;
            const levels=[]; if(plan.entry)levels.push(plan.entry); if(plan.stop)levels.push(plan.stop); if(plan.liq)levels.push(plan.liq); if(_V10_PRICE)levels.push(_V10_PRICE); plan.tps.forEach(tp=>levels.push(tp.price));
            const all=[...candles.flatMap(c=>[c.high,c.low]),...levels].filter(Boolean); if(all.length<2)return;
            const min=Math.min(...all),max=Math.max(...all),pad=(max-min)*0.08||1,lo=min-pad,hi=max+pad;
            const yFor=v=>top+(hi-v)/(hi-lo)*plotH;
            const xFor=i=>left+(i/(candles.length-1||1))*plotW;
            const cw=Math.max(4, Math.min(15, plotW/(candles.length||1)*0.62));
            candles.forEach((c,i)=>{
                const x=xFor(i), yO=yFor(c.open), yC=yFor(c.close), yH=yFor(c.high), yL=yFor(c.low);
                const up=c.close>=c.open; ctx.strokeStyle=up?'#14e6a2':'#ff5555'; ctx.fillStyle=up?'rgba(16,185,129,.93)':'rgba(239,68,68,.93)'; ctx.lineWidth=1.8;
                ctx.beginPath(); ctx.moveTo(x,yH); ctx.lineTo(x,yL); ctx.stroke();
                ctx.fillRect(x-cw/2, Math.min(yO,yC), cw, Math.max(4,Math.abs(yC-yO)));
                ctx.strokeRect(x-cw/2, Math.min(yO,yC), cw, Math.max(4,Math.abs(yC-yO)));
            });
            const conv = omega_V12ChartConverters();
            omega_V12DrawUserDrawings(ctx, conv);
        };

        // Fetch deeper chart history where the exchange permits it.
        const _omega_v14_old_refresh_crypto = omega_V10RefreshCrypto;
        omega_V10RefreshCrypto = async function(force=false){
            await _omega_v14_old_refresh_crypto(force);
            omega_V14BindCanvasEvents();
            omega_V14RenderDrawingsPanel();
        };

        // Make Crypto tab survive refresh even with the first DOMContentLoaded handler.
        window.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                const hash = window.location.hash.replace('#','');
                if(['live','crypto','finance','favs','stream','basketbol','futbol'].includes(hash)){
                    const el = document.getElementById('nav-' + hash);
                    if(el) omega_SwitchMainTab(hash, el, false);
                }
                omega_V14BindCanvasEvents();
                omega_V14RenderDrawingsPanel();
            }, 1200);
        });



        /* ================= V15 FINAL CHART UX: WHEEL ZOOM, AXIS SCALE, DRAG TREND, SOUND ALARMS ================= */
        let _V15_SELECTED_ITEM = null;
        let _V15_TREND_PREVIEW = null;
        let _V15_Y_SCALE = parseFloat(localStorage.getItem('v15_y_scale') || '1');
        let _V15_AXIS_DRAG = null;
        let _V15_PAN_DRAG = null;
        let _V15_SOUND_SETTINGS = JSON.parse(localStorage.getItem('v15_alarm_sound') || '{"sound":"beep","customUrl":""}');
        let _V15_AUDIO_CTX = null;

        function omega_V15SaveSound(){ localStorage.setItem('v15_alarm_sound', JSON.stringify(_V15_SOUND_SETTINGS)); }

        function omega_V15InstallUi(){
            document.querySelectorAll('.crypto-v12-toolbar .chart-tool-btn').forEach(btn=>{
                const txt=(btn.textContent||'').toLowerCase();
                if(txt.includes('yakınlaştır') || txt.includes('uzaklaştır') || txt.includes('sığdır')) btn.classList.add('v15-hide');
            });
            const wrap=document.querySelector('.crypto-v12-chart-wrap');
            if(wrap && !document.getElementById('v15-chart-trash')){
                const del=document.createElement('button');
                del.id='v15-chart-trash'; del.className='chart-delete-floating';
                del.innerHTML='<i class="fa-solid fa-trash-can"></i> Sil';
                del.onclick=(e)=>{ e.stopPropagation(); omega_V15DeleteSelected(); };
                wrap.appendChild(del);
            }
        }

        function omega_V15Beep(freq=880, dur=180, type='sine', delay=0, vol=.13){
            try{
                _V15_AUDIO_CTX = _V15_AUDIO_CTX || new (window.AudioContext || window.webkitAudioContext)();
                const ctx=_V15_AUDIO_CTX; const osc=ctx.createOscillator(); const gain=ctx.createGain();
                osc.type=type; osc.frequency.value=freq; gain.gain.value=0;
                osc.connect(gain); gain.connect(ctx.destination);
                const t=ctx.currentTime+delay/1000;
                gain.gain.setValueAtTime(0,t); gain.gain.linearRampToValueAtTime(vol,t+.02); gain.gain.exponentialRampToValueAtTime(.001,t+dur/1000);
                osc.start(t); osc.stop(t+dur/1000+.04);
            }catch(e){}
        }
        function omega_V15PlayAlarmSound(sound){
            sound = sound || _V15_SOUND_SETTINGS.sound || 'beep';
            const custom = _V15_SOUND_SETTINGS.customUrl || '';
            if(sound==='silent') return;
            if(sound==='custom' && custom){ try{ const a=new Audio(custom); a.volume=.8; a.play().catch(()=>{}); return; }catch(e){} }
            if(sound==='chime'){ omega_V15Beep(660,180,'sine',0,.12); omega_V15Beep(990,260,'sine',170,.10); return; }
            if(sound==='siren'){ omega_V15Beep(740,180,'sawtooth',0,.11); omega_V15Beep(520,180,'sawtooth',180,.11); omega_V15Beep(740,220,'sawtooth',360,.11); return; }
            if(sound==='digital'){ omega_V15Beep(1200,90,'square',0,.09); omega_V15Beep(900,90,'square',105,.09); omega_V15Beep(1200,120,'square',210,.09); return; }
            omega_V15Beep(880,220,'sine',0,.13);
        }
        function omega_V15TestAlarmSound(){
            const s=document.getElementById('v15-alarm-sound'); const u=document.getElementById('v15-alarm-custom');
            _V15_SOUND_SETTINGS.sound=s?.value||'beep'; _V15_SOUND_SETTINGS.customUrl=(u?.value||'').trim(); omega_V15SaveSound(); omega_V15PlayAlarmSound(_V15_SOUND_SETTINGS.sound);
        }

        function omega_V15TimeLabel(ms, detailed=false){
            const d=new Date(ms);
            if(detailed) return d.toLocaleString('tr-TR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'});
            const tf=_V10_TF||'1m';
            if(['1d','3d','1w','1M'].includes(tf)) return d.toLocaleDateString('tr-TR',{day:'2-digit',month:'2-digit',year:'2-digit'});
            return d.toLocaleString('tr-TR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
        }

        function omega_V15VisibleIndexRange(){
            const n=(_V10_CANDLES||[]).length; if(!n) return {start:0,end:0};
            const start=Math.max(0,Math.floor(_V12_VIEW_START*(n-1)));
            const end=Math.min(n,Math.max(start+8,Math.ceil(_V12_VIEW_END*n)));
            return {start,end};
        }

        function omega_V12ChartConverters(){
            const canvas=document.getElementById('crypto-v10-chart'); if(!canvas) return null;
            const w=canvas.width,h=canvas.height;
            const left=64,right=104,top=24,bottom=62,plotW=w-left-right,plotH=h-top-bottom;
            const allCandles=_V10_CANDLES||[];
            const range=omega_V15VisibleIndexRange();
            const candles=allCandles.slice(range.start,range.end);
            const plan=omega_V10GetPlan();
            const levels=[]; if(plan.entry)levels.push(plan.entry); if(plan.stop)levels.push(plan.stop); if(plan.liq)levels.push(plan.liq); if(_V10_PRICE)levels.push(_V10_PRICE); plan.tps.forEach(tp=>levels.push(tp.price));
            const all=[...candles.flatMap(c=>[c.high,c.low]),...levels].filter(v=>Number.isFinite(Number(v)) && Number(v)>0).map(Number);
            if(all.length<2||!candles.length)return null;
            let min=Math.min(...all), max=Math.max(...all); let pad=(max-min)*0.10||1;
            let lo=min-pad, hi=max+pad;
            const mid=(lo+hi)/2; const half=((hi-lo)/2)*Math.max(.22,Math.min(18,_V15_Y_SCALE||1));
            lo=mid-half; hi=mid+half;
            return {
                w,h,left,right,top,bottom,plotW,plotH,lo,hi,candles,range,allCandles,
                yFor:v=>top+(hi-v)/(hi-lo)*plotH,
                priceForY:y=>hi-((y-top)/plotH)*(hi-lo),
                xForIndex:i=>left+((i-range.start)/(Math.max(1,range.end-range.start-1)))*plotW,
                indexForX:x=>Math.max(range.start,Math.min(range.end-1,Math.round(range.start+((x-left)/plotW)*(Math.max(1,range.end-range.start-1))))),
                candleAtIndex:i=>allCandles[Math.max(0,Math.min(allCandles.length-1,i))]
            };
        }

        function omega_V15ZoomAt(xPx, factor){
            const conv=omega_V12ChartConverters(); const n=(_V10_CANDLES||[]).length; if(!conv||n<10)return;
            const plotFrac=Math.max(0,Math.min(1,(xPx-conv.left)/conv.plotW));
            const width=_V12_VIEW_END-_V12_VIEW_START;
            const anchor=_V12_VIEW_START+plotFrac*width;
            const newWidth=Math.min(1,Math.max(0.003,width*factor));
            let ns=anchor-plotFrac*newWidth, ne=ns+newWidth;
            if(ns<0){ne-=ns;ns=0;} if(ne>1){ns-=ne-1;ne=1;} ns=Math.max(0,ns); ne=Math.min(1,ne);
            _V12_VIEW_START=ns; _V12_VIEW_END=ne; _V12_AUTO_FIT=false; omega_V10DrawChart();
        }

        function omega_V15SelectItemAt(x,y){
            const conv=omega_V12ChartConverters(); if(!conv)return false;
            const plan=omega_V10GetPlan(); const key=omega_V12SymbolKey(plan);
            let best=null;
            const distPoint=(x1,y1,x2,y2)=>Math.hypot(x1-x2,y1-y2);
            function distSeg(px,py,x1,y1,x2,y2){ const A=px-x1,B=py-y1,C=x2-x1,D=y2-y1; const dot=A*C+B*D; const len=C*C+D*D||1; let t=Math.max(0,Math.min(1,dot/len)); return Math.hypot(px-(x1+t*C),py-(y1+t*D)); }
            _V12_DRAWINGS.filter(d=>d.key===key).forEach(d=>{
                if(d.type==='hline'){
                    const yy=conv.yFor(d.price); const ds=Math.abs(y-yy); if(ds<12 && (!best||ds<best.dist)) best={type:'drawing',id:d.id,dist:ds,x:Math.min(Math.max(x,conv.left),conv.left+conv.plotW),y:yy};
                }else if(d.type==='trend'){
                    const x1=conv.xForIndex(d.x1),y1=conv.yFor(d.y1),x2=conv.xForIndex(d.x2),y2=conv.yFor(d.y2); const ds=distSeg(x,y,x1,y1,x2,y2); if(ds<14 && (!best||ds<best.dist)) best={type:'drawing',id:d.id,dist:ds,x,y};
                }
            });
            _V12_ALARMS.filter(a=>a.key===key&&!a.hit).forEach(a=>{
                const yy=conv.yFor(a.price); const ds=Math.abs(y-yy); if(ds<12 && (!best||ds<best.dist)) best={type:'alarm',id:a.id,dist:ds,x:conv.left+conv.plotW-20,y:yy};
            });
            if(best){ _V15_SELECTED_ITEM=best; omega_V15PositionTrash(); omega_V10DrawChart(); return true; }
            _V15_SELECTED_ITEM=null; omega_V15PositionTrash(); omega_V10DrawChart(); return false;
        }

        function omega_V15PositionTrash(){
            const btn=document.getElementById('v15-chart-trash'); const canvas=document.getElementById('crypto-v10-chart'); if(!btn||!canvas)return;
            if(!_V15_SELECTED_ITEM){btn.classList.remove('show');return;}
            const rect=canvas.getBoundingClientRect(); const wrap=canvas.parentElement.getBoundingClientRect();
            const left=(rect.left-wrap.left)+Math.min(Math.max(_V15_SELECTED_ITEM.x+12,10),rect.width-82);
            const top=(rect.top-wrap.top)+Math.min(Math.max(_V15_SELECTED_ITEM.y-22,8),rect.height-36);
            btn.style.left=left+'px'; btn.style.top=top+'px'; btn.classList.add('show');
        }

        function omega_V15DeleteSelected(){
            if(!_V15_SELECTED_ITEM)return;
            if(_V15_SELECTED_ITEM.type==='drawing'){ _V12_DRAWINGS=_V12_DRAWINGS.filter(d=>d.id!==_V15_SELECTED_ITEM.id); omega_V12SaveDrawings(); }
            if(_V15_SELECTED_ITEM.type==='alarm'){ _V12_ALARMS=_V12_ALARMS.filter(a=>a.id!==_V15_SELECTED_ITEM.id); omega_V12SaveAlarms(); omega_V12RenderAlarms(); }
            _V15_SELECTED_ITEM=null; omega_V15PositionTrash(); omega_V10DrawChart(); omega_V14RenderDrawingsPanel&&omega_V14RenderDrawingsPanel();
        }

        function omega_V12DrawUserDrawings(ctx, conv){
            if(!conv)return; const plan=omega_V10GetPlan(); const key=omega_V12SymbolKey(plan);
            _V12_DRAWINGS.filter(d=>d.key===key).forEach(d=>{
                if(!d.id)d.id=Date.now()+Math.floor(Math.random()*1000);
                const selected=_V15_SELECTED_ITEM&&_V15_SELECTED_ITEM.type==='drawing'&&_V15_SELECTED_ITEM.id===d.id;
                const col=d.type==='hline'?'#f2f2f2':(d.color==='red'?'#dc2626':'#059669');
                ctx.strokeStyle=col; ctx.fillStyle=col; ctx.lineWidth=selected?5.5:(d.type==='trend'?4.2:2.8); ctx.setLineDash([]);
                if(d.type==='hline'){
                    const y=conv.yFor(d.price); ctx.beginPath(); ctx.moveTo(conv.left,y); ctx.lineTo(conv.left+conv.plotW,y); ctx.stroke();
                    ctx.font='bold 12px JetBrains Mono, monospace'; ctx.fillText(`ÇİZGİ ${omega_V10FormatPrice(d.price)}`, conv.left+10, y-8);
                    if(selected){ctx.beginPath();ctx.arc(conv.left+conv.plotW-18,y,6,0,Math.PI*2);ctx.fill();}
                }else if(d.type==='trend'){
                    const x1=conv.xForIndex(d.x1),y1=conv.yFor(d.y1),x2=conv.xForIndex(d.x2),y2=conv.yFor(d.y2);
                    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
                    ctx.beginPath(); ctx.arc(x1,y1,selected?6:4.5,0,Math.PI*2); ctx.arc(x2,y2,selected?6:4.5,0,Math.PI*2); ctx.fill();
                }
            });
            if(_V15_TREND_PREVIEW){
                const col=_V14_TREND_COLOR==='red'?'#dc2626':'#059669'; ctx.strokeStyle=col; ctx.fillStyle=col; ctx.lineWidth=4.2; ctx.setLineDash([]);
                ctx.beginPath(); ctx.moveTo(conv.xForIndex(_V15_TREND_PREVIEW.x1),conv.yFor(_V15_TREND_PREVIEW.y1)); ctx.lineTo(_V15_TREND_PREVIEW.x2Px,_V15_TREND_PREVIEW.y2Px); ctx.stroke();
                ctx.beginPath(); ctx.arc(conv.xForIndex(_V15_TREND_PREVIEW.x1),conv.yFor(_V15_TREND_PREVIEW.y1),5,0,Math.PI*2); ctx.arc(_V15_TREND_PREVIEW.x2Px,_V15_TREND_PREVIEW.y2Px,5,0,Math.PI*2); ctx.fill();
            }
            omega_V14RenderDrawingsPanel&&omega_V14RenderDrawingsPanel();
        };

        function omega_V15DrawAlarms(ctx, conv){
            const plan=omega_V10GetPlan(); const key=omega_V12SymbolKey(plan);
            _V12_ALARMS.filter(a=>a.key===key&&!a.hit).forEach(a=>{
                const y=conv.yFor(a.price); const selected=_V15_SELECTED_ITEM&&_V15_SELECTED_ITEM.type==='alarm'&&_V15_SELECTED_ITEM.id===a.id;
                ctx.strokeStyle=a.dir==='above'?'#f59e0b':'#60a5fa'; ctx.fillStyle=ctx.strokeStyle; ctx.lineWidth=selected?3.8:2.4; ctx.setLineDash([10,6]);
                ctx.beginPath(); ctx.moveTo(conv.left,y); ctx.lineTo(conv.left+conv.plotW,y); ctx.stroke(); ctx.setLineDash([]);
                const txt=`ALARM ${a.dir==='above'?'ÜST':'ALT'} ${omega_V10FormatPrice(a.price)}`;
                ctx.font='bold 12px JetBrains Mono, monospace'; const tw=ctx.measureText(txt).width+14;
                ctx.fillStyle='rgba(5,5,5,.92)'; ctx.fillRect(conv.left+conv.plotW-tw-8, y-20, tw, 18);
                ctx.fillStyle=a.dir==='above'?'#f59e0b':'#60a5fa'; ctx.fillText(txt, conv.left+conv.plotW-tw, y-7);
                if(selected){ctx.beginPath();ctx.arc(conv.left+conv.plotW-12,y,6,0,Math.PI*2);ctx.fill();}
            });
        }

        function omega_V10DrawChart(){
            const canvas=document.getElementById('crypto-v10-chart'); if(!canvas)return; const ctx=canvas.getContext('2d');
            const w=canvas.width,h=canvas.height; ctx.clearRect(0,0,w,h); ctx.fillStyle='#020202'; ctx.fillRect(0,0,w,h);
            const conv=omega_V12ChartConverters(); if(!conv)return; const {left,top,plotW,plotH,candles}=conv; const plan=omega_V10GetPlan();
            ctx.fillStyle='#050505'; ctx.fillRect(left,top,plotW,plotH);
            ctx.strokeStyle='rgba(255,255,255,.055)'; ctx.lineWidth=1;
            ctx.font='11px JetBrains Mono, monospace'; ctx.fillStyle='#7b7b7b';
            for(let i=0;i<=6;i++){ const y=top+i*plotH/6; const price=conv.hi-(i/6)*(conv.hi-conv.lo); ctx.beginPath(); ctx.moveTo(left,y); ctx.lineTo(left+plotW,y); ctx.stroke(); ctx.fillText(omega_V10FormatPrice(price), left+plotW+10, y+4); }
            const tickCount=6; for(let i=0;i<=tickCount;i++){ const idx=Math.round(conv.range.start+(i/tickCount)*Math.max(1,conv.range.end-conv.range.start-1)); const c=conv.allCandles[idx]; if(!c)continue; const x=conv.xForIndex(idx); ctx.beginPath(); ctx.moveTo(x,top); ctx.lineTo(x,top+plotH); ctx.stroke(); ctx.fillText(omega_V15TimeLabel(c.time,false), Math.min(x-28,left+plotW-72), top+plotH+24); }
            ctx.strokeStyle='rgba(255,255,255,.18)'; ctx.strokeRect(left,top,plotW,plotH);
            const cw=Math.max(3.5,Math.min(16,plotW/(candles.length||1)*.64));
            candles.forEach((c,localI)=>{ const globalI=conv.range.start+localI; const x=conv.xForIndex(globalI); const yO=conv.yFor(c.open),yC=conv.yFor(c.close),yH=conv.yFor(c.high),yL=conv.yFor(c.low); const up=c.close>=c.open; ctx.strokeStyle=up?'#00b46f':'#c81e1e'; ctx.fillStyle=up?'#008f5c':'#a91515'; ctx.lineWidth=2.2; ctx.beginPath(); ctx.moveTo(x,yH); ctx.lineTo(x,yL); ctx.stroke(); const bodyY=Math.min(yO,yC), bodyH=Math.max(4,Math.abs(yC-yO)); ctx.fillRect(x-cw/2,bodyY,cw,bodyH); ctx.strokeRect(x-cw/2,bodyY,cw,bodyH); });
            omega_V12DrawMA(ctx,conv);
            const levels=[]; if(plan.entry)levels.push({v:plan.entry,c:'#fbbf24',label:'GİRİŞ'}); if(plan.stop)levels.push({v:plan.stop,c:'#ef4444',label:'STOP'}); if(plan.liq)levels.push({v:plan.liq,c:'#f97316',label:'LİQ'}); if(_V10_PRICE)levels.push({v:_V10_PRICE,c:'#3b82f6',label:'CANLI'}); plan.tps.forEach(tp=>levels.push({v:tp.price,c:'#10b981',label:`TP${tp.index}`}));
            levels.forEach(l=>{ const y=conv.yFor(l.v); ctx.strokeStyle=l.c; ctx.fillStyle=l.c; ctx.lineWidth=l.label==='CANLI'?3.2:2.2; ctx.setLineDash(l.label==='CANLI'?[]:[8,5]); ctx.beginPath(); ctx.moveTo(left,y); ctx.lineTo(left+plotW,y); ctx.stroke(); ctx.setLineDash([]); const txt=`${l.label} ${omega_V10FormatPrice(l.v)}`; const tw=ctx.measureText(txt).width+14; ctx.fillStyle='rgba(4,4,4,.94)'; ctx.fillRect(left+8,y-20,tw,18); ctx.fillStyle=l.c; ctx.font='bold 12px JetBrains Mono, monospace'; ctx.fillText(txt,left+15,y-7); });
            omega_V15DrawAlarms(ctx,conv);
            omega_V12DrawUserDrawings(ctx,conv);
            if(_V13_CROSSHAIR){ const x=Math.max(left,Math.min(left+plotW,_V13_CROSSHAIR.x)); const y=Math.max(top,Math.min(top+plotH,_V13_CROSSHAIR.y)); ctx.strokeStyle='rgba(255,255,255,.28)'; ctx.lineWidth=1; ctx.setLineDash([4,4]); ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(left+plotW,y);ctx.moveTo(x,top);ctx.lineTo(x,top+plotH);ctx.stroke();ctx.setLineDash([]); const price=conv.priceForY(y); const idx=conv.indexForX(x); const c=conv.candleAtIndex(idx); const label=`${omega_V10FormatPrice(price)} · ${c?omega_V15TimeLabel(c.time,true):''}`; ctx.fillStyle='rgba(0,0,0,.86)'; ctx.fillRect(left+10,top+10,ctx.measureText(label).width+20,24); ctx.fillStyle='#e5e5e5';ctx.font='12px JetBrains Mono, monospace';ctx.fillText(label,left+20,top+27); }
            const cap=document.getElementById('crypto-v10-caption'); if(cap) cap.innerHTML=`<span>Grafik: <b>${candles.length}/${(_V10_CANDLES||[]).length}</b> mum · Wheel: zaman zoom · Sağ fiyat ekseni: dikey ölçek · Son güncelleme: ${new Date().toLocaleTimeString('tr-TR')}</span><span>Fiyat ve tarih ekseni aktif.</span>`;
            omega_V15PositionTrash();
        }

        function omega_V15BindCanvasEvents(){
            const old=document.getElementById('crypto-v10-chart'); if(!old)return;
            if(old.dataset.v15Bound)return;
            const canvas=old.cloneNode(true); old.parentNode.replaceChild(canvas,old); canvas.dataset.v15Bound='1';
            let trendDragStarted=false;
            canvas.addEventListener('mousedown',(ev)=>{
                const rect=canvas.getBoundingClientRect(); const x=(ev.clientX-rect.left)*(canvas.width/rect.width); const y=(ev.clientY-rect.top)*(canvas.height/rect.height); const conv=omega_V12ChartConverters(); if(!conv)return;
                if(x>conv.left+conv.plotW){ _V15_AXIS_DRAG={startY:y,startScale:_V15_Y_SCALE}; return; }
                if(_V12_DRAW_MODE==='trend'){
                    const price=conv.priceForY(y), timeIndex=conv.indexForX(x); const plan=omega_V10GetPlan(); const key=omega_V12SymbolKey(plan);
                    _V12_PENDING_TREND={x1:timeIndex,y1:price,key}; _V15_TREND_PREVIEW={x1:timeIndex,y1:price,x2Px:x,y2Px:y}; trendDragStarted=true; omega_V10DrawChart(); return;
                }
                if(!_V12_DRAW_MODE && !omega_V15SelectItemAt(x,y)){ _V15_PAN_DRAG={startX:x,startStart:_V12_VIEW_START,startEnd:_V12_VIEW_END}; }
            });
            canvas.addEventListener('mousemove',(ev)=>{
                const rect=canvas.getBoundingClientRect(); const x=(ev.clientX-rect.left)*(canvas.width/rect.width); const y=(ev.clientY-rect.top)*(canvas.height/rect.height); const conv=omega_V12ChartConverters(); if(!conv)return;
                _V13_CROSSHAIR={x,y};
                if(_V15_AXIS_DRAG){ const dy=y-_V15_AXIS_DRAG.startY; _V15_Y_SCALE=Math.max(.18,Math.min(22,_V15_AXIS_DRAG.startScale*Math.exp(dy/180))); localStorage.setItem('v15_y_scale',String(_V15_Y_SCALE)); omega_V10DrawChart(); return; }
                if(_V15_PAN_DRAG){ const dx=x-_V15_PAN_DRAG.startX; const width=_V15_PAN_DRAG.startEnd-_V15_PAN_DRAG.startStart; const shift=-(dx/conv.plotW)*width; let ns=_V15_PAN_DRAG.startStart+shift, ne=_V15_PAN_DRAG.startEnd+shift; if(ns<0){ne-=ns;ns=0;} if(ne>1){ns-=ne-1;ne=1;} _V12_VIEW_START=Math.max(0,ns); _V12_VIEW_END=Math.min(1,ne); _V12_AUTO_FIT=false; omega_V10DrawChart(); return; }
                if(_V12_DRAW_MODE==='trend' && _V12_PENDING_TREND){ _V15_TREND_PREVIEW={x1:_V12_PENDING_TREND.x1,y1:_V12_PENDING_TREND.y1,x2Px:x,y2Px:y}; omega_V10DrawChart(); return; }
                omega_V10DrawChart();
            });
            canvas.addEventListener('mouseup',(ev)=>{
                const rect=canvas.getBoundingClientRect(); const x=(ev.clientX-rect.left)*(canvas.width/rect.width); const y=(ev.clientY-rect.top)*(canvas.height/rect.height); const conv=omega_V12ChartConverters();
                if(_V15_AXIS_DRAG){_V15_AXIS_DRAG=null; return;} if(_V15_PAN_DRAG){_V15_PAN_DRAG=null; return;}
                if(_V12_DRAW_MODE==='trend' && _V12_PENDING_TREND && conv && trendDragStarted){ const plan=omega_V10GetPlan(); const key=omega_V12SymbolKey(plan); const price=conv.priceForY(y), timeIndex=conv.indexForX(x); if(Math.abs(timeIndex-_V12_PENDING_TREND.x1)>0 || Math.abs(price-_V12_PENDING_TREND.y1)>0){ _V12_DRAWINGS.push({id:Date.now(),type:'trend',key,color:_V14_TREND_COLOR,x1:_V12_PENDING_TREND.x1,y1:_V12_PENDING_TREND.y1,x2:timeIndex,y2:price}); omega_V12SaveDrawings(); omega_V12SetDrawMode(null); } _V12_PENDING_TREND=null; _V15_TREND_PREVIEW=null; trendDragStarted=false; omega_V10DrawChart(); }
            });
            canvas.addEventListener('click',(ev)=>{
                const rect=canvas.getBoundingClientRect(); const x=(ev.clientX-rect.left)*(canvas.width/rect.width); const y=(ev.clientY-rect.top)*(canvas.height/rect.height); const conv=omega_V12ChartConverters(); if(!conv)return;
                if(_V12_DRAW_MODE==='alarm'){ const price=conv.priceForY(y); const plan=omega_V10GetPlan(); const key=omega_V12SymbolKey(plan); const dir=(_V10_PRICE&&price>_V10_PRICE)?'above':'below'; _V12_ALARMS.push({id:Date.now(),key,symbol:`${plan.symbol}${plan.quote}`,exchange:plan.exchange,dir,price,note:'Grafikten alarm',sound:_V15_SOUND_SETTINGS.sound,customUrl:_V15_SOUND_SETTINGS.customUrl,hit:false,created:new Date().toISOString()}); omega_V12SaveAlarms(); omega_V12RenderAlarms(); omega_V12SetDrawMode(null); omega_V10DrawChart(); omega_ShowFinanceToast&&omega_ShowFinanceToast('Grafikten alarm eklendi.'); return; }
                if(_V12_DRAW_MODE==='hline'){ const price=conv.priceForY(y); const plan=omega_V10GetPlan(); const key=omega_V12SymbolKey(plan); _V12_DRAWINGS.push({id:Date.now(),type:'hline',key,price,label:'Çizgi'}); omega_V12SaveDrawings(); omega_V12SetDrawMode(null); omega_V10DrawChart(); return; }
                if(!_V12_DRAW_MODE) omega_V15SelectItemAt(x,y);
            });
            canvas.addEventListener('mouseleave',()=>{_V13_CROSSHAIR=null; if(!_V12_PENDING_TREND){omega_V10DrawChart();}});
            canvas.addEventListener('wheel',(ev)=>{ ev.preventDefault(); const rect=canvas.getBoundingClientRect(); const x=(ev.clientX-rect.left)*(canvas.width/rect.width); const y=(ev.clientY-rect.top)*(canvas.height/rect.height); const conv=omega_V12ChartConverters(); if(!conv)return; const factor=ev.deltaY<0?.76:1.32; if(x>conv.left+conv.plotW || ev.ctrlKey){ _V15_Y_SCALE=Math.max(.18,Math.min(22,_V15_Y_SCALE*(ev.deltaY<0?.82:1.22))); localStorage.setItem('v15_y_scale',String(_V15_Y_SCALE)); omega_V10DrawChart(); } else omega_V15ZoomAt(x,factor); },{passive:false});
            omega_V10DrawChart();
        }

        const _omega_v15_old_check_alarms = omega_V12CheckAlarms;
        omega_V12CheckAlarms = function(){
            if(!_V10_PRICE)return; const plan=omega_V10GetPlan(); const key=omega_V12SymbolKey(plan); let changed=false;
            _V12_ALARMS.forEach(a=>{ if(a.key!==key||a.hit)return; const hit=a.dir==='above'?_V10_PRICE>=a.price:_V10_PRICE<=a.price; if(hit){ a.hit=true; a.hitAt=new Date().toISOString(); changed=true; const msg=`${a.symbol} ${a.dir==='above'?'üstüne çıktı':'altına düştü'}: ${omega_V10FormatPrice(a.price)}`; omega_ShowFinanceToast&&omega_ShowFinanceToast('ALARM: '+msg); omega_V15PlayAlarmSound(a.sound||_V15_SOUND_SETTINGS.sound); if('Notification'in window&&Notification.permission==='granted') new Notification('Kasa Terminal Alarm',{body:msg}); } });
            if(changed){omega_V12SaveAlarms(); omega_V12RenderAlarms(); omega_V10DrawChart();}
        };

        const _omega_v15_old_add_alarm = omega_V12AddAlarm;
        omega_V12AddAlarm = function(){
            const price=parseFloat(document.getElementById('v12-alarm-price')?.value); const dir=document.getElementById('v12-alarm-dir')?.value||'above'; const note=(document.getElementById('v12-alarm-note')?.value||'').trim();
            if(!price||price<=0){omega_ShowFinanceToast&&omega_ShowFinanceToast('Alarm için geçerli fiyat gir.');return;}
            const plan=omega_V10GetPlan(); _V12_ALARMS.push({id:Date.now(),key:omega_V12SymbolKey(plan),symbol:`${plan.symbol}${plan.quote}`,exchange:plan.exchange,dir,price,note,sound:_V15_SOUND_SETTINGS.sound,customUrl:_V15_SOUND_SETTINGS.customUrl,hit:false,created:new Date().toISOString()});
            omega_V12SaveAlarms(); omega_V12RenderAlarms(); omega_V10DrawChart(); const pe=document.getElementById('v12-alarm-price'); if(pe)pe.value=''; omega_ShowFinanceToast&&omega_ShowFinanceToast('Alarm eklendi.');
        };

        const _omega_v15_old_render_alarms = omega_V12RenderAlarms;
        omega_V12RenderAlarms = function(){
            const box=document.getElementById('v12-alarm-list'); if(!box)return; const plan=omega_V10GetPlan(); const key=omega_V12SymbolKey(plan); const list=_V12_ALARMS.filter(a=>a.key===key);
            if(!list.length){box.innerHTML='<div class="alarm-v12-row"><span>Bu sembol için alarm yok.</span><span></span><span></span></div>';return;}
            box.innerHTML=list.map(a=>`<div class="alarm-v12-row ${a.hit?'hit':''}"><div><b>${a.dir==='above'?'ÜST':'ALT'} ${omega_V10FormatPrice(a.price)}</b><br><span>${a.note||a.symbol} · ${a.hit?'ÇALDI':'aktif'} · ses: ${a.sound||_V15_SOUND_SETTINGS.sound}</span></div><span class="alarm-status">${a.hit?'ÇALDI':'AKTİF'}</span><button onclick="omega_V12DeleteAlarm(${a.id})"><i class="fa-solid fa-trash"></i></button></div>`).join('');
        };

        const _omega_v15_old_refresh = omega_V10RefreshCrypto;
        omega_V10RefreshCrypto = async function(force=false){ await _omega_v15_old_refresh(force); omega_V15InstallUi(); omega_V15BindCanvasEvents(); omega_V12RenderAlarms(); omega_V10DrawChart(); };
        window.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{omega_V15InstallUi(); omega_V15BindCanvasEvents(); omega_V10DrawChart();},1500));
