# TODO

## Tamamlananlar
1. Oran Terminali altında ayrı POLYMARKET alanı açıldı.
2. Mevcut Oran Terminali düzeni bozulmadan #odds içinde ayrı panel yaklaşımı uygulandı.
3. Polymarket kayıtlarının normal oran kıyaslama listelerine karışması engellendi.
4. sw.js değiştirilmedi.
5. Oran Terminali ana fırsatlar ekranının altına POLYMARKET kısa özet/dock alanı eklendi.
6. V544 ile Oran Terminali kategori/dropdown UX düzeltildi.
7. V544 ile futbol ve basketbol market listeleri gerçekçi başlıklarla temizlendi.
8. V544 ile POLYMARKET en sağda koyu mavi marka butonu olarak konumlandırıldı.
9. V545 ile POLYMARKET BASKETBOL hemen sağına alındı, tek tıklama aktifleşmesi ve Marketler sekmesine özel Bahis Türü / Market görünümü düzeltildi.
10. V546 ile Bahis Türü / Market dropdown tamamen kaldırıldı; Marketler sekmesi aramalı geniş futbol/basket katalog oldu.

## Sıradaki İşler
1. V546 sonrası gerçek verilere yavaş geçiş için market taxonomy ile canlı oran datasını eşleştir.
2. POLYMARKET kısa özet/dock alanını gerçek API verisi geldiğinde canlı sinyallerle besle.
3. Kısa vadeli Polymarket marketleri için filtreleme ve sıralamayı canlı veriye bağla.
4. Futbol/basket market taxonomy listesini canlı veri sağlayıcı market kodlarıyla eşleştir.
5. Polymarket avantaj skoru için referans olasılık kaynağını netleştir.
6. Modül sızıntılarını her güncellemede test et.
7. Değişecek dosyaları net listele.
8. Gerekirse tam ZIP/paket üret.
9. İş sonunda bağlam güncellemesi çıkar.

## Dikkat Edilecekler
- sw.js dokunulmayacak; gerekirse ayrıca açıklanacak.
- CSS/JS temiz kalacak.
- Eski çalışan sistemler bozulmayacak.
- #rolling, #crypto, #stream ve #odds birbirine karışmayacak.
- Büyük kodu tek mesajda şişirme.
- Her görev ayrı kısa sohbet olarak yürütülecek.
## V546 Sonrası Veri Geçiş Notları
- Terminal gerçek veriyle çalışınca takım trend hafızası tutulacak: ilk yarıda gol atma/yeme, 30. dakikaya kadar gol bulma, korner/kart/ilk gol trendleri.
- Basketbolda sembolik line marketleri gerçek veri gelince maça göre çoğaltılacak.
- Her İki Takım da ____ Üst Sayı Atar ve İlk X Sayıya Ulaşan Takım marketleri gerçek oran datasına göre dinamik üretilecek.
