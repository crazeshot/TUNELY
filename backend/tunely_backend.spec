# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_all, collect_submodules, collect_data_files
import os

block_cipher = None

datas = []
if os.path.exists('db.sqlite3'):
    datas.append(('db.sqlite3', '.'))

binaries = []
hiddenimports = [
    'config',
    'config.settings',
    'config.urls',
    'config.wsgi',
    'api',
    'api.apps',
    'api.models',
    'api.views',
    'api.urls',
    'api.serializers',
    'api.ytmusic_service',
    'django.db.backends.sqlite3',
    'django.core.management',
    'django.core.management.commands.runserver',
    'django.core.management.commands.migrate',
    'rest_framework',
    'rest_framework.authentication',
    'rest_framework.parsers',
    'rest_framework.renderers',
    'rest_framework.authtoken',
    'rest_framework.authtoken.models',
]

for pkg in ['django', 'rest_framework', 'corsheaders', 'ytmusicapi', 'yt_dlp', 'youtube_search_python']:
    try:
        pkg_datas, pkg_binaries, pkg_hidden = collect_all(pkg)
        datas += pkg_datas
        binaries += pkg_binaries
        hiddenimports += pkg_hidden
    except Exception as e:
        print(f"Hook warning for {pkg}: {e}")

a = Analysis(
    ['run_server.py'],
    pathex=['.'],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='tunely-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
