import json
import datetime

def veri_topla():
    zaman = datetime.datetime.now().strftime("%d.%m.%Y %H:%M:%S")
    
    # Sistemin çalıştığını test etmek için sahte başlangıç verisi
    oranlar = {
        "son_guncelleme": zaman,
        "maclar": [
            {
                "lig": "İngiltere Premier Lig",
                "kategori": "ALTIN",
                "ev_sahibi": "Arsenal",
                "deplasman": "Liverpool",
                "marketler": {
                    "toplam_korner_9_5_ust": {"bet365": 1.80, "1xbet": 2.15, "betsmove": 2.05}
                }
            }
        ]
    }
    return oranlar

if __name__ == "__main__":
    yeni_veri = veri_topla()
    with open("canli_oranlar.json", "w", encoding="utf-8") as f:
        json.dump(yeni_veri, f, ensure_ascii=False, indent=4)
