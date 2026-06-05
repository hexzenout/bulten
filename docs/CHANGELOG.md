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

### V546 - 2026-06-05
#### Değişenler
- Oran Terminali'nde Bahis Türü / Market dropdown yapısı tamamen kaldırıldı.
- Marketler sekmesi arama kutulu geniş futbol + basketbol market kataloğu haline getirildi.
- Futbol marketleri 16 kategoriye ayrıldı; maç sonucu kombinasyonları, dakika/gol generator marketleri, korner, kart, handikap, oyuncu, istatistik, seri gol, skor, galibiyet farkı, geri dönüş ve penaltı başlıkları eklendi.
- Basketbol marketleri 16 kategoriye ayrıldı; ana marketler, çeyrek, takım sayı, handikap, sembolik baraj, ilk X sayı, oyuncu, takım istatistikleri ve seri sayı başlıkları eklendi.
- POLYMARKET logosu binary dosya eklenmeden, gönderilen görsele benzeyen beyaz inline SVG işaretine çevrildi.
- STORE_KEY v546_odds_terminal_state olarak yenilendi.

#### Düzeltilenler
- POLYMARKET ana kategori olarak TÜMÜ | FUTBOL | BASKETBOL | POLYMARKET sırasında ve BASKETBOL'un hemen sağında kalır.
- POLYMARKET tek tıklamada kendi panelini açar; klasik futbol/basket market kataloğu POLYMARKET içinde görünmez.
- Tümü seçiliyken futbol + basketbol marketleri, Futbol seçiliyken sadece futbol, Basketbol seçiliyken sadece basketbol marketleri listelenir.
- Market araması 2.5, korner, ilk 5 dakika korner, 68.5, oyuncu faul, isabetli şut, art arda gol ve ilk X sayıya ulaşan gibi sorguları yakalayacak şekilde genişletildi.

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
- live_scores.json
- v19_rapor.json
- canli_oranlar.json
- assets/data/odds-sources.json
- assets/js/20-stream-core.js
- assets/js/60-crypto-core.js
- assets/js/70-rolling-core.js
- .github/workflows/update-radar.yml
- .github/workflows/update-live-scores.yml

#### Test Notları
- node --check assets/js/55-odds-terminal.js geçti.
- Market katalog fixture ve kötü isim taraması geçti.
- JSON dosyası değiştirilmedi; parse testi gerekmedi.
- sw.js, index.html, canlı skor/rapor JSON'ları ve workflow dosyaları değiştirilmedi.

#### Sıradaki Hedef
- Gerçek verilere yavaş geçişte ilk adım market taxonomy ile canlı oran datasını eşleştirmek olacak.
- İleride takım trend hafızası; ilk yarı gol atma/yeme, 30. dakikaya kadar gol bulma, korner/kart/ilk gol trendleri gibi sinyaller tutulacak.
- Basketbolda gerçek veri gelince sembolik line marketleri, Her İki Takım da ____ Üst Sayı Atar ve İlk X Sayıya Ulaşan Takım gibi marketler maç bazlı dinamik üretilecek.

### V545 - 2026-06-05
#### Değişenler
- Oran Terminali ana kategori satırı temiz sırayla TÜMÜ | FUTBOL | BASKETBOL | POLYMARKET oldu.
- POLYMARKET butonu BASKETBOL'un hemen sağına alındı; koyu mavi marka hissi ve beyaz inline SVG işareti korundu.
- Bahis Türü / Market alanı sadece Marketler sekmesi aktifken görünecek şekilde izole edildi.
- STORE_KEY v545_odds_terminal_state olarak yenilendi; eski V544 localStorage state'i bu düzeltmeyi bozmayacak.
- Futbol ve basketbol market listelerine eksik yaygın marketler eklendi; kötü basketbol isimleri temiz adlarla korundu.

#### Düzeltilenler
- POLYMARKET tek tıklamada ana kategori olarak aktifleşip kendi panelindeki kartları gösterir.
- Dropdown açıkken kategori tıklaması ilk tıklamada kategori değiştirir; dropdown sonradan kapanır.
- Market kartları koyu gri normal ton, yumuşak hover, daha küçük başlık/açıklama ve kontrollü padding/radius ile sıkılaştırıldı.
- Eski conflictli POLYMARKET bridge katmanı kaldırıldı; #rolling, #crypto ve #stream modüllerine dokunulmadı.

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
- live_scores.json
- v19_rapor.json
- canli_oranlar.json
- assets/js/20-stream-core.js
- assets/js/60-crypto-core.js
- assets/js/70-rolling-core.js
- .github/workflows/update-radar.yml
- .github/workflows/update-live-scores.yml

#### Test Notları
- node --check assets/js/55-odds-terminal.js geçti.
- JSON dosyası değiştirilmedi; parse testi gerekmedi.
- sw.js, index.html, live_scores.json, v19_rapor.json ve canli_oranlar.json değiştirilmedi.

#### Sıradaki Hedef
- Gerçek oran veri modeli ve Polymarket API motoru tasarlanacak.

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
