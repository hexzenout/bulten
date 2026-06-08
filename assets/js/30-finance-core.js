// ===============================
// V30 FINANCE CORE
// Kasa Yönetimi, Rolling, günlük işlem defteri ve grafik fonksiyonları.
// Bu dosya V30 modülerleştirme adımıdır; davranış değiştirmez.
// ===============================

function omega_GetRollingModeV46D() {
            return localStorage.getItem('finance_rolling_mode') === 'crypto' ? 'crypto' : 'bet';
        }

        function omega_GetRollingPlanKeyV47(days) {
            const mode = omega_GetRollingModeV46D();
            return `${mode}_${days}`;
        }

        function omega_OpenRollingExcel(days, skipHash = false) {
            _ACTIVE_EXCEL_DAYS = days;
            const rollMode = omega_GetRollingModeV46D();
            const planKey = omega_GetRollingPlanKeyV47(days);
            if(!_ROLLING_DB[planKey]) _ROLLING_DB[planKey] = { startBal: 100, targetBal: ROLLING_TARGETS[days], ops: {}, mode: rollMode, days };
            if(!_ROLLING_DB[planKey].targetBal) _ROLLING_DB[planKey].targetBal = ROLLING_TARGETS[days];
            document.getElementById('excel-modal-title').innerHTML = `${rollMode === 'crypto' ? 'KRİPTO' : 'BAHİS'} ${days} GÜNLÜK ROLLING`;
            document.getElementById('excel-start-bal').value = _ROLLING_DB[planKey].startBal;
            const targetInput = document.getElementById('excel-target-bal-input');
            if(targetInput) targetInput.value = _ROLLING_DB[planKey].targetBal;
            document.getElementById('rolling-excel-overlay').style.display = 'flex';
            document.documentElement.classList.remove('rolling-hash-boot');
            document.body.classList.add('rolling-active');
            if(!skipHash) {
                const baseHash = (document.getElementById('omega-rolling-block') && getComputedStyle(document.getElementById('omega-rolling-block')).display !== 'none') ? 'rolling' : 'finance';
                history.replaceState(null, '', `#${baseHash}/rolling/${days}`);
            }
            setTimeout(() => { document.getElementById('rolling-excel-overlay').classList.add('show-modal'); }, 10);
            omega_RenderExcelTable();
        }

        function omega_CloseRollingExcel(force = false) {
            if(!force && /^#(finance|rolling)\/rolling\/\d+/.test(String(location.hash || ''))) return;
            document.getElementById('rolling-excel-overlay').classList.remove('show-modal');
            document.body.classList.remove('rolling-active');
            document.documentElement.classList.remove('rolling-hash-boot');
            setTimeout(() => { document.getElementById('rolling-excel-overlay').style.display = 'none'; }, 300);
            if(force && /^#(finance|rolling)\/rolling\/\d+/.test(String(location.hash || ''))) history.replaceState(null, '', (document.getElementById('omega-rolling-block') && getComputedStyle(document.getElementById('omega-rolling-block')).display !== 'none') ? '#rolling' : '#finance');
        }

        function omega_UpdateExcelConfig() {
            const newBal = parseFloat(document.getElementById('excel-start-bal').value);
            const newTarget = parseFloat(document.getElementById('excel-target-bal-input')?.value);
            const planKey = omega_GetRollingPlanKeyV47(_ACTIVE_EXCEL_DAYS);
            if(!_ROLLING_DB[planKey]) _ROLLING_DB[planKey] = { startBal: 100, targetBal: ROLLING_TARGETS[_ACTIVE_EXCEL_DAYS], ops: {}, mode: omega_GetRollingModeV46D(), days: _ACTIVE_EXCEL_DAYS };
            if(!isNaN(newBal)) _ROLLING_DB[planKey].startBal = newBal;
            if(!isNaN(newTarget) && newTarget > 0) _ROLLING_DB[planKey].targetBal = newTarget;
            omega_SaveRollingDB();
            omega_RenderExcelTable();
        }

        function omega_SaveRollingDB() {
            localStorage.setItem('v19_rolling', JSON.stringify(_ROLLING_DB));
        }

        function omega_RenderExcelTable() {
            const wrapper = document.getElementById('excel-body-content');
            const currentPlan = _ROLLING_DB[omega_GetRollingPlanKeyV47(_ACTIVE_EXCEL_DAYS)];
            const rollMode = omega_GetRollingModeV46D();
            const isCrypto = rollMode === 'crypto';
            const overlay = document.getElementById('rolling-excel-overlay');
            if (overlay) overlay.setAttribute('data-roll-mode', rollMode);
            let runningBalance = currentPlan.startBal;
            let totalProfit = 0;
            let htmlBuffer = "";
            for (let day = 1; day <= _ACTIVE_EXCEL_DAYS; day++) {
                const dayOps = currentPlan.ops[day] || [];
                let dayProfit = 0;
                htmlBuffer += `
                <div class="day-row-capsule">
                    <div class="day-info"><h3>GÜN ${day}</h3><span>${isCrypto ? 'Gün P/L' : 'Gün K/Z'}</span></div>
                    <div class="capsule-container">`;
                for (let slot = 0; slot < 10; slot++) {
                    if (dayOps[slot]) {
                        const op = dayOps[slot];
                        const raw = parseFloat(op.odds);
                        const fee = Math.max(0, Number(op.fee || op.cost || 0));
                        const pnl = isCrypto
                            ? (op.netMode === 'amount' ? (op.res === 'win' ? Math.abs(raw) - fee : Math.abs(raw) + fee) : Math.abs(op.amt * (raw / 100)))
                            : (op.res === 'win' ? (op.amt * raw) - op.amt : op.amt);
                        const effect = op.res === 'win' ? pnl : -pnl;
                        runningBalance += effect; totalProfit += effect; dayProfit += effect;
                        htmlBuffer += `
                            <div class="kapsul ${op.res}">
                                <button class="k-undo" onclick="omega_UndoExcelOp(${day}, ${slot})" title="Geri Al"><i class="fa-solid fa-xmark"></i></button>
                                <div class="k-result">
                                    <div class="k-note-show">${op.note || (isCrypto ? 'İşlem' : 'Maç')}</div>
                                    <b>${isCrypto ? `$${op.amt} · Net $${Number(op.odds || 0).toFixed(2)}${Number(op.fee || 0) ? ' · Fee $' + Number(op.fee || 0).toFixed(2) : ''}` : `$${op.amt} x ${op.odds}`}</b>
                                    <span>${effect >= 0 ? '+' : '-'}$${Math.abs(effect).toFixed(2)}</span>
                                </div>
                            </div>`;
                    } else {
                        htmlBuffer += `
                            <div class="kapsul">
                                <input type="text" class="k-note-input" id="e-n-${day}-${slot}" placeholder="${isCrypto ? 'İşlem' : 'Maç'}">
                                <div class="k-inputs">
                                    <input type="number" id="e-a-${day}-${slot}" placeholder="Tutar">
                                    <input type="number" id="e-o-${day}-${slot}" placeholder="${isCrypto ? 'Net K/Z $' : 'Oran'}">
                                    ${isCrypto ? `<input type="number" id="e-f-${day}-${slot}" placeholder="Fee/Funding $" step="0.01">` : ''}
                                </div>
                                <div class="k-actions">
                                    <button class="k-btn w" onclick="omega_ResolveExcelOp(${day}, ${slot}, 'win')">${isCrypto ? 'KAZANÇ' : 'KAZANDI'}</button>
                                    <button class="k-btn l" onclick="omega_ResolveExcelOp(${day}, ${slot}, 'loss')">${isCrypto ? 'KAYIP' : 'KAYBETTİ'}</button>
                                </div>
                            </div>`;
                    }
                }
                htmlBuffer += `</div><div class="day-result"><span>${isCrypto ? 'Gün P/L' : 'Gün K/Z'}</span><b>${dayProfit >= 0 ? '+' : ''}$${dayProfit.toFixed(2)}</b></div></div>`;
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
            const isCrypto = omega_GetRollingModeV46D() === 'crypto';
            const amt = parseFloat(document.getElementById(`e-a-${day}-${slot}`).value);
            const odds = parseFloat(document.getElementById(`e-o-${day}-${slot}`).value);
            const fee = Math.max(0, parseFloat(document.getElementById(`e-f-${day}-${slot}`)?.value) || 0);
            if (isNaN(amt) || isNaN(odds)) {
                if (typeof omega_ShowFinanceToast === 'function') omega_ShowFinanceToast('Tutar ve ilgili oran / net K/Z alanını doldur.');
                return;
            }
            const currentPlan = _ROLLING_DB[omega_GetRollingPlanKeyV47(_ACTIVE_EXCEL_DAYS)];
            if (!currentPlan.ops[day]) currentPlan.ops[day] = [];
            currentPlan.ops[day][slot] = { note, amt, odds, fee, res: result, netMode: isCrypto ? 'amount' : 'odds' };
            omega_SaveRollingDB();
            omega_RenderExcelTable();
        }

        function omega_UndoExcelOp(day, slot) {
            const currentPlan = _ROLLING_DB[omega_GetRollingPlanKeyV47(_ACTIVE_EXCEL_DAYS)];
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
        function omega_DateKeyFromTs(ts) {
            const d = new Date(Number(ts || Date.now()));
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        }
        function omega_FilterLedgerByKey(key) {
            return (_COMPLETED_LEDGER || []).filter(item => omega_DateKeyFromTs(item.id || item.resolvedAt) === key);
        }
        function omega_MoneySigned(value) {
            const n = Number(value || 0);
            return `${n >= 0 ? '+' : '-'}$${Math.abs(n).toFixed(2)}`;
        }
        function omega_FormatLogDate(ts) {
            try { return new Date(Number(ts || Date.now())).toLocaleString('tr-TR', { dateStyle:'short', timeStyle:'short' }); }
            catch(e) { return '-'; }
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
                cryptoNetProfitAmount: '',
                cryptoCostAmount: 0,
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
            omega_SetVal('crypto-net-profit-amount', _FINANCE_SETTINGS.cryptoNetProfitAmount || '');
            omega_SetVal('crypto-cost-amount', _FINANCE_SETTINGS.cryptoCostAmount || 0);
            omega_SetVal('crypto-default-symbol', _FINANCE_SETTINGS.cryptoDefaultSymbol || 'BTC');
            const exSel = document.getElementById('crypto-default-exchange'); if(exSel) exSel.value = _FINANCE_SETTINGS.cryptoDefaultExchange || 'binance';
            const qSel = document.getElementById('crypto-default-quote'); if(qSel) qSel.value = _FINANCE_SETTINGS.cryptoDefaultQuote || 'USDT';
            const sideSel = document.getElementById('crypto-default-side'); if(sideSel) sideSel.value = _FINANCE_SETTINGS.cryptoDefaultSide || 'long';
            omega_RenderCryptoSymbolDatalist();
            const todayLabel = document.getElementById('finance-today-label');
            if(todayLabel) todayLabel.innerText = new Date().toLocaleDateString('tr-TR', { weekday:'long', day:'2-digit', month:'long' }).toUpperCase();
            omega_SetFinanceMode(_FINANCE_MODE, false);
        }

        
        
        function omega_RemoveOldRollingLaunchCard() {
            document.querySelectorAll('.finance-rolling-launch-card, .finance-rolling-selector, .finance-rolling-options').forEach(el => {
                const card = el.closest('.finance-card') || el;
                if(card && card.parentNode) card.remove();
            });
        }

        document.addEventListener('DOMContentLoaded', omega_RemoveOldRollingLaunchCard);
        window.addEventListener('hashchange', () => setTimeout(omega_RemoveOldRollingLaunchCard, 60));
        setTimeout(omega_RemoveOldRollingLaunchCard, 300);


        function omega_FinanceRailAction(action) {
            const smooth = { behavior: 'smooth', block: 'start' };

            if(action === 'bet' || action === 'crypto') {
                omega_SetFinanceMode(action, true);
                document.querySelectorAll('[data-finance-mode-btn]').forEach(btn => {
                    btn.classList.toggle('active', btn.getAttribute('data-finance-mode-btn') === action);
                });
                if(typeof omega_SetFinanceChartFilter === 'function') omega_SetFinanceChartFilter(action);
                const plan = document.querySelector('.finance-plan-card');
                if(plan) plan.scrollIntoView(smooth);
                return;
            }

            if(action === 'chart') {
                const chart = document.getElementById('omega-apex-chart-main')?.closest('.finance-card');
                if(chart) chart.scrollIntoView(smooth);
                return;
            }

            if(action === 'daily') {
                const daily = document.getElementById('daily-trade-grid')?.closest('.finance-card');
                if(daily) daily.scrollIntoView(smooth);
                return;
            }
        }

        function omega_OpenModeRolling(mode, days) {
            const safeMode = mode === 'crypto' ? 'crypto' : 'bet';
            omega_SetFinanceMode(safeMode, true);
            document.querySelectorAll('[data-finance-mode-btn]').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-finance-mode-btn') === safeMode);
            });
            localStorage.setItem('finance_rolling_mode', safeMode);
            omega_OpenRollingExcel(days);
        }

        function omega_RemoveOldRollingLaunchCard() {
            document.querySelectorAll('.finance-rolling-launch-card, .finance-rolling-selector, .finance-rolling-options').forEach(el => {
                const card = el.closest('.finance-card') || el;
                if(card && card.parentNode) card.remove();
            });
        }

        document.addEventListener('DOMContentLoaded', omega_RemoveOldRollingLaunchCard);
        window.addEventListener('hashchange', () => setTimeout(omega_RemoveOldRollingLaunchCard, 50));
        setTimeout(omega_RemoveOldRollingLaunchCard, 250);

function omega_SetFinanceMode(mode, refresh = true) {
            _FINANCE_MODE = mode === 'crypto' ? 'crypto' : 'bet';
            document.querySelectorAll('.finance-tab').forEach(x => {
                x.classList.remove('active');
                x.setAttribute('aria-selected', 'false');
            });
            document.querySelectorAll('.finance-tab-panel').forEach(x => {
                x.classList.remove('active');
                x.style.display = 'none';
            });
            const tab = document.getElementById('finance-tab-' + _FINANCE_MODE);
            const panel = document.getElementById('finance-panel-' + _FINANCE_MODE);
            if(tab) { tab.classList.add('active'); tab.setAttribute('aria-selected', 'true'); }
            document.querySelectorAll('[data-finance-mode-btn]').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-finance-mode-btn') === _FINANCE_MODE));
            if(panel) { panel.classList.add('active'); panel.style.display = 'block'; }
            if(refresh) { omega_SaveFinanceAll(); omega_CalculateStakePlan(); omega_RenderDailyTradeGrid(); }
        }

        function omega_UpdateFinanceSettings() {
            _FINANCE_SETTINGS.startBank = parseFloat(document.getElementById('finance-start-bank')?.value) || 100;
            _FINANCE_SETTINGS.targetPct = parseFloat(document.getElementById('finance-target-pct')?.value) || 0;
            _FINANCE_SETTINGS.tradeCount = Math.min(50, Math.max(1, parseInt(document.getElementById('finance-trade-count')?.value) || 20));
            _FINANCE_SETTINGS.splitCount = Math.min(100, Math.max(1, parseInt(document.getElementById('finance-split-count')?.value) || 20));
            _FINANCE_SETTINGS.defaultOdds = parseFloat(document.getElementById('finance-default-odds')?.value) || 1.30;
            _FINANCE_SETTINGS.riskModel = document.getElementById('finance-risk-model')?.value || 'target';
            omega_SaveFinanceAll(); omega_CalculateStakePlan(); omega_RefreshFinanceDashboard();
        }

        function omega_UpdateCryptoSettings() {
            _FINANCE_SETTINGS.startBank = parseFloat(document.getElementById('crypto-start-bank')?.value) || _FINANCE_SETTINGS.startBank || 100;
            _FINANCE_SETTINGS.cryptoTargetPct = parseFloat(document.getElementById('crypto-target-pct')?.value) || 0;
            _FINANCE_SETTINGS.cryptoTradeCount = Math.min(50, Math.max(1, parseInt(document.getElementById('crypto-trade-count')?.value) || 20));
            _FINANCE_SETTINGS.cryptoSplitCount = Math.min(100, Math.max(1, parseInt(document.getElementById('crypto-split-count')?.value) || 20));
            _FINANCE_SETTINGS.cryptoTpPct = parseFloat(document.getElementById('crypto-tp-pct')?.value) || 1;
            _FINANCE_SETTINGS.cryptoLeverage = parseFloat(document.getElementById('crypto-leverage')?.value) || 1;
            _FINANCE_SETTINGS.cryptoNetProfitAmount = parseFloat(document.getElementById('crypto-net-profit-amount')?.value) || '';
            _FINANCE_SETTINGS.cryptoCostAmount = Math.max(0, parseFloat(document.getElementById('crypto-cost-amount')?.value) || 0);
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
                const count = Math.max(1, _FINANCE_SETTINGS.cryptoTradeCount || 20);
                const splitCount = Math.max(1, _FINANCE_SETTINGS.cryptoSplitCount || 20);
                const tpPct = Math.max(.01, _FINANCE_SETTINGS.cryptoTpPct || 1);
                const lev = Math.max(1, _FINANCE_SETTINGS.cryptoLeverage || 1);
                const grossRate = (tpPct / 100) * lev;
                const costAmount = Math.max(0, Number(_FINANCE_SETTINGS.cryptoCostAmount || 0));
                const manualNetProfit = Number(_FINANCE_SETTINGS.cryptoNetProfitAmount || 0);
                const percentTargetProfit = bank * ((_FINANCE_SETTINGS.cryptoTargetPct || 0) / 100);
                const netProfitPerTrade = manualNetProfit > 0 ? manualNetProfit : (percentTargetProfit / count);
                const targetProfit = netProfitPerTrade * count;
                const grossNeededPerTrade = netProfitPerTrade + costAmount;
                const stakeByTarget = grossRate > 0 ? (grossNeededPerTrade / grossRate) : 0;
                const stakeBySplit = bank / splitCount;
                const stake = manualNetProfit > 0 ? stakeByTarget : stakeBySplit;
                const syntheticOdds = 1 + grossRate;
                const grossProfitPerTrade = stake * grossRate;
                const netEstimatedProfit = grossProfitPerTrade - costAmount;
                return { mode:'crypto', bank, targetProfit, count, splitCount, odds:syntheticOdds, stake, stakeByTarget, stakeBySplit, tpPct, lev, profitRate:grossRate, grossRate, costAmount, manualNetProfit, netProfitPerTrade, grossProfitPerTrade, netEstimatedProfit };
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
                perProfit = r.netEstimatedProfit;
                label = 'MARJİN';
                detail = `${r.manualNetProfit > 0 ? 'Net hedef $' + r.manualNetProfit.toFixed(2) : '%' + r.tpPct + ' TP'} · ${r.lev}x · Kesinti $${Number(r.costAmount || 0).toFixed(2)}`;
            } else {
                perProfit = r.stake * (r.odds - 1);
                label = 'STAKE';
                detail = `${r.splitCount} parçaya böl · @${r.odds.toFixed(2)}`;
            }
            box.innerHTML = `
                <div class="plan-metric main"><span>Önerilen ${label}</span><b>$${r.stake.toFixed(2)}</b></div>
                <div class="plan-metric"><span>${r.mode === 'crypto' ? 'İşlem Başı Net Kâr' : 'İşlem Başı Kâr'}</span><b>${perProfit >= 0 ? '' : '-'}$${Math.abs(perProfit).toFixed(2)}</b></div>
                <div class="plan-metric"><span>Günlük Hedef</span><b>$${r.targetProfit.toFixed(2)}</b></div>
                <div class="plan-metric good"><span>Model</span><b>${detail}</b></div>
            `;
            return r.stake;
        }

        function omega_EnsureTodaySlotCount() {
            omega_EnsureFinanceSettings();
            const key = omega_TodayKey();
            if (!_DAILY_SLOTS[key]) _DAILY_SLOTS[key] = [];
            while (_DAILY_SLOTS[key].length < 20) _DAILY_SLOTS[key].push(omega_NewSlot(_DAILY_SLOTS[key].length));
            if (_DAILY_SLOTS[key].length > 20) _DAILY_SLOTS[key] = _DAILY_SLOTS[key].slice(0, 20);
            _DAILY_SLOTS[key].forEach((slot, i) => {
                if (!slot || typeof slot !== 'object') _DAILY_SLOTS[key][i] = omega_NewSlot(i);
                _DAILY_SLOTS[key][i].index = i + 1;
            });
            return _DAILY_SLOTS[key];
        }

        function omega_GetTodaySlots() { return omega_EnsureTodaySlotCount(); }

        function omega_BuildDailyStatusPanel(slots) {
            const wins = slots.filter(s => s.status === 'win').length;
            const losses = slots.filter(s => s.status === 'loss').length;
            const pending = slots.filter(s => s.status === 'pending').length;
            const empty = slots.filter(s => !s.status || s.status === 'empty').length;
            const pnl = slots.reduce((sum, s) => sum + (Number(s.pnl) || 0), 0);
            const risk = slots.filter(s => s.status === 'pending').reduce((sum, s) => sum + (parseFloat(s.stake) || 0), 0);
            const todayKey = omega_TodayKey();
            const todayLog = omega_FilterLedgerByKey(todayKey);
            const betLog = todayLog.filter(x => (x.type || 'bet') === 'bet');
            const cryptoLog = todayLog.filter(x => x.type === 'crypto');
            const logPnl = todayLog.reduce((sum, item) => sum + Number(item.pnl || 0), 0);
            const lastRows = todayLog.slice(0, 5).map(item => `
                <li>
                    <span>${omega_FormatLogDate(item.id || item.resolvedAt)}</span>
                    <b>${(item.name || (item.type === 'crypto' ? 'Kripto işlem' : 'Bahis / maç')).toString().replace(/[<>]/g,'')}</b>
                    <em class="${Number(item.pnl || 0) >= 0 ? 'pos' : 'neg'}">${omega_MoneySigned(item.pnl)}</em>
                </li>`).join('') || `<li class="empty"><span>Bugün log yok.</span><b>W/L ile kapatınca burada kalır.</b><em>-</em></li>`;
            return `
                <div class="v751-daily-control v753-daily-log-control">
                    <div class="v751-daily-title">
                        <b>Günlük 20 Alan + LOG</b>
                        <span>Satırları aşağıdaki tabloda doldur. W/L ile kapatınca sonuç otomatik LOG'a düşer; yarın yeni günlük tablo açılır.</span>
                    </div>
                    <div class="v751-daily-metrics">
                        <div><span>Alan</span><b>${slots.length}/20</b></div>
                        <div><span>Bekleyen</span><b>${pending}</b></div>
                        <div><span>Boş</span><b>${empty}</b></div>
                        <div><span>W / L</span><b>${wins} / ${losses}</b></div>
                        <div><span>Açık Risk</span><b>$${risk.toFixed(2)}</b></div>
                        <div><span>Gün K/Z</span><b class="${pnl >= 0 ? 'pos' : 'neg'}">${omega_MoneySigned(pnl)}</b></div>
                    </div>
                    <div class="v753-daily-log-summary">
                        <div><span>Bugün LOG</span><b>${todayLog.length} kayıt</b><em class="${logPnl >= 0 ? 'pos' : 'neg'}">${omega_MoneySigned(logPnl)}</em></div>
                        <div><span>Bahis LOG</span><b>${betLog.length}</b><em>${betLog.filter(x=>x.res==='win').length}W / ${betLog.filter(x=>x.res==='loss').length}L</em></div>
                        <div><span>Kripto LOG</span><b>${cryptoLog.length}</b><em>${cryptoLog.filter(x=>x.res==='win').length}W / ${cryptoLog.filter(x=>x.res==='loss').length}L</em></div>
                    </div>
                    <ul class="v753-daily-log-list">${lastRows}</ul>
                </div>`;
        }


        function omega_ApplyStakeToEmptySlots() {
            const r = omega_CalculateRecommendedStake();
            window.__lastFinancePlan = r;
            const slots = omega_GetTodaySlots();
            let applied = 0;
            slots.forEach((slot) => {
                if(slot.status !== 'win' && slot.status !== 'loss') {
                    slot.type = _FINANCE_MODE;
                    if(!slot.name) slot.name = '';
                    slot.stake = Number(r.stake.toFixed(2));
                    if(_FINANCE_MODE === 'crypto') {
                        slot.odds = '';
                        slot.exchange = _FINANCE_SETTINGS.cryptoDefaultExchange || 'binance';
                        slot.quote = _FINANCE_SETTINGS.cryptoDefaultQuote || 'USDT';
                        slot.symbol = (_FINANCE_SETTINGS.cryptoDefaultSymbol || 'BTC').toUpperCase();
                        slot.side = _FINANCE_SETTINGS.cryptoDefaultSide || 'long';
                        slot.entry = slot.entry || '';
                    } else {
                        slot.odds = Number(r.odds.toFixed(4));
                    }
                    slot.status = 'pending';
                    applied++;
                }
            });
            omega_SaveFinanceAll();
            omega_RenderDailyTradeGrid();
            omega_RefreshFinanceDashboard();
            omega_CalculateStakePlan();
            omega_FinanceToast(`${applied} açık alana önerilen tutar yazıldı. Kapalı W/L satırlarına dokunulmadı.`);
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
                const fee = Math.max(0, Number(slot.fee || slot.cost || 0));
                const grossPnl = stake * change;
                const pnl = grossPnl - fee;
                pnlText = `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} net · ${(change*100).toFixed(2)}%${fee ? ' · fee $' + fee.toFixed(2) : ''}`;
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
            let html = `${omega_BuildDailyStatusPanel(slots)}<table class="trade-table trade-table-v35"><thead><tr><th>#</th><th>Tür</th><th>Bahis / Kripto Detayı</th><th>Tutar / Marjin</th><th>Oran / K/Z</th><th>Canlı Takip</th><th>Durum</th><th>K/Z</th><th>Sonuç</th></tr></thead><tbody>`;
            slots.forEach((slot, idx) => {
                const pnl = Number(slot.pnl || 0);
                const pnlClass = pnl >= 0 ? 'pnl-pos' : 'pnl-neg';
                const typeCls = slot.type === 'crypto' ? 'slot-type-crypto' : 'slot-type-bet';
                const statusCls = slot.status === 'win' ? 'status-win' : slot.status === 'loss' ? 'status-loss' : slot.status === 'pending' ? 'status-pending' : 'status-empty';
                const liveHtml = slot.type === 'crypto' ? omega_BuildCryptoLiveCell(slot, idx) : `<span class="crypto-live-pill bet">Bahis sonucu manuel</span>`;
                const nameHtml = slot.type === 'crypto' ? `
                    <div class="slot-symbol-row">
                        <select class="slot-mini-input" onchange="omega_UpdateSlot(${idx}, 'exchange', this.value)"><option value="binance" ${slot.exchange !== 'okx' ? 'selected' : ''}>Binance</option><option value="okx" ${slot.exchange === 'okx' ? 'selected' : ''}>OKX</option></select>
                        <select class="slot-mini-input" onchange="omega_UpdateSlot(${idx}, 'quote', this.value)"><option value="USDT" ${(slot.quote || 'USDT') === 'USDT' ? 'selected' : ''}>USDT</option><option value="USDC" ${(slot.quote || 'USDT') === 'USDC' ? 'selected' : ''}>USDC</option></select>
                        <input class="slot-mini-input" list="crypto-symbol-list" value="${slot.symbol || ''}" placeholder="BTC" onchange="omega_UpdateSlot(${idx}, 'symbol', this.value)">
                        <select class="slot-mini-input" onchange="omega_UpdateSlot(${idx}, 'side', this.value)"><option value="long" ${(slot.side || 'long') === 'long' ? 'selected' : ''}>LONG</option><option value="short" ${slot.side === 'short' ? 'selected' : ''}>SHORT</option></select>
                    </div>
                    <input type="text" value="${slot.name || ''}" placeholder="Alınan işlem notu: BTC Long, SOL Short..." onchange="omega_UpdateSlot(${idx}, 'name', this.value)" style="margin-top:6px;">
                    <input class="slot-mini-input" type="number" value="${slot.entry || ''}" placeholder="Giriş fiyatı (opsiyonel)" onchange="omega_UpdateSlot(${idx}, 'entry', this.value)" style="margin-top:6px;">
                    <input class="slot-mini-input" type="number" value="${slot.fee || ''}" placeholder="Fee/Funding $" onchange="omega_UpdateSlot(${idx}, 'fee', this.value)" style="margin-top:6px;">
                ` : `<input type="text" value="${slot.name || ''}" placeholder="Oynanan maç / bahis notu" onchange="omega_UpdateSlot(${idx}, 'name', this.value)">`;
                const oddsPlaceholder = slot.type === 'crypto' ? 'K/Z manuel $' : 'Alınan oran';
                const oddsStep = slot.type === 'crypto' ? '0.01' : '0.01';
                html += `<tr>
                    <td style="font-family:'JetBrains Mono'; color:var(--muted); font-weight:900;">${idx+1}</td>
                    <td><select class="${typeCls}" onchange="omega_UpdateSlot(${idx}, 'type', this.value)"><option value="bet" ${slot.type === 'bet' ? 'selected' : ''}>BAHİS</option><option value="crypto" ${slot.type === 'crypto' ? 'selected' : ''}>KRİPTO</option></select></td>
                    <td>${nameHtml}</td>
                    <td><input class="slot-money-input" type="number" value="${slot.stake || ''}" placeholder="${slot.type === 'crypto' ? 'Marjin / tutar' : 'Tutar'}" onchange="omega_UpdateSlot(${idx}, 'stake', this.value)"></td>
                    <td><input class="slot-odds-input" type="number" value="${slot.odds || ''}" step="${oddsStep}" placeholder="${oddsPlaceholder}" onchange="omega_UpdateSlot(${idx}, 'odds', this.value)"></td>
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
            if(['stake','odds','entry','fee'].includes(field)) value = parseFloat(value) || '';
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
            if(['type','exchange','quote','symbol','side','entry','fee'].includes(field)) {
                omega_RenderDailyTradeGrid();
                omega_RefreshCryptoLive(true);
            }
        }

        function omega_ResolveDailySlot(index, result) {
            const slot = omega_GetTodaySlots()[index]; if(!slot) return;
            const stake = parseFloat(slot.stake);
            const oddsOrPnl = parseFloat(slot.odds);
            if(isNaN(stake) || stake <= 0) { alert('Tutar / marjin gir.'); return; }
            let pnl;
            if(slot.type === 'crypto') {
                if(isNaN(oddsOrPnl)) { alert('Kripto satırı için net K/Z tutarını gir. Örnek: 12.5'); return; }
                const fee = Math.max(0, parseFloat(slot.fee || 0) || 0);
                pnl = result === 'win' ? (Math.abs(oddsOrPnl) - fee) : -(Math.abs(oddsOrPnl) + fee);
            } else {
                if(isNaN(oddsOrPnl) || oddsOrPnl <= 1) { alert('Bahis satırı için alınan oran gir.'); return; }
                pnl = result === 'win' ? stake * (oddsOrPnl - 1) : -stake;
            }
            slot.status = result; slot.pnl = pnl; slot.resolvedAt = Date.now(); slot.name = slot.name || `${slot.type === 'crypto' ? 'KRİPTO' : 'BAHİS'} #${index+1}`;
            _WALLET_BALANCE += pnl; _BALANCE_HISTORY.push(Number(_WALLET_BALANCE.toFixed(2)));
            _COMPLETED_LEDGER.unshift({ id: slot.resolvedAt, resolvedKey: omega_TodayKey(), name: slot.name, type: slot.type, amt: stake, odds: oddsOrPnl || 0, fee: slot.type === 'crypto' ? Math.max(0, parseFloat(slot.fee || 0) || 0) : 0, res: result, pnl, bal: _WALLET_BALANCE });
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
            let headerHtml = `<tr><th>TARİH</th><th>TÜR</th><th>LOG</th><th>TUTAR</th><th>ORAN / NET K/Z</th><th>FEE</th><th>DURUM</th><th>K/Z</th><th>KASA</th></tr>`;
            let rowsHtml = '';
            const list = [..._PENDING_OPS.map(x=>({...x,pending:true})), ..._COMPLETED_LEDGER.slice(0,40)];
            if(list.length===0) rowsHtml = `<tr><td colspan="9" style="text-align:center; padding:28px; color:var(--muted); font-weight:900;">Henüz LOG kaydı yok. W/L ile kapattığın işlemler burada kalır.</td></tr>`;
            list.forEach(item=>{
                const dateStr = new Date(item.id).toLocaleDateString('tr-TR');
                const statusBadge = item.pending ? `<span style="color:var(--gold); font-weight:900;">BEKLEMEDE</span>` : item.res==='win' ? `<b style="color:var(--green)">KAZANDI</b>` : `<b style="color:var(--red)">KAYBETTİ</b>`;
                const pnlDisplay = item.pending ? '-' : `<span style="color:${item.pnl>=0?'var(--green)':'var(--red)'}; font-weight:900;">${item.pnl>=0?'+':''}${item.pnl.toFixed(2)}</span>`;
                const valueLabel = (item.type || 'bet') === 'crypto' ? `$${Number(item.odds||0).toFixed(2)}` : `@${Number(item.odds||0).toFixed(2)}`;
                const feeLabel = (item.type || 'bet') === 'crypto' && Number(item.fee || 0) ? '$' + Number(item.fee || 0).toFixed(2) : '-';
                rowsHtml += `<tr><td>${dateStr}</td><td>${omega_TypeText(item.type||'bet')}</td><td style="color:#fff; font-weight:800;">${item.name}</td><td>$${Number(item.amt||0).toFixed(2)}</td><td>${valueLabel}</td><td>${feeLabel}</td><td>${statusBadge}</td><td>${pnlDisplay}</td><td>${item.bal?'$'+Number(item.bal).toFixed(2):'-'}</td></tr>`;
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
        let _FINANCE_CHART_FILTER = localStorage.getItem('finance_chart_filter') || 'all';

        function omega_SetFinanceChartFilter(filter) {
            _FINANCE_CHART_FILTER = ['all','bet','crypto'].includes(filter) ? filter : 'all';
            localStorage.setItem('finance_chart_filter', _FINANCE_CHART_FILTER);
            document.querySelectorAll('.finance-chart-tabs button').forEach(btn => btn.classList.remove('active'));
            const active = document.getElementById('finance-chart-tab-' + _FINANCE_CHART_FILTER);
            if(active) active.classList.add('active');
            omega_RenderApexSupremeChart();
        }

        function omega_BuildFilteredBalanceSeries(filter) {
            const initial = Number((_BALANCE_HISTORY && _BALANCE_HISTORY[0]) || _FINANCE_SETTINGS.startBank || 100);
            if(filter === 'all') {
                const all = (_BALANCE_HISTORY && _BALANCE_HISTORY.length) ? _BALANCE_HISTORY.map(Number) : [Number(_WALLET_BALANCE || initial)];
                return { balances: all.length ? all : [initial], hasData: all.length > 1 };
            }
            const done = (_COMPLETED_LEDGER || []).slice().reverse().filter(item => (item.type || 'bet') === filter);
            const balances = [initial];
            let bal = initial;
            done.forEach(item => {
                bal += Number(item.pnl || 0);
                balances.push(Number(bal.toFixed(2)));
            });
            return { balances, hasData: done.length > 0 };
        }

        function omega_RenderApexSupremeChart() {
            const chartDiv = document.querySelector('#omega-apex-chart-main'); if(!chartDiv) return;
            document.querySelectorAll('.finance-chart-tabs button').forEach(btn => btn.classList.remove('active'));
            const active = document.getElementById('finance-chart-tab-' + _FINANCE_CHART_FILTER);
            if(active) active.classList.add('active');

            if(_SUPREME_CHART_INSTANCE) { try { _SUPREME_CHART_INSTANCE.destroy(); } catch(e){} _SUPREME_CHART_INSTANCE = null; }
            const built = omega_BuildFilteredBalanceSeries(_FINANCE_CHART_FILTER);
            const balanceData = built.balances;
            if(!built.hasData) {
                const label = _FINANCE_CHART_FILTER === 'crypto' ? 'kripto işlemi' : _FINANCE_CHART_FILTER === 'bet' ? 'bahis işlemi' : 'işlem';
                chartDiv.innerHTML = `<div class="finance-empty-chart"><b>Henüz bakiye geçmişi yok</b><span>İlk ${label} kapandığında kasa eğrisi burada oluşacak.</span></div>`;
                omega_RenderBarriers();
                return;
            }

            chartDiv.innerHTML = '';
            const pnlData = balanceData.map((v, i) => i === 0 ? 0 : Number((v - balanceData[i-1]).toFixed(2)));
            const labels = balanceData.map((_, i) => i === 0 ? 'Başlangıç' : `${i}. işlem`);
            const minBal = Math.min(...balanceData);
            const maxBal = Math.max(...balanceData);
            const visibleBarriers = FINANCE_BARRIERS.filter(x => x >= minBal * 0.80 && x <= Math.max(maxBal * 1.25, 1000));
            const annotations = { yaxis: visibleBarriers.map(v => ({ y:v, borderColor:'#34343a', strokeDashArray:5, label:{ text:'$'+v.toLocaleString('en-US'), style:{ background:'#151515', color:'#c8c8c8', fontSize:'10px' } } })) };
            const chartOptions = {
                series:[
                    { name:_FINANCE_CHART_FILTER === 'all' ? 'Kasa' : (_FINANCE_CHART_FILTER === 'crypto' ? 'Kripto Kasa' : 'Bahis Kasa'), type:'line', data: balanceData },
                    { name:'P/L', type:'column', data:pnlData }
                ],
                chart:{ type:'line', height:'100%', toolbar:{show:false}, background:'transparent', animations:{enabled:true, speed:420}, stacked:false },
                theme:{ mode:'dark' },
                colors:[_FINANCE_CHART_FILTER === 'crypto' ? '#60a5fa' : '#fbbf24', '#10b981'],
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
            _SUPREME_CHART_INSTANCE = new ApexCharts(chartDiv, chartOptions);
            _SUPREME_CHART_INSTANCE.render();
            omega_RenderBarriers();
        }

        
        function omega_CheckRollingHashOnLoad() {
            const m = String(location.hash || '').match(/^#finance\/rolling\/(\d+)/);
            if(!m) return;
            const days = parseInt(m[1]);
            if(![7,15,30,60,90].includes(days)) return;
            if(typeof omega_SwitchMainTab === 'function') {
                const el = document.getElementById('nav-finance');
                omega_SwitchMainTab('finance', el, false);
            }
            const run = () => omega_OpenRollingExcel(days, true);
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', run, { once:true });
            } else {
                requestAnimationFrame(run);
            }
        }
        window.addEventListener('hashchange', omega_CheckRollingHashOnLoad);
        document.addEventListener('DOMContentLoaded', omega_CheckRollingHashOnLoad);
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
