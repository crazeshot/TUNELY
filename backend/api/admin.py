from django.contrib import admin
from .models import Artist, Album, Track, Playlist, PlaylistItem, FavoriteTrack


@admin.register(Artist)
class ArtistAdmin(admin.ModelAdmin):
    list_display = ('name', 'monthly_listeners', 'verified', 'created_at')
    search_fields = ('name',)
    list_filter = ('verified',)


@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
    list_display = ('title', 'artist', 'release_year', 'genre', 'created_at')
    search_fields = ('title', 'artist__name')
    list_filter = ('genre', 'release_year')


@admin.register(Track)
class TrackAdmin(admin.ModelAdmin):
    list_display = ('title', 'artist', 'genre', 'duration', 'plays_count', 'is_explicit', 'created_at')
    search_fields = ('title', 'artist__name', 'genre')
    list_filter = ('genre', 'is_explicit')


class PlaylistItemInline(admin.TabularInline):
    model = PlaylistItem
    extra = 1


@admin.register(Playlist)
class PlaylistAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_public', 'created_at', 'updated_at')
    search_fields = ('title', 'description')
    list_filter = ('is_public',)
    inlines = [PlaylistItemInline]


@admin.register(FavoriteTrack)
class FavoriteTrackAdmin(admin.ModelAdmin):
    list_display = ('track', 'created_at')
    search_fields = ('track__title', 'track__artist__name')
