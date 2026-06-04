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
- ## Codex Çalışma Akışı

- Önce analiz yap, hemen kod değiştirme.
- Büyük değişikliklerde önce hangi dosyalara dokunacağını raporla.
- Mümkünse işi küçük ve kontrollü adımlara böl.
- Direkt main branch üzerinde riskli değişiklik yapma; değişiklikleri PR/patch mantığıyla hazırla.
- sw.js dosyasına sadece gerçekten gerekiyorsa dokun.
- İş sonunda şu formatta rapor ver:

DEĞİŞECEKLER
- ...

DEĞİŞMEYENLER
- ...

TEST NOTLARI
- ...

DOCS GÜNCELLEME NOTLARI
- ...
- Değişmeyen kritik dosyalar
- Test notları
- Açık kalan riskler
- docs dosyalarına eklenmesi gereken hafıza güncellemesi
## PR ve Onay Kuralı

Codex değişiklikleri doğrudan main branch'e uygulamamalıdır.

Standart akış:

1. Görevi analiz et.
2. Sadece gerekli dosyaları değiştir.
3. Değişiklikleri PR/branch mantığıyla hazırla.
4. İş sonunda rapor ver.
5. Kullanıcı onaylamadan main branch'e merge edilmiş kabul etme.

Her görev sonunda şu kontrol raporunu ver:

DEĞİŞECEKLER
- ...

DEĞİŞMEYENLER
- ...

TEST NOTLARI
- ...

DOCS GÜNCELLEME NOTLARI
- ...

Özellikle kontrol edilecekler:
- sw.js gereksiz değişti mi?
- index.html gereksiz değişti mi?
- #rolling, #crypto, #stream etkileniyor mu?
- Oran Terminali düzeni bozuldu mu?
- Yeni özellik izole mi eklendi?
