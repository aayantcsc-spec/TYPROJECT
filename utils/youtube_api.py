import requests
from config import Config

class YouTubeAPI:
    def __init__(self):
        self.api_key = Config.YOUTUBE_API_KEY
        self.base_url = Config.YOUTUBE_API_BASE_URL
    
    def search_cricket_videos(self, query="cricket highlights", max_results=12):
        """Search for cricket videos on YouTube"""
        endpoint = f"{self.base_url}/search"
        params = {
            'part': 'snippet',
            'q': query,
            'type': 'video',
            'maxResults': max_results,
            'key': self.api_key,
            'order': 'relevance',
            'videoEmbeddable': 'true'
        }
        
        try:
            response = requests.get(endpoint, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            videos = []
            for item in data.get('items', []):
                video = {
                    'id': item['id']['videoId'],
                    'title': item['snippet']['title'],
                    'description': item['snippet']['description'][:200] + '...',
                    'thumbnail': item['snippet']['thumbnails']['medium']['url'],
                    'channel': item['snippet']['channelTitle'],
                    'published_at': item['snippet']['publishedAt'][:10],
                    'url': f"https://www.youtube.com/watch?v={item['id']['videoId']}",
                    'embed_url': f"https://www.youtube.com/embed/{item['id']['videoId']}"
                }
                videos.append(video)
            
            return videos
        except Exception as e:
            print(f"YouTube API Error: {e}")
            return self._get_fallback_videos()
    
    def get_video_details(self, video_id):
        """Get detailed information about a specific video"""
        endpoint = f"{self.base_url}/videos"
        params = {
            'part': 'snippet,statistics,contentDetails',
            'id': video_id,
            'key': self.api_key
        }
        
        try:
            response = requests.get(endpoint, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data.get('items'):
                item = data['items'][0]
                return {
                    'id': video_id,
                    'title': item['snippet']['title'],
                    'description': item['snippet']['description'],
                    'views': item['statistics'].get('viewCount', '0'),
                    'likes': item['statistics'].get('likeCount', '0'),
                    'duration': item['contentDetails']['duration'],
                    'thumbnail': item['snippet']['thumbnails']['high']['url']
                }
        except Exception as e:
            print(f"YouTube API Error: {e}")
        
        return None
    
    def get_channel_videos(self, channel_id, max_results=10):
        """Get videos from a specific cricket channel"""
        endpoint = f"{self.base_url}/search"
        params = {
            'part': 'snippet',
            'channelId': channel_id,
            'type': 'video',
            'maxResults': max_results,
            'order': 'date',
            'key': self.api_key
        }
        
        try:
            response = requests.get(endpoint, params=params, timeout=10)
            response.raise_for_status()
            return response.json().get('items', [])
        except Exception as e:
            print(f"YouTube API Error: {e}")
            return []
    
    def _get_fallback_videos(self):
        """Fallback videos when API fails"""
        return [
            {
                'id': 'sample1',
                'title': 'India vs Australia - Match Highlights',
                'description': 'Watch the exciting highlights from the latest match...',
                'thumbnail': 'https://via.placeholder.com/320x180?text=Cricket+Highlights',
                'channel': 'Cricket Highlights',
                'published_at': '2024-01-15',
                'url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'embed_url': 'https://www.youtube.com/embed/dQw4w9WgXcQ'
            },
            {
                'id': 'sample2',
                'title': 'Top 10 Catches in Cricket History',
                'description': 'Amazing catches that changed the game...',
                'thumbnail': 'https://via.placeholder.com/320x180?text=Top+Catches',
                'channel': 'Cricket Legends',
                'published_at': '2024-01-14',
                'url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'embed_url': 'https://www.youtube.com/embed/dQw4w9WgXcQ'
            }
        ]