# CHANGELOG

## Kullanım
Her paket/güncelleme sonrası bu dosya güncellenecek.

## Format

### VXX - Tarih
#### Değişenler
- ...

#### Düzeltilenler
- ...

#### Değişen Dosyalar
- ...

#### Değişmeyen Dosyalar
- ...

#### Test Notları
- ...

#### Sıradaki Hedef
- ...

### V543 - 2026-06-04
#### Değişenler
- POLYMARKET, Oran Terminali içinde FUTBOL/BASKETBOL ile aynı seviyede ana kategoriye alındı.
- Ana kategori sırası TÜMÜ | FUTBOL | BASKETBOL | POLYMARKET olarak sabitlendi.
- Eski analiz sekmeleri arasındaki POLYMARKET sekmesi kaldırıldı; POLYMARKET ayrı route açmadan #odds içinde ana kategori olarak çalışır.
- STORE_KEY v543_odds_terminal_state olarak yenilendi; eski basketbol/market seçimlerinin takılı kalma riski azaltıldı.
- Futbol market görünürlüğü UI tarafında 0.5/1.5/2.5/3.5 gol, genel gol üstleri ve KG başlıklarıyla güçlendirildi.

#### Düzeltilenler
- Bahis Türü / Market dropdown'unun sayfayı aşağı itme/aşağı kaydırma riski floating overlay davranışıyla düzeltildi.
- POLYMARKET seçiliyken normal Bahis Türü / Market dropdown gizlenip pasif bilgi alanına dönüştürüldü.
- POLYMARKET kayıtlarının normal futbol/basket oran tablolarına karışmaması korundu.

#### Değişen Dosyalar
- assets/js/55-odds-terminal.js
- assets/css/55-odds-terminal.css
- docs/BULTEN_CONTEXT.md
- docs/BUGS.md
- docs/TODO.md
- docs/CHANGELOG.md
- docs/FILE_MAP.md
- PATCH_NOTES.md

#### Değişmeyen Dosyalar
- sw.js
- index.html
- assets/data/odds-snapshot.json
- assets/data/odds-sources.json
- assets/js/20-stream-core.js
- assets/js/60-crypto-core.js
- assets/js/70-rolling-core.js
- .github/workflows/update-radar.yml
- .github/workflows/update-live-scores.yml

#### Test Notları
- node --check assets/js/55-odds-terminal.js geçti.
- odds-snapshot.json ve odds-sources.json JSON parse testleri geçti.
- sw.js ve index.html değiştirilmedi.

#### Sıradaki Hedef
- POLYMARKET gerçek veri çekme motoru/API entegrasyonu tasarlanacak.

### V542 - 2026-06-04
#### Değişenler
- Oran Terminali ana fırsatlar ekranının altına izole POLYMARKET kısa özet/dock alanı eklendi.
- POLYMARKET paneline ayrı alan erişilebilirlik etiketi eklendi.
- Kısa özet alanından POLYMARKET sekmesine geçiş butonu eklendi.

#### Düzeltilenler
- POLYMARKET kayıtlarının normal futbol/basket oran kartlarından ayrı algılanması görsel olarak güçlendirildi.
- Route sızıntısı oluşturmadan sadece #odds içindeki Oran Terminali render akışı kullanıldı.

#### Değişen Dosyalar
- assets/js/55-odds-terminal.js
- assets/css/55-odds-terminal.css
- docs/BULTEN_CONTEXT.md
- docs/BUGS.md
- docs/TODO.md
- docs/CHANGELOG.md
- docs/FILE_MAP.md

#### Değişmeyen Dosyalar
- sw.js
- index.html
- assets/data/odds-snapshot.json
- assets/data/odds-sources.json
- assets/js/20-stream-core.js
- assets/js/60-crypto-core.js
- assets/js/70-rolling-core.js

#### Test Notları
- node --check assets/js/55-odds-terminal.js geçti.
- odds-snapshot.json ve odds-sources.json JSON parse testleri geçti.
- sw.js değiştirilmedi.

#### Sıradaki Hedef
- POLYMARKET gerçek veri çekme motoru/API entegrasyonu tasarlanacak.

### V541 - 2026-06-04
#### Değişenler
- Oran Terminali altında ayrı POLYMARKET sekmesi/paneli eklendi.
- Polymarket kayıtları normal bahis oranı tablolarından ayrıldı.
- Kısa vadeli Polymarket marketleri için güven skoru, edge, kapanış, likidite ve hacim kartları eklendi.
- Demo odds snapshot içine 5 adet Polymarket örnek marketi eklendi.
- FILE_MAP gerçek modüler assets/js ve assets/css yapısına göre güncellendi.

#### Düzeltilenler
- POLYMARKET kayıtlarının Oran Terminali normal oran kıyaslama listelerine karışma riski azaltıldı.
- Route sızıntısı oluşturmadan #odds içinde izole panel yaklaşımı uygulandı.

#### Değişen Dosyalar
- assets/js/55-odds-terminal.js
- assets/css/55-odds-terminal.css
- assets/data/odds-snapshot.json
- docs/BULTEN_CONTEXT.md
- docs/BUGS.md
- docs/TODO.md
- docs/CHANGELOG.md
- docs/FILE_MAP.md

#### Değişmeyen Dosyalar
- sw.js
- index.html
- assets/js/00-omega-core.js
- assets/js/10-radar-core.js
- assets/js/20-stream-core.js
- assets/js/60-crypto-core.js
- assets/js/70-rolling-core.js
- .github/workflows/update-radar.yml
- .github/workflows/update-live-scores.yml

#### Test Notları
- node --check assets/js/55-odds-terminal.js geçti.
- odds-snapshot.json JSON parse testi geçti.
- sw.js değiştirilmedi.

#### Sıradaki Hedef
- POLYMARKET gerçek veri çekme motoru/API entegrasyonu tasarlanacak.
- Futbol/basket bahis türleri canlı veriyle daha geniş beslenecek.
