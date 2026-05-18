import os, json, requests
from datetime import datetime, timedelta, timezone

RAPID_KEYS = [k.strip() for k in os.getenv('RAPID_KEYS','').split(',') if k.strip()]
OUT = 'live_scores.json'
LEAGUES = [39,140,78,135,61,203,2,3,848,13,253]  # EPL, LaLiga, Bundesliga, SerieA, Ligue1, Süper Lig, UEFA, MLS

def tr_now():
    return datetime.utcnow() + timedelta(hours=3)

def fetch_live(key):
    headers = {'x-rapidapi-key': key, 'x-rapidapi-host': 'v3.football.api-sports.io'}
    url = 'https://v3.football.api-sports.io/fixtures?live=all'
    r = requests.get(url, headers=headers, timeout=12)
    if r.status_code in (401,403,429):
        raise RuntimeError(str(r.status_code))
    r.raise_for_status()
    return r.json().get('response', [])

def normalize(item):
    league_id = item.get('league',{}).get('id')
    if league_id not in LEAGUES:
        return None
    teams = item.get('teams',{})
    goals = item.get('goals',{})
    fixture = item.get('fixture',{})
    status = fixture.get('status',{})
    home = teams.get('home',{}).get('name','')
    away = teams.get('away',{}).get('name','')
    return {
        'name': f'{home} - {away}',
        'league': item.get('league',{}).get('name',''),
        'score': f"{goals.get('home','-')} - {goals.get('away','-')}",
        'home_goals': goals.get('home'),
        'away_goals': goals.get('away'),
        'minute': status.get('elapsed'),
        'status': status.get('long') or status.get('short'),
        'updated': tr_now().strftime('%Y-%m-%d %H:%M:%S')
    }

def main():
    logs=[]; matches=[]
    if not RAPID_KEYS:
        payload={'up':tr_now().strftime('%H:%M'),'matches':[],'logs':['RAPID_KEYS yok']}
    else:
        for idx,key in enumerate(RAPID_KEYS):
            try:
                raw=fetch_live(key)
                for x in raw:
                    n=normalize(x)
                    if n: matches.append(n)
                logs.append(f'key#{idx+1} OK live={len(matches)}')
                break
            except Exception as e:
                logs.append(f'key#{idx+1} hata: {e}')
                continue
        payload={'up':tr_now().strftime('%H:%M'),'matches':matches,'logs':logs}
    with open(OUT,'w',encoding='utf-8') as f:
        json.dump(payload,f,ensure_ascii=False,indent=2)

if __name__=='__main__':
    main()
