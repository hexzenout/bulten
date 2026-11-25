# FILE MAP

## Ana Dosyalar
- AGENTS.md
- index.html
- sw.js
- manifest.webmanifest
- requirements.txt
- bulten.py
- motor.py
- v19_motor.py
- live_score_motor.py
- canli_oranlar.json
- live_scores.json
- v19_rapor.json

## JS Modülleri
- assets/js/00-omega-core.js
- assets/js/10-radar-core.js
- assets/js/20-stream-core.js
- assets/js/30-finance-core.js
- assets/js/40-live-center-core.js
- assets/js/50-daily-trade-core.js
- assets/js/55-odds-terminal.js
- assets/js/60-crypto-core.js
- assets/js/70-rolling-core.js
- assets/js/71-finance-ui.js
- assets/js/72-crypto-ui.js
- assets/js/73-crypto-alarm-audio.js
- assets/js/74-crypto-alarm-center.js
- assets/js/80-app-fixes.js
- assets/js/82-firebase-core.js
- assets/js/83-crypto-panel.js
- assets/js/84-crypto-tv-chart.js
- assets/js/85-cleanup-core.js
- assets/js/86-crypto-professional.js
- assets/js/90-ui-menu-fixes.js
- assets/js/91-runtime-core.js
- assets/js/92-healthcheck.js
- assets/js/95-kasa-challenge.js
- assets/js/pwa.js

## Kasa Challenge (İzole Iframe Modülü)
- assets/kasa-challenge/kasa-challenge.html
- assets/kasa-challenge/vendor/chart.umd.min.js

## CSS Dosyaları
- assets/css/00-base.css
- assets/css/10-route-crypto.css
- assets/css/20-module-helpers.css
- assets/css/30-finance-core.css
- assets/css/31-finance-panels.css
- assets/css/40-rolling-prep.css
- assets/css/41-rolling-main.css
- assets/css/42-rolling-route.css
- assets/css/43-rolling-final.css
- assets/css/50-sound-center.css
- assets/css/55-odds-terminal-final-ui.css
- assets/css/55-odds-terminal-live-gate.css
- assets/css/55-odds-terminal.css
- assets/css/90-final-fixes.css
- assets/css/95-kasa-challenge.css

## Data / JSON Dosyaları
- assets/data/55-odds-terminal-catalog.json
- assets/data/55-odds-terminal-runtime.json
- assets/data/odds-sources.json
- assets/data/odds-snapshot.json

## Workflow Dosyaları
- .github/workflows/update-radar.yml
- .github/workflows/update-live-scores.yml

## Docs Dosyaları
- docs/BULTEN_CONTEXT.md
- docs/BUGS.md
- docs/TODO.md
- docs/CHANGELOG.md
- docs/FILE_MAP.md
- docs/PROJECT_SETUP_NOTES.md

## Dokunulmaması Gerekenler
- sw.js sadece gerçekten gerekirse değiştirilecek.
- Gereksiz service worker/cache değişikliği yapılmayacak.
- Route sızıntısı oluşturulmayacak.

## Son Güncelleme
- V1296: Eksik `crypto.js` 404 çağrısı kaldırıldı; `live_scores.json` <-> Canlı Takip Merkezi (`matches`, `home_goals`/`away_goals`) şeması hizalandı; `#live` ve `#rolling` route sızıntıları ve tekrarlı `hashchange` dinleyicisi düzeltildi; `index.html` preboot/CSS linkleri sadeleştirildi; kullanılmayan yedek klasörler (`BULTEN_V805_*`, `BULTEN_V901_*`, kök `js/`, `css/`) temizlendi. `sw.js` ve workflow dosyaları değiştirilmedi.
- V578: Dry-run payload şeması, nested records desteği ve ham market → katalog market alias eşleşme tablosu eklendi; sw.js ve workflow dosyaları değiştirilmedi.
- V577: Oran Terminali gerçek veri öncesi ana akış konsolide edildi; Veri Akışı Durumu bandı, okunur Oran Karşılaştırma özeti ve sade Kaynaklar akışı eklendi.
- V576: Oran Karşılaştırma / Oran Hareketleri hover popup stabilitesi ve cache-bust akışı korundu.
- V574: Statik snapshot hazırlık özeti korundu; V577 ile Geliştirici Detayları içine taşındı.
- V545: Oran Terminali kategori sırası, Marketler sekmesine özel market dropdown, geniş futbol/basket market listeleri ve POLYMARKET tek tıklama davranışı düzeltildi.
- Bu güncellemede sw.js değiştirilmedi; index.html sadece v578 cache-bust için değişti.
