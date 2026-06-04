# BULTEN V543 Clean PR Notes

## Amaç
- POLYMARKET, Oran Terminali içinde TÜMÜ / FUTBOL / BASKETBOL ile aynı seviyede ana kategori olarak görünür.
- POLYMARKET ayrı route değildir; mevcut `#odds` içinde çalışır.
- Bahis Türü / Market dropdown sayfayı aşağı itmeyecek şekilde floating overlay davranışına alınır.

## Temiz PR Notu
Bu patch özellikle conflict riskini azaltmak için append-only hazırlanmıştır:
- Mevcut V542 Oran Terminali kodunun büyük blokları yeniden yazılmaz.
- `sw.js` ve `index.html` değiştirilmez.
- ZIP/BAT artefaktı yoktur.

## Test
- `node --check assets/js/55-odds-terminal.js`
- `python -m json.tool assets/data/odds-snapshot.json`
- `python -m json.tool assets/data/odds-sources.json`
