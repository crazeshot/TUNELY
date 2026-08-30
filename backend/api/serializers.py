from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile,
    Artist,
    Album,
    Track,
    Playlist,
    PlaylistItem,
    FavoriteTrack,
    ListeningHistory,
)


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'id',
            'username',
            'email',
            'display_name',
            'avatar_url',
            'bio',
            'preferred_theme',
            'total_minutes_listened',
            'created_at',
        ]


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile']


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(required=True, min_length=3)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, min_length=6, write_only=True)
    display_name = serializers.CharField(required=False, allow_blank=True)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class ArtistSerializer(serializers.ModelSerializer):
    track_count = serializers.IntegerField(source='tracks.count', read_only=True)
    album_count = serializers.IntegerField(source='albums.count', read_only=True)

    class Meta:
        model = Artist
        fields = ['id', 'name', 'bio', 'avatar_url', 'monthly_listeners', 'verified', 'track_count', 'album_count', 'created_at']


class AlbumSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(source='artist.name', read_only=True)
    track_count = serializers.IntegerField(source='tracks.count', read_only=True)

    class Meta:
        model = Album
        fields = ['id', 'title', 'artist', 'artist_name', 'cover_url', 'release_year', 'genre', 'track_count', 'created_at']


class TrackSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(source='artist.name', read_only=True)
    artist_avatar = serializers.CharField(source='artist.avatar_url', read_only=True)
    album_title = serializers.CharField(source='album.title', read_only=True, default='')
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Track
        fields = [
            'id',
            'title',
            'artist',
            'artist_name',
            'artist_avatar',
            'album',
            'album_title',
            'audio_url',
            'cover_url',
            'duration',
            'duration_seconds',
            'genre',
            'plays_count',
            'is_explicit',
            'lyrics',
            'synced_lyrics',
            'bpm',
            'audio_key',
            'is_liked',
            'created_at',
        ]

    def get_is_liked(self, obj):
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None
        if user:
            return FavoriteTrack.objects.filter(user=user, track=obj).exists()
        return FavoriteTrack.objects.filter(track=obj).exists()


class PlaylistItemSerializer(serializers.ModelSerializer):
    track_details = TrackSerializer(source='track', read_only=True)

    class Meta:
        model = PlaylistItem
        fields = ['id', 'playlist', 'track', 'track_details', 'order', 'added_at']


class PlaylistSerializer(serializers.ModelSerializer):
    tracks = serializers.SerializerMethodField()
    track_count = serializers.SerializerMethodField()
    creator = serializers.CharField(source='user.username', read_only=True, default='Tunely Curated')

    class Meta:
        model = Playlist
        fields = ['id', 'user', 'creator', 'title', 'description', 'cover_url', 'is_public', 'tracks', 'track_count', 'created_at', 'updated_at']

    def get_tracks(self, obj):
        items = obj.items.select_related('track', 'track__artist', 'track__album').all()
        tracks = [item.track for item in items]
        return TrackSerializer(tracks, many=True, context=self.context).data

    def get_track_count(self, obj):
        return obj.items.count()


class ListeningHistorySerializer(serializers.ModelSerializer):
    track_details = TrackSerializer(source='track', read_only=True)

    class Meta:
        model = ListeningHistory
        fields = ['id', 'user', 'track', 'track_details', 'duration_seconds', 'listened_at']
