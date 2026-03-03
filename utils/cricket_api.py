import requests
import json
from datetime import datetime, timedelta
from config import Config

class CricketDataAPI:
    def __init__(self):
        self.api_key = Config.CRICKET_DATA_API_KEY
        self.base_url = Config.CRICKET_DATA_BASE_URL
        self.headers = {
            'apikey': self.api_key,
            'Content-Type': 'application/json'
        }
    
    def _make_request(self, endpoint, params=None):
        """Make API request to Cricket Data"""
        url = f"{self.base_url}/{endpoint}"
        default_params = {'apikey': self.api_key}
        
        if params:
            default_params.update(params)
        
        try:
            response = requests.get(url, params=default_params, headers=self.headers, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"API Error: {e}")
            return self._get_fallback_data(endpoint)
    
    def _get_fallback_data(self, endpoint):
        """Return fallback data when API fails"""
        if 'matches' in endpoint:
            return self._get_sample_matches()
        elif 'series' in endpoint:
            return self._get_sample_series()
        elif 'players' in endpoint:
            return self._get_sample_players()
        return {}
    
    def get_current_matches(self):
        """Get currently live matches"""
        data = self._make_request('matches', {'status': 'live'})
        return data.get('data', []) if isinstance(data, dict) else data
    
    def get_recent_matches(self):
        """Get recently completed matches"""
        data = self._make_request('matches', {'status': 'completed', 'limit': 10})
        return data.get('data', []) if isinstance(data, dict) else data
    
    def get_upcoming_matches(self):
        """Get upcoming matches"""
        data = self._make_request('matches', {'status': 'upcoming', 'limit': 10})
        return data.get('data', []) if isinstance(data, dict) else data
    
    def get_match_scorecard(self, match_id):
        """Get detailed scorecard for a match"""
        return self._make_request(f'match/{match_id}/scorecard')
    
    def get_series_list(self):
        """Get list of cricket series"""
        return self._make_request('series')
    
    def get_series_matches(self, series_id):
        """Get matches in a series"""
        return self._make_request(f'series/{series_id}/matches')
    
    def get_player_info(self, player_id):
        """Get player information"""
        return self._make_request(f'player/{player_id}')
    
    def get_player_stats(self, player_id):
        """Get player statistics"""
        return self._make_request(f'player/{player_id}/stats')
    
    def search_players(self, query):
        """Search for players"""
        return self._make_request('players/search', {'q': query})
    
    def get_match_squads(self, match_id):
        """Get squads for a match"""
        return self._make_request(f'match/{match_id}/squads')
    
    def get_ball_by_ball(self, match_id):
        """Get ball by ball data"""
        return self._make_request(f'match/{match_id}/balls')
    
    def get_live_scores(self):
        """Get live scores using CricAPI"""
        cric_api_key = Config.CRIC_API_KEY
        cric_api_url = f"{Config.CRIC_API_BASE_URL}/cricScore"
        
        try:
            response = requests.get(
                cric_api_url,
                params={'apikey': cric_api_key},
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get('status') == 'success':
                matches_data = data.get('data', [])
                # Transform the scores data into a standardized format
                matches_list = []
                for match_data in matches_data:
                    match_info = {
                        'id': match_data.get('id', 'N/A'),
                        'matchType': match_data.get('matchType', 'N/A'),
                        'status': match_data.get('status', 'Unknown'),
                        'name': match_data.get('t1', 'Team 1') + ' vs ' + match_data.get('t2', 'Team 2'),
                        'teams': {
                            'team1': {
                                'name': match_data.get('t1', 'Team 1'),
                                'score': match_data.get('t1s', ''),
                                'img': match_data.get('t1img', '')
                            },
                            'team2': {
                                'name': match_data.get('t2', 'Team 2'),
                                'score': match_data.get('t2s', ''),
                                'img': match_data.get('t2img', '')
                            }
                        },
                        'series': match_data.get('series', 'N/A'),
                        'venue': match_data.get('venue', 'N/A'),
                        'date': match_data.get('dateTimeGMT', 'N/A'),
                        'ms': match_data.get('ms', 'N/A')
                    }
                    matches_list.append(match_info)
                return matches_list
            else:
                print(f"CricAPI Error: {data.get('info', 'Unknown error')}")
                return []
        except requests.exceptions.RequestException as e:
            print(f"CricAPI Request Error: {e}")
            return self._get_sample_matches()
    
    def _get_sample_matches(self):
        """Sample match data for fallback"""
        return [
            {
                'id': 'match_001',
                'name': 'India vs Australia - 1st Test',
                'status': 'Live',
                'venue': 'Wankhede Stadium, Mumbai',
                'date': datetime.now().strftime('%Y-%m-%d'),
                'teams': {
                    'home': {'name': 'India', 'score': '245/3', 'overs': '42.3'},
                    'away': {'name': 'Australia', 'score': 'Yet to bat'}
                },
                'matchType': 'Test',
                'series': 'Border-Gavaskar Trophy 2024'
            },
            {
                'id': 'match_002',
                'name': 'England vs New Zealand - 3rd ODI',
                'status': 'Live',
                'venue': 'Lord\'s, London',
                'date': datetime.now().strftime('%Y-%m-%d'),
                'teams': {
                    'home': {'name': 'England', 'score': '178/10', 'overs': '45.2'},
                    'away': {'name': 'New Zealand', 'score': '182/4', 'overs': '38.1'}
                },
                'matchType': 'ODI',
                'series': 'England Tour of New Zealand 2024'
            }
        ]
    
    def _get_sample_series(self):
        return [
            {'id': 'series_001', 'name': 'ICC World Cup 2024', 'startDate': '2024-02-01', 'endDate': '2024-03-15'},
            {'id': 'series_002', 'name': 'IPL 2024', 'startDate': '2024-03-22', 'endDate': '2024-05-26'},
            {'id': 'series_003', 'name': 'Ashes Series 2024', 'startDate': '2024-06-15', 'endDate': '2024-08-15'}
        ]
    
    def _get_sample_players(self):
        return [
            {'id': 'player_001', 'name': 'Virat Kohli', 'country': 'India', 'role': 'Batsman'},
            {'id': 'player_002', 'name': 'Steve Smith', 'country': 'Australia', 'role': 'Batsman'},
            {'id': 'player_003', 'name': 'Kane Williamson', 'country': 'New Zealand', 'role': 'Batsman'}
        ]


class CricbuzzRapidAPI:
    """Lightweight wrapper for Cricbuzz endpoints available via RapidAPI.

    Configure via `Config.CRICBUZZ_RAPIDAPI_KEY` and `Config.CRICBUZZ_RAPIDAPI_HOST`.
    Methods mirror the endpoint list you provided (matches/list, matches/get-info, etc.).
    When no API key is provided, methods will return empty dicts or helpful messages.
    """
    def __init__(self):
        from config import Config
        self.host = Config.CRICBUZZ_RAPIDAPI_HOST
        self.base_url = Config.CRICBUZZ_BASE_URL.rstrip('/')
        self.api_key = Config.CRICBUZZ_RAPIDAPI_KEY
        self.headers = {}
        if self.api_key:
            self.headers = {
                'x-rapidapi-key': self.api_key,
                'x-rapidapi-host': self.host
            }

    def _make_request(self, path, params=None):
        if not self.api_key:
            return {'error': 'CRICBUZZ_RAPIDAPI_KEY not set in Config'}

        url = f"{self.base_url}{path}"
        try:
            resp = requests.get(url, headers=self.headers, params=params, timeout=10)
            resp.raise_for_status()
            # many rapidapi cricbuzz endpoints return JSON or text; attempt JSON
            try:
                return resp.json()
            except ValueError:
                return {'raw': resp.text}
        except requests.exceptions.RequestException as e:
            return {'error': str(e)}

    # Matches
    def matches_list(self, list_type='live'):
        # list_type can be 'live', 'upcoming', 'recent'
        mapping = {
            'live': '/matches/v1/live',
            'upcoming': '/matches/v1/upcoming',
            'recent': '/matches/v1/recent'
        }
        path = mapping.get(list_type, '/matches/v1/live')
        return self._make_request(path)

    def matches_get_info(self, match_id):
        return self._make_request(f'/matches/v1/{match_id}/info')

    def matches_get_team(self, match_id):
        return self._make_request(f'/matches/v1/{match_id}/team')

    def matches_get_commentaries(self, match_id):
        return self._make_request(f'/matches/v1/{match_id}/commentary')

    def matches_get_commentaries_v2(self, match_id):
        return self._make_request(f'/matches/v2/{match_id}/commentary')

    def matches_get_overs(self, match_id):
        return self._make_request(f'/matches/v1/{match_id}/overs')

    def matches_get_scorecard(self, match_id):
        return self._make_request(f'/matches/v1/{match_id}/scorecard')

    def matches_get_scorecard_v2(self, match_id):
        return self._make_request(f'/matches/v2/{match_id}/scorecard')

    def matches_get_leanback(self, match_id):
        return self._make_request(f'/matches/v1/{match_id}/leanback')

    # Schedules
    def schedules_list(self):
        return self._make_request('/schedules/v1/list')

    # Series
    def series_list(self):
        return self._make_request('/series/v1/list')

    def series_list_archives(self):
        return self._make_request('/series/v1/archives')

    def series_get_matches(self, series_id):
        return self._make_request(f'/series/v1/{series_id}/matches')

    def series_get_news(self, series_id):
        return self._make_request(f'/series/v1/{series_id}/news')

    def series_get_squads(self, series_id):
        return self._make_request(f'/series/v1/{series_id}/squads')
