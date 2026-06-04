# BUGS

## Açık Buglar / Riskler
- Uzun ChatGPT sohbetinde lag oluşuyor.
- Share / paylaşma seçeneği Internal Server Error verebiliyor.
- Yeni sohbette proje istekleri unutulabiliyor.
- Route sızıntısı riski her güncellemede test edilmeli:
  - #rolling
  - #crypto
  - #stream
  - Oran Terminali
  - POLYMARKET
- sw.js dosyasının gereksiz değiştirilme riski var.
- CSS/JS dosyalarının şişme riski var.
- POLYMARKET gerçek veri motoru henüz bağlı değil; panel şimdilik demo snapshot kayıtlarıyla çalışıyor.

## Her Güncellemede Test Edilecekler
- Oran Terminali eski hali çalışıyor mu?
- POLYMARKET alanı ayrı duruyor mu?
- POLYMARKET kayıtları normal oran tablolarına karışıyor mu?
- Rolling modülü etkileniyor mu?
- Kripto Terminal etkileniyor mu?
- Canlı Yayın / Stream alanı etkileniyor mu?
- Alarm Ses Merkezi bozuldu mu?
- sw.js gereksiz değişti mi?
- Dosya listesi kısa formatta verildi mi?
- Route geçişlerinde modüller birbirine karışıyor mu?

## Çözülenler
- V541: Oran Terminali altına POLYMARKET ayrı panel olarak eklendi.
- V541: Polymarket kayıtlarının normal oran kıyaslama listelerine karışma riski azaltıldı.
- V541: sw.js değiştirilmeden POLYMARKET paneli eklendi.
