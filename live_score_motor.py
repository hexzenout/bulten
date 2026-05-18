import os
import json
import requests
from datetime import datetime, timedelta

RAPID_KEYS = [k.strip() for k in os.getenv('RAPID_KEYS', '').split(',') if k.strip()]
OUTPUT_FILE = 'live_scores.json'
TIMEOUT = 12
TR_OFFSET = 3

API_HOST = 'api-football-v1.p.rapidapi.com'
API_URL = 'https://api-football-v1.p.rapidapi.com/v3/fixtures'

class LiveScoreMotor:
    def __init__(self):
        self.key_index = 0
        self.logs = []

    def tr_now(self):
        return datetime.utcnow() + timedelta(hours=TR_OFFSET)

    def log(self, msg):
        line = f"[{self.tr_now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}"
        print(line)
        self.logs.append(line)

    def fetch_live(self):
        if not RAPID_KEYS:
            self.log('RAPID_KEYS bulunamadı')
            return []
        while self.key_index < len(RAPID_KEYS):
            key = RAPID_KEYS[self.key_index]
            try:
                r = requests.get(
                    API_URL,
                    headers={
                        'x-rapidapi-key': key,
                        'x-rapidapi-host': API_HOST,
                    },
                    params={'live': 'all'},
                    timeout=TIMEOUT,
                )
                if r.status_code == 200:
                    data = r.json()
                    self.log(f"Canlı skor çekildi | key#{self.key_index+1}")
                    return data.get('response', []) or []
                if r.status_code in (401, 403, 429):
                    self.log(f"Key limit/auth | status={r.status_code} | key#{self.key_index+1} değişiyor")
                    self.key_index += 1
                    continue
                self.log(f"API hata | status={r.status_code} | body={r.text[:160]}")
                return []
            except Exception as e:
                self.log(f"Request hata | {e}")
                return []
        self.log('Tüm RAPID_KEYS tükendi')
        return []

    def normalize(self, item):
        fixture = item.get('fixture', {})
        league = item.get('league', {})
        teams = item.get('teams', {})
        goals = item.get('goals', {})
        status = fixture.get('status', {})
        home = teams.get('home', {}).get('name', '')
        away = teams.get('away', {}).get('name', '')
        return {
            'id': fixture.get('id'),
            'league': league.get('name', ''),
            'country': league.get('country', ''),
            'home': home,
            'away': away,
            'home_score': goals.get('home') if goals.get('home') is not None else 0,
            'away_score': goals.get('away') if goals.get('away') is not None else 0,
            'minute': status.get('elapsed') or status.get('short') or '',
            'status': status.get('short') or '',
            'long_status': status.get('long') or '',
            'match_key': f"{home} - {away}",
        }

    def run(self):
        self.log('LIVE SCORE MOTOR BAŞLADI')
        raw = self.fetch_live()
        live = []
        for item in raw:
            try:
                live.append(self.normalize(item))
            except Exception as e:
                self.log(f"Normalize hata | {e}")
        payload = {
            'up': self.tr_now().strftime('%H:%M:%S'),
            'mode': 'live_scores',
            'live': live,
            'count': len(live),
            'logs': self.logs[-50:],
        }
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(payload, f, ensure_ascii=False, indent=4)
        self.log(f"LIVE SCORE MOTOR BİTTİ | {len(live)} canlı maç")

if __name__ == '__main__':
    LiveScoreMotor().run()
