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
10. V577 ile Veri Akışı Durumu bandı eklendi.
11. V577 ile Oran Karşılaştırma ve Fırsat Radarı canlı veri değildir ayrımıyla konsolide edildi.
12. V577 ile Kaynaklar sekmesi sade ana akışa çekildi; V574 snapshot hazırlık özeti Geliştirici Detayları içinde korundu.

## Sıradaki İşler
1. Gerçek veri öncesi dry-run payload şemasını daha kullanışlı hale getir.
2. Gerçek oran veri modelini ve Polymarket API motorunu tasarla.
3. POLYMARKET kısa özet/dock alanını gerçek API verisi geldiğinde canlı sinyallerle besle.
4. Kısa vadeli Polymarket marketleri için filtreleme ve sıralamayı canlı veriye bağla.
5. Futbol/basket bahis türlerini canlı veriyle genişlet.
6. Polymarket avantaj skoru için referans olasılık kaynağını netleştir.
7. Modül sızıntılarını her güncellemede test et.
8. Değişecek dosyaları net listele.
9. Gerekirse tam ZIP/paket üret.
10. İş sonunda bağlam güncellemesi çıkar.

## Dikkat Edilecekler
- sw.js dokunulmayacak; gerekirse ayrıca açıklanacak.
- CSS/JS temiz kalacak.
- Eski çalışan sistemler bozulmayacak.
- #rolling, #crypto, #stream ve #odds birbirine karışmayacak.
- Büyük kodu tek mesajda şişirme.
- Her görev ayrı kısa sohbet olarak yürütülecek.
