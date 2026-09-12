import os
import sys
import shutil
import logging
from pathlib import Path

# Redirect stdout and stderr if running in noconsole (GUI) mode
log_dir = Path(os.environ.get('APPDATA', Path.home())) / 'Tunely'
log_dir.mkdir(parents=True, exist_ok=True)
log_file = log_dir / 'backend.log'

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
    
    # 1. Base directory resolution
    if getattr(sys, 'frozen', False):
        bundle_dir = Path(sys._MEIPASS)
    else:
        bundle_dir = Path(__file__).resolve().parent

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

    # 2. Setup persistent user data directory
    data_dir = log_dir
    os.environ['TUNELY_DATA_DIR'] = str(data_dir)
    logging.info(f"Tunely data directory: {data_dir}")

    # 3. Seed user SQLite database if it doesn't exist
    user_db = data_dir / 'db.sqlite3'
    if not user_db.exists():
        template_db = bundle_dir / 'db.sqlite3'
        if template_db.exists():
            logging.info(f"Copying template database to {user_db}")
            try:
                shutil.copy2(template_db, user_db)
            except Exception as e:
                logging.warning(f"Failed to copy template database: {e}")
        else:
            logging.info("No template database found; will migrate freshly.")

    from django.core.management import execute_from_command_line

    # 4. Apply any pending database migrations
    try:
        logging.info("Applying migrations...")
        execute_from_command_line(['manage.py', 'migrate', '--noinput'])
    except Exception as e:
        logging.warning(f"Migration warning: {e}")

    # 5. Start Django development server bound to localhost:8000
    port = os.environ.get('TUNELY_PORT', '8000')
    bind_addr = f"127.0.0.1:{port}"
    logging.info(f"Starting server on {bind_addr}...")
    sys.argv = ['manage.py', 'runserver', bind_addr, '--noreload']
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    run()
