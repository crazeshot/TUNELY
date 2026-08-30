from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import Artist, Album, Track, Playlist, PlaylistItem, FavoriteTrack, UserProfile


class TunelyEnterpriseAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Demo user
        self.user = User.objects.create_user(username='testaudiophile', email='test@tunely.io', password='password123')
        self.profile, _ = UserProfile.objects.get_or_create(user=self.user)
        self.profile.display_name = 'Test Audiophile'
        self.profile.save()

        # Artist & Album
        self.artist = Artist.objects.create(name='M83', bio='French electronic music project')
        self.album = Album.objects.create(title='Hurry Up, We’re Dreaming', artist=self.artist, release_year=2011)

        # Tracks
        self.track1 = Track.objects.create(
            title='Midnight City',
            artist=self.artist,
            album=self.album,
            duration='4:03',
            duration_seconds=243,
            genre='Dream Pop',
            bpm=105,
            audio_key='B Minor',
            plays_count=100,
            synced_lyrics='[00:00.00] Intro\n[00:15.00] Waiting in a car'
        )

        self.track2 = Track.objects.create(
            title='Reunion',
            artist=self.artist,
            album=self.album,
            duration='3:55',
            duration_seconds=235,
            genre='Dream Pop',
            bpm=110,
            audio_key='B Minor',
            plays_count=50
        )

        # Playlist
        self.playlist = Playlist.objects.create(user=self.user, title='My Synth Playlist', is_public=True)
        PlaylistItem.objects.create(playlist=self.playlist, track=self.track1, order=0)

    def test_health_check(self):
        res = self.client.get('/api/health/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'ok')
        self.assertEqual(res.data['track_count'], 2)

    def test_get_tracks(self):
        res = self.client.get('/api/tracks/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)
        self.assertIn('synced_lyrics', res.data[0])

    def test_track_radio(self):
        res = self.client.get(f'/api/tracks/{self.track1.id}/radio/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('station_title', res.data)
        self.assertIn('tracks', res.data)
        self.assertEqual(res.data['tracks'][0]['id'], self.track2.id)

    def test_daily_mix(self):
        res = self.client.get('/api/daily-mix/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 3)

    def test_user_registration(self):
        payload = {
            'username': 'newuser',
            'email': 'new@tunely.io',
            'password': 'strongpassword',
            'display_name': 'New Listener',
        }
        res = self.client.post('/api/auth/register/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', res.data)
        self.assertEqual(res.data['user']['username'], 'newuser')

    def test_user_login(self):
        payload = {'username': 'testaudiophile', 'password': 'password123'}
        res = self.client.post('/api/auth/login/', payload)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('token', res.data)

    def test_me_profile_and_update(self):
        # Authenticate
        self.client.force_authenticate(user=self.user)
        res = self.client.get('/api/auth/me/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['username'], 'testaudiophile')

        # Update profile
        update_res = self.client.put('/api/auth/me/', {'display_name': 'Super Audiophile', 'bio': 'Updated bio'})
        self.assertEqual(update_res.status_code, status.HTTP_200_OK)
        self.assertEqual(update_res.data['profile']['display_name'], 'Super Audiophile')

    def test_tunely_wrapped(self):
        res = self.client.get('/api/auth/wrapped/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('total_minutes_streamed', res.data)
        self.assertIn('music_personality', res.data)
        self.assertIn('top_tracks', res.data)

    def test_track_like_toggle(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.post(f'/api/tracks/{self.track1.id}/like/')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['liked'])

        res2 = self.client.post(f'/api/tracks/{self.track1.id}/like/')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertFalse(res2.data['liked'])

    def test_record_play(self):
        res = self.client.post(f'/api/tracks/{self.track1.id}/play/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.track1.refresh_from_db()
        self.assertEqual(self.track1.plays_count, 101)

    def test_search_tracks(self):
        res = self.client.get('/api/search/?q=Midnight')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data['tracks']), 1)
        self.assertEqual(res.data['tracks'][0]['title'], 'Midnight City')
