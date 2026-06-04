# PROJECT SETUP NOTES

Bu dosya, eski uzun ChatGPT sohbetinden yeni BULTEN Project / GitHub / Codex düzenine geçiş kararlarını içerir.

## Ana Karar

Tek gerçek proje hafızası GitHub repo içinde tutulacak.

Ana hafıza yapısı:

- AGENTS.md
- docs/BULTEN_CONTEXT.md
- docs/BUGS.md
- docs/TODO.md
- docs/CHANGELOG.md
- docs/FILE_MAP.md
- docs/PROJECT_SETUP_NOTES.md

## ChatGPT Project Kararı

ChatGPT Project, planlama ve ZIP inceleme için kullanılacak.

Project kaynaklarında eski hafıza dosyaları bulunabilir; ancak uzun vadede ana kaynak GitHub repo içindeki docs klasörüdür.

Güncel GitHub ZIP'i Project Kaynaklar kısmına kalıcı kaynak olarak eklenmeyecek.
Güncel ZIP sadece aktif görev sohbetine dosya eki olarak yüklenecek.

Sebep:
Kod ZIP'i sürekli değişir. Kaynaklar kısmına kalıcı eklenirse ileride eski ZIP yanlışlıkla güncel kod sanılabilir.

## Codex Kararı

ChatGPT Project konuşmaları Codex'e otomatik geçmez.

Codex'in proje kurallarını görmesi için repo köküne AGENTS.md eklendi.
Codex görevlerinde önce AGENTS.md ve docs klasörü okunacak.

## Sohbet Düzeni

- Her büyük görev için ayrı kısa Project sohbeti açılabilir.
- Bir sohbet çok uzarsa, iş sonunda proje hafıza güncellemesi çıkarılır.
- Güncelleme gerekiyorsa docs dosyalarına işlenir.
- Eski uzun sohbetler arşiv gibi bırakılabilir.
- Sohbet silinirse o sohbet geçmişi kaybolur; ama repo içindeki docs dosyaları kalır.

## Net İş Akışı

1. GitHub repo ana hafıza olacak.
2. ChatGPT'ye güncel ZIP verildiğinde önce AGENTS.md ve docs dosyaları okunacak.
3. Codex görevlerinde önce AGENTS.md ve docs dosyaları okunacak.
4. İş sonunda docs dosyaları güncel tutulacak.
