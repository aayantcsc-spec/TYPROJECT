import random
import json
from datetime import datetime

class MatchPredictor:
    def __init__(self):
        self.team_ratings = self._load_team_ratings()
        self.venue_stats = self._load_venue_stats()
    
    def _load_team_ratings(self):
        """Load team ratings (in production, this would come from database)"""
        return {
            'India': {'rating': 95, 'home_advantage': 5},
            'Australia': {'rating': 92, 'home_advantage': 5},
            'England': {'rating': 90, 'home_advantage': 5},
            'New Zealand': {'rating': 88, 'home_advantage': 4},
            'South Africa': {'rating': 87, 'home_advantage': 6},
            'Pakistan': {'rating': 85, 'home_advantage': 8},
            'Sri Lanka': {'rating': 82, 'home_advantage': 7},
            'West Indies': {'rating': 80, 'home_advantage': 5},
            'Bangladesh': {'rating': 78, 'home_advantage': 8},
            'Afghanistan': {'rating': 75, 'home_advantage': 9}
        }
    
    def _load_venue_stats(self):
        """Load venue statistics"""
        return {
            'Wankhede Stadium, Mumbai': {'batting_friendly': 85, 'pace_friendly': 60},
            'Eden Gardens, Kolkata': {'batting_friendly': 75, 'pace_friendly': 50},
            'Lord\'s, London': {'batting_friendly': 70, 'pace_friendly': 80},
            'Melbourne Cricket Ground': {'batting_friendly': 75, 'pace_friendly': 75},
            'Sydney Cricket Ground': {'batting_friendly': 80, 'pace_friendly': 70}
        }
    
    def predict_match(self, team1, team2, venue, match_format='ODI'):
        """
        Predict match outcome using basic algorithm
        In production, this would use ML models with historical data
        """
        # Get team ratings
        t1_rating = self.team_ratings.get(team1, {'rating': 80, 'home_advantage': 5})
        t2_rating = self.team_ratings.get(team2, {'rating': 80, 'home_advantage': 5})
        
        # Venue factor
        venue_data = self.venue_stats.get(venue, {'batting_friendly': 75, 'pace_friendly': 65})
        
        # Calculate base probabilities
        t1_strength = t1_rating['rating'] + random.randint(-5, 5)
        t2_strength = t2_rating['rating'] + random.randint(-5, 5)
        
        # Venue adjustment (teams familiar with conditions)
        if 'India' in team1 and 'India' in venue:
            t1_strength += t1_rating['home_advantage']
        if 'Australia' in team1 and 'Australia' in venue:
            t1_strength += t1_rating['home_advantage']
        if 'India' in team2 and 'India' in venue:
            t2_strength += t2_rating['home_advantage']
        if 'Australia' in team2 and 'Australia' in venue:
            t2_strength += t2_rating['home_advantage']
        
        # Calculate win probability
        total_strength = t1_strength + t2_strength
        t1_prob = (t1_strength / total_strength) * 100
        t2_prob = (t2_strength / total_strength) * 100
        
        # Predicted scores (for limited overs)
        if match_format in ['ODI', 'T20']:
            base_score = 250 if match_format == 'ODI' else 165
            t1_predicted = int(base_score * (t1_strength / 90) * (venue_data['batting_friendly'] / 75))
            t2_predicted = int(base_score * (t2_strength / 90) * (venue_data['batting_friendly'] / 75))
        else:
            t1_predicted = None
            t2_predicted = None
        
        # Determine favorite
        if t1_prob > t2_prob:
            favorite = team1
            favorite_prob = t1_prob
        else:
            favorite = team2
            favorite_prob = t2_prob
        
        return {
            'team1': {
                'name': team1,
                'win_probability': round(t1_prob, 1),
                'predicted_score': t1_predicted
            },
            'team2': {
                'name': team2,
                'win_probability': round(t2_prob, 1),
                'predicted_score': t2_predicted
            },
            'favorite': favorite,
            'confidence': round(favorite_prob, 1),
            'venue_advantage': venue,
            'match_format': match_format,
            'key_factors': [
                f"{team1} recent form",
                f"{team2} head-to-head record",
                f"Pitch conditions at {venue}",
                "Weather conditions",
                "Team composition"
            ],
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
    
    def predict_player_performance(self, player_id, match_conditions):
        """Predict individual player performance"""
        # Simplified prediction logic
        base_score = random.randint(20, 60)
        form_factor = random.uniform(0.8, 1.2)
        
        predicted_runs = int(base_score * form_factor)
        predicted_wickets = random.randint(0, 3) if random.random() > 0.7 else 0
        
        return {
            'predicted_runs': predicted_runs,
            'predicted_wickets': predicted_wickets,
            'confidence': random.randint(60, 85),
            'form': 'Good' if form_factor > 1.0 else 'Average'
        }