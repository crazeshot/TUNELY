import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Track, Album, Artist, FavoriteTrack, PlaylistItem

Track.objects.all().delete()
Album.objects.all().delete()
Artist.objects.all().delete()
FavoriteTrack.objects.all().delete()
PlaylistItem.objects.all().delete()

print("Successfully deleted all dummy catalog songs, albums, and artists from database.")
