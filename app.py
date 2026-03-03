from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from config import Config
from utils.cricket_api import CricketDataAPI
from utils.youtube_api import YouTubeAPI
from utils.prediction import MatchPredictor
from utils.fantasy import FantasyTeamManager
import json
from datetime import datetime

app = Flask(__name__)
app.config.from_object(Config)

# Initialize services
cricket_api = CricketDataAPI()
youtube_api = YouTubeAPI()
predictor = MatchPredictor()
fantasy_manager = FantasyTeamManager()

# helper to convert CricAPI-style team1/team2 format into home/away layout used by templates

def _normalize_match(match: dict) -> dict:
    teams = match.get('teams', {})
    if 'team1' in teams and 'team2' in teams:
        t1 = teams['team1']
        t2 = teams['team2']
        match['teams'] = {
            'home': {
                'name': t1.get('name', ''),
                'score': t1.get('score', ''),
                'overs': t1.get('overs', '')
            },
            'away': {
                'name': t2.get('name', ''),
                'score': t2.get('score', ''),
                'overs': t2.get('overs', '')
            }
        }
    return match


@app.route('/')
def index():
    """Home page with overview"""
    try:
        live_matches = cricket_api.get_live_scores()
        # normalize if matches come from CricAPI
        live_matches = [_normalize_match(m) for m in live_matches]
        recent_matches = cricket_api.get_recent_matches()
        videos = youtube_api.search_cricket_videos("cricket highlights today", 4)
    except Exception as e:
        print(f"Error loading home page: {e}")
        live_matches = []
        recent_matches = []
        videos = []
    
    return render_template('index.html', 
                         live_matches=live_matches[:3] if live_matches else [],
                         recent_matches=recent_matches[:3] if recent_matches else [],
                         videos=videos)

@app.route('/live-scores')
def live_scores():
    """Live scores page"""
    try:
        live = cricket_api.get_live_scores()
        # convert to home/away format for templates
        live = [_normalize_match(m) for m in live]
        recent = cricket_api.get_recent_matches()
        upcoming = cricket_api.get_upcoming_matches()
    except Exception as e:
        print(f"Error: {e}")
        live, recent, upcoming = [], [], []
    
    return render_template('live_scores.html',
                         live_matches=live,
                         recent_matches=recent,
                         upcoming_matches=upcoming)

@app.route('/match/<match_id>')
def match_detail(match_id):
    """Individual match details"""
    try:
        scorecard = cricket_api.get_match_scorecard(match_id)
        squads = cricket_api.get_match_squads(match_id)
    except Exception as e:
        print(f"Error loading match: {e}")
        scorecard = {}
        squads = {}
    
    return render_template('match_detail.html',
                         match_id=match_id,
                         scorecard=scorecard,
                         squads=squads)

@app.route('/match-prediction', methods=['GET', 'POST'])
def match_prediction():
    """Match prediction page"""
    prediction = None
    teams = ['India', 'Australia', 'England', 'New Zealand', 'South Africa', 
             'Pakistan', 'Sri Lanka', 'West Indies', 'Bangladesh', 'Afghanistan']
    venues = ['Wankhede Stadium, Mumbai', 'Eden Gardens, Kolkata', 
              'Lord\'s, London', 'Melbourne Cricket Ground', 'Sydney Cricket Ground',
              'Old Trafford, Manchester', 'The Oval, London', 'MCG, Melbourne']
    
    if request.method == 'POST':
        team1 = request.form.get('team1')
        team2 = request.form.get('team2')
        venue = request.form.get('venue')
        match_format = request.form.get('format', 'ODI')
        
        if team1 and team2 and venue:
            prediction = predictor.predict_match(team1, team2, venue, match_format)
    
    return render_template('match_prediction.html',
                         prediction=prediction,
                         teams=teams,
                         venues=venues)

@app.route('/player-stats')
def player_stats():
    """Player statistics page"""
    search_query = request.args.get('search', '')
    
    if search_query:
        players = cricket_api.search_players(search_query)
    else:
        # Get top players
        players = cricket_api._get_sample_players()
    
    return render_template('player_stats.html', 
                         players=players,
                         search_query=search_query)

@app.route('/player/<player_id>')
def player_detail(player_id):
    """Individual player details"""
    try:
        info = cricket_api.get_player_info(player_id)
        stats = cricket_api.get_player_stats(player_id)
    except Exception as e:
        print(f"Error loading player: {e}")
        info = {}
        stats = {}
    
    return render_template('player_detail.html',
                         player=info,
                         stats=stats)

@app.route('/news')
def news():
    """Cricket news page"""
    try:
        news_items = cricket_api.get_cricket_news()
    except Exception as e:
        print(f"Error loading news: {e}")
        news_items = []
    
    return render_template('news.html', news=news_items)

@app.route('/team-management', methods=['GET', 'POST'])
def team_management():
    """Fantasy team management"""
    user_id = session.get('user_id', 'default_user')
    
    if 'user_id' not in session:
        session['user_id'] = user_id
    
    # Initialize team if not exists
    if user_id not in fantasy_manager.user_teams:
        fantasy_manager.create_team(user_id, 'My Dream Team')
    
    if request.method == 'POST':
        action = request.form.get('action')
        player_id = request.form.get('player_id')
        
        if action == 'add':
            result = fantasy_manager.add_player(user_id, player_id)
            if 'error' in result:
                session['error'] = result['error']
        elif action == 'remove':
            fantasy_manager.remove_player(user_id, player_id)
        elif action == 'captain':
            fantasy_manager.set_captain(user_id, player_id)
        
        return redirect(url_for('team_management'))
    
    team = fantasy_manager.user_teams.get(user_id)
    available_players = fantasy_manager.get_available_players()
    error = session.pop('error', None)

    # generate a report for display
    report = fantasy_manager.report_team(user_id)
    
    return render_template('team_management.html',
                         team=team,
                         available_players=available_players,
                         error=error,
                         report=report)

@app.route('/leaderboard')
def leaderboard():
    """Fantasy leaderboard"""
    leaders = fantasy_manager.get_leaderboard()
    return render_template('leaderboard.html', leaders=leaders)

@app.route('/videos')
def videos():
    """YouTube cricket videos"""
    search_query = request.args.get('q', 'cricket highlights')
    try:
        videos_list = youtube_api.search_cricket_videos(search_query, 12)
    except Exception as e:
        print(f"Error loading videos: {e}")
        videos_list = []
    
    return render_template('videos.html',
                         videos=videos_list,
                         search_query=search_query)

@app.route('/api/live-scores')
def api_live_scores():
    """API endpoint for live scores (for AJAX updates)"""
    try:
        matches = cricket_api.get_current_matches()
        return jsonify({'status': 'success', 'data': matches})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/predict', methods=['POST'])
def api_predict():
    """API endpoint for match prediction"""
    data = request.get_json()
    team1 = data.get('team1')
    team2 = data.get('team2')
    venue = data.get('venue')
    match_format = data.get('format', 'ODI')
    
    if not all([team1, team2, venue]):
        return jsonify({'error': 'Missing parameters'}), 400
    
    prediction = predictor.predict_match(team1, team2, venue, match_format)
    return jsonify(prediction)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)