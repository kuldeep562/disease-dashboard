"""
Disease Dashboard v2 — Flask Backend
Full HTTPS + JWT-style session auth + all page APIs
"""
from flask import Flask, jsonify, request, send_from_directory, Response
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import os, hashlib, secrets, logging, math, json
from datetime import datetime, date, timedelta
from functools import wraps
from pathlib import Path

# ── Load .env file BEFORE anything reads os.getenv ───────
# This runs immediately at import time, before Cfg class is defined.
def _load_env():
    """Read backend/.env into os.environ. No external libs needed."""
    env_path = Path(__file__).parent / '.env'
    if not env_path.exists():
        print(f"[WARN] .env not found at {env_path} — relying on system environment")
        return
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            k, v = k.strip(), v.strip()
            # os.environ.setdefault so system env vars take priority
            if k not in os.environ:
                os.environ[k] = v
    print(f"[INFO] Loaded .env from {env_path}")

_load_env()  # ← must run before Cfg reads os.getenv

# ── Config ────────────────────────────────────────────────
class Cfg:
    DB_HOST   = os.getenv('DB_HOST', 'localhost')
    DB_PORT   = int(os.getenv('DB_PORT', 3306))
    DB_USER   = os.getenv('DB_USER', 'medwatch_user')
    DB_PASS   = os.getenv('DB_PASSWORD', 'StrongPassword@123')
    DB_NAME   = os.getenv('DB_NAME', 'disease_dashboard')
    SSL_CERT  = os.getenv('SSL_CERT', '../certs/cert.pem')
    SSL_KEY   = os.getenv('SSL_KEY', '../certs/key.pem')
    FRONTEND  = os.getenv('FRONTEND_DIR', '../frontend')
    HOST      = os.getenv('HOST', '0.0.0.0')
    PORT      = int(os.getenv('PORT', 5000))
    DEBUG     = os.getenv('FLASK_DEBUG','false').lower() == 'true'
    # SECRET must be a fixed value from .env — NEVER random
    SECRET    = os.getenv('SECRET_KEY', '')

# ── App ────────────────────────────────────────────────────
app = Flask(__name__, static_folder=Cfg.FRONTEND, static_url_path='')
CORS(app, resources={r"/api/*": {"origins": "*"}})
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
log = logging.getLogger(__name__)

# In-memory session store (use Redis in production)
SESSIONS = {}

# ── DB helpers ────────────────────────────────────────────
def db():
    try:
        return mysql.connector.connect(
            host=Cfg.DB_HOST, port=Cfg.DB_PORT, user=Cfg.DB_USER,
            password=Cfg.DB_PASS, database=Cfg.DB_NAME, autocommit=False, connection_timeout=10
        )
    except Error as e:
        log.error(f"DB: {e}"); return None

def qry(sql, params=None, one=False):
    conn = db()
    if not conn: return None
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(sql, params or ())
        return cur.fetchone() if one else cur.fetchall()
    except Error as e:
        log.error(f"QRY: {e}"); return None
    finally: conn.close()

def exe(sql, params=None):
    conn = db()
    if not conn: return False
    try:
        cur = conn.cursor(); cur.execute(sql, params or ()); conn.commit(); return cur.lastrowid or True
    except Error as e:
        conn.rollback(); log.error(f"EXE: {e}"); return False
    finally: conn.close()

def ok(data, code=200):   return jsonify({"status":"ok","data":data}), code
def err(msg, code=400):   return jsonify({"status":"error","message":msg}), code

def hash_pw(pw):   return hashlib.sha256((pw + Cfg.SECRET).encode()).hexdigest()

def require_auth(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = request.headers.get('Authorization','').replace('Bearer ','')
        if token not in SESSIONS:
            return err("Unauthorized", 401)
        return f(*args, **kwargs)
    return wrapper

# ── Static serve ─────────────────────────────────────────
@app.route('/')
def index(): return send_from_directory(Cfg.FRONTEND, 'index.html')

@app.route('/<path:path>')
def static_files(path):
    try: return send_from_directory(Cfg.FRONTEND, path)
    except: return send_from_directory(Cfg.FRONTEND, 'index.html')

# ── AUTH ──────────────────────────────────────────────────
@app.route('/api/auth/login', methods=['POST'])
def login():
    body = request.get_json(silent=True) or {}
    username = body.get('username','').strip()
    password = body.get('password','')
    if not username or not password:
        return err("Username and password required")
    pw_hash = hash_pw(password)
    user = qry(
        "SELECT user_id,username,full_name,role,email,is_active FROM users WHERE (username=%s OR email=%s) AND password_hash=%s",
        (username, username, pw_hash), one=True
    )
    if not user:
        return err("Invalid credentials", 401)
    if not user['is_active']:
        return err("Account is deactivated", 403)
    token = secrets.token_urlsafe(32)
    SESSIONS[token] = { 'user_id': user['user_id'], 'username': user['username'], 'role': user['role'] }
    exe("UPDATE users SET last_login=NOW() WHERE user_id=%s", (user['user_id'],))
    return ok({
        "token": token,
        "user": {
            "id": user['user_id'], "username": user['username'],
            "name": user['full_name'], "role": user['role'],
            "email": user['email'],
            "avatar": ''.join(w[0].upper() for w in (user['full_name'] or 'U').split()[:2])
        }
    })

@app.route('/api/auth/logout', methods=['POST'])
@require_auth
def logout():
    token = request.headers.get('Authorization','').replace('Bearer ','')
    SESSIONS.pop(token, None)
    return ok({"message": "Logged out"})

@app.route('/api/auth/me', methods=['GET'])
@require_auth
def me():
    token = request.headers.get('Authorization','').replace('Bearer ','')
    session = SESSIONS[token]
    user = qry("SELECT user_id,username,full_name,role,email FROM users WHERE user_id=%s", (session['user_id'],), one=True)
    return ok({"user": user})

# ── USERS ─────────────────────────────────────────────────
@app.route('/api/users', methods=['GET'])
@require_auth
def get_users():
    rows = qry("SELECT user_id AS id, username, full_name AS name, email, role, DATE_FORMAT(last_login,'%b %d, %Y') AS last_login, IF(is_active,'Active','Inactive') AS status FROM users ORDER BY user_id")
    return ok({"users": rows or []})

@app.route('/api/users', methods=['POST'])
@require_auth
def create_user():
    body = request.get_json(silent=True) or {}
    username = body.get('username','').strip()
    password = body.get('password','')
    full_name = body.get('full_name','').strip()
    email = body.get('email','').strip()
    role = body.get('role','Staff')
    if not all([username, password, full_name, email]):
        return err("All fields required")
    pw_hash = hash_pw(password)
    uid = exe("INSERT INTO users (username, password_hash, full_name, email, role) VALUES (%s,%s,%s,%s,%s)", (username, pw_hash, full_name, email, role))
    if not uid: return err("Username or email already exists")
    return ok({"user_id": uid, "message": "User created"}, 201)

@app.route('/api/users/<int:uid>', methods=['PUT'])
@require_auth
def update_user(uid):
    body = request.get_json(silent=True) or {}
    fields, vals = [], []
    for f in ['full_name','email','role']:
        if f in body: fields.append(f"{f}=%s"); vals.append(body[f])
    if 'password' in body:
        fields.append("password_hash=%s"); vals.append(hash_pw(body['password']))
    if 'is_active' in body:
        fields.append("is_active=%s"); vals.append(1 if body['is_active'] else 0)
    if not fields: return err("Nothing to update")
    vals.append(uid)
    exe(f"UPDATE users SET {','.join(fields)} WHERE user_id=%s", vals)
    return ok({"message": "User updated"})

@app.route('/api/users/<int:uid>', methods=['DELETE'])
@require_auth
def delete_user(uid):
    exe("UPDATE users SET is_active=0 WHERE user_id=%s", (uid,))
    return ok({"message": "User deactivated"})

# ── DASHBOARD SUMMARY ─────────────────────────────────────
@app.route('/api/dashboard-summary')
def dashboard_summary():
    zone      = request.args.get('zone',      '').strip()
    date_from = request.args.get('date_from', '').strip()
    date_to   = request.args.get('date_to',   '').strip()

    # Zone filter
    zf  = "AND z.zone_name=%s" if zone and zone != 'All Zones' else ""
    zp  = [zone] if zf else []

    # Date range filter — flexible, works with presets AND custom ranges
    df  = ""
    dp  = []
    if date_from:
        df += " AND p.admission_date >= %s"
        dp.append(date_from)
    if date_to:
        df += " AND p.admission_date <= %s"
        dp.append(date_to)

    patient_join = "JOIN zones z ON p.zone_id=z.zone_id" if zf else ""
    where  = f"WHERE 1=1 {zf} {df}"
    params = tuple(zp + dp) or None

    row = qry(f"""SELECT
        COUNT(*) AS total_patients,
        SUM(p.status='Admitted') AS admitted,
        SUM(p.status='Monitoring') AS monitoring,
        SUM(p.status='Recovered') AS recovered,
        SUM(p.is_death) AS total_deaths
        FROM patients p {patient_join}
        {where}""", params, one=True)

    meta = qry("SELECT COUNT(*) AS diseases_tracked FROM diseases", one=True)
    fac  = qry("SELECT COUNT(*) AS facilities_active FROM facilities", one=True)

    summary = dict(row or {})
    summary['diseases_tracked']  = (meta or {}).get('diseases_tracked', 0)
    summary['facilities_active'] = (fac  or {}).get('facilities_active', 0)
    summary['zone_filter']  = zone      or 'All Zones'
    summary['date_from']    = date_from or ''
    summary['date_to']      = date_to   or ''
    return ok({"summary": summary})

# ── NCD STATS ─────────────────────────────────────────────
@app.route('/api/ncd-stats')
def ncd_stats():
    zone      = request.args.get('zone',      '').strip()
    date_from = request.args.get('date_from', '').strip()
    date_to   = request.args.get('date_to',   '').strip()
    filters, params = [], []
    if zone and zone != 'All Zones': filters.append("z.zone_name=%s"); params.append(zone)
    if date_from: filters.append("p.admission_date >= %s"); params.append(date_from)
    if date_to:   filters.append("p.admission_date <= %s"); params.append(date_to)
    where = ("AND " + " AND ".join(filters)) if filters else ""
    rows = qry(f"""SELECT d.disease_name, d.disease_type,
        COUNT(DISTINCT p.patient_id) AS total_cases,
        z.zone_name AS primary_zone, d.trend_percent AS trend, d.alert_level AS alert
        FROM patients p JOIN diseases d ON p.disease_id=d.disease_id JOIN zones z ON p.zone_id=z.zone_id
        WHERE d.disease_type='NCD' {where}
        GROUP BY d.disease_id,z.zone_name ORDER BY total_cases DESC LIMIT 8""", tuple(params) or None)
    return ok({"cards": rows or []})

# ── SURVEILLANCE ──────────────────────────────────────────
@app.route('/api/surveillance')
def surveillance():
    disease   = request.args.get('disease',   '').strip()
    zone      = request.args.get('zone',      '').strip()
    date_from = request.args.get('date_from', '').strip()
    date_to   = request.args.get('date_to',   '').strip()
    filters, params = [], []
    if disease:   filters.append("d.disease_name LIKE %s"); params.append(f"%{disease}%")
    if zone and zone != 'All Zones':
        filters.append("z.zone_name=%s"); params.append(zone)
    if date_from: filters.append("p.admission_date >= %s"); params.append(date_from)
    if date_to:   filters.append("p.admission_date <= %s"); params.append(date_to)
    zone_join = "JOIN zones z ON p.zone_id=z.zone_id" if zone and zone != 'All Zones' else ""
    where = ("AND " + " AND ".join(filters)) if filters else ""
    rows = qry(f"""SELECT d.disease_name AS disease,
        COUNT(CASE WHEN p.status IN ('Admitted','Monitoring') THEN 1 END) AS active,
        COUNT(CASE WHEN p.status='Recovered' THEN 1 END) AS recovered,
        COUNT(CASE WHEN p.status='Admitted' THEN 1 END) AS admitted,
        SUM(p.is_death) AS deaths,
        d.trend_percent AS trend, d.alert_level AS alert, d.summary_text AS summary
        FROM patients p JOIN diseases d ON p.disease_id=d.disease_id {zone_join}
        WHERE d.disease_type='Communicable' {where}
        GROUP BY d.disease_id ORDER BY active DESC""", tuple(params) or None)
    return ok({"diseases": rows or []})

# ── HOTSPOTS ──────────────────────────────────────────────
@app.route('/api/hotspots')
def hotspots():
    rows = qry("""SELECT hs.hotspot_name AS name, d.disease_name AS disease,
        hs.active_cases AS count, hs.latitude AS lat, hs.longitude AS lng,
        hs.description AS description, hs.severity
        FROM hotspots hs JOIN diseases d ON hs.disease_id=d.disease_id
        WHERE hs.is_active=1 ORDER BY hs.active_cases DESC LIMIT 20""")
    return ok({"clusters": rows or []})

# ── ZONES ─────────────────────────────────────────────────
@app.route('/api/zones')
def zones():
    rows = qry("""SELECT z.zone_name AS name, d.disease_name AS disease,
        COUNT(DISTINCT p.patient_id) AS cases, z.alert_status AS alert,
        z.latitude, z.longitude
        FROM patients p JOIN zones z ON p.zone_id=z.zone_id JOIN diseases d ON p.disease_id=d.disease_id
        WHERE p.status IN ('Admitted','Monitoring')
        GROUP BY z.zone_id,d.disease_id ORDER BY cases DESC""")
    return ok({"zones": rows or []})

# ── PATIENTS ──────────────────────────────────────────────
@app.route('/api/patients')
def patients():
    search = request.args.get('search','').strip()
    page   = max(1, int(request.args.get('page', 1)))
    per    = int(request.args.get('per_page', 20))
    offset = (page - 1) * per
    sf, params = "", []
    if search:
        sf = "AND (p.patient_code LIKE %s OR CONCAT(p.first_name,' ',p.last_name) LIKE %s OR d.disease_name LIKE %s OR z.zone_name LIKE %s OR f.facility_name LIKE %s)"
        lk = f"%{search}%"; params = [lk,lk,lk,lk,lk]
    total_row = qry(f"SELECT COUNT(*) AS n FROM patients p JOIN diseases d ON p.disease_id=d.disease_id JOIN zones z ON p.zone_id=z.zone_id JOIN facilities f ON p.facility_id=f.facility_id WHERE 1=1 {sf}", params or None, one=True)
    total = total_row['n'] if total_row else 0
    rows = qry(f"""SELECT p.patient_code AS id,
        CONCAT(p.first_name,' ',p.last_name) AS name, p.age, p.gender,
        d.disease_name AS disease, z.zone_name AS zone,
        f.facility_name AS facility, DATE_FORMAT(p.admission_date,'%b %d, %Y') AS admitted, p.status
        FROM patients p JOIN diseases d ON p.disease_id=d.disease_id JOIN zones z ON p.zone_id=z.zone_id JOIN facilities f ON p.facility_id=f.facility_id
        WHERE 1=1 {sf} ORDER BY p.admission_date DESC LIMIT %s OFFSET %s""",
        (params + [per, offset]) if params else [per, offset])
    return ok({"patients": rows or [], "total": total, "page": page, "pages": math.ceil(total/per) or 1})

# ── FACILITIES ────────────────────────────────────────────
@app.route('/api/facilities')
def facilities():
    rows = qry("""SELECT f.facility_id AS id, f.facility_name AS name, f.facility_type AS type,
        z.zone_name AS zone, f.bed_capacity AS beds,
        COUNT(DISTINCT p.patient_id) AS patients,
        ROUND(COUNT(DISTINCT p.patient_id)*100.0/NULLIF(f.bed_capacity,0),1) AS occ
        FROM facilities f JOIN zones z ON f.zone_id=z.zone_id
        LEFT JOIN patients p ON p.facility_id=f.facility_id AND p.status IN ('Admitted','Monitoring')
        GROUP BY f.facility_id ORDER BY occ DESC""")
    return ok({"facilities": rows or []})

# ── TRENDS ────────────────────────────────────────────────
@app.route('/api/trends')
def trends():
    disease = request.args.get('disease','')
    df = "AND d.disease_name=%s" if disease else ""
    params = (disease,) if disease else ()
    rows = qry(f"""SELECT DATE_FORMAT(p.admission_date,'%b') AS month_label,
        YEAR(p.admission_date) AS yr, MONTH(p.admission_date) AS mo,
        d.disease_name, COUNT(*) AS cases
        FROM patients p JOIN diseases d ON p.disease_id=d.disease_id
        WHERE d.disease_type='Communicable'
        AND p.admission_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        {df} GROUP BY yr,mo,month_label,d.disease_name ORDER BY yr,mo,d.disease_name""", params)
    return ok({"trends": rows or []})

# ── EXPORT ────────────────────────────────────────────────
@app.route('/api/export', methods=['POST'])
@require_auth
def export():
    body = request.get_json(silent=True) or {}
    zone    = body.get('zone','')
    disease = body.get('disease','')
    zf = "AND z.zone_name=%s" if zone and zone != 'All Zones' else ""
    df = "AND d.disease_name=%s" if disease and disease != 'All Diseases' else ""
    params = [v for v,f in [(zone,zf),(disease,df)] if f]
    rows = qry(f"""SELECT p.patient_code,p.first_name,p.last_name,p.age,p.gender,
        d.disease_name,z.zone_name,f.facility_name,p.admission_date,p.status
        FROM patients p JOIN diseases d ON p.disease_id=d.disease_id
        JOIN zones z ON p.zone_id=z.zone_id JOIN facilities f ON p.facility_id=f.facility_id
        WHERE 1=1 {zf} {df} ORDER BY p.admission_date DESC LIMIT 5000""", params or None)
    if not rows: return ok({"message":"No data","rows":0})
    hdrs = list(rows[0].keys())
    csv  = '\n'.join([','.join(hdrs)] + [','.join(str(r[h] or '') for h in hdrs) for r in rows])
    return Response(csv, mimetype='text/csv', headers={"Content-Disposition": f"attachment; filename=medwatch_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"})

# ── HEALTH ────────────────────────────────────────────────
@app.route('/api/health')
def health():
    conn = db(); ok_db = conn is not None
    if conn: conn.close()
    return jsonify({"status":"ok" if ok_db else "degraded","db": "connected" if ok_db else "unavailable","ts":datetime.utcnow().isoformat()+"Z"})

# ── RUN ───────────────────────────────────────────────────
if __name__ == '__main__':
    log.info("=" * 60)
    log.info("  Disease Dashboard v2 — startup checks")
    log.info("=" * 60)

    # 1. SECRET_KEY must be set and non-empty
    if not Cfg.SECRET:
        log.error("FATAL: SECRET_KEY is empty in .env!")
        log.error("  Add this line to backend/.env:")
        log.error("  SECRET_KEY=supersecret123")
        log.error("  Then re-run: python database/seed_users.py")
        exit(1)
    log.info(f"  SECRET_KEY   : OK ({len(Cfg.SECRET)} chars) — '{Cfg.SECRET[:4]}...'")

    # 2. DB connection test
    test = db()
    if test:
        test.close()
        log.info(f"  DB           : connected ({Cfg.DB_USER}@{Cfg.DB_HOST}/{Cfg.DB_NAME})")
    else:
        log.warning(f"  DB           : FAILED — check DB_PASSWORD in .env")

    # 3. SSL check
    cert, key = Cfg.SSL_CERT, Cfg.SSL_KEY
    ssl = (cert, key) if os.path.exists(cert) and os.path.exists(key) else None
    if ssl:
        log.info(f"  SSL          : enabled ({cert})")
    else:
        log.warning(f"  SSL          : certs not found — running plain HTTP")

    log.info(f"  Listening    : {'https' if ssl else 'http'}://{Cfg.HOST}:{Cfg.PORT}")
    log.info("=" * 60)

    app.run(host=Cfg.HOST, port=Cfg.PORT, debug=Cfg.DEBUG, ssl_context=ssl)