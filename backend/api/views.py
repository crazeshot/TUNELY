from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Count, Q
from django.http import HttpResponse, StreamingHttpResponse
from django.shortcuts import redirect
from django.utils import timezone
import time
import requests
import urllib.parse
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import (
    Artist,
    Album,
    Track,
    Playlist,
    PlaylistItem,
    FavoriteTrack,
    ListeningHistory,
    UserProfile,
)
from .serializers import (
    ArtistSerializer,
    AlbumSerializer,
    TrackSerializer,
    PlaylistSerializer,
    UserSerializer,
    UserProfileSerializer,
    RegisterSerializer,
    LoginSerializer,
    ListeningHistorySerializer,
)


@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    return Response(
        {
            'service': 'Tunely Enterprise Audio API',
            'status': 'running',
            'version': '3.0.0',
            'features': [
                'JWT/Token Authentication',
                'Real-Time Track Radio & Similarity Engine',
                'Tunely Wrapped Analytics',
                'Synchronized .LRC Lyrics',
                'Audio DSP & 10-Band Graphic EQ',
                '3D Spatial Soundstage Support',
            ],
            'endpoints': {
                'auth_register': '/api/auth/register/',
                'auth_login': '/api/auth/login/',
                'auth_me': '/api/auth/me/',
                'auth_wrapped': '/api/auth/wrapped/',
                'tracks': '/api/tracks/',
                'track_radio': '/api/tracks/{id}/radio/',
                'daily_mix': '/api/daily-mix/',
                'recommended': '/api/tracks/recommended/',
                'recently_played': '/api/tracks/recently-played/',
                'artists': '/api/artists/',
                'albums': '/api/albums/',
                'playlists': '/api/playlists/',
                'genres': '/api/genres/',
                'search': '/api/search/?q={query}',
                'ytm_genre_mood': '/api/ytm/genre-mood/?genre={genre}&mood={mood}',
                'health': '/api/health/',
            },
        }
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response(
        {
            'status': 'ok',
            'timestamp': timezone.now().isoformat(),
            'database': 'connected',
            'track_count': Track.objects.count(),
            'artist_count': Artist.objects.count(),
            'user_count': User.objects.count(),
        }
    )


def favicon(request):
    return HttpResponse(status=204)


# ── AUTHENTICATION VIEWS ─────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    username = serializer.validated_data['username']
    email = serializer.validated_data['email']
    password = serializer.validated_data['password']
    display_name = serializer.validated_data.get('display_name') or username

    if User.objects.filter(username__iexact=username).exists():
        return Response({'error': 'Username already taken'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email__iexact=email).exists():
        return Response({'error': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password)
    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.display_name = display_name
    profile.save()

    token, _ = Token.objects.get_or_create(user=user)
    user_data = UserSerializer(user).data

    return Response({
        'token': token.key,
        'user': user_data,
        'message': f'Welcome to Tunely, {display_name}!'
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    username = serializer.validated_data['username']
    password = serializer.validated_data['password']

    # Support login with either username or email
    if '@' in username:
        user_obj = User.objects.filter(email__iexact=username).first()
        if user_obj:
            username = user_obj.username

    user = authenticate(username=username, password=password)
    if not user:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    token, _ = Token.objects.get_or_create(user=user)
    user_data = UserSerializer(user).data

    return Response({
        'token': token.key,
        'user': user_data,
        'message': f'Welcome back, {user.profile.display_name or user.username}!'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    Token.objects.filter(user=request.user).delete()
    return Response({'message': 'Successfully logged out'}, status=status.HTTP_200_OK)


@api_view(['GET', 'PUT'])
@permission_classes([AllowAny])
def me_view(request):
    user = request.user if request.user.is_authenticated else None
    if not user:
        # Return guest profile representation
        return Response({
            'is_guest': True,
            'username': 'Guest Audiophile',
            'display_name': 'Alex M. (Guest)',
            'avatar_url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
            'bio': 'Streaming on Tunely Guest Mode',
            'total_minutes_listened': 1420,
            'liked_count': FavoriteTrack.objects.count(),
        })

    if request.method == 'PUT':
        profile, _ = UserProfile.objects.get_or_create(user=user)
        display_name = request.data.get('display_name')
        avatar_url = request.data.get('avatar_url')
        bio = request.data.get('bio')
        preferred_theme = request.data.get('preferred_theme')

        if display_name is not None: profile.display_name = display_name
        if avatar_url is not None: profile.avatar_url = avatar_url
        if bio is not None: profile.bio = bio
        if preferred_theme is not None: profile.preferred_theme = preferred_theme
        profile.save()
        user.refresh_from_db()

    return Response(UserSerializer(user).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def wrapped_view(request):
    """
    Generates rich 'Tunely Wrapped' listening analytics & music personality for the active user.
    """
    user = request.user if request.user.is_authenticated else None
    
    minutes = 0
    streak_days = 1
    if user and hasattr(user, 'profile'):
        minutes = int(user.profile.total_minutes_listened)
        streak_days = max(1, getattr(user.profile, 'listening_streak', 1))

    top_tracks = Track.objects.order_by('-plays_count')[:5]
    top_artists = Artist.objects.all()[:3]
    top_genres = (
        Track.objects.values('genre')
        .annotate(count=Count('id'))
        .order_by('-count')[:3]
    )

    personalities = [
        {'title': 'Atmospheric Voyager', 'desc': 'You dwell in ethereal soundscapes, high dynamic range, and authentic acoustic depths.'},
        {'title': 'Neo-Psychedelic Explorer', 'desc': 'Your ears gravitate toward intricate instrumentation and sonic journeys.'},
        {'title': 'Audiophile Architect', 'desc': 'You appreciate spatial depth, high dynamic range, and flawless acoustic resonance.'},
    ]

    return Response({
        'year': 2026,
        'total_minutes_streamed': minutes,
        'top_genres': [g['genre'] for g in top_genres if g.get('genre')],
        'top_tracks': TrackSerializer(top_tracks, many=True).data,
        'top_artists': ArtistSerializer(top_artists, many=True).data,
        'music_personality': personalities[0],
        'listening_streak_days': streak_days,
        'vibes_summary': 'Dynamic, High-Fidelity, Ethereal, Sophisticated',
    })


# ── TRACK & RADIO VIEWS ──────────────────────────────────────────────

class TrackViewSet(viewsets.ModelViewSet):
    queryset = Track.objects.select_related('artist', 'album').all()
    serializer_class = TrackSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        genre = self.request.query_params.get('genre')
        query = self.request.query_params.get('search')
        artist_id = self.request.query_params.get('artist')

        if genre and genre.lower() != 'all':
            qs = qs.filter(genre__iexact=genre)
        if query:
            qs = qs.filter(
                Q(title__icontains=query)
                | Q(artist__name__icontains=query)
                | Q(genre__icontains=query)
            )
        if artist_id:
            qs = qs.filter(artist_id=artist_id)
        return qs

    @action(detail=False, methods=['get'], url_path='recommended')
    def recommended(self, request):
        tracks = self.get_queryset().order_by('-plays_count', 'id')[:8]
        serializer = self.get_serializer(tracks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='recently-played')
    def recently_played(self, request):
        tracks = self.get_queryset().order_by('-created_at', 'id')[:8]
        serializer = self.get_serializer(tracks, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='radio')
    def track_radio(self, request, pk=None):
        """
        AI similarity matrix: finds matching genre, similar BPM, and related artists.
        """
        track = self.get_object()
        similar_tracks = Track.objects.filter(
            Q(genre__iexact=track.genre) |
            Q(artist=track.artist) |
            Q(bpm__range=(max(60, track.bpm - 25), track.bpm + 25))
        ).exclude(pk=track.pk).order_by('-plays_count')[:10]

        if not similar_tracks.exists():
            similar_tracks = Track.objects.exclude(pk=track.pk)[:8]

        serializer = self.get_serializer(similar_tracks, many=True)
        return Response({
            'seed_track': TrackSerializer(track).data,
            'station_title': f"{track.title} Radio",
            'tracks': serializer.data,
        })

    @action(detail=True, methods=['post'], url_path='like')
    def toggle_like(self, request, pk=None):
        track = self.get_object()
        user = request.user if request.user.is_authenticated else None

        fav = FavoriteTrack.objects.filter(user=user, track=track).first() if user else FavoriteTrack.objects.filter(track=track).first()

        if fav:
            fav.delete()
            return Response({'liked': False, 'message': 'Removed from favorites'}, status=status.HTTP_200_OK)
        else:
            FavoriteTrack.objects.create(user=user, track=track)
            return Response({'liked': True, 'message': 'Added to favorites'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='play')
    def record_play(self, request, pk=None):
        track = self.get_object()
        track.plays_count += 1
        track.save(update_fields=['plays_count'])

        user = request.user if request.user.is_authenticated else None
        ListeningHistory.objects.create(
            user=user,
            track=track,
            duration_seconds=track.duration_seconds,
        )

        if user and hasattr(user, 'profile'):
            user.profile.total_minutes_listened += max(1, track.duration_seconds // 60)
            user.profile.save(update_fields=['total_minutes_listened'])

        return Response({'plays_count': track.plays_count}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def daily_mix_view(request):
    """
    Returns dynamic curated Daily Mix stations.
    """
    all_tracks = list(Track.objects.all())
    mixes = [
        {
            'id': 'mix-1',
            'title': 'Daily Mix 1: Late Night Frequencies',
            'description': 'M83, Tame Impala, and atmospheric dreamscapes.',
            'cover_url': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
            'tracks': TrackSerializer(all_tracks[:4], many=True).data,
        },
        {
            'id': 'mix-2',
            'title': 'Daily Mix 2: Indie & Melancholy Echoes',
            'description': 'Florence + The Machine, Phoebe Bridgers, and Bon Iver.',
            'cover_url': 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=600&auto=format&fit=crop&q=80',
            'tracks': TrackSerializer(all_tracks[2:6], many=True).data,
        },
        {
            'id': 'mix-3',
            'title': 'Daily Mix 3: High Voltage & Synthwave',
            'description': 'The Weeknd, Daft Punk, and electro grooves.',
            'cover_url': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
            'tracks': TrackSerializer(all_tracks[3:7], many=True).data,
        },
    ]
    return Response(mixes)


class ArtistViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Artist.objects.prefetch_related('tracks', 'albums').all()
    serializer_class = ArtistSerializer
    permission_classes = [AllowAny]

    @action(detail=True, methods=['get'])
    def tracks(self, request, pk=None):
        artist = self.get_object()
        tracks = artist.tracks.select_related('album').all()
        serializer = TrackSerializer(tracks, many=True)
        return Response(serializer.data)


class AlbumViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Album.objects.select_related('artist').prefetch_related('tracks').all()
    serializer_class = AlbumSerializer
    permission_classes = [AllowAny]


class PlaylistViewSet(viewsets.ModelViewSet):
    queryset = Playlist.objects.prefetch_related('items__track__artist', 'items__track__album').all()
    serializer_class = PlaylistSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)

    @action(detail=True, methods=['post'], url_path='add-track')
    def add_track(self, request, pk=None):
        playlist = self.get_object()
        track_id = request.data.get('track_id')
        if not track_id:
            return Response({'error': 'track_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            track = Track.objects.get(pk=track_id)
        except Track.DoesNotExist:
            return Response({'error': 'Track not found'}, status=status.HTTP_404_NOT_FOUND)

        item, created = PlaylistItem.objects.get_or_create(
            playlist=playlist,
            track=track,
            defaults={'order': playlist.items.count()}
        )
        if not created:
            return Response({'message': 'Track already in playlist'}, status=status.HTTP_200_OK)

        return Response(
            {'message': 'Track added to playlist', 'playlist': PlaylistSerializer(playlist).data},
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'], url_path='remove-track')
    def remove_track(self, request, pk=None):
        playlist = self.get_object()
        track_id = request.data.get('track_id')
        if not track_id:
            return Response({'error': 'track_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        PlaylistItem.objects.filter(playlist=playlist, track_id=track_id).delete()
        return Response(
            {'message': 'Track removed from playlist', 'playlist': PlaylistSerializer(playlist).data},
            status=status.HTTP_200_OK
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def search_view(request):
    q = request.query_params.get('q', '').strip()
    if not q:
        return Response({'tracks': [], 'artists': [], 'albums': [], 'playlists': []})

    tracks = Track.objects.select_related('artist', 'album').filter(
        Q(title__icontains=q) | Q(artist__name__icontains=q) | Q(genre__icontains=q)
    )[:10]

    artists = Artist.objects.filter(
        Q(name__icontains=q) | Q(bio__icontains=q)
    )[:5]

    albums = Album.objects.select_related('artist').filter(
        Q(title__icontains=q) | Q(artist__name__icontains=q)
    )[:5]

    playlists = Playlist.objects.filter(
        Q(title__icontains=q) | Q(description__icontains=q)
    )[:5]

    return Response({
        'tracks': TrackSerializer(tracks, many=True).data,
        'artists': ArtistSerializer(artists, many=True).data,
        'albums': AlbumSerializer(albums, many=True).data,
        'playlists': PlaylistSerializer(playlists, many=True).data,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def genres_view(request):
    genres = (
        Track.objects.values('genre')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    return Response(list(genres))


# ── YOUTUBE MUSIC INTEGRATION ENDPOINTS ─────────────────────────────
from .ytmusic_service import ytmusic_service


@api_view(['GET'])
@permission_classes([AllowAny])
def ytm_search_view(request):
    q = request.query_params.get('q', '').strip()
    limit = int(request.query_params.get('limit', 16))
    tracks = ytmusic_service.search_youtube_videos(q, limit=limit)
    return Response({'tracks': tracks})


@api_view(['GET'])
@permission_classes([AllowAny])
def ytm_trending_view(request):
    tracks = ytmusic_service.get_trending_tracks()
    return Response({'tracks': tracks})


@api_view(['GET'])
@permission_classes([AllowAny])
def ytm_genre_mood_view(request):
    """
    Fetch songs categorized by Genre and/or Mood via YouTube Music's recommendation algorithm.
    """
    genre = request.query_params.get('genre', '').strip()
    mood = request.query_params.get('mood', '').strip()
    limit = int(request.query_params.get('limit', 24))
    tracks = ytmusic_service.get_genre_or_mood_tracks(genre=genre, mood=mood, limit=limit)
    return Response({
        'genre': genre or 'All',
        'mood': mood or 'All',
        'count': len(tracks),
        'tracks': tracks
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def ytm_stream_view(request, video_id):
    stream_url = ytmusic_service.get_stream_url(video_id)
    if not stream_url:
        return Response({'error': 'Audio stream not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.query_params.get('json') == '1':
        return Response({'stream_url': stream_url})

    try:
        req_headers = {}
        if 'HTTP_RANGE' in request.META:
            req_headers['Range'] = request.META['HTTP_RANGE']

        upstream = requests.get(stream_url, headers=req_headers, stream=True, timeout=12)

        def iter_stream():
            for chunk in upstream.iter_content(chunk_size=128 * 1024):
                if chunk:
                    yield chunk

        status_code = upstream.status_code if upstream.status_code in [200, 206] else 200
        content_type = upstream.headers.get('Content-Type', 'audio/mp4')
        response = StreamingHttpResponse(iter_stream(), status=status_code, content_type=content_type)
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response['Access-Control-Allow-Headers'] = '*'
        response['Accept-Ranges'] = 'bytes'
        for h in ['Content-Range', 'Content-Length']:
            if h in upstream.headers:
                response[h] = upstream.headers[h]
        return response
    except Exception as e:
        print(f"[StreamProxy] Fallback redirect: {e}")
        return redirect(stream_url)


@api_view(['GET'])
@permission_classes([AllowAny])
def ytm_lyrics_view(request, video_id):
    lyrics = ytmusic_service.get_lyrics(video_id)
    return Response({'lyrics': lyrics})


@api_view(['GET'])
@permission_classes([AllowAny])
def ytm_related_view(request):
    video_id = request.query_params.get('videoId', '').strip()
    artist = request.query_params.get('artist', '').strip()
    title = request.query_params.get('title', '').strip()
    limit = int(request.query_params.get('limit', 10))

    tracks = ytmusic_service.get_related_tracks(
        video_id=video_id if video_id else None,
        artist_name=artist,
        title=title,
        limit=limit
    )
    return Response({'tracks': tracks})


_thumbnail_session = requests.Session()
_adapter = requests.adapters.HTTPAdapter(pool_connections=25, pool_maxsize=100, max_retries=2)
_thumbnail_session.mount('https://', _adapter)
_thumbnail_session.mount('http://', _adapter)
_thumbnail_cache = {}  # url -> (timestamp, content_type, bytes)


@api_view(['GET'])
@permission_classes([AllowAny])
def ytm_thumbnail_view(request):
    """
    High-performance caching proxy for YouTube/Google Music album artwork.
    Uses connection pooling and in-memory LRU byte caching for instant loading.
    """
    raw_url = request.query_params.get('url', '').strip()
    if not raw_url:
        return HttpResponse("Empty url", status=400)
    if '%' in raw_url:
        raw_url = urllib.parse.unquote(raw_url)

    # 1. Fast in-memory cache hit (< 0.1ms)
    now = time.time()
    if raw_url in _thumbnail_cache:
        ts, ctype, cbytes = _thumbnail_cache[raw_url]
        if now - ts < 86400:  # 24-hour cache
            resp = HttpResponse(cbytes, content_type=ctype, status=200)
            resp['Access-Control-Allow-Origin'] = '*'
            resp['Cache-Control'] = 'public, max-age=86400, immutable'
            return resp

    # 2. Security validation
    allowed_domains = (
        'ytimg.com',
        'googleusercontent.com',
        'ggpht.com',
        'youtube.com',
        'images.unsplash.com',
    )
    try:
        parsed = urllib.parse.urlparse(raw_url)
        netloc = parsed.netloc.lower().split(':')[0]
        if not any(netloc == d or netloc.endswith('.' + d) for d in allowed_domains):
            return HttpResponse('Forbidden domain', status=403)
    except Exception:
        return HttpResponse("Invalid url", status=400)

    # 3. Fetch with connection pooling
    try:
        resp = _thumbnail_session.get(
            raw_url,
            timeout=5,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            },
        )
        if resp.status_code == 200:
            content_type = resp.headers.get('Content-Type', 'image/jpeg')
            content_bytes = resp.content

            # LRU eviction
            if len(_thumbnail_cache) > 1000:
                oldest_k = min(_thumbnail_cache.keys(), key=lambda k: _thumbnail_cache[k][0])
                del _thumbnail_cache[oldest_k]
            _thumbnail_cache[raw_url] = (now, content_type, content_bytes)

            response = HttpResponse(content_bytes, content_type=content_type, status=200)
            response['Access-Control-Allow-Origin'] = '*'
            response['Cache-Control'] = 'public, max-age=86400, immutable'
            return response
        return HttpResponse(status=resp.status_code)
    except Exception as e:
        print(f'[ThumbnailProxy] Note: {e}')
        return HttpResponse(status=502)
