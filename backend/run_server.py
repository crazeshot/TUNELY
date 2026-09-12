import os
import sys
import shutil
import logging
from pathlib import Path

# 1. Base directory resolution
if getattr(sys, 'frozen', False):
    bundle_dir = Path(sys._MEIPASS)
else:
    bundle_dir = Path(__file__).resolve().parent

# Ensure bundle_dir is in sys.path and current working directory
sys.path.insert(0, str(bundle_dir))
try:
    os.chdir(str(bundle_dir))
except Exception:
    pass

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# 2. Setup persistent user data directory
try:
    if sys.platform == 'darwin':
        data_dir = Path.home() / 'Library' / 'Application Support' / 'Tunely'
    elif os.environ.get('APPDATA'):
        data_dir = Path(os.environ['APPDATA']) / 'Tunely'
    else:
        data_dir = Path.home() / '.tunely'
    data_dir.mkdir(parents=True, exist_ok=True)
except Exception:
    data_dir = Path.home() / 'Tunely'
    data_dir.mkdir(parents=True, exist_ok=True)

os.environ['TUNELY_DATA_DIR'] = str(data_dir)
log_file = data_dir / 'backend.log'

# Redirect stdout and stderr if running in noconsole (GUI) mode
if sys.stdout is None or sys.stderr is None:
    try:
        f = open(log_file, 'a', encoding='utf-8')
        sys.stdout = f
        sys.stderr = f
    except Exception:
        sys.stdout = open(os.devnull, 'w')
        sys.stderr = open(os.devnull, 'w')

logging.basicConfig(
    filename=str(log_file),
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)

def run():
    logging.info("Starting Tunely backend sidecar...")
    logging.info(f"Platform: {sys.platform}, Python: {sys.version}")
    logging.info(f"Bundle dir: {bundle_dir}, Data dir: {data_dir}")

    # 3. Seed user SQLite database if it doesn't exist or is empty
    user_db = data_dir / 'db.sqlite3'
    if not user_db.exists() or user_db.stat().st_size == 0:
        template_db = bundle_dir / 'db.sqlite3'
        if template_db.exists():
            logging.info(f"Copying template database from {template_db} to {user_db}")
            try:
                shutil.copy2(template_db, user_db)
            except Exception as e:
                logging.warning(f"Failed to copy template database: {e}")
        else:
            logging.info("No template database found; will migrate and seed freshly.")

    from django.core.management import execute_from_command_line, call_command

    # 4. Apply database migrations
    try:
        logging.info("Ensuring database migrations are up to date...")
        call_command('migrate', interactive=False)
    except Exception as e:
        logging.warning(f"Migration warning: {e}")

    # 5. Check if tracks table has initial songs; auto-seed if empty
    try:
        from api.models import Track
        if Track.objects.count() == 0:
            logging.info("Database has 0 tracks; auto-seeding initial catalogue...")
            call_command('seed_music')
            logging.info(f"Seeding finished. Total tracks: {Track.objects.count()}")
    except Exception as e:
        logging.warning(f"Seed music check note: {e}")

    # 6. Start Django development server bound to localhost:8000
    port = os.environ.get('TUNELY_PORT', '8000')
    bind_addr = f"127.0.0.1:{port}"
    logging.info(f"Starting server on {bind_addr}...")
    sys.argv = ['manage.py', 'runserver', bind_addr, '--noreload']
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    run()
