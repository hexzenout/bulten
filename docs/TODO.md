# TODO

## Tamamlananlar
1. Oran Terminali altında ayrı POLYMARKET alanı açıldı.
2. Mevcut Oran Terminali düzeni bozulmadan #odds içinde ayrı panel yaklaşımı uygulandı.
3. Polymarket kayıtlarının normal oran kıyaslama listelerine karışması engellendi.
4. sw.js değiştirilmedi.
5. Oran Terminali ana fırsatlar ekranının altına POLYMARKET kısa özet/dock alanı eklendi.
6. V543 ile POLYMARKET, TÜMÜ/FUTBOL/BASKETBOL ile aynı seviyede ana kategoriye alındı.
7. V543 ile Bahis Türü / Market dropdown sayfayı aşağı itmeyen overlay davranışına alındı.
8. V543 ile futbol marketlerinin görünürlüğü geri güçlendirildi.
9. V544 ile PR üzerinde çalışan validation workflow eklendi.

## Sıradaki İşler
1. Polymarket gerçek veri çekme motorunu/API entegrasyonunu tasarla.
2. POLYMARKET ana kategori ve kısa özet/dock alanını gerçek API verisi geldiğinde canlı sinyallerle besle.
3. Kısa vadeli Polymarket marketleri için filtreleme ve sıralamayı canlı veriye bağla.
4. Futbol/basket bahis türlerini canlı veriyle genişlet.
5. Polymarket avantaj skoru için referans olasılık kaynağını netleştir.
6. Modül sızıntılarını her güncellemede test et.
7. Değişecek dosyaları net listele.
8. Gerekirse tam ZIP/paket üret.
9. İş sonunda bağlam güncellemesi çıkar.
10. PR Validation check geçmezse GitHub Actions logu incelenecek.

## Dikkat Edilecekler
- sw.js dokunulmayacak; gerekirse ayrıca açıklanacak.
- CSS/JS temiz kalacak.
- Eski çalışan sistemler bozulmayacak.
- #rolling, #crypto, #stream ve #odds birbirine karışmayacak.
- Büyük kodu tek mesajda şişirme.
- Her görev ayrı kısa sohbet olarak yürütülecek.
