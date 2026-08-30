from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    api_root,
    health_check,
    register_view,
    login_view,
    logout_view,
    me_view,
    wrapped_view,
    daily_mix_view,
    TrackViewSet,
    ArtistViewSet,
    AlbumViewSet,
    PlaylistViewSet,
    search_view,
    genres_view,
    ytm_search_view,
    ytm_trending_view,
    ytm_stream_view,
    ytm_lyrics_view,
)

router = DefaultRouter()
router.register(r'tracks', TrackViewSet, basename='track')
router.register(r'artists', ArtistViewSet, basename='artist')
router.register(r'albums', AlbumViewSet, basename='album')
router.register(r'playlists', PlaylistViewSet, basename='playlist')

urlpatterns = [
    path('', api_root, name='api-root'),
    path('health/', health_check, name='health-check'),
    path('auth/register/', register_view, name='auth-register'),
    path('auth/login/', login_view, name='auth-login'),
    path('auth/logout/', logout_view, name='auth-logout'),
    path('auth/me/', me_view, name='auth-me'),
    path('auth/wrapped/', wrapped_view, name='auth-wrapped'),
    path('daily-mix/', daily_mix_view, name='api-daily-mix'),
    path('search/', search_view, name='api-search'),
    path('genres/', genres_view, name='api-genres'),
    # YouTube Music Endpoints
    path('ytm/search/', ytm_search_view, name='ytm-search'),
    path('ytm/trending/', ytm_trending_view, name='ytm-trending'),
    path('ytm/stream/<str:video_id>/', ytm_stream_view, name='ytm-stream'),
    path('ytm/lyrics/<str:video_id>/', ytm_lyrics_view, name='ytm-lyrics'),
    path('', include(router.urls)),
]