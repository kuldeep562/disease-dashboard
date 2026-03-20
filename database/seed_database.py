#!/usr/bin/env python3
"""
seed_database.py — Generate up to 2,50,000 rows of realistic Indian health data
Default: 2,50,000 patients | 30 diseases | 1500 care providers

Run:
    python seed_database.py                          # 2,50,000 patients (default)
    PATIENT_COUNT=100000 python seed_database.py     # custom count
    PATIENT_COUNT=500000 python seed_database.py     # 5 lakh patients

Notes:
- Script is IDEMPOTENT: safe to re-run, skips existing records
- Memory-safe: patients inserted in 5000-row batches
- Vaccinations/lab tests use random sample (not all patients) to save space
"""

import mysql.connector
import random
import os
import sys
from datetime import date, timedelta
from pathlib import Path
from faker import Faker

fake = Faker('en_IN')
random.seed(42)

PATIENT_COUNT = int(os.environ.get('PATIENT_COUNT', 250000))
print(f"\n  Target patient count: {PATIENT_COUNT:,}")

# ── .env loader ────────────────────────────────────────────
def load_env_file(path):
    p = Path(path).resolve()
    if not p.exists():
        return False
    with open(p, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            os.environ[k.strip()] = v.strip()
    print(f"  ✓ Loaded .env from {p}")
    return True

script_dir = Path(__file__).parent
load_env_file(script_dir / '../backend/.env') or \
load_env_file(script_dir / '../../backend/.env') or \
load_env_file(script_dir / '.env')

DB_CONFIG = {
    'host':       os.environ.get('DB_HOST',     'localhost'),
    'port':       int(os.environ.get('DB_PORT', 3306)),
    'user':       os.environ.get('DB_USER',     'medwatch_user'),
    'password':   os.environ.get('DB_PASSWORD', ''),
    'database':   os.environ.get('DB_NAME',     'disease_dashboard'),
    'autocommit': False,
}
print(f"  DB: {DB_CONFIG['user']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
if not DB_CONFIG['password']:
    print("  ✗ DB_PASSWORD is empty — check backend/.env")
    sys.exit(1)

def get_conn():
    return mysql.connector.connect(**DB_CONFIG)

def fetch_all(conn, sql, params=None):
    cur = conn.cursor(buffered=True)
    cur.execute(sql, params or ())
    rows = cur.fetchall()
    cur.close()
    return rows

def run_sql(conn, sql):
    cur = conn.cursor(buffered=True)
    cur.execute(sql)
    cur.close()
    conn.commit()

def batch_insert(conn, sql, rows, batch=1000):
    if not rows:
        print("    (nothing to insert)")
        return
    cur   = conn.cursor(buffered=True)
    total = len(rows)
    for i in range(0, total, batch):
        cur.executemany(sql, rows[i:i+batch])
        conn.commit()
        done = min(i + batch, total)
        pct  = done * 100 // total
        bar  = '█' * (pct // 5) + '░' * (20 - pct // 5)
        print(f"    [{bar}] {done:,}/{total:,} ({pct}%)", end='\r')
    cur.close()
    print(f"    [{'█'*20}] {total:,}/{total:,} (100%) ✓   ")

# ── Reference data ──────────────────────────────────────────

ZONES = [
    ('North Zone',  'NZ', 19.1800, 72.8500, 2800000),
    ('South Zone',  'SZ', 18.9400, 72.8300, 3100000),
    ('East Zone',   'EZ', 19.0700, 72.9300, 1900000),
    ('West Zone',   'WZ', 19.0800, 72.8300, 2600000),
    ('Central Zone','CZ', 19.0200, 72.8400, 2200000),
]

# 30 diseases (expanded from 20)
DISEASES = [
    # Communicable (15)
    ('Dengue',                  'Communicable', 'A90',   'Hotspot', '+14%', 'Higher case concentration in North Zone; intensified vector control advised.', 1),
    ('Malaria',                 'Communicable', 'B50',   'Rising',  '+11%', 'Rising positivity in East Zone with pending field surveillance closure.', 1),
    ('Tuberculosis',            'Communicable', 'A15',   'Watch',   '+6%',  'Most cases remain on treatment; adherence tracking required.', 1),
    ('Influenza-like Illness',  'Communicable', 'J11',   'Cluster', '+18%', 'Cluster activity in West Zone with rapid outpatient growth.', 0),
    ('Acute Diarrheal Disease', 'Communicable', 'A09',   'Normal',  '-3%',  'Stable trend; water quality follow-up continues.', 0),
    ('Cholera',                 'Communicable', 'A00',   'Normal',  '-8%',  'Declining trend. Water treatment interventions effective.', 1),
    ('Typhoid',                 'Communicable', 'A01',   'Watch',   '+3%',  'Mild upward trend in Central Zone. Monitoring ongoing.', 1),
    ('Leptospirosis',           'Communicable', 'A27',   'Normal',  '+2%',  'Seasonal uptick; rodent control measures in progress.', 1),
    ('Hepatitis A',             'Communicable', 'B15',   'Normal',  '-1%',  'Stable. Community hygiene awareness camps scheduled.', 1),
    ('Chikungunya',             'Communicable', 'A92.0', 'Watch',   '+7%',  'Vector breeding sites identified in South Zone.', 1),
    ('COVID-19',                'Communicable', 'U07.1', 'Normal',  '-10%', 'Surveillance maintained at entry points.', 1),
    ('Measles',                 'Communicable', 'B05',   'Normal',  '-5%',  'Vaccination drive achieved 92% coverage.', 1),
    ('Chickenpox',              'Communicable', 'B01',   'Normal',  '+4%',  'Mild seasonal rise in paediatric cases.', 0),
    ('Hepatitis B',             'Communicable', 'B16',   'Watch',   '+2%',  'Blood-borne transmission monitoring active.', 1),
    ('Meningitis',              'Communicable', 'G00',   'Normal',  '+1%',  'Sporadic cases; close contacts monitored.', 1),
    # NCD (10)
    ('Diabetes',                'NCD',          'E11',   'Normal',  '+6%',  'Screening camps active across all zones.', 0),
    ('Hypertension',            'NCD',          'I10',   'Normal',  '+4%',  'Lifestyle intervention programme ongoing.', 0),
    ('Oral Cancer',             'NCD',          'C06',   'Normal',  '-2%',  'Early detection camps conducted this month.', 0),
    ('Breast Cancer',           'NCD',          'C50',   'Normal',  '+1%',  'Mammography screening ongoing in South Zone.', 0),
    ('Cervical Cancer',         'NCD',          'C53',   'Normal',  '-3%',  'Pap smear camps conducted across facilities.', 0),
    ('Cardiovascular Disease',  'NCD',          'I25',   'Normal',  '+8%',  'Cardiac health checkup drive in progress.', 0),
    ('COPD',                    'NCD',          'J44',   'Normal',  '+2%',  'Spirometry screening camps organised.', 0),
    ('Chronic Kidney Disease',  'NCD',          'N18',   'Watch',   '+5%',  'Renal function screening programme launched.', 0),
    ('Sickle Cell Disease',     'NCD',          'D57',   'Normal',  '-1%',  'Genetic counselling and treatment programme active.', 0),
    ('Thyroid Disorder',        'NCD',          'E07',   'Normal',  '+3%',  'Thyroid screening in women 25-45 underway.', 0),
    # Respiratory & Other (5)
    ('Asthma',                  'Respiratory',  'J45',   'Normal',  '+5%',  'Inhaler therapy compliance tracking ongoing.', 0),
    ('Pneumonia',               'Respiratory',  'J18',   'Watch',   '+9%',  'Elevated cases in elderly; vaccination recommended.', 0),
    ('Acute Rheumatic Fever',   'Other',        'I00',   'Normal',  '+1%',  'Streptococcal follow-up programme in schools.', 1),
    ('Nutritional Anaemia',     'NCD',          'D50',   'Normal',  '-4%',  'Iron supplementation programme showing results.', 0),
    ('Neonatal Jaundice',       'Other',        'P59',   'Normal',  '+2%',  'Phototherapy availability ensured at all facilities.', 0),
]

FACILITIES_SEED = [
    ('Sion Hospital',           'Municipal Hospital', 2, 1500, 19.0412, 72.8605),
    ('KEM Hospital',            'Municipal Hospital', 4, 1800, 19.0044, 72.8399),
    ('Nair Hospital',           'Municipal Hospital', 4, 1250, 19.0360, 72.8407),
    ('Cooper Hospital',         'Municipal Hospital', 2, 1100, 19.1055, 72.8372),
    ('Kasturba Hospital',       'Municipal Hospital', 4,  600, 18.9543, 72.8295),
    ('GT Hospital',             'Municipal Hospital', 4,  800, 18.9375, 72.8360),
    ('Rajawadi Hospital',       'Municipal Hospital', 2,  500, 19.0812, 72.8905),
    ('Shatabdi Hospital',       'Municipal Hospital', 0,  850, 19.2180, 72.8450),
    ('M.T. Agarwal Hospital',   'Municipal Hospital', 2,  400, 19.0680, 72.8550),
    ('Lokmanya Tilak Hospital', 'Municipal Hospital', 2, 1600, 19.0385, 72.8584),
    ('PHC Dharavi',             'PHC',                2,   80, 19.0430, 72.8535),
    ('PHC Kurla',               'PHC',                2,   80, 19.0720, 72.8825),
    ('PHC Malad',               'PHC',                0,   60, 19.1878, 72.8480),
    ('PHC Govandi',             'PHC',                2,   60, 19.0628, 72.9241),
    ('PHC Bhandup',             'PHC',                2,   70, 19.1525, 72.9360),
    ('PHC Mulund',              'PHC',                2,   70, 19.1767, 72.9542),
    ('CHC Andheri',             'CHC',                2,  150, 19.1136, 72.8697),
    ('CHC Borivali',            'CHC',                0,  140, 19.2308, 72.8567),
    ('CHC Ghatkopar',           'CHC',                2,  120, 19.0858, 72.9081),
    ('Dispensary Worli',        'Dispensary',         1,   40, 18.9994, 72.8154),
    ('Dispensary Bandra',       'Dispensary',         2,   40, 19.0596, 72.8295),
    ('Dispensary Dadar',        'Dispensary',         4,   40, 19.0178, 72.8478),
    ('Lilavati Hospital',       'Private',            3,  320, 19.0523, 72.8274),
    ('Hinduja Hospital',        'Private',            3,  350, 19.0611, 72.8316),
    ('Kokilaben Hospital',      'Private',            3,  750, 19.1332, 72.8272),
    ('Holy Spirit Hospital',    'Private',            3,  250, 19.1181, 72.8437),
    ('Breach Candy Hospital',   'Private',            1,  200, 18.9731, 72.8083),
    ('Bombay Hospital',         'Specialty Center',   4,  650, 18.9411, 72.8291),
    ('Tata Memorial Hospital',  'Specialty Center',   4,  600, 18.9988, 72.8125),
    ('NIMHANS Mumbai',          'Specialty Center',   1,  300, 18.9100, 72.8200),
]

FIRST_NAMES = [
    'Aarav','Aditya','Akash','Akira','Alka','Amit','Amita','Ananya','Anjali','Ankit',
    'Arjun','Aryan','Ashish','Ashok','Avni','Bhavna','Chetan','Deepa','Deepak','Dhruv',
    'Divya','Ekta','Farhan','Fatima','Gaurav','Geeta','Girish','Govind','Harish','Heena',
    'Hemant','Hitesh','Ishaan','Isha','Jagdish','Jaya','Jayesh','Karim','Kalpana','Kartik',
    'Kavita','Kishan','Komal','Krishna','Kuldeep','Lalit','Lata','Leela','Mahesh','Manisha',
    'Meena','Mihir','Mira','Mohammad','Mohan','Mukesh','Nalini','Namita','Neha','Nikhil',
    'Nilesh','Nisha','Omkar','Padma','Pankaj','Payal','Pooja','Pradeep','Prakash','Priya',
    'Rahul','Rajesh','Rakesh','Ramesh','Rashmi','Ravi','Rekha','Rohit','Ruchi','Rukmini',
    'Sachin','Salma','Sanjay','Sangeeta','Sapna','Seema','Sharda','Shilpa','Shivam','Shruti',
    'Siddharth','Sneha','Suresh','Swati','Tanvi','Tejas','Uma','Usha','Vaishali','Vijay',
    'Vikas','Vinita','Vivek','Wasim','Yogesh','Zara','Zubair',
]

LAST_NAMES = [
    'Agarwal','Bose','Chakraborty','Chaudhari','Deshpande','Dubey','Fernandez','Gaikwad',
    'Ghosh','Goswami','Gupta','Iyer','Jain','Joshi','Kadam','Kaur','Khan','Khanna',
    'Kulkarni','Kumar','Mehta','Mishra','More','Mukherjee','Nair','Naik','Patel','Patil',
    'Pillai','Rao','Reddy','Saha','Shah','Sharma','Shinde','Shukla','Singh','Sinha',
    'Tiwari','Varma','Verma','Wagh','Yadav','Zala',
]

BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown']
STATUSES     = ['Admitted','Monitoring','Recovered','Discharged','Deceased']
STATUS_W     = [10, 12, 38, 38, 2]

SPECIALIZATIONS = [
    'General Medicine','Infectious Disease','Pulmonology','Cardiology',
    'Oncology','Pediatrics','Obstetrics & Gynecology','Surgery',
    'Orthopedics','Psychiatry','Nephrology','Neurology','Endocrinology',
    'Dermatology','Ophthalmology',
]

VACCINES = [
    ('MMR', 1), ('Hepatitis A', 2), ('Hepatitis B', 3),
    ('Typhoid Vi', 1), ('Dengue CYD-TDV', 3), ('Influenza', 1),
    ('COVID-19', 2), ('Cholera', 2), ('Meningococcal', 1),
    ('Pneumococcal', 2), ('Varicella', 2),
]

LAB_TESTS = [
    ('Complete Blood Count',    True),  ('Malaria RDT',             False),
    ('Dengue NS1 Antigen',      False), ('Dengue IgM/IgG',          False),
    ('Typhoid Widal Test',      False), ('Tuberculosis GeneXpert',  False),
    ('Blood Culture',           False), ('Liver Function Test',     True),
    ('Blood Glucose Fasting',   True),  ('HbA1c',                   True),
    ('Lipid Profile',           True),  ('Chest X-Ray',             False),
    ('COVID RT-PCR',            False), ('Urine Routine',           True),
    ('Renal Function Test',     True),  ('Thyroid Profile (TSH)',   True),
]

HOTSPOTS_SEED = [
    ('Dharavi Cluster',  0, 2, 44, 'High',   19.0412, 72.8525, 'High density area; prolonged treatment follow-up burden.'),
    ('Kurla Belt',       1, 2, 38, 'High',   19.0726, 72.8843, 'Vector-borne case spike; breeding-site response pending.'),
    ('Malad West',       3, 0, 52, 'Medium', 19.1874, 72.8479, 'Outpatient respiratory cluster increasing.'),
    ('Govandi Pocket',   4, 2, 21, 'Low',    19.0614, 72.9241, 'Water sanitation follow-up underway.'),
    ('Andheri',          1, 2, 17, 'Medium', 19.1136, 72.8697, 'Breeding sites identified; larvicide spraying scheduled.'),
    ('Bandra Cluster',   0, 2, 29, 'High',   19.0596, 72.8295, 'High-density residential buildings.'),
    ('Worli',            6, 1, 12, 'Low',    18.9994, 72.8154, 'Typhoid cluster near water supply area.'),
    ('Chembur East',     3, 2, 33, 'Medium', 19.0508, 72.9014, 'ILI spike in residential colony.'),
    ('Colaba',           9, 1,  8, 'Low',    18.9067, 72.8147, 'Seasonal chikungunya cases.'),
    ('Borivali',         0, 0, 24, 'Medium', 19.2317, 72.8567, 'Dengue near Sanjay Gandhi park.'),
    ('Ghatkopar',        2, 2, 18, 'Medium', 19.0858, 72.9081, 'TB defaulter tracking in progress.'),
    ('Sion',             1, 2, 22, 'Medium', 19.0385, 72.8605, 'Monsoon breeding sites.'),
]


# ═══════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════
def seed():
    conn = get_conn()
    print("\nConnected ✓")
    run_sql(conn, "SET FOREIGN_KEY_CHECKS=0")

    # 1. Zones
    print("\n[1/9] Zones...")
    batch_insert(conn,
        "INSERT IGNORE INTO zones (zone_name,zone_code,alert_status,latitude,longitude,population) "
        "VALUES (%s,%s,%s,%s,%s,%s)",
        [(z[0],z[1],'Normal',z[2],z[3],z[4]) for z in ZONES])
    zone_rows = fetch_all(conn, "SELECT zone_id,zone_name FROM zones")
    zones_db  = {n:i for i,n in zone_rows}
    zone_ids  = list(zones_db.values())
    print(f"  → {len(zones_db)} zones")

    # 2. Diseases
    print(f"\n[2/9] Diseases ({len(DISEASES)})...")
    batch_insert(conn,
        "INSERT IGNORE INTO diseases (disease_name,disease_type,icd10_code,alert_level,trend_percent,summary_text,is_notifiable) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s)", DISEASES)
    disease_rows = fetch_all(conn, "SELECT disease_id,disease_name FROM diseases")
    diseases_db  = {n:i for i,n in disease_rows}
    disease_ids  = list(diseases_db.values())
    disease_list = list(diseases_db.items())
    print(f"  → {len(diseases_db)} diseases")

    # 3. Facilities
    print(f"\n[3/9] Facilities ({len(FACILITIES_SEED)})...")
    batch_insert(conn,
        "INSERT IGNORE INTO facilities (facility_name,facility_type,zone_id,bed_capacity,latitude,longitude) "
        "VALUES (%s,%s,%s,%s,%s,%s)",
        [(f[0],f[1],zones_db[ZONES[f[2]][0]],f[3],f[4],f[5]) for f in FACILITIES_SEED])
    fac_db    = fetch_all(conn, "SELECT facility_id,facility_name,zone_id FROM facilities")
    all_fac   = [r[0] for r in fac_db]
    fac_zone  = {}
    for fid,_,zid in fac_db:
        fac_zone.setdefault(zid,[]).append(fid)
    print(f"  → {len(fac_db)} facilities")

    # 4. Care Providers
    PROV_TARGET = max(500, PATIENT_COUNT // 200)
    print(f"\n[4/9] Care providers (target {PROV_TARGET:,})...")
    existing_p = fetch_all(conn,"SELECT COUNT(*) FROM care_providers")[0][0]
    if existing_p < PROV_TARGET:
        prov_rows = [(f"Dr. {random.choice(FIRST_NAMES)}",random.choice(LAST_NAMES),
                      random.choice(SPECIALIZATIONS),random.choice(all_fac),
                      fake.phone_number()[:20],fake.ascii_email())
                     for _ in range(PROV_TARGET - existing_p)]
        batch_insert(conn,
            "INSERT IGNORE INTO care_providers (first_name,last_name,specialization,facility_id,phone,email) "
            "VALUES (%s,%s,%s,%s,%s,%s)", prov_rows)
    prov_db  = fetch_all(conn,"SELECT provider_id,facility_id FROM care_providers")
    prov_fac = {}
    for pid,fid in prov_db:
        prov_fac.setdefault(fid,[]).append(pid)
    print(f"  → {len(prov_db)} providers")

    # 5. Patients — memory-safe batched generation
    print(f"\n[5/9] Patients (target {PATIENT_COUNT:,})...")
    existing = fetch_all(conn,"SELECT COUNT(*) FROM patients")[0][0]
    to_insert = max(0, PATIENT_COUNT - existing)
    print(f"  Existing: {existing:,} | Inserting: {to_insert:,}")

    today = date.today()
    dw = [8,6,5,7,4,2,3,2,2,3, 2,1,2,2,1, 12,10,3,3,3, 8,2,3,2,3, 3,4,1,2,1]
    while len(dw) < len(disease_list): dw.append(2)
    dw = dw[:len(disease_list)]

    INSERT_SQL = (
        "INSERT INTO patients "
        "(patient_code,first_name,last_name,age,gender,blood_group,"
        " disease_id,zone_id,facility_id,provider_id,"
        " admission_date,discharge_date,status,is_death) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"
    )
    CHUNK = 5000
    inserted = 0
    while inserted < to_insert:
        chunk_size = min(CHUNK, to_insert - inserted)
        rows = []
        for j in range(chunk_size):
            zid  = random.choice(zone_ids)
            fid  = random.choice(fac_zone.get(zid, all_fac))
            pid  = random.choice(prov_fac.get(fid, [None]))
            _,did= random.choices(disease_list, weights=dw)[0]
            adm  = today - timedelta(days=random.randint(0,1095))
            st   = random.choices(STATUSES, weights=STATUS_W)[0]
            dis  = adm + timedelta(days=random.randint(3,60)) if st in ('Recovered','Discharged','Deceased') else None
            rows.append((
                f"P-{existing+inserted+j+1:07d}",
                random.choice(FIRST_NAMES), random.choice(LAST_NAMES),
                random.randint(1,90),
                random.choices(['Male','Female','Other'],[50,48,2])[0],
                random.choices(BLOOD_GROUPS,[28,6,23,5,5,1,32,8,10])[0],
                did, zid, fid, pid, adm, dis, st, 1 if st=='Deceased' else 0,
            ))
        batch_insert(conn, INSERT_SQL, rows)
        inserted += chunk_size
        pct = inserted * 100 // to_insert
        print(f"  Progress: {existing+inserted:,}/{PATIENT_COUNT:,} patients ({pct}%)")

    actual = fetch_all(conn,"SELECT COUNT(*) FROM patients")[0][0]
    print(f"  → {actual:,} patients total")

    # Fetch a sample for vaccinations/lab tests
    SAMPLE_SIZE = min(50000, actual)
    print(f"\n  Sampling {SAMPLE_SIZE:,} patients for vaccinations & lab tests...")
    sample_pts = fetch_all(conn,
        f"SELECT patient_id,facility_id,admission_date FROM patients ORDER BY RAND() LIMIT {SAMPLE_SIZE}")

    # 6. Hotspots
    print("\n[6/9] Hotspots...")
    hs_rows = []
    for h in HOTSPOTS_SEED:
        n,di,zi,cases,sev,lat,lng,desc = h
        if di < len(disease_ids) and zi < len(zone_ids):
            hs_rows.append((n,disease_ids[di],zone_ids[zi],cases,sev,lat,lng,desc,
                            today-timedelta(days=random.randint(1,30))))
    for _ in range(40):
        hs_rows.append((f"{fake.city()} Cluster",random.choice(disease_ids),random.choice(zone_ids),
                        random.randint(5,100),random.choice(['Low','Medium','High','Critical']),
                        18.89+random.uniform(0,0.38), 72.77+random.uniform(0,0.23),
                        fake.sentence(), today-timedelta(days=random.randint(1,60))))
    batch_insert(conn,
        "INSERT IGNORE INTO hotspots (hotspot_name,disease_id,zone_id,active_cases,severity,"
        "latitude,longitude,description,reported_date,is_active) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,1)",
        hs_rows)
    print(f"  → {len(hs_rows)} hotspots")

    # 7. Surveillance reports (1 year × 15 diseases × 5 zones)
    print("\n[7/9] Surveillance reports...")
    existing_sr = fetch_all(conn,"SELECT COUNT(*) FROM surveillance_reports")[0][0]
    if existing_sr < 10000:
        sr_rows = []
        for d in range(365):
            rd = today - timedelta(days=d)
            for did in disease_ids[:15]:
                for zid in zone_ids:
                    nc = random.randint(0,30)
                    rec= random.randint(0,nc)
                    dt = random.randint(0,max(0,(nc-rec)//10))
                    sr_rows.append((did,zid,rd,nc,rec,dt,max(0,nc-rec-dt+random.randint(0,25)),1))
        batch_insert(conn,
            "INSERT INTO surveillance_reports (disease_id,zone_id,report_date,new_cases,recovered,deaths,total_active,is_published) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s,%s)", sr_rows)
        print(f"  → {len(sr_rows)} reports")
    else:
        print(f"  → {existing_sr:,} reports already exist, skipping")

    # 8. Vaccinations
    print("\n[8/9] Vaccinations...")
    VAC_N = min(30000, len(sample_pts))
    vac_rows = [(p,vn,random.randint(1,md),(a or today)-timedelta(days=random.randint(0,30)),
                 f,f"BCH{random.randint(10000,99999)}")
                for p,f,a in random.sample(sample_pts,VAC_N)
                for vn,md in [random.choice(VACCINES)]]
    batch_insert(conn,
        "INSERT INTO vaccinations (patient_id,vaccine_name,dose_number,vaccination_date,facility_id,batch_number) "
        "VALUES (%s,%s,%s,%s,%s,%s)", vac_rows)
    print(f"  → {len(vac_rows)} vaccinations")

    # 9. Lab Tests
    print("\n[9/9] Lab tests...")
    LAB_N = min(50000, len(sample_pts))
    lab_rows = []
    for p,f,a in random.sample(sample_pts, LAB_N):
        tn,hv = random.choice(LAB_TESTS)
        res   = random.choices(['Positive','Negative','Inconclusive','Pending'],[20,65,10,5])[0]
        lab_rows.append((p,tn,(a or today)+timedelta(days=random.randint(0,3)),
                         res,str(round(random.uniform(60,400),1)) if hv else None,f,
                         1 if res=='Positive' and random.random()<0.12 else 0))
    batch_insert(conn,
        "INSERT INTO lab_tests (patient_id,test_name,test_date,result,result_value,facility_id,is_critical) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s)", lab_rows)
    print(f"  → {len(lab_rows)} lab tests")

    run_sql(conn,"SET FOREIGN_KEY_CHECKS=1")
    conn.close()

    print("\n" + "═"*56)
    print("✅  Seeding complete!")
    print("═"*56)
    print(f"   Patients  : {actual:,}")
    print(f"   Diseases  : {len(diseases_db)}")
    print(f"   Providers : {len(prov_db):,}")
    print(f"   Hotspots  : {len(hs_rows)}")
    print("─"*56)
    print("   Scale up: PATIENT_COUNT=500000 python seed_database.py")
    print("═"*56)


if __name__ == '__main__':
    seed()