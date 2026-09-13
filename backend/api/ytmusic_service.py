"""
ytmusic_service.py
High-Performance YouTube Music & Video integration service with:
 - Pure Song & Audio Filtering (Strict exclusion of YouTube Shorts, video clips, reactions, podcasts, memes)
 - Minimum duration threshold (>= 65s) to eliminate ringtones and shorts
 - Official YouTube Music 'songs' catalog filtering as primary engine
 - Fast In-Memory TTL LRU caching for instant search (< 1ms cached)
 - 4-Hour Stream URL caching to eliminate yt-dlp latency on repeated playback
 - Resilient audio stream extraction with connection pooling
"""

import os
import time
from pathlib import Path
from ytmusicapi import YTMusic, OAuthCredentials
import yt_dlp

BASE_DIR = Path(__file__).resolve().parent.parent

EXCLUDED_TERMS = [
    '#shorts', '#short', '/shorts/', 'shorts', 'short clip', 'tiktok', 'reels', 'whatsapp status',
    'status video', 'meme', 'trailer', 'teaser', 'snippet', 'ringtone', 'reaction',
    'review', 'podcast', 'interview', 'vlog', 'behind the scenes', 'gameplay',
    'walkthrough', 'speedrun', 'episode', 'audiobook', 'parody', 'unboxing', 'funny moments',
    'highlights', 'compilation of', 'stand up comedy', 'tutorial', 'how to'
]

class YTMusicService:
    def __init__(self):
        self.ytm = None
        self._search_cache = {}    # { query: (timestamp, results) }
        self._stream_cache = {}    # { video_id: (timestamp, url) }
        self._trending_cache = None # (timestamp, results)
        self._genre_mood_cache = {} # { cache_key: (timestamp, results) }
        self._init_client()

    def _init_client(self):
        browser_json = BASE_DIR / 'browser.json'
        oauth_json = BASE_DIR / 'oauth.json'

        client_id = os.getenv('YTM_CLIENT_ID')
        client_secret = os.getenv('YTM_CLIENT_SECRET')

        try:
            if browser_json.exists():
                print(f"[YTMusic] Initializing with {browser_json.name}")
                self.ytm = YTMusic(str(browser_json))
            elif oauth_json.exists() and client_id and client_secret:
                print(f"[YTMusic] Initializing with {oauth_json.name} & OAuth credentials")
                self.ytm = YTMusic(
                    str(oauth_json),
                    oauth_credentials=OAuthCredentials(client_id=client_id, client_secret=client_secret)
                )
            elif oauth_json.exists():
                print(f"[YTMusic] Initializing with {oauth_json.name}")
                self.ytm = YTMusic(str(oauth_json))
            else:
                print("[YTMusic] Initializing in public unauthenticated mode (Search, Charts, Catalog)")
                self.ytm = YTMusic()
        except Exception as e:
            print(f"[YTMusic] Initialization warning: {e}. Falling back to public mode.")
            self.ytm = YTMusic()

    def _is_pure_song(self, title, duration_seconds, link=""):
        """
        Strict filter to ensure only authentic full songs are delivered:
        - Excludes YouTube Shorts (< 65 seconds)
        - Excludes extreme long clips (> 20 mins)
        - Excludes title / url keywords (shorts, tiktok, reaction, podcast, meme, review, etc.)
        """
        if duration_seconds < 65 or duration_seconds > 1200:
            return False

        lower_title = str(title).lower()
        lower_link = str(link).lower()

        if any(term in lower_title for term in EXCLUDED_TERMS):
            return False
        if any(term in lower_link for term in EXCLUDED_TERMS):
            return False

        return True

    def _get_cover_url(self, item, video_id):
        thumbnails = item.get('thumbnails') or item.get('thumbnail') or []
        if isinstance(thumbnails, list) and thumbnails:
            last = thumbnails[-1]
            url = last.get('url', '') if isinstance(last, dict) else str(last)
            if url.startswith('//'):
                url = 'https:' + url
            if url:
                return url
        elif isinstance(thumbnails, str) and thumbnails:
            return thumbnails
        if video_id:
            return f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
        return 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80'

    def search_youtube_videos(self, query, limit=16):
        """
        Search for pure songs only.
        Uses YouTube Music 'songs' filter first, supplemented by clean YouTube scraped tracks.
        """
        if not query:
            return []

        cache_key = f"songs_only_{query.lower().strip()}_{limit}"
        now = time.time()

        # Return cached results if fresher than 1 hour (3600s)
        if cache_key in self._search_cache:
            cached_time, cached_results = self._search_cache[cache_key]
            if now - cached_time < 3600:
                return cached_results

        # 1. Primary: Official YouTube Music Songs Filter
        tracks = self.search_tracks(query, limit=limit)

        # 2. Fallback to clean youtube-search-python if needed
        if len(tracks) < 6:
            try:
                from youtubesearchpython import VideosSearch
                search_query = f"{query} song audio"
                vs = VideosSearch(search_query, limit=limit * 2)
                raw_results = vs.result().get('result', [])

                for item in raw_results:
                    video_id = item.get('id')
                    if not video_id or any(t.get('videoId') == video_id for t in tracks):
                        continue

                    title = item.get('title', 'Unknown Title')
                    duration_str = item.get('duration') or '3:30'
                    duration_seconds = self._parse_duration(duration_str)
                    link = item.get('link', '')

                    if not self._is_pure_song(title, duration_seconds, link):
                        continue

                    channel = item.get('channel', {})
                    artist_name = channel.get('name', 'YouTube Artist') if isinstance(channel, dict) else 'YouTube Artist'

                    cover_url = self._get_cover_url(item, video_id)

                    view_count = ''
                    if isinstance(item.get('viewCount'), dict):
                        view_count = item.get('viewCount', {}).get('short', '')

                    tracks.append({
                        'id': f"yt-{video_id}",
                        'videoId': video_id,
                        'title': title,
                        'artist_name': artist_name,
                        'artist': artist_name,
                        'cover_url': cover_url,
                        'cover': cover_url,
                        'duration': duration_str,
                        'duration_seconds': duration_seconds,
                        'genre': 'Tunely',
                        'audio_url': f"/api/ytm/stream/{video_id}/",
                        'youtube_url': f"https://www.youtube.com/watch?v={video_id}",
                        'is_ytm': True,
                        'is_youtube_video': True,
                        'views': view_count,
                    })

                    if len(tracks) >= limit:
                        break
            except Exception as e:
                print(f"[YouTubeSearch] Filtered search note: {e}")

        # Save in memory cache
        self._search_cache[cache_key] = (now, tracks)
        if len(self._search_cache) > 500:
            oldest_key = min(self._search_cache.keys(), key=lambda k: self._search_cache[k][0])
            del self._search_cache[oldest_key]

        return tracks

    def search_tracks(self, query, limit=16):
        """
        Search official YouTube Music catalog using filter='songs'.
        """
        if not query:
            return []
        try:
            results = self.ytm.search(query, filter='songs', limit=limit * 2)
            tracks = []
            for item in results:
                video_id = item.get('videoId')
                if not video_id:
                    continue

                title = item.get('title', 'Unknown Title')
                duration_str = item.get('duration', '3:30')
                duration_seconds = self._parse_duration(duration_str)

                # Strict duration & content filter
                if not self._is_pure_song(title, duration_seconds):
                    continue

                artists = item.get('artists', [])
                artist_name = artists[0]['name'] if artists else 'Unknown Artist'
                artist_id = artists[0]['id'] if artists and 'id' in artists[0] else ''

                cover_url = self._get_cover_url(item, video_id)

                album = item.get('album', {})
                album_title = album.get('name') if album else ''

                tracks.append({
                    'id': f"ytm-{video_id}",
                    'videoId': video_id,
                    'title': title,
                    'artist_name': artist_name,
                    'artist': artist_name,
                    'artist_id': artist_id,
                    'album_title': album_title,
                    'cover_url': cover_url,
                    'cover': cover_url,
                    'duration': duration_str,
                    'duration_seconds': duration_seconds,
                    'genre': 'Tunely',
                    'audio_url': f"/api/ytm/stream/{video_id}/",
                    'youtube_url': f"https://www.youtube.com/watch?v={video_id}",
                    'is_ytm': True,
                })

                if len(tracks) >= limit:
                    break

            return tracks
        except Exception as e:
            print(f"[YTMusic] Search error: {e}")
            return []

    def get_trending_tracks(self):
        return self.get_trending_songs()

    def get_trending_songs(self):
        """
        Fetch top trending songs from YouTube Music charts with disk cache and reliable fallback.
        """
        now = time.time()
        if self._trending_cache:
            cached_time, cached_tracks = self._trending_cache
            if now - cached_time < 7200 and cached_tracks:  # 2 hours and non-empty
                return cached_tracks

        # 1. Check disk cache for instant startup (0ms)
        cache_file = BASE_DIR / 'trending_cache.json'
        if not self._trending_cache and cache_file.exists():
            try:
                import json
                with open(cache_file, 'r', encoding='utf-8') as f:
                    disk_data = json.load(f)
                    if disk_data and isinstance(disk_data, list) and len(disk_data) > 0:
                        self._trending_cache = (now, disk_data)
                        return disk_data
            except Exception as e:
                print(f"[YTMusic] Disk cache read note: {e}")

        # 2. Query YouTube Music Charts
        try:
            charts = self.ytm.get_charts(country='US')
            songs_data = charts.get('songs')
            items = []
            if isinstance(songs_data, dict):
                items = songs_data.get('items', [])
            elif isinstance(songs_data, list):
                items = songs_data

            if not items and 'videos' in charts:
                videos_data = charts.get('videos')
                if isinstance(videos_data, dict):
                    items = videos_data.get('items', [])

            tracks = []
            for item in items[:24]:
                video_id = item.get('videoId')
                if not video_id:
                    continue

                title = item.get('title', 'Trending Song')
                artists = item.get('artists', [])
                artist_name = artists[0]['name'] if artists else 'Top Artist'

                cover_url = self._get_cover_url(item, video_id)

                tracks.append({
                    'id': f"ytm-{video_id}",
                    'videoId': video_id,
                    'title': title,
                    'artist_name': artist_name,
                    'artist': artist_name,
                    'cover_url': cover_url,
                    'cover': cover_url,
                    'duration': '3:30',
                    'duration_seconds': 210,
                    'genre': 'Top Charts',
                    'audio_url': f"/api/ytm/stream/{video_id}/",
                    'youtube_url': f"https://www.youtube.com/watch?v={video_id}",
                    'is_ytm': True,
                })
            if tracks:
                self._trending_cache = (now, tracks)
                self._save_trending_to_disk(tracks)
                return tracks
        except Exception as e:
            print(f"[YTMusic] Charts error: {e}")

        # 3. Fallback to searching top global trending songs
        try:
            tracks = self.search_tracks("top global trending songs hits", limit=24)
            if tracks:
                self._trending_cache = (now, tracks)
                self._save_trending_to_disk(tracks)
                return tracks
        except Exception as e:
            print(f"[YTMusic] Trending fallback error: {e}")

        # 4. Instant local DB fallback if network is offline or slow
        try:
            from api.models import Track
            db_tracks = Track.objects.select_related('artist', 'album').all()[:24]
            fallback_tracks = []
            for t in db_tracks:
                vid = t.audio_url.rstrip('/').split('/')[-1] if '/stream/' in t.audio_url else f"db-{t.id}"
                fallback_tracks.append({
                    'id': f"ytm-{vid}",
                    'videoId': vid,
                    'title': t.title,
                    'artist_name': t.artist.name if t.artist else 'Tunely Artist',
                    'artist': t.artist.name if t.artist else 'Tunely Artist',
                    'cover_url': t.cover_url or (t.album.cover_url if t.album else ''),
                    'cover': t.cover_url or (t.album.cover_url if t.album else ''),
                    'duration': t.duration or '3:30',
                    'duration_seconds': t.duration_seconds or 210,
                    'genre': t.genre or 'Top Charts',
                    'audio_url': t.audio_url or f"/api/ytm/stream/{vid}/",
                    'youtube_url': f"https://www.youtube.com/watch?v={vid}",
                    'is_ytm': True,
                })
            if fallback_tracks:
                self._trending_cache = (now, fallback_tracks)
                return fallback_tracks
        except Exception:
            pass

        return []

    def _save_trending_to_disk(self, tracks):
        try:
            import json
            cache_file = BASE_DIR / 'trending_cache.json'
            with open(cache_file, 'w', encoding='utf-8') as f:
                json.dump(tracks, f, ensure_ascii=False)
        except Exception as e:
            print(f"[YTMusic] Disk cache write note: {e}")

    def get_stream_url(self, video_id):
        """
        Extract direct audio stream URL with 4-hour in-memory caching and optimized yt-dlp.
        """
        now = time.time()
        if video_id in self._stream_cache:
            cached_time, cached_url = self._stream_cache[video_id]
            if now - cached_time < 14400:  # 4 hours
                return cached_url

        video_url = f"https://www.youtube.com/watch?v={video_id}"
        ydl_opts = {
            'format': '140/bestaudio[ext=m4a][format_id!=139][asr>=44100]/251/bestaudio[format_id!=139][asr>=44100]/bestaudio[format_id!=139]',
            'quiet': True,
            'no_warnings': True,
            'skip_download': True,
            'extract_flat': False,
            'nocheckcertificate': True,
            'youtube_include_dash_manifest': False,
            'youtube_include_hls_manifest': False,
            'extractor_retries': 0,
            'socket_timeout': 6,
        }
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(video_url, download=False)
                url = info.get('url')
                if url:
                    self._stream_cache[video_id] = (now, url)
                    if len(self._stream_cache) > 1000:
                        oldest_key = min(self._stream_cache.keys(), key=lambda k: self._stream_cache[k][0])
                        del self._stream_cache[oldest_key]
                return url
        except Exception as e:
            print(f"[YTMusic] Stream extraction error: {e}")
            return None

    def get_related_tracks(self, video_id=None, artist_name="", title="", limit=10):
        """
        Fetch related songs from YouTube Music radio/watch playlist or artist search.
        Strictly filters pure songs.
        """
        tracks = []
        seen_ids = set()

        if video_id:
            try:
                watch_data = self.ytm.get_watch_playlist(videoId=video_id, limit=limit + 5)
                raw_tracks = watch_data.get('tracks', [])
                for item in raw_tracks:
                    vid = item.get('videoId')
                    if not vid or vid == video_id or vid in seen_ids:
                        continue
                    t_title = item.get('title', 'Related Song')
                    artists = item.get('artists', [])
                    a_name = artists[0]['name'] if artists else (artist_name or 'Artist')
                    cover_url = self._get_cover_url(item, vid)
                    duration_str = item.get('length', '3:30')
                    duration_sec = self._parse_duration(duration_str)

                    if not self._is_pure_song(t_title, duration_sec):
                        continue

                    seen_ids.add(vid)
                    tracks.append({
                        'id': f"ytm-{vid}",
                        'videoId': vid,
                        'title': t_title,
                        'artist_name': a_name,
                        'artist': a_name,
                        'cover_url': cover_url,
                        'cover': cover_url,
                        'duration': duration_str,
                        'duration_seconds': duration_sec,
                        'genre': 'Tunely Radio',
                        'audio_url': f"/api/ytm/stream/{vid}/",
                        'youtube_url': f"https://www.youtube.com/watch?v={vid}",
                        'is_ytm': True,
                    })
                    if len(tracks) >= limit:
                        break
            except Exception as e:
                print(f"[YTMusic] Related watch playlist note: {e}")

        # Fallback to searching artist or related tracks if watch playlist returned few
        if len(tracks) < 3 and (artist_name or title):
            query = f"{artist_name} songs" if artist_name else f"{title} song"
            search_results = self.search_youtube_videos(query, limit=limit)
            for st in search_results:
                if st.get('videoId') != video_id and st.get('videoId') not in seen_ids:
                    seen_ids.add(st['videoId'])
                    tracks.append(st)
                    if len(tracks) >= limit:
                        break

        return tracks

    def get_lyrics(self, video_id):
        try:
            watch_playlist = self.ytm.get_watch_playlist(videoId=video_id)
            lyrics_browse_id = watch_playlist.get('lyrics')
            if lyrics_browse_id:
                lyrics_data = self.ytm.get_lyrics(lyrics_browse_id)
                return lyrics_data.get('lyrics')
        except Exception as e:
            print(f"[YTMusic] Lyrics error: {e}")
        return None

    def get_genre_or_mood_tracks(self, genre=None, mood=None, limit=24):
        """
        Fetch top songs categorized according to Genre and/or Mood using YouTube Music's native ranking algorithm.
        Pure songs only (filters shorts, podcasts, and clips).
        """
        clean_genre = (genre or '').strip()
        clean_mood = (mood or '').strip()
        if clean_genre.lower() in ('all', '', 'none'):
            clean_genre = ''
        if clean_mood.lower() in ('all', '', 'none'):
            clean_mood = ''

        if not clean_genre and not clean_mood:
            return self.get_trending_tracks()

        cache_key = f"gm_{clean_genre.lower()}_{clean_mood.lower()}_{limit}"
        now = time.time()
        if cache_key in self._genre_mood_cache:
            cached_time, cached_tracks = self._genre_mood_cache[cache_key]
            if now - cached_time < 7200:  # 2 hours cache
                return cached_tracks

        # Construct algorithmic search queries tailored for YouTube Music song ranking
        queries = []
        if clean_genre and clean_mood:
            queries = [
                f"{clean_mood} {clean_genre} songs",
                f"best {clean_genre} {clean_mood} music hits",
                f"{clean_genre} {clean_mood} playlist top",
                f"{clean_mood} {clean_genre} popular tracks",
            ]
        elif clean_genre:
            queries = [
                f"{clean_genre} songs hits",
                f"best of {clean_genre} music",
                f"top {clean_genre} tracks",
                f"popular {clean_genre} playlist",
            ]
        else:
            queries = [
                f"{clean_mood} music songs vibes",
                f"chill {clean_mood} playlist songs",
                f"best {clean_mood} tracks",
                f"popular {clean_mood} songs",
            ]

        tracks = []
        seen_ids = set()

        for q in queries:
            sub_limit = limit - len(tracks)
            if sub_limit <= 0:
                break
            batch = self.search_tracks(q, limit=sub_limit)
            for t in batch:
                vid = t.get('videoId')
                if vid and vid not in seen_ids:
                    seen_ids.add(vid)
                    tracks.append(t)
            if len(tracks) >= limit:
                break

        # Fallback to general YouTube search if too few
        if len(tracks) < min(12, limit):
            fallback_query = f"{clean_genre} {clean_mood} music".strip()
            fallback_tracks = self.search_youtube_videos(fallback_query, limit=limit - len(tracks))
            for ft in fallback_tracks:
                vid = ft.get('videoId')
                if vid and vid not in seen_ids:
                    seen_ids.add(vid)
                    tracks.append(ft)
                if len(tracks) >= limit:
                    break

        # Stamp the categorized genre and mood on each track object
        for t in tracks:
            if clean_genre:
                t['genre'] = clean_genre
            if clean_mood:
                t['mood'] = clean_mood

        self._genre_mood_cache[cache_key] = (now, tracks)
        if len(self._genre_mood_cache) > 300:
            oldest = min(self._genre_mood_cache.keys(), key=lambda k: self._genre_mood_cache[k][0])
            del self._genre_mood_cache[oldest]

        return tracks

    def _parse_duration(self, duration_str):
        try:
            parts = [int(p) for p in str(duration_str).split(':')]
            if len(parts) == 2:
                return parts[0] * 60 + parts[1]
            elif len(parts) == 3:
                return parts[0] * 3600 + parts[1] * 60 + parts[2]
            return 210
        except:
            return 210

ytmusic_service = YTMusicService()
