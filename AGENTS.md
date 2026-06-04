# BULTEN AGENTS TALİMATLARI

Bu repo BULTEN web uygulamasıdır.

## Ana Bağlam Dosyaları

Her görevde önce şu dosyaları oku ve ana bağlam kabul et:

- docs/BULTEN_CONTEXT.md
- docs/BUGS.md
- docs/TODO.md
- docs/CHANGELOG.md
- docs/FILE_MAP.md
- docs/PROJECT_SETUP_NOTES.md

## Kesin Kurallar

- Mevcut çalışan düzen bozulmayacak.
- sw.js sadece gerçekten gerekiyorsa değiştirilecek.
- Gereksiz cache/service-worker değişikliği yapılmayacak.
- Route sızıntısı oluşturulmayacak.
- #rolling, #crypto, #stream, Oran Terminali ve POLYMARKET birbirine karışmayacak.
- Patch üstüne patch yapılmayacak; temiz ve güvenilir çözüm üretilecek.
- Gereksiz dosya değiştirilmeyecek.
- Büyük değişikliklerde tam çalışan paket/PR hazırlanacak.
- Küçük değişikliklerde sadece ilgili blok/dosya değiştirilecek.

## Kullanıcı Tercihleri

Kullanıcı uzun açıklama değil, uygulanabilir kod/paket ister.

Dosya listesi kısa formatta verilecek:

DEĞİŞECEKLER
- ...

DEĞİŞMEYENLER
- ...

TEST NOTLARI
- ...

## sw.js Kuralı

sw.js dosyasına sadece gerçekten cache/service-worker davranışı değişmesi gerekiyorsa dokun.
Rutin güncellemelerde sw.js değiştirme.

## Modül İzolasyonu

Aşağıdaki modüller birbirine sızmayacak:

- Canlı Yayın / Stream
- Rolling
- Kripto Terminal
- Oran Terminali
- POLYMARKET
- Kasa Yönetimi
- Alarm Ses Merkezi

## İş Sonu

Her görev sonunda kısa rapor ver:

- Değişen dosyalar
- Değişmeyen kritik dosyalar
- Test notları
- Açık kalan riskler
- docs dosyalarına eklenmesi gereken hafıza güncellemesi
