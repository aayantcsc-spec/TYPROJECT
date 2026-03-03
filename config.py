import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'cricket-app-secret-key-2024'
    
    # Cricket Data API Configuration
    CRICKET_DATA_API_KEY = "4066b45f-9790-421d-bf61-0908ae31ec69"
    CRICKET_DATA_BASE_URL = "https://api.cricketdata.org/v1"
    
    # CricAPI Configuration
    CRIC_API_KEY = "4066b45f-9790-421d-bf61-0908ae31ec69"
    CRIC_API_BASE_URL = "https://api.cricapi.com/v1"
    # Optional Cricbuzz (RapidAPI) configuration - set via env to enable
    CRICBUZZ_RAPIDAPI_KEY = os.environ.get('5ec7de79a0msh7263db89892c147p179440jsnab9383687aa0') or None
    CRICBUZZ_RAPIDAPI_HOST = os.environ.get('5ec7de79a0msh7263db89892c147p179440jsnab9383687aa0') or 'cricbuzz-cricket.p.rapidapi.com'
    CRICBUZZ_BASE_URL = os.environ.get('CRICBUZZ_BASE_URL') or 'https://cricbuzz-cricket.p.rapidapi.com'
    
    # YouTube API Configuration
    YOUTUBE_API_KEY = "AIzaSyATfcwlhA5oBxg21figCrJ-Bzosa67PIkM"
    YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3"
    
    # App Settings
    DEBUG = True
    CACHE_TIMEOUT = 300  # 5 minutes cache