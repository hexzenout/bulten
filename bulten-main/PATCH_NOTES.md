# BULTEN V543 Clean PR Notes

## Amaç
- POLYMARKET, Oran Terminali içinde TÜMÜ / FUTBOL / BASKETBOL ile aynı seviyede ana kategori olarak görünür.
- POLYMARKET ayrı route değildir; mevcut `#odds` içinde çalışır.
- Bahis Türü / Market dropdown sayfayı aşağı itmeyecek şekilde floating overlay davranışına alınır.

## Net Conflict Çözümü
Bu PR özellikle önceki CSS conflict sorununu çözmek için yalnız iki dosya değiştirir:
- `assets/js/55-odds-terminal.js`
- `PATCH_NOTES.md`

CSS dosyası değiştirilmez. Gerekli scoped stiller JS içinde tek bir `<style>` etiketiyle enjekte edilir.

## Değişmeyenler
- `assets/css/55-odds-terminal.css`
- `sw.js`
- `index.html`
- ZIP/BAT artefaktları

## Test
- `node --check assets/js/55-odds-terminal.js`
- `python -m json.tool assets/data/odds-snapshot.json`
- `python -m json.tool assets/data/odds-sources.json`
