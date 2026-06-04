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

### V544 - 2026-06-04
#### Değişenler
- Oran Terminali ana kategori satırı TÜMÜ | FUTBOL | BASKETBOL | POLYMARKET düzenine alındı.
- POLYMARKET en sağda koyu mavi marka butonu olarak konumlandırıldı; yazının kesilmemesi için ellipsis yerine yatay taşma/scroll yaklaşımı uygulandı.
- Bahis Türü / Market dropdown'u kategori tıklamalarını yutmayacak ve sayfayı aşağı itmeyecek floating overlay davranışına alındı.
- Üst analiz sekmeleri Fırsat Radarı, Marketler, Oran Karşılaştırma, Oran Hareketleri, Kaynaklar olarak sadeleştirildi.
- Futbol market listesi gerçekçi ana sonuç, gol, yarı, korner/kart ve handikap marketleriyle temizlendi; VAR gibi ütopik marketler UI listesinden gizlendi.
- Basketbol market listesi takım, periyot ve oyuncu marketleriyle genişletildi; kötü isimlendirmeler Maç Handikapı / Toplam Sayı Alt Üst gibi net adlarla değiştirildi.
- Yanıltıcı Garantili Kazanç dili Arbitraj Adayları olarak değiştirildi.
- STORE_KEY v544_odds_terminal_state olarak güncellendi.

#### Düzeltilenler
- Dropdown açıkken FUTBOL / BASKETBOL / POLYMARKET tıklamasının ilk tıklamada çalışmaması düzeltildi.
- Dropdown açıkken POLYMARKET yazısının kaybolması/kesilmesi engellendi.
- POLYMARKET normal futbol/basket tablolarına karışmadan #odds içinde izole kalır.

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
- .github/workflows/update-radar.yml
- .github/workflows/update-live-scores.yml

#### Test Notları
- node --check assets/js/55-odds-terminal.js geçti.
- odds-snapshot.json ve odds-sources.json JSON parse testleri geçti.
- sw.js ve index.html değiştirilmedi.

#### Sıradaki Hedef
- Gerçek oran veri modeli ve Polymarket API motoru tasarlanacak.

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
