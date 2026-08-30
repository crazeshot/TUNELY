from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    display_name = models.CharField(max_length=150, blank=True, default='')
    avatar_url = models.URLField(max_length=600, blank=True, default='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80')
    bio = models.TextField(blank=True, default='Music enthusiast exploring new sonic frequencies on Tunely.')
    preferred_theme = models.CharField(max_length=50, default='neon')
    total_minutes_listened = models.PositiveIntegerField(default=1420)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.display_name or self.user.username


@receiver(post_save, sender=User)
def create_or_save_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance, display_name=instance.username)
    else:
        if hasattr(instance, 'profile'):
            instance.profile.save()


class Artist(models.Model):
    name = models.CharField(max_length=150, unique=True)
    bio = models.TextField(blank=True, default='')
    avatar_url = models.URLField(max_length=500, blank=True, default='')
    monthly_listeners = models.CharField(max_length=50, blank=True, default='1.2M')
    verified = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Album(models.Model):
    title = models.CharField(max_length=150)
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE, related_name='albums')
    cover_url = models.URLField(max_length=500, blank=True, default='')
    release_year = models.IntegerField(default=2024)
    genre = models.CharField(max_length=60, blank=True, default='Alternative')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-release_year', 'title']

    def __str__(self):
        return f"{self.title} - {self.artist.name}"


class Track(models.Model):
    title = models.CharField(max_length=150, db_index=True)
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE, related_name='tracks')
    album = models.ForeignKey(Album, on_delete=models.SET_NULL, null=True, blank=True, related_name='tracks')
    audio_url = models.URLField(max_length=600, blank=True, default='')
    cover_url = models.URLField(max_length=600, blank=True, default='')
    duration = models.CharField(max_length=10, default='3:30')
    duration_seconds = models.IntegerField(default=210)
    genre = models.CharField(max_length=60, default='Alternative', db_index=True)
    plays_count = models.PositiveIntegerField(default=0, db_index=True)
    is_explicit = models.BooleanField(default=False)
    lyrics = models.TextField(blank=True, default='')
    synced_lyrics = models.TextField(blank=True, default='')  # Standard .lrc format
    bpm = models.PositiveIntegerField(default=120, db_index=True)
    audio_key = models.CharField(max_length=20, default='C Major')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-plays_count', 'title']

    def __str__(self):
        return f"{self.title} - {self.artist.name}"


class Playlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='playlists')
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True, default='')
    cover_url = models.URLField(max_length=600, blank=True, default='')
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return self.title


class PlaylistItem(models.Model):
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE, related_name='items')
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='playlist_entries')
    order = models.PositiveIntegerField(default=0)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'added_at']
        unique_together = ('playlist', 'track')

    def __str__(self):
        return f"{self.playlist.title} -> {self.track.title}"


class FavoriteTrack(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='favorite_tracks')
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='favorite_records')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('user', 'track')

    def __str__(self):
        return f"Liked: {self.track.title}"


class ListeningHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='listening_history')
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='listening_logs')
    duration_seconds = models.PositiveIntegerField(default=0)
    listened_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-listened_at']

    def __str__(self):
        return f"{self.track.title} @ {self.listened_at}"
