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
- assets/js/pwa.js

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
- assets/css/55-odds-terminal.css
- assets/css/90-final-fixes.css

## Data / JSON Dosyaları
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
- V545: Oran Terminali kategori satırı, POLYMARKET logo/tıklama, Marketler sekmesi picker konumu ve geniş market listeleri düzeltildi.
- V544: Oran Terminali ana kategori/dropdown UX düzeltildi; POLYMARKET marka butonu ve temiz market listeleri eklendi.
- V542: Oran Terminali ana fırsatlar ekranının altına izole POLYMARKET kısa özet/dock alanı eklendi.
- V541: Oran Terminali altında POLYMARKET paneli eklendi.
- Bu güncellemede sw.js ve index.html değiştirilmedi.
