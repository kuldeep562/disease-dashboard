#!/usr/bin/env python3
"""
seed_users.py — Create/update user accounts with correct password hashes
Run from the database/ folder: python seed_users.py

Root cause of login failures:
  - app.py uses SECRET_KEY from .env to hash at login-check time
  - seed_users.py must use the EXACT SAME SECRET_KEY when creating hashes
  - This script loads backend/.env before doing anything
"""
import mysql.connector, hashlib, os, sys
from pathlib import Path

# ── Step 1: Load .env — no external libs, pure stdlib ────
def load_env_file(path):
    p = Path(path).resolve()
    if not p.exists():
        return False
    count = 0
    with open(p, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            os.environ[k.strip()] = v.strip()
            count += 1
    print(f"  ✓ Loaded {count} keys from {p}")
    return True

print("\n── Loading environment ────────────────────────────────")
script_dir = Path(__file__).parent
loaded = (
    load_env_file(script_dir / '../backend/.env') or
    load_env_file(script_dir / '../../backend/.env') or
    load_env_file(script_dir / '.env')
)
if not loaded:
    print("  ⚠  No .env file found — using system environment only")

# ── Step 2: Read config ───────────────────────────────────
DB = {
    'host':     os.environ.get('DB_HOST',     'localhost'),
    'port':     int(os.environ.get('DB_PORT', 3306)),
    'user':     os.environ.get('DB_USER',     'medwatch_user'),
    'password': os.environ.get('DB_PASSWORD', ''),
    'database': os.environ.get('DB_NAME',     'disease_dashboard'),
}
SECRET_KEY = os.environ.get('SECRET_KEY', '')

# ── Step 3: Validate ──────────────────────────────────────
print("\n── Configuration check ───────────────────────────────")
print(f"  DB_HOST     : {DB['host']}:{DB['port']}")
print(f"  DB_NAME     : {DB['database']}")
print(f"  DB_USER     : {DB['user']}")
print(f"  DB_PASSWORD : {'OK' if DB['password'] else 'EMPTY ✗'}")
print(f"  SECRET_KEY  : {repr(SECRET_KEY[:6]+'...') if SECRET_KEY else 'EMPTY ✗'}")

if not SECRET_KEY:
    print("\n  ✗ ERROR: SECRET_KEY is empty!")
    print("    Add to backend/.env:  SECRET_KEY=supersecret123")
    sys.exit(1)
if not DB['password']:
    print("\n  ✗ ERROR: DB_PASSWORD is empty! Check backend/.env")
    sys.exit(1)
print("  → OK, proceeding...\n")

# ── Step 4: Hash function — identical to app.py ───────────
def hash_pw(password):
    return hashlib.sha256((password + SECRET_KEY).encode('utf-8')).hexdigest()

# ── Step 5: Users ─────────────────────────────────────────
USERS = [
    ('admin',          'admin123',    'Dr. Rashmi Patel',    'dr.rashmi@bmchealth.in',  'Admin',         'Public Health & Surveillance'),
    ('samved',         'samved123',   'Dr. Samved Vora',     'dr.samved@bmchealth.in',  'Admin',         'Public Health & Surveillance'),
    ('kuldeep',        'kuldeep123',  'Dr. Kuldeep Solanki', 'dr.kuldeep@bmchealth.in', 'Admin',         'Public Health & Surveillance'),
    ('dr.aditya',      'doctor123',   'Dr. Aditya Kumar',    'aditya.k@bmchealth.in',   'Doctor',        'Infectious Disease'),
    ('dr.priya',       'doctor123',   'Dr. Priya Sharma',    'priya.s@bmchealth.in',    'Doctor',        'NCD Programme'),
    ('nurse.meena',    'nurse123',    'Meena Joshi',         'meena.j@bmchealth.in',    'Nurse',         'Ward Management'),
    ('officer.ravi',   'field123',    'Ravi Nair',           'ravi.n@bmchealth.in',     'Field Officer', 'Outbreak Response'),
    ('analyst.kavita', 'analyst123',  'Kavita Rao',          'kavita.r@bmchealth.in',   'Analyst',       'Data Analytics'),
    ('staff.suresh',   'staff123',    'Suresh Verma',        'suresh.v@bmchealth.in',   'Staff',         'Administration'),
]

# ── Step 6: Connect + upsert ──────────────────────────────
print("── Connecting to database ────────────────────────────")
try:
    conn = mysql.connector.connect(**DB)
    cur  = conn.cursor()
    print(f"  ✓ Connected to {DB['database']}@{DB['host']}\n")
except Exception as e:
    print(f"  ✗ Connection failed: {e}")
    sys.exit(1)

try:
    cur.execute("DELETE FROM users WHERE username='placeholder_run_seed_users'")
except Exception:
    pass

print("── Creating / updating users ─────────────────────────")
success = 0
for (username, password, full_name, email, role, dept) in USERS:
    pw_hash = hash_pw(password)
    try:
        cur.execute("""
            INSERT INTO users
                (username, password_hash, full_name, email, role, department, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, 1)
            ON DUPLICATE KEY UPDATE
                password_hash = VALUES(password_hash),
                full_name     = VALUES(full_name),
                role          = VALUES(role),
                department    = VALUES(department),
                is_active     = 1
        """, (username, pw_hash, full_name, email, role, dept))
        print(f"  ✓ {username:<22}  [{role}]")
        success += 1
    except Exception as e:
        print(f"  ✗ {username:<22}  ERROR: {e}")

conn.commit()
conn.close()

# ── Step 7: Summary ───────────────────────────────────────
print(f"\n✅ Done — {success}/{len(USERS)} users created/updated")
print("\n── Login credentials ─────────────────────────────────")
for (u, p, name, *_) in USERS:
    print(f"  {u:<22}  password: {p:<14}  ({name})")
print("──────────────────────────────────────────────────────")
print(f"\n  SECRET_KEY used: {SECRET_KEY!r}")
print("  ⚠  Must match SECRET_KEY in backend/.env at runtime!")
print("  ⚠  If you ever change SECRET_KEY, re-run this script!")
