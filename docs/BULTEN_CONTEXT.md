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
- POLYMARKET, Oran Terminali altında ayrı alan olacak.
- Mevcut Oran Terminali düzeni bozulmadan eklenecek.
- Kısa vadeli ve avantajlı marketler taranacak.
- Polymarket tarafında farklı market tipleri desteklenecek.

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
Oran Terminali altına POLYMARKET alanı eklemek.
Mevcut Oran Terminali düzenini bozmadan bahis verilerini daha geniş destekleyecek yapıya geçirmek.

## Açık Riskler
- Uzun ChatGPT sohbetinde lag oluşuyor.
- Yeni sohbete geçince bağlam kaybı olmaması gerekiyor.
- Oran Terminali ve POLYMARKET yapısı temiz tasarlanmalı.
- Route/modül sızıntısı olmamalı.
- sw.js gereksiz yere değişmemeli.

## Son Bilinen Paket Notu
- V49 dev polish: stream / rolling / sound alanları konuşuldu.
- sw.js mümkün olduğunca sabit tutulacak.
