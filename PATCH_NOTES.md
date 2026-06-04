# BULTEN V543 Oran Terminali / POLYMARKET Patch Notları

## Kurulum / PR Akışı
1. Bu PR içindeki değişiklikleri repo ana dalına merge et veya patch olarak uygula.
2. Testleri çalıştır:
   - `node --check assets/js/55-odds-terminal.js`
   - `python -m json.tool assets/data/odds-snapshot.json >NUL`
   - `python -m json.tool assets/data/odds-sources.json >NUL`
3. Tarayıcıda `#odds` açıp TÜMÜ / FUTBOL / BASKETBOL / POLYMARKET ana kategori butonlarını kontrol et.
4. Bahis Türü / Market dropdown açıldığında sayfanın aşağı itilmediğini kontrol et.
5. Commit/push yap.

## Değişen Dosyalar
- `assets/js/55-odds-terminal.js`
- `assets/css/55-odds-terminal.css`
- `docs/BULTEN_CONTEXT.md`
- `docs/BUGS.md`
- `docs/TODO.md`
- `docs/CHANGELOG.md`
- `docs/FILE_MAP.md`
- `PATCH_NOTES.md`

## Değişmeyen Kritik Dosyalar
- `sw.js`
- `index.html`
- `assets/data/odds-snapshot.json`
- `assets/data/odds-sources.json`
- `assets/js/20-stream-core.js`
- `assets/js/60-crypto-core.js`
- `assets/js/70-rolling-core.js`

## Not
POLYMARKET ayrı route değildir; `#odds` içinde TÜMÜ / FUTBOL / BASKETBOL ile aynı seviyede ana kategori olarak çalışır.
