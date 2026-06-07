# BULTEN PROJE HAFIZASI

## Ana Proje
Site: https://hexzenout.github.io/bulten/

Amaç:
Canlı Yayın, Oran Terminali, POLYMARKET, Rolling, Kripto Terminal, Kasa Yönetimi, Alarm Ses Merkezi, Firebase üyelik sistemi ve canlı skor/oran altyapısını temiz, stabil ve modüler şekilde geliştirmek.

## Kesin Kurallar
- Mevcut çalışan düzen bozulmayacak.
- sw.js sadece gerçekten gerekiyorsa değiştirilecek.
- Gereksiz cache/service worker değişikliği yapılmayacak.
- Patch üstüne patch yapılmayacak.
- Temiz ve güvenilir çözüm tercih edilecek.
- Büyük değişikliklerde tam ZIP/paket verilecek.
- Küçük değişikliklerde sadece değişen bloklar net gösterilecek.
- CSS/JS şişmesi azaltılacak.
- Eski çalışan modüller yeni özellik yüzünden bozulmayacak.
- Route sızıntısı olmayacak:
  - #rolling
  - #crypto
  - #stream
  - Oran Terminali
  - POLYMARKET
  birbirine karışmayacak.

## Kullanıcının Cevap Formatı Tercihi
Dosya listesi kısa formatta verilecek:

DEĞİŞECEKLER
- ...

DEĞİŞMEYENLER
- ...

Uzun açıklama yerine uygulanabilir kod, net blok veya tam ZIP/paket tercih edilecek.

## Ana Modüller
- Canlı Yayın / Stream Matrix
- Oran Terminali
- POLYMARKET alanı
- Rolling modülü
- Kripto Terminal
- Kasa Yönetimi
- Alarm Ses Merkezi
- CSS/JS temizlik ve modülerleştirme
- Firebase Auth / üyelik sistemi
- Admin / kullanıcı ayrımı
- Canlı skor / workflow sistemi

## Oran Terminali
- Mevcut Oran Terminali düzeni bozulmayacak.
- Oran Terminali altına POLYMARKET adlı ekstra alan açılacak.
- Futbol ve basket bahis türleri geniş desteklenecek.
- Avantajlı bahisler terminalde öne getirilecek.

## Basket Bahis Türleri
- Maç sonucu
- İlk yarı
- İlk çeyrek
- İkinci çeyrek
- Handikap
- Alt/Üst
- Takım toplam sayı
- İki takım da belirli sayı üstü
- Örnek: her iki takım da 68.5 üst sayı atar

## Futbol Bahis Türleri
- Maç sonucu
- Alt/Üst
- Handikap
- Korner
- İlk yarı
- İkinci yarı
- Takım golü
- Karşılıklı gol
- Avantajlı oran yakalama

## POLYMARKET
- POLYMARKET, Oran Terminali içinde TÜMÜ / FUTBOL / BASKETBOL ile aynı seviyede ana kategori olarak konumlandırıldı.
- Ana kategori sırası: TÜMÜ | FUTBOL | BASKETBOL | POLYMARKET.
- POLYMARKET BASKETBOL butonunun hemen sağında koyu mavi marka butonu olarak görünür; yazısı kesilmez ve beyaz inline SVG marka işareti kullanır.
- POLYMARKET ayrı route değildir; mevcut #odds içinde çalışır.
- Polymarket kayıtları normal futbol/basket oran tablolarına karışmaz.
- Kısa vadeli ve avantajlı marketler için güven skoru, edge, kapanış, likidite ve hacim kartları gösterilir.
- Polymarket tarafında spor, kripto, makro ve haber gibi farklı market tipleri desteklenecek şekilde demo veri yapısı hazırlandı.
- Oran Terminali ana fırsatlar ekranının altında POLYMARKET için ayrı kısa özet/dock alanı gösterilir.
- Oran Terminali ana fırsatlar ekranının altında POLYMARKET için ayrı kısa özet/dock alanı korunur.
- V577 ile Oran Terminali üstünde Veri Akışı Durumu bandı gösterilir: veri modu, dış API, otomatik oynama, aktif kaynak, eşleşen/eşleşmeyen kayıt ve son okuma.
- V577 ile Fırsat Radarı ve Oran Karşılaştırma statik snapshot/dry-run adaylarını canlı veri gibi göstermeden okunur özet kartlarıyla sunar.
- V577 ile Kaynaklar sekmesi sade ana akışa çekildi; V574 statik snapshot hazırlık özeti Geliştirici Detayları içinde korundu.
- V578 ile dry-run payload şeması konsolide edildi: Array, { records: [] } ve { payload: { records: [] } } formatları desteklenir.
- V578 ile dry-run içinde ham market → katalog market alias eşleşme tablosu eklendi; fixture, Market ID, eşleşme yöntemi ve güven oranı görünür.
- V578 ile bookmaker dry-run ve POLYMARKET YES/NO dry-run ayrımı daha net hale getirildi; POLYMARKET decimal odds motoruna bağlanmaz.
- Bahis Türü / Market dropdown alanı sadece Marketler sekmesi aktifken görünür; POLYMARKET seçiliyken klasik futbol/basket market kontrolü gizlenir.
- Polymarket panelinde spor, kripto, ekonomi, haber, kısa vade, yüksek likidite ve fırsat adayı filtreleri gösterilir.
- Sıradaki aşama gerçek Polymarket veri çekme motorudur.

## Kripto Terminal
- Binance / OKX seçimi
- Manuel sembol girişi
- Top 150 coin veya tüm coinler
- TP1 / TP2 / TP3 / TP4
- Stop loss
- Likidasyon fiyatı
- Grafik üstünden alarm
- Alarm çizgileri
- Trendline çizimi
- Wheel zoom
- Sağ fiyat skalası
- Ayarlar refresh sonrası korunacak

## Rolling / Kasa Yönetimi
- 7-15 gün mantığı
- Günlük 20 alan
- Manuel maç/coin yazma alanı
- W/L butonları görünür olacak
- Hedef kasa manuel değiştirilebilir olacak
- “Bu hesapla / 20 alana uygula” düzgün çalışacak
- Sade ve kullanılabilir tasarım tercih edilecek

## Alarm Sistemi
- Alarm Ses Merkezi korunacak.
- Varsayılan ve özel sesler desteklenecek.
- Grafik alarmı ve manuel alarm mantığı bozulmayacak.

## Firebase
- Firebase Auth Email/Password aktif.
- Firestore aktif.
- Üyelik sistemi geliştirilecek.
- Daha sonra admin / kullanıcı ayrımı yapılacak.

## GitHub / Workflow
- GitHub Pages üzerinden yayınlanıyor.
- update-radar.yml ve update-live-scores.yml gibi workflow dosyaları var.
- ODDS_KEYS gibi GitHub Secrets kullanılıyor.
- API kota tüketimi dikkatli yönetilecek.

## Son Aktif Hedef
V578 ile Oran Terminali dry-run payload şeması ve market alias eşleştirme görünümü konsolide edildi.
Sıradaki hedef, gerçek veri motoruna geçmeden önce kaynak adapter sözleşmesini ve örnek JSON üretim formatını netleştirmektir.

## Açık Riskler
- Uzun ChatGPT sohbetinde lag oluşuyor.
- Yeni sohbete geçince bağlam kaybı olmaması gerekiyor.
- Oran Terminali ve POLYMARKET yapısı temiz tasarlanmalı.
- Route/modül sızıntısı olmamalı.
- sw.js gereksiz yere değişmemeli.

## Son Bilinen Paket Notu
- V578: Dry-run payload şeması, nested records desteği ve ham market → katalog market alias eşleşme tablosu eklendi; sw.js/workflow değiştirilmedi, index.html sadece cache-bust v578 için değişti.
- V577: Oran Terminali üstüne Veri Akışı Durumu bandı eklendi; Fırsat Radarı ve Oran Karşılaştırma okunur özetlerle konsolide edildi; Kaynaklar sadeleştirildi; sw.js değiştirilmedi, index.html sadece cache-bust v577 için değişti.
- V576: Oran Karşılaştırma / Oran Hareketleri popup stabilitesi ve cache-bust çözümü korundu.
- V574: Statik snapshot hazırlık özeti korundu; V577 ile Geliştirici Detayları içine taşındı.
- V545: Oran Terminali V544 sonrası market listesi/kategori/POLYMARKET davranışı düzeltildi; STORE_KEY v545_odds_terminal_state oldu; sw.js ve index.html değiştirilmedi.
- V544: Oran Terminali ana kategori/dropdown UX hataları düzeltildi; futbol/basket market listeleri temizlendi; POLYMARKET #odds içinde marka butonu oldu.
- V542: Oran Terminali ana fırsatlar ekranının altına izole POLYMARKET kısa özet/dock alanı eklendi.
- V541: Oran Terminali altında POLYMARKET sekmesi/paneli eklendi.
- Polymarket kayıtları normal oran terminali tablolarından ayrıldı.
- Demo odds snapshot içine 5 Polymarket örnek marketi eklendi.
- sw.js değiştirilmedi.
- V577 paketinde index.html yalnızca Oran Terminali JS/CSS cache-bust değeri için değiştirildi.
