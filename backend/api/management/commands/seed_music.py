from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Artist, Album, Track, Playlist, PlaylistItem, FavoriteTrack, UserProfile


class Command(BaseCommand):
    help = 'Seeds database with realistic artists, albums, tracks, .lrc synced lyrics, and demo user'

    def handle(self, *args, **options):
        self.stdout.write('Seeding enterprise music data...')

        # Clear existing data
        PlaylistItem.objects.all().delete()
        Playlist.objects.all().delete()
        FavoriteTrack.objects.all().delete()
        Track.objects.all().delete()
        Album.objects.all().delete()
        Artist.objects.all().delete()

        # 0. Demo user
        demo_user, created = User.objects.get_or_create(username='alex_m', defaults={'email': 'alex@tunely.io'})
        if created:
            demo_user.set_password('tunely2026')
            demo_user.save()
        profile, _ = UserProfile.objects.get_or_create(user=demo_user)
        profile.display_name = 'Alex Morgan'
        profile.avatar_url = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
        profile.bio = 'Audiophile exploring spatial sound & electronic dreamscapes.'
        profile.total_minutes_listened = 4820
        profile.save()

        # 1. Artists
        artists_data = [
            {
                'name': 'Tame Impala',
                'bio': 'Kevin Parker is an Australian multi-instrumentalist, singer, songwriter, and record producer best known for his psychedelic pop project Tame Impala.',
                'avatar_url': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
                'monthly_listeners': '24.8M',
                'verified': True,
            },
            {
                'name': 'Florence + The Machine',
                'bio': 'English indie rock band formed in London in 2007, consisting of lead vocalist Florence Welch and collaborator Isabella Summers.',
                'avatar_url': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
                'monthly_listeners': '18.3M',
                'verified': True,
            },
            {
                'name': 'The Weeknd',
                'bio': 'Abel Makkonen Tesfaye, known professionally as The Weeknd, is a Canadian singer-songwriter known for sonic innovation and genre-blending artistry.',
                'avatar_url': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
                'monthly_listeners': '108.5M',
                'verified': True,
            },
            {
                'name': 'Radiohead',
                'bio': 'English rock band formed in Abingdon, Oxfordshire, in 1985. Acclaimed for experimental approach and pioneering art rock sound.',
                'avatar_url': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
                'monthly_listeners': '21.1M',
                'verified': True,
            },
            {
                'name': 'Bon Iver',
                'bio': 'American indie folk band founded in 2006 by singer-songwriter Justin Vernon.',
                'avatar_url': 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=400&auto=format&fit=crop&q=80',
                'monthly_listeners': '16.7M',
                'verified': True,
            },
            {
                'name': 'Phoebe Bridgers',
                'bio': 'American singer-songwriter known for intimate, melancholic indie rock and evocative storytelling.',
                'avatar_url': 'https://images.unsplash.com/photo-1520523839898-50712825e3a7?w=400&auto=format&fit=crop&q=80',
                'monthly_listeners': '14.2M',
                'verified': True,
            },
            {
                'name': 'Frank Ocean',
                'bio': 'American singer, songwriter, and rapper acclaimed for idiosyncrasy and soul-stirring R&B narratives.',
                'avatar_url': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
                'monthly_listeners': '34.9M',
                'verified': True,
            },
            {
                'name': 'Lorde',
                'bio': 'New Zealand singer-songwriter celebrated for introspection, alternative pop textures, and unconventional songwriting.',
                'avatar_url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
                'monthly_listeners': '20.4M',
                'verified': True,
            },
            {
                'name': 'Daft Punk',
                'bio': 'Legendary French electronic music duo formed in 1993 in Paris by Guy-Manuel de Homem-Christo and Thomas Bangalter.',
                'avatar_url': 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&auto=format&fit=crop&q=80',
                'monthly_listeners': '29.3M',
                'verified': True,
            },
            {
                'name': 'M83',
                'bio': 'French electronic music project formed in Antibes in 2001 by Anthony Gonzalez.',
                'avatar_url': 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80',
                'monthly_listeners': '12.8M',
                'verified': True,
            },
        ]

        artists_dict = {}
        for a in artists_data:
            artist = Artist.objects.create(**a)
            artists_dict[a['name']] = artist

        # 2. Albums
        albums_data = [
            {
                'title': 'The Slow Rush',
                'artist': artists_dict['Tame Impala'],
                'cover_url': 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80',
                'release_year': 2020,
                'genre': 'Psychedelic Pop',
            },
            {
                'title': 'Dance Fever',
                'artist': artists_dict['Florence + The Machine'],
                'cover_url': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
                'release_year': 2022,
                'genre': 'Indie Rock',
            },
            {
                'title': 'After Hours',
                'artist': artists_dict['The Weeknd'],
                'cover_url': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
                'release_year': 2020,
                'genre': 'Synthwave / R&B',
            },
            {
                'title': 'In Rainbows',
                'artist': artists_dict['Radiohead'],
                'cover_url': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
                'release_year': 2007,
                'genre': 'Art Rock',
            },
            {
                'title': 'Hurry Up, We’re Dreaming',
                'artist': artists_dict['M83'],
                'cover_url': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
                'release_year': 2011,
                'genre': 'Dream Pop',
            },
            {
                'title': 'Blonde',
                'artist': artists_dict['Frank Ocean'],
                'cover_url': 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&auto=format&fit=crop&q=80',
                'release_year': 2016,
                'genre': 'R&B / Soul',
            },
        ]

        albums_dict = {}
        for alb in albums_data:
            album = Album.objects.create(**alb)
            albums_dict[alb['title']] = album

        # 3. Tracks with precise .lrc timestamps
        tracks_data = [
            {
                'title': 'Midnight City',
                'artist': artists_dict['M83'],
                'album': albums_dict['Hurry Up, We’re Dreaming'],
                'audio_url': 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
                'cover_url': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
                'duration': '4:03',
                'duration_seconds': 243,
                'genre': 'Dream Pop',
                'bpm': 105,
                'audio_key': 'B Minor',
                'plays_count': 1420500,
                'lyrics': "Waiting in a car\nWaiting for a ride in the dark\nThe night city grows\nLook and see her eyes, they glow\n\nWaiting in a car\nWaiting for a ride in the dark\nDrinking in the lights\nFollowing the neon signs\n\nThe city is my church\nIt wraps me in the sparkling twilight",
                'synced_lyrics': """[00:00.00] ♫ (Dreamy Synth Intro) ♫
[00:15.20] Waiting in a car
[00:18.50] Waiting for a ride in the dark
[00:23.10] The night city grows
[00:27.40] Look and see her eyes, they glow
[00:32.00] Waiting in a car
[00:35.80] Waiting for a ride in the dark
[00:40.20] Drinking in the lights
[00:44.50] Following the neon signs
[00:50.00] The city is my church
[00:54.20] It wraps me in the sparkling twilight
[01:04.00] ♫ (Iconic Saxophone Climax) ♫""",
            },
            {
                'title': 'Borderline',
                'artist': artists_dict['Tame Impala'],
                'album': albums_dict['The Slow Rush'],
                'audio_url': 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=electronic-future-beats-117997.mp3',
                'cover_url': 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80',
                'duration': '3:57',
                'duration_seconds': 237,
                'genre': 'Psychedelic Pop',
                'bpm': 120,
                'audio_key': 'D Major',
                'plays_count': 982000,
                'lyrics': "Gone a little far, gone a little far this time for something\nHow was I to know? How was I to know this dark will come?\nWill I be known and loved?\nIs there one that I trust?\nStarting to sober up\nHas it been long enough?",
                'synced_lyrics': """[00:00.00] ♫ (Bassline & Flute Groove) ♫
[00:12.00] Gone a little far, gone a little far this time for something
[00:18.20] How was I to know? How was I to know this dark will come?
[00:25.50] Will I be known and loved?
[00:29.80] Is there one that I trust?
[00:34.20] Starting to sober up
[00:38.00] Has it been long enough?
[00:43.00] ♫ (Psychedelic Chorus) ♫""",
            },
            {
                'title': 'King',
                'artist': artists_dict['Florence + The Machine'],
                'album': albums_dict['Dance Fever'],
                'audio_url': 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=tuesday-glitch-ambient-110940.mp3',
                'cover_url': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
                'duration': '3:58',
                'duration_seconds': 238,
                'genre': 'Indie Rock',
                'bpm': 116,
                'audio_key': 'G Minor',
                'plays_count': 845000,
                'lyrics': "We argue in the kitchen about whether to have a child\nAbout the world outside\nAnd the art that takes all night\nI am no mother, I am no bride, I am King",
                'synced_lyrics': """[00:00.00] ♫ (Atmospheric Chords) ♫
[00:14.00] We argue in the kitchen about whether to have a child
[00:22.00] About the world outside
[00:26.50] And the art that takes all night
[00:32.00] I am no mother, I am no bride, I am King
[00:44.00] ♫ (Orchestral Climax) ♫""",
            },
            {
                'title': 'Blinding Lights',
                'artist': artists_dict['The Weeknd'],
                'album': albums_dict['After Hours'],
                'audio_url': 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=the-beat-of-nature-122841.mp3',
                'cover_url': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
                'duration': '3:20',
                'duration_seconds': 200,
                'genre': 'Synthwave / R&B',
                'bpm': 171,
                'audio_key': 'F Minor',
                'plays_count': 3240000,
                'lyrics': "Yeah\nI've been on my own for long enough\nMaybe you can show me how to love, maybe\nI'm going through withdrawals\nYou don't even have to do too much\nYou can turn me on with just a touch, baby",
                'synced_lyrics': """[00:00.00] ♫ (80s Analog Synth Riff) ♫
[00:10.50] Yeah, I've been on my own for long enough
[00:17.20] Maybe you can show me how to love, maybe
[00:24.00] I'm going through withdrawals
[00:27.50] You don't even have to do too much
[00:31.00] You can turn me on with just a touch, baby
[00:38.00] I look around and Sin City's cold and empty
[00:45.00] ♫ (Synthwave Drop) ♫""",
            },
            {
                'title': 'Nude',
                'artist': artists_dict['Radiohead'],
                'album': albums_dict['In Rainbows'],
                'audio_url': 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_bb630cc098.mp3?filename=ambient-piano-amp-strings-10711.mp3',
                'cover_url': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
                'duration': '4:15',
                'duration_seconds': 255,
                'genre': 'Art Rock',
                'bpm': 63,
                'audio_key': 'E Major',
                'plays_count': 720000,
                'lyrics': "Don't get any big ideas\nThey're not gonna happen\nYou paint yourself white\nAnd fill up with noise\nThere'll be something missing",
                'synced_lyrics': """[00:00.00] ♫ (Reverb Vocal Swell) ♫
[00:20.00] Don't get any big ideas
[00:32.00] They're not gonna happen
[00:44.00] You paint yourself white
[00:52.00] And fill up with noise
[01:00.00] There'll be something missing""",
            },
            {
                'title': '22 (OVER S∞∞N)',
                'artist': artists_dict['Bon Iver'],
                'audio_url': 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_c35f997cb6.mp3?filename=chill-abstract-intention-12099.mp3',
                'cover_url': 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=600&auto=format&fit=crop&q=80',
                'duration': '3:57',
                'duration_seconds': 237,
                'genre': 'Indie Folk',
                'bpm': 75,
                'audio_key': 'F# Major',
                'plays_count': 610000,
                'lyrics': "It might be over soon\nTwo, two\nWhere you gonna look for confirmation?\nAnd if it's harvest time\nWho's gonna hold up the light?",
                'synced_lyrics': """[00:00.00] ♫ (Sampled Saxophone Loop) ♫
[00:12.00] It might be over soon
[00:20.00] Two, two
[00:26.00] Where you gonna look for confirmation?
[00:34.00] And if it's harvest time
[00:40.00] Who's gonna hold up the light?""",
            },
            {
                'title': 'Kyoto',
                'artist': artists_dict['Phoebe Bridgers'],
                'audio_url': 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c32c4d682e.mp3?filename=lifelike-126735.mp3',
                'cover_url': 'https://images.unsplash.com/photo-1520523839898-50712825e3a7?w=600&auto=format&fit=crop&q=80',
                'duration': '3:05',
                'duration_seconds': 185,
                'genre': 'Indie Rock',
                'bpm': 148,
                'audio_key': 'A Major',
                'plays_count': 930000,
                'lyrics': "Day off in Kyoto\nGot bored at the temple\nLooked around at the 7-Eleven\nThe band took the afternoon off\nI'm gonna kill you\nIf you don't beat me to it",
                'synced_lyrics': """[00:00.00] ♫ (Upbeat Horn Section) ♫
[00:08.50] Day off in Kyoto
[00:12.20] Got bored at the temple
[00:16.00] Looked around at the 7-Eleven
[00:20.00] The band took the afternoon off
[00:24.00] I'm gonna kill you if you don't beat me to it""",
            },
            {
                'title': 'Pink + White',
                'artist': artists_dict['Frank Ocean'],
                'album': albums_dict['Blonde'],
                'audio_url': 'https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92c21.mp3?filename=smoke-143172.mp3',
                'cover_url': 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&auto=format&fit=crop&q=80',
                'duration': '3:04',
                'duration_seconds': 184,
                'genre': 'R&B / Soul',
                'bpm': 80,
                'audio_key': 'A Major',
                'plays_count': 2150000,
                'lyrics': "That's the way everyday goes\nEvery time we have no control\nIf the sky is pink and white\nIf the ground is black and yellow\nIt's the same way you showed me",
                'synced_lyrics': """[00:00.00] ♫ (Acoustic Guitar & Piano Strum) ♫
[00:10.00] That's the way everyday goes
[00:16.00] Every time we have no control
[00:22.00] If the sky is pink and white
[00:28.00] If the ground is black and yellow
[00:34.00] It's the same way you showed me""",
            },
            {
                'title': 'Green Light',
                'artist': artists_dict['Lorde'],
                'audio_url': 'https://cdn.pixabay.com/download/audio/2022/04/27/audio_3025272a8c.mp3?filename=inspire-ambient-111327.mp3',
                'cover_url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
                'duration': '3:53',
                'duration_seconds': 233,
                'genre': 'Electropop',
                'bpm': 129,
                'audio_key': 'A Major',
                'plays_count': 1120000,
                'lyrics': "I do my makeup in somebody else's car\nWe order different drinks at the same bar\nI know about what you did and I wanna scream the truth\nShe thinks you love the beach, you're such a damn liar",
                'synced_lyrics': """[00:00.00] ♫ (Punchy Piano Chords) ♫
[00:07.50] I do my makeup in somebody else's car
[00:14.00] We order different drinks at the same bar
[00:20.00] I know about what you did and I wanna scream the truth
[00:28.00] She thinks you love the beach, you're such a damn liar
[00:36.00] ♫ (Euphoric Dance Climax) ♫""",
            },
            {
                'title': 'Get Lucky',
                'artist': artists_dict['Daft Punk'],
                'audio_url': 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=electronic-future-beats-117997.mp3',
                'cover_url': 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80',
                'duration': '4:08',
                'duration_seconds': 248,
                'genre': 'Disco / Funk',
                'bpm': 116,
                'audio_key': 'F# Minor',
                'plays_count': 2890000,
                'lyrics': "Like the legend of the phoenix\nAll ends with beginnings\nWhat keeps the planet spinning\nThe force from the beginning\nWe've come too far to give up who we are\nSo let's raise the bar and our cups to the stars",
                'synced_lyrics': """[00:00.00] ♫ (Nile Rodgers Funk Guitar) ♫
[00:16.00] Like the legend of the phoenix
[00:20.20] All ends with beginnings
[00:24.50] What keeps the planet spinning
[00:28.80] The force from the beginning
[00:33.00] We've come too far to give up who we are
[00:37.50] So let's raise the bar and our cups to the stars
[00:42.00] ♫ (Vocoder Drop: We're up all night to get lucky) ♫""",
            },
        ]

        created_tracks = []
        for t in tracks_data:
            track = Track.objects.create(**t)
            created_tracks.append(track)

        # 4. Favorite a couple tracks for demo user
        FavoriteTrack.objects.create(user=demo_user, track=created_tracks[0])
        FavoriteTrack.objects.create(user=demo_user, track=created_tracks[3])

        # 5. Playlists
        p1 = Playlist.objects.create(
            user=demo_user,
            title='Late Night Vibrations',
            description='Curated dreamy synths and late-night aesthetic frequencies.',
            cover_url='https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
            is_public=True,
        )
        for i, track in enumerate([created_tracks[0], created_tracks[1], created_tracks[3], created_tracks[7]]):
            PlaylistItem.objects.create(playlist=p1, track=track, order=i)

        p2 = Playlist.objects.create(
            user=demo_user,
            title='Indie & Melancholy',
            description='Deep emotional lyrics, acoustic echoes, and sublime soundscapes.',
            cover_url='https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=600&auto=format&fit=crop&q=80',
            is_public=True,
        )
        for i, track in enumerate([created_tracks[2], created_tracks[4], created_tracks[5], created_tracks[6]]):
            PlaylistItem.objects.create(playlist=p2, track=track, order=i)

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {Artist.objects.count()} artists, {Album.objects.count()} albums, {Track.objects.count()} tracks with .LRC synced lyrics, and demo user "{demo_user.username}".'))
