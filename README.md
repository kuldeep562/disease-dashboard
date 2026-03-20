# Disease Dashboard — Public Health Intelligence Platform

> A production-ready, full-stack disease surveillance and NCD programme management dashboard for municipal health departments. Built for Mumbai's BMC health infrastructure, adaptable to any city or regional health system.

![Version](https://img.shields.io/badge/version-2.1.0-brightgreen)
![Stack](https://img.shields.io/badge/stack-Flask%20%2B%20MySQL%20%2B%20Vanilla%20JS-blue)
![Responsive](https://img.shields.io/badge/responsive-mobile%20%2B%20tablet%20%2B%20desktop-success)

---

## Table of Contents
1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Quick Start](#quick-start)
5. [Database Setup](#database-setup)
6. [Backend Configuration](#backend-configuration)
7. [Scaling the Database](#scaling-the-database)
8. [API Reference](#api-reference)
9. [Default Login Credentials](#default-login-credentials)
10. [Deployment](#deployment)
11. [Connecting a Real Database](#connecting-a-real-database)
12. [Device Compatibility](#device-compatibility)
13. [Architecture Notes](#architecture-notes)

---

## Features

### Dashboard & Analytics
- **Real-time disease surveillance** with 7-day trend charts and zone alerts
- **NCD Programme reporting** — Diabetes, Hypertension, Cancer, CVD tracking
- **Hotspot Map** — Leaflet.js map with Mumbai-bounded cluster markers, tap-to-detail zone popups
- **Zone-level filtering** — filter all dashboard data by zone + custom date range
- **Disease Trends** — 12-month line charts per disease
- **Zone Distribution** — donut chart of active cases by zone

### Patient Management
- **2,50,000+ patient records** with search, filter, pagination
- Per-page selector: 50 / 100 / 200 / 500 / 1000 rows
- CSV export of filtered results
- Status, zone, and disease filters

### Facilities
- **30 real Mumbai hospitals** with verified addresses, phone numbers, GPS coordinates
- Static map tile preview per facility
- Get Directions → Google Maps (Android) / Apple Maps (iOS)
- Patient status distribution charts per facility

### Settings & Administration
- Role-based access: Admin / Doctor / Nurse / Field Officer / Analyst / Staff
- Admin-only: edit roles, reset passwords (`username@123`), add/deactivate users
- Themed logout modal, notification panel with clear-one/clear-all

### UX & Design
- **Dark + Light theme** — persists in localStorage
- **Fully responsive** — iPhone 12/13/14, Android phones, tablets, laptops, 4K monitors
- Smooth SPA navigation with `Router.refresh()` for instant filter updates
- Actionable notifications with navigation targets (tap → go to relevant page)
- Collapsed sidebar shows `DD` initials; tap user avatar to expand

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS SPA — no framework, no build step |
| Charts | Chart.js 4.4.1 |
| Maps | Leaflet.js 1.9.4 + CartoDB dark tiles |
| Fonts | Syne (headings) + DM Sans (body) + JetBrains Mono (numbers) |
| Backend | Python 3.10+ · Flask 3.x |
| Database | MySQL 8 / MariaDB 10.6+ |
| Auth | SHA-256 password hashing · In-memory session tokens |
| SSL | cert.pem + key.pem (self-signed or CA-issued) |

---

## Project Structure

```
diseasedash/
├── frontend/
│   ├── index.html              # SPA shell — login + app
│   ├── css/
│   │   ├── base.css            # Variables, reset, layout, responsive
│   │   ├── components.css      # Login, cards, tables, toasts, modals
│   │   └── pages.css           # Page-specific styles, mobile breakpoints
│   └── js/
│       ├── config.js           # API_BASE, app settings
│       ├── api.js              # All API calls + MOCK fallback data
│       ├── auth.js             # Login / logout / session (localStorage)
│       ├── router.js           # Hash-based SPA router + Router.refresh()
│       ├── app.js              # Bootstrap: login, sidebar, topnav, filters
│       ├── components/
│       │   ├── toast.js        # Toast notifications
│       │   ├── charts.js       # Chart.js wrappers
│       │   └── table.js        # Table helper functions
│       └── pages/
│           ├── dashboard.js    # Main dashboard — all sections
│           └── ncd.js          # NCD, Surveillance, Hotspots, Facilities,
│                               # Patients, Settings (all in one file)
├── backend/
│   ├── app.py                  # Flask API — all endpoints
│   ├── requirements.txt
│   └── .env.example
├── database/
│   ├── 00_create_user.sql      # DB user creation (run as root)
│   ├── 01_schema.sql           # 10 core tables
│   ├── 02_users_table.sql      # auth/users table
│   ├── seed_database.py        # Seeds up to 5 lakh patients
│   └── seed_users.py           # Creates login accounts
└── certs/
    └── README.txt              # SSL certificate instructions
```

---

## Quick Start

### Prerequisites
- Python 3.10+
- MySQL 8 or MariaDB 10.6+
- `pip install faker mysql-connector-python flask flask-cors`

### 1. Clone and configure

```bash
git clone https://github.com/yourname/disease-dashboard.git
cd disease-dashboard
cd backend
cp .env.example .env
# Edit .env — set DB_PASSWORD and SECRET_KEY
```

### 2. SSL Certificates (required for HTTPS)

```bash
# Generate self-signed cert (development)
cd certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem -out cert.pem \
  -subj "/CN=localhost"
```

### 3. Database setup

```bash
# As MySQL root:
mysql -u root -p < database/00_create_user.sql

# Create schema:
mysql -u medwatch_user -p disease_dashboard < database/01_schema.sql
mysql -u medwatch_user -p disease_dashboard < database/02_users_table.sql
```

### 4. Install Python dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 5. Seed the database

```bash
cd database
python seed_database.py          # Default: 2,50,000 patients
python seed_users.py             # Creates 9 default user accounts
```

### 6. Start the server

```bash
cd backend
python app.py
```

Open: **https://localhost:9000** (accept self-signed certificate warning)

---

## Database Setup

### Environment variables (backend/.env)

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=medwatch_user
DB_PASSWORD=your_secure_password
DB_NAME=disease_dashboard
SECRET_KEY=your_secret_key_min_32_chars
SSL_CERT=../certs/cert.pem
SSL_KEY=../certs/key.pem
```

> ⚠️ **CRITICAL**: `SECRET_KEY` must be set BEFORE running `seed_users.py`.  
> If you change `SECRET_KEY`, re-run `seed_users.py` to regenerate all password hashes.

### Database tables

| Table | Description | Rows (default seed) |
|-------|-------------|-------------------|
| zones | 5 Mumbai zones | 5 |
| diseases | 30 diseases (NCD + Communicable) | 30 |
| facilities | 30 hospitals/PHCs/CHCs | 30 |
| care_providers | Doctors/nurses | 1,250 |
| patients | Patient records | 2,50,000 |
| hotspots | Disease outbreak clusters | ~52 |
| surveillance_reports | Daily zone/disease reports | ~27,375 |
| vaccinations | Vaccination records (sample) | ~30,000 |
| lab_tests | Lab test results (sample) | ~50,000 |
| users | Login accounts | 9 |

---

## Scaling the Database

The seed script is designed to scale:

```bash
# 1 lakh patients
PATIENT_COUNT=100000 python seed_database.py

# 2.5 lakh patients (default)
python seed_database.py

# 5 lakh patients
PATIENT_COUNT=500000 python seed_database.py

# 10 lakh patients (1 million — ~25 min)
PATIENT_COUNT=1000000 python seed_database.py
```

The script is **idempotent** — safe to re-run. It skips existing records and only inserts the difference.

### Performance at scale
| Patient count | Seed time | DB size (approx) |
|--------------|-----------|-----------------|
| 30,000 | ~1 min | ~50 MB |
| 2,50,000 | ~5-8 min | ~400 MB |
| 5,00,000 | ~12-15 min | ~800 MB |
| 10,00,000 | ~25-30 min | ~1.6 GB |

---

## Backend Configuration

### API base URL

Edit `frontend/js/config.js`:
```js
const CFG = {
  API_BASE: 'https://localhost:5000/api',  // development
  // API_BASE: 'https://yourdomain.com/api', // production
};
```

### Running in production with Gunicorn

```bash
cd backend
gunicorn \
  --bind 0.0.0.0:5000 \
  --certfile ../certs/cert.pem \
  --keyfile ../certs/key.pem \
  --workers 4 \
  --timeout 60 \
  app:app
```

---

## API Reference

All endpoints accept `zone`, `date_from`, `date_to` query parameters for filtering.

| Method | Endpoint | Description | Filter params |
|--------|----------|-------------|--------------|
| POST | `/api/auth/login` | Login, returns session token | — |
| POST | `/api/auth/logout` | Invalidate session | — |
| GET | `/api/auth/me` | Current user info | — |
| GET | `/api/dashboard-summary` | Header stats | zone, date_from, date_to |
| GET | `/api/ncd-stats` | NCD programme cards | zone, date_from, date_to |
| GET | `/api/surveillance` | Disease line listing | zone, disease, date_from, date_to |
| GET | `/api/hotspots` | Active outbreak clusters | — |
| GET | `/api/zones` | Zone summary data | — |
| GET | `/api/facilities` | Facility directory | — |
| GET | `/api/patients` | Patient records | search, page, per_page, zone, date_from, date_to |
| GET | `/api/trends` | 12-month trend data | disease |
| GET | `/api/health` | Server health check | — |
| GET/POST/PUT/DELETE | `/api/users` | User management (admin) | — |

### Filter propagation
When a user selects "East Zone + Last 3 Months" in the topnav:
- `window._globalZone = 'East Zone'`
- `window._globalDateFrom = '2025-12-20'`
- `window._globalDateTo = '2026-03-20'`

Every `API.*` call automatically appends these via `API._filterQS()`. No page-level code changes needed when adding new pages.

---

## Default Login Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| samved | samved123 | Admin |
| kuldeep | kuldeep123 | Admin |
| dr.aditya | doctor123 | Doctor |
| dr.priya | doctor123 | Doctor |
| nurse.meena | nurse123 | Nurse |
| officer.ravi | field123 | Field Officer |
| analyst.kavita | analyst123 | Analyst |
| staff.suresh | staff123 | Staff |

> ⚠️ Change all passwords after first production login.  
> Admin can reset any user's password to `username@123` from Settings → Users & Access.

---

## Deployment

### Nginx reverse proxy (recommended for production)

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Serve frontend static files
    location / {
        root /var/www/diseasedash/frontend;
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API to Flask/Gunicorn
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Environment checklist for production
- [ ] Change `SECRET_KEY` in `.env` to a random 64-char string
- [ ] Change all default passwords
- [ ] Use a CA-issued SSL certificate (not self-signed)
- [ ] Set `API_BASE` in `frontend/js/config.js` to your domain
- [ ] Configure MySQL with a strong password
- [ ] Set up database backups (daily `mysqldump`)
- [ ] Consider Redis for session storage (currently in-memory)

---

## Connecting a Real Database

The project is designed for easy database migration. The frontend always tries the real API first, falling back to `MOCK.*` data only if the API fails.

### To connect a different hospital database:

1. **Map your table fields** to the API response format:
   - Patients need: `patient_code`, `first_name`, `last_name`, `age`, `gender`, `disease_name`, `zone_name`, `facility_name`, `admission_date`, `status`
   - Facilities need: `facility_name`, `facility_type`, `zone_name`, `bed_capacity`

2. **Update SQL queries** in `backend/app.py` to match your schema — all queries are clearly labeled by endpoint.

3. **The frontend auto-adapts**: 
   - Patient table uses all returned fields
   - Zone filter reads `zone_name` from any joined table
   - Search works across all string fields

4. **Add new diseases**: Just insert rows into the `diseases` table — they appear automatically in all dropdowns and charts.

---

## Device Compatibility

Tested and optimised for:

| Device category | Sizes | Status |
|----------------|-------|--------|
| iPhone SE/Mini | 375–390px | ✅ Full support |
| iPhone 12/13/14 Standard | 390–393px | ✅ Full support |
| iPhone 12/13/14 Pro Max | 428–430px | ✅ Full support |
| Android phones | 360–414px | ✅ Full support |
| iPad / Android tablets | 768–1024px | ✅ Full support |
| Laptops | 1280–1600px | ✅ Full support |
| Desktop / 4K | 1920px+ | ✅ Full support |

### Mobile-specific features:
- Sidebar becomes a **slide-in drawer** (tap hamburger or user avatar to open)
- **Period picker panel** slides in full-width below the topnav
- Tables have **horizontal scroll** with momentum scrolling
- All tap targets minimum **44×44px** (Apple HIG / Material guidelines)
- Facility cards open bottom-sheet modal (slides up from bottom)
- iOS-compatible direction links open Apple Maps natively
- `font-size: 16px` on all inputs to prevent iOS auto-zoom

---

## Architecture Notes

### SPA Router
`Router.navigate(page)` — navigates to a new page  
`Router.refresh()` — re-runs the current page handler (used for filter updates without page transitions)

The same-page guard (`if page === current return`) is bypassed by `refresh()`, enabling instant filter application without visible page transitions.

### Filter System
Global filters stored as window variables:
- `window._globalZone` — e.g. `"East Zone"`
- `window._globalDateFrom` — e.g. `"2025-12-20"`  
- `window._globalDateTo` — e.g. `"2026-03-20"`

`API._filterQS()` appends these to every API call automatically. Backend endpoints accept these as query params on all data endpoints.

### Authentication
- Passwords hashed as `SHA256(password + SECRET_KEY)`
- Sessions stored in server-side dict (in-memory)
- Token passed as `Authorization: Bearer <token>` header
- For production: replace with Redis-backed sessions

### MOCK Data fallback
When the backend is unavailable, the frontend automatically serves realistic MOCK data from `api.js`. This means the UI is always functional for demos even without the database running.

---

## Changelog

### v2.1.0 (March 2026)
- ✅ Scaled to 2,50,000+ patients (up from 30,000)
- ✅ 30 diseases (up from 20)
- ✅ Real Mumbai hospital data — addresses, phone numbers, GPS
- ✅ Static map tiles in facility modals (no Leaflet lag)
- ✅ Full filter system — zone + custom date range propagates everywhere
- ✅ `Router.refresh()` — instant filter updates without page transitions
- ✅ Comprehensive mobile responsive (all phones/tablets)
- ✅ Dark + Light theme with persistence
- ✅ Notification panel with navigation targets + clear all/individual
- ✅ Collapsible sidebar with `DD` initials
- ✅ Zone detail popup on hotspot map tap

### v2.0.0 (Initial release)
- SPA with 7 pages (Dashboard, NCD, Surveillance, Hotspots, Facilities, Patients, Settings)
- Flask + MySQL backend
- 30,000 patient seed

---

## License

MIT License — free to use, modify, and deploy.

Built with ❤️ for public health.
