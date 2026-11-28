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
        let _ACTIVE_LAYOUT = parseInt(localStorage.getItem('v49_stream_layout')) || 1;
        let _ACTIVE_STREAMS = JSON.parse(localStorage.getItem('v19_streams')) || ["","","","","",""];

        const HIERARCHY_SCORES = {
            "TÜRKİYE - SÜPER LİG": 4000, "İNGİLTERE - PREMIER LEAGUE": 3900, "İSPANYA - LA LIGA": 3800,
            "ALMANYA - BUNDESLIGA": 3700, "İTALYA - SERIE A": 3600, "İITALYA - SERIE A": 3600, "FRANSA - LIGUE 1": 3500,
            "AVRUPA - CHAMPIONS LEAGUE": 3400, "AVRUPA - EUROPA LEAGUE": 3300, "AVRUPA - CONFERENCE LEAGUE": 3200,
            "TÜRKİYE - 1. LİG": 3000,
            "AVRUPA - EUROLEAGUE": 4900, "AMERİKA - NBA": 4800, "TÜRKİYE - BSL": 4700, "TÜRKİYE - KBSL": 4650,
            "İSPANYA - LIGA ACB": 4600, "İTALYA - LEGA A": 4500, "FRANSA - LNB PRO A": 4400,
            "ALMANYA - BBL": 4300, "AVRUPA - EUROCUP": 4200, "AVRUPA - BCL": 4100,
            "AMERİKA - NCAA": 4000, "RUSYA - VTB": 3900, "AMERİKA - WNBA": 3800,
            "AVRUPA - FIBA": 3750, "AVUSTRALYA - NBL": 3700, "JAPONYA - B.LEAGUE": 3650,
            "TAYVAN - P.LEAGUE+": 3600, "FİLİPİNLER - PBA": 3550, "FİLİPİNLER - MPBL": 3500
        };

        const GOLD_BASKET_LIST = [
            "AMERİKA - NBA", "AVRUPA - EUROLEAGUE", "TÜRKİYE - BSL", "TÜRKİYE - KBSL", "İSPANYA - LIGA ACB",
            "İTALYA - LEGA A", "FRANSA - LNB PRO A", "ALMANYA - BBL", "AVRUPA - EUROCUP",
            "AVRUPA - BCL", "AMERİKA - NCAA", "RUSYA - VTB", "AMERİKA - WNBA",
            "AVRUPA - FIBA", "AVUSTRALYA - NBL", "JAPONYA - B.LEAGUE",
            "TAYVAN - P.LEAGUE+", "FİLİPİNLER - PBA", "FİLİPİNLER - MPBL"
        ];

        const ROLLING_TARGETS = { 7: 1000, 15: 5000, 30: 15000, 60: 40000, 90: 100000 };

        const OMEGA_VALID_TABS = ['futbol', 'basketbol', 'rolling', 'kasa-challenge', 'stream', 'favs', 'live', 'odds', 'crypto', 'finance'];

        window.addEventListener('DOMContentLoaded', () => {
            const rawHash = window.location.hash.replace('#', '') || 'futbol';
            const hash = rawHash.split('/')[0] || 'futbol';
            if (OMEGA_VALID_TABS.includes(hash)) {
                omega_SwitchMainTab(hash, document.getElementById('nav-' + hash), false);
            } else {
                omega_SwitchMainTab('futbol', document.getElementById('nav-futbol'), false);
            }
            omega_InitializeEngine();
        });

        
        function omega_HandleHashRouteV38() {
            const rawHash = window.location.hash.replace('#', '') || 'futbol';
            const hash = rawHash.split('/')[0] || 'futbol';
            if (OMEGA_VALID_TABS.includes(hash)) {
                const el = document.getElementById('nav-' + hash);
                omega_SwitchMainTab(hash, el, false);
            }
        }

        window.addEventListener('hashchange', omega_HandleHashRouteV38);

window.addEventListener('popstate', (e) => {
            if(e.state && e.state.tab) {
                const el = document.getElementById('nav-' + e.state.tab);
                if(el) omega_SwitchMainTab(e.state.tab, el, false);
            }
        });

        
        /* Radar/Bulletin functions moved to assets/js/radar-core.js */

        /* Stream module functions moved to assets/js/stream-core.js */

        
        /* Finance module functions moved to assets/js/finance-core.js */

        
        /* Live center functions moved to assets/js/live-center-core.js */

        
        /* Daily trade / tracking table overrides moved to assets/js/daily-trade-core.js */

        /* Crypto module functions moved to assets/js/crypto-core.js */
