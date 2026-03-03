import json
from datetime import datetime

class FantasyTeamManager:
    def __init__(self):
        self.player_pool = self._load_player_pool()
        self.user_teams = {}  # In production, use database
    
    def _load_player_pool(self):
        """Load available fantasy players"""
        return [
            {'id': 'p001', 'name': 'Virat Kohli', 'team': 'India', 'role': 'Batsman', 'credits': 11, 'points': 0},
            {'id': 'p002', 'name': 'Rohit Sharma', 'team': 'India', 'role': 'Batsman', 'credits': 10.5, 'points': 0},
            {'id': 'p003', 'name': 'Jasprit Bumrah', 'team': 'India', 'role': 'Bowler', 'credits': 9.5, 'points': 0},
            {'id': 'p004', 'name': 'Ravindra Jadeja', 'team': 'India', 'role': 'All-rounder', 'credits': 9, 'points': 0},
            {'id': 'p005', 'name': 'KL Rahul', 'team': 'India', 'role': 'Wicket-keeper', 'credits': 8.5, 'points': 0},
            {'id': 'p006', 'name': 'Steve Smith', 'team': 'Australia', 'role': 'Batsman', 'credits': 10.5, 'points': 0},
            {'id': 'p007', 'name': 'David Warner', 'team': 'Australia', 'role': 'Batsman', 'credits': 10, 'points': 0},
            {'id': 'p008', 'name': 'Pat Cummins', 'team': 'Australia', 'role': 'Bowler', 'credits': 9, 'points': 0},
            {'id': 'p009', 'name': 'Glenn Maxwell', 'team': 'Australia', 'role': 'All-rounder', 'credits': 9.5, 'points': 0},
            {'id': 'p010', 'name': 'Alex Carey', 'team': 'Australia', 'role': 'Wicket-keeper', 'credits': 8, 'points': 0},
            {'id': 'p011', 'name': 'Joe Root', 'team': 'England', 'role': 'Batsman', 'credits': 10, 'points': 0},
            {'id': 'p012', 'name': 'Ben Stokes', 'team': 'England', 'role': 'All-rounder', 'credits': 10.5, 'points': 0},
            {'id': 'p013', 'name': 'Jofra Archer', 'team': 'England', 'role': 'Bowler', 'credits': 9, 'points': 0},
            {'id': 'p014', 'name': 'Jos Buttler', 'team': 'England', 'role': 'Wicket-keeper', 'credits': 9.5, 'points': 0},
            {'id': 'p015', 'name': 'Kane Williamson', 'team': 'New Zealand', 'role': 'Batsman', 'credits': 10, 'points': 0}
        ]
    
    def create_team(self, user_id, team_name):
        """Create a new fantasy team"""
        team = {
            'user_id': user_id,
            'name': team_name,
            'players': [],
            'captain': None,
            'vice_captain': None,
            'total_credits': 100,
            'used_credits': 0,
            'total_points': 0,
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        self.user_teams[user_id] = team
        return team
    
    def add_player(self, user_id, player_id):
        """Add player to team"""
        if user_id not in self.user_teams:
            return {'error': 'Team not found'}
        
        team = self.user_teams[user_id]
        player = next((p for p in self.player_pool if p['id'] == player_id), None)
        
        if not player:
            return {'error': 'Player not found'}
        
        if len(team['players']) >= 11:
            return {'error': 'Team already has 11 players'}
        
        if any(p['id'] == player_id for p in team['players']):
            return {'error': 'Player already in team'}
        
        remaining_credits = team['total_credits'] - team['used_credits']
        if player['credits'] > remaining_credits:
            return {'error': 'Not enough credits'}
        
        # Team-based constraint: at most 4 players from the same real-world team
        team_counts = {}
        for p in team['players']:
            team_counts[p['team']] = team_counts.get(p['team'], 0) + 1
        if team_counts.get(player['team'], 0) >= 4:
            return {'error': 'Maximum 4 players from one team reached'}
        
        # Role constraints
        role_count = {'Batsman': 0, 'Bowler': 0, 'All-rounder': 0, 'Wicket-keeper': 0}
        for p in team['players']:
            role_count[p['role']] += 1
        
        if role_count[player['role']] >= 4 and player['role'] != 'Wicket-keeper':
            return {'error': f'Maximum {player["role"]}s reached'}
        if player['role'] == 'Wicket-keeper' and role_count['Wicket-keeper'] >= 2:
            return {'error': 'Maximum wicket-keepers reached'}
        
        team['players'].append(player)
        team['used_credits'] += player['credits']
        
        return {'success': True, 'team': team}
    
    def remove_player(self, user_id, player_id):
        """Remove player from team"""
        if user_id not in self.user_teams:
            return {'error': 'Team not found'}
        
        team = self.user_teams[user_id]
        player = next((p for p in team['players'] if p['id'] == player_id), None)
        
        if not player:
            return {'error': 'Player not in team'}
        
        team['players'] = [p for p in team['players'] if p['id'] != player_id]
        team['used_credits'] -= player['credits']
        
        if team['captain'] == player_id:
            team['captain'] = None
        if team['vice_captain'] == player_id:
            team['vice_captain'] = None
        
        return {'success': True, 'team': team}
    
    def set_captain(self, user_id, player_id):
        """Set team captain (2x points)"""
        if user_id not in self.user_teams:
            return {'error': 'Team not found'}
        
        team = self.user_teams[user_id]
        if not any(p['id'] == player_id for p in team['players']):
            return {'error': 'Player not in team'}
        
        team['captain'] = player_id
        return {'success': True, 'team': team}
    
    def get_leaderboard(self):
        """Get fantasy leaderboard"""
        # Sample leaderboard data
        return [
            {'rank': 1, 'user': 'CricketKing', 'team': 'Super Strikers', 'points': 1250, 'matches': 15},
            {'rank': 2, 'user': 'BoundaryHunter', 'team': 'Six Hitters', 'points': 1180, 'matches': 15},
            {'rank': 3, 'user': 'WicketTaker', 'team': 'Bowling Stars', 'points': 1120, 'matches': 15},
            {'rank': 4, 'user': 'AllRounder', 'team': 'Dream Team', 'points': 1080, 'matches': 15},
            {'rank': 5, 'user': 'CricketFan', 'team': 'Power Play', 'points': 1050, 'matches': 15},
            {'rank': 6, 'user': 'StadiumStar', 'team': 'Champions XI', 'points': 1020, 'matches': 15},
            {'rank': 7, 'user': 'PitchPerfect', 'team': 'Cricket Masters', 'points': 980, 'matches': 15},
            {'rank': 8, 'user': 'CoverDrive', 'team': 'Batting Legends', 'points': 950, 'matches': 15},
            {'rank': 9, 'user': 'YorkerKing', 'team': 'Fast Bowlers', 'points': 920, 'matches': 15},
            {'rank': 10, 'user': 'SlipCatcher', 'team': 'Fielding Stars', 'points': 890, 'matches': 15}
        ]

    def report_team(self, user_id):
        """Generate a summary report for a user's fantasy team."""
        if user_id not in self.user_teams:
            return {'error': 'Team not found'}

        team = self.user_teams[user_id]
        players = team['players']
        role_count = {'Batsman': 0, 'Bowler': 0, 'All-rounder': 0, 'Wicket-keeper': 0}
        for p in players:
            role_count[p['role']] += 1

        remaining_credits = team['total_credits'] - team['used_credits']

        # basic validity checks
        wk_ok = 1 <= role_count['Wicket-keeper'] <= 2
        bats_ok = 3 <= role_count['Batsman'] <= 6
        bowl_ok = 3 <= role_count['Bowler'] <= 6
        ar_ok = 1 <= role_count['All-rounder'] <= 4
        size_ok = len(players) == 11

        valid = all([wk_ok, bats_ok, bowl_ok, ar_ok, size_ok])

        total_points = sum(p.get('points', 0) for p in players)

        # compare against sample leaderboard averages to give a rough "chance" metric
        leaders = self.get_leaderboard()
        avg_points = sum(l['points'] for l in leaders) / len(leaders)
        if total_points >= avg_points:
            chance = 'Above average compared to top 10 sample'
        else:
            chance = 'Below average compared to top 10 sample'

        return {
            'role_count': role_count,
            'remaining_credits': remaining_credits,
            'valid': valid,
            'total_points': total_points,
            'chance_description': chance
        }
    
    def get_available_players(self):
        """Get list of available players"""
        return self.player_pool