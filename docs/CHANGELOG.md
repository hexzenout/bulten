# CHANGELOG

## Kullanım
Her paket/güncelleme sonrası bu dosya güncellenecek.

## Format

### V1297 - 2026-11-25
#### Değişenler
- `ROLLING` alt menüsüne üçüncü seçenek olarak `KASA CHALLENGE` (`#kasa-challenge`) eklendi; teknik olarak `#rolling/*` yapısından izole bağımsız route olarak bağlandı.
- `Kasa_Takip_Uygulamasi_v10.html` uygulaması `assets/kasa-challenge/kasa-challenge.html` ve yerel `assets/kasa-challenge/vendor/chart.umd.min.js` (Chart.js v4.4.7) ile izole iframe modülü olarak entegre edildi.
- Kasa Challenge verileri `bulten_kasa_challenge_v1:` prefix'i altına alındı; sıfırlama işlemi yalnızca bu prefix'teki anahtarları temizler.
- Grafik ölçek/eğri ayarı (`computeChartYBounds`, `cubicInterpolationMode: 'monotone'`, `animation: false`) ile ilk kazanma adımındaki aşağı inip çıkma görsel sıçraması giderildi; masaüstünde tek ekrana sığan görünüm ve iframe içi tıklamalarda ana menü kapanma desteği eklendi.

#### Değişen Dosyalar
- index.html
- assets/js/00-omega-core.js
- assets/js/10-radar-core.js
- assets/js/55-odds-terminal.js
- assets/js/60-crypto-core.js
- assets/js/90-ui-menu-fixes.js
- assets/js/92-healthcheck.js
- docs/CHANGELOG.md
- docs/FILE_MAP.md

#### Yeni Dosyalar
- assets/kasa-challenge/kasa-challenge.html
- assets/kasa-challenge/vendor/chart.umd.min.js
- assets/css/95-kasa-challenge.css
- assets/js/95-kasa-challenge.js

#### Değişmeyen Dosyalar
- sw.js
- assets/js/70-rolling-core.js
- assets/js/30-finance-core.js
- assets/js/82-firebase-core.js
- assets/css/43-rolling-final.css

### V1296 - 2026-11-25
#### Değişenler
- `assets/js/80-app-fixes.js` içindeki mevcut olmayan `assets/js/crypto.js` dinamik script yüklemesi (404) kaldırıldı.
- `assets/js/40-live-center-core.js` ve `assets/js/50-daily-trade-core.js` dosyaları `live_score_motor.py` çıktısı (`matches`, `name`, `home_goals`, `away_goals`) ile uyumlu hale getirildi; boş takım adına eşleşme bug'ı giderildi ve `#live-watch-list-page` doğrudan güncellenir hale getirildi.
- `assets/js/10-radar-core.js` ve `assets/js/60-crypto-core.js` içinde `#omega-live-block` ve `#omega-rolling-block` route sızıntıları giderildi; `00-omega-core.js` içindeki tekrarlı `hashchange` dinleyicisi ve `60-crypto-core.js` içindeki erişilemez `odds` dalı temizlendi.
- `index.html` içine `55-odds-terminal-live-gate.css` ve `55-odds-terminal-final-ui.css` statik `<link>` olarak eklendi; tekrarlı `v534-preboot-flicker-guard` ve kullanılmayan `draw` kripto sekmesi kaldırıldı, değişen JS modüllerinin cache-bust sürümü `v1296` yapıldı.
- Kullanılmayan `BULTEN_V805_kasa_hedefi_kalan_mor_fix/`, `BULTEN_V901_tutar_placeholder_uyari_fix/`, kök `js/` ve `css/` kopya dizinleri kaldırıldı.

#### Düzeltilenler
- Açılışta eksik `assets/js/crypto.js` 404 hatası giderildi.
- `live_scores.json` -> Canlı Takip kartları şema uyumsuzluğu giderildi.
- `#live` ve `#rolling` sekmelerinden geçişte blok görünür kalma / body sınıfı sızıntısı giderildi.
- `71-finance-ui.js` sonrası `#live-watch-list-page` alanının boş kalma sorunu giderildi.

#### Değişen Dosyalar
- index.html
- assets/js/00-omega-core.js
- assets/js/10-radar-core.js
- assets/js/40-live-center-core.js
- assets/js/50-daily-trade-core.js
- assets/js/60-crypto-core.js
- assets/js/80-app-fixes.js
- docs/BULTEN_CONTEXT.md
- docs/BUGS.md
- docs/TODO.md
- docs/CHANGELOG.md
- docs/FILE_MAP.md

#### Değişmeyen Dosyalar
- sw.js
- .github/workflows/update-radar.yml
- .github/workflows/update-live-scores.yml
- assets/data/odds-sources.json
- assets/data/odds-snapshot.json
- assets/js/20-stream-core.js
- assets/js/55-odds-terminal.js
- assets/js/70-rolling-core.js

#### Sıradaki Hedef
- Oran Terminali / POLYMARKET canlı veri akışını bağlamak ve Firebase bulut senkronizasyonunu tamamlamak.

### V578 - 2026-06-08
#### Değişenler
- Dry-run payload kontrolüne şema rehberi eklendi.
- Array, { records: [] } ve { payload: { records: [] } } formatları desteklendi.
- Ham market → katalog market alias eşleşme tablosu eklendi.
- Dry-run önizleme içinde Market ID, eşleşme yöntemi, fixture durumu ve güven oranı görünür hale getirildi.
- Canlı Geçiş Hazırlığı kontrol listesine nested payload şeması ve market alias haritası eklendi.

#### Düzeltilenler
- Nested payload içindeki records dizisinin okunmama riski giderildi.
- POLYMARKET dry-run kayıtlarının bookmaker payload ile karışmaması uyarısı güçlendirildi.
- Katalog market eşleşme etiketleri Türkçeleştirildi: Kaynak Haritası, Katalog Alias, Market ID.

#### Değişen Dosyalar
- index.html
- assets/js/55-odds-terminal.js
- assets/css/55-odds-terminal.css
- docs/BULTEN_CONTEXT.md
- docs/BUGS.md
- docs/TODO.md
- docs/CHANGELOG.md
- docs/FILE_MAP.md

#### Değişmeyen Dosyalar
- sw.js
- .github/workflows/update-radar.yml
- .github/workflows/update-live-scores.yml
- assets/data/odds-sources.json
- assets/data/odds-snapshot.json
- assets/js/20-stream-core.js
- assets/js/60-crypto-core.js
- assets/js/70-rolling-core.js

#### Test Notları
- node --check assets/js/55-odds-terminal.js geçti.
- odds-sources.json ve odds-snapshot.json JSON parse testleri geçti.
- ZIP bütünlük testi geçti.
- sw.js değiştirilmedi.

#### Sıradaki Hedef
- Kaynak adapter sözleşmesini ve örnek JSON üretim formatını netleştirip gerçek veri motoruna hazırlık yapmak.

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


### V577 - 2026-06-08
#### Değişenler
- Oran Terminali üstüne Veri Akışı Durumu bandı eklendi: veri modu, dış API, otomatik oynama, aktif kaynak, eşleşen/eşleşmeyen kayıt ve son okuma tek satırda gösterilir.
- Fırsat Radarı statik snapshot adayı, kaynak farkı adayı, barem farkı adayı ve canlı veri değildir ayrımıyla daha net hale getirildi.
- Oran Karşılaştırma paneline okunur özet eklendi: en iyi oran adayı, kaynak farkı, barem farkı ve eşleşme durumu ayrı kartlarda görünür.
- Kaynaklar sekmesi sade ana akışa çekildi: Kaynak Özeti, Kaynak Ayarları, Canlı Geçiş Hazırlığı, Dry-run Veri Kontrolü ve Geliştirici Detayları.
- V574 statik snapshot hazırlık özeti korundu; Geliştirici Detayları içine taşındı.
- index.html içindeki Oran Terminali JS/CSS cache-bust değeri v577 yapıldı.

#### Düzeltilenler
- POLYMARKET YES/NO prediction market mantığı bookmaker oran karşılaştırma akışından ayrı tutuldu.
- Gerçek API, scraping ve otomatik oynama kapalı bilgisi ana akışta daha görünür hale getirildi.
- Kaynaklar sekmesindeki teknik kalabalık varsayılan görünümden azaltıldı.
- Dropdown popup / Oran Hareketleri hover stabilitesine dokunulmadı; V576 overlay düzeltmesi korundu.

#### Değişen Dosyalar
- index.html
- assets/js/55-odds-terminal.js
- assets/css/55-odds-terminal.css
- docs/BULTEN_CONTEXT.md
- docs/BUGS.md
- docs/TODO.md
- docs/CHANGELOG.md
- docs/FILE_MAP.md

#### Değişmeyen Dosyalar
- sw.js
- assets/data/odds-sources.json
- assets/data/odds-snapshot.json
- assets/js/20-stream-core.js
- assets/js/60-crypto-core.js
- assets/js/70-rolling-core.js
- .github/workflows/update-radar.yml
- .github/workflows/update-live-scores.yml

#### Test Notları
- node --check assets/js/55-odds-terminal.js geçti.
- assets/data/odds-sources.json JSON parse testi geçti.
- assets/data/odds-snapshot.json JSON parse testi geçti.
- sw.js değiştirilmedi.

#### Sıradaki Hedef
- Gerçek veri öncesi dry-run payload şeması ve örnek kayıt doğrulama alanını daha kullanışlı hale getirmek.

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
