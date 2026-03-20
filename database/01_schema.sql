-- ============================================================
-- Disease Management Dashboard — Database Schema
-- Compatible with MySQL 5.7+ and MariaDB 10.3+
-- ============================================================

CREATE DATABASE IF NOT EXISTS disease_dashboard
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE disease_dashboard;

-- ============================================================
-- 1. ZONES
-- ============================================================
CREATE TABLE IF NOT EXISTS zones (
    zone_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    zone_name       VARCHAR(100) NOT NULL UNIQUE,
    zone_code       VARCHAR(20)  NOT NULL UNIQUE,
    alert_status    ENUM('Normal','Watch','Rising','Hotspot','Cluster') DEFAULT 'Normal',
    latitude        DECIMAL(9,6),
    longitude       DECIMAL(9,6),
    population      INT UNSIGNED DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_zone_name (zone_name)
) ENGINE=InnoDB;

-- ============================================================
-- 2. DISEASES
-- ============================================================
CREATE TABLE IF NOT EXISTS diseases (
    disease_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    disease_name    VARCHAR(150) NOT NULL UNIQUE,
    disease_type    ENUM('Communicable','NCD','Vector-borne','Waterborne','Respiratory') NOT NULL,
    icd10_code      VARCHAR(20),
    alert_level     ENUM('Normal','Watch','Rising','Hotspot','Cluster') DEFAULT 'Normal',
    trend_percent   VARCHAR(10) DEFAULT '0%',
    summary_text    TEXT,
    is_notifiable   TINYINT(1) DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_disease_type (disease_type)
) ENGINE=InnoDB;

-- ============================================================
-- 3. FACILITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS facilities (
    facility_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    facility_name   VARCHAR(200) NOT NULL,
    facility_type   ENUM('Municipal Hospital','PHC','CHC','Dispensary','Private','Specialty Center') NOT NULL,
    zone_id         INT UNSIGNED NOT NULL,
    bed_capacity    INT UNSIGNED DEFAULT 100,
    address         TEXT,
    phone           VARCHAR(20),
    email           VARCHAR(150),
    latitude        DECIMAL(9,6),
    longitude       DECIMAL(9,6),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (zone_id) REFERENCES zones(zone_id),
    INDEX idx_facility_zone (zone_id),
    INDEX idx_facility_type (facility_type)
) ENGINE=InnoDB;

-- ============================================================
-- 4. CARE PROVIDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS care_providers (
    provider_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    specialization  VARCHAR(150),
    facility_id     INT UNSIGNED NOT NULL,
    phone           VARCHAR(20),
    email           VARCHAR(150),
    is_active       TINYINT(1) DEFAULT 1,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (facility_id) REFERENCES facilities(facility_id),
    INDEX idx_provider_facility (facility_id)
) ENGINE=InnoDB;

-- ============================================================
-- 5. PATIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
    patient_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_code    VARCHAR(20) NOT NULL UNIQUE,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    age             TINYINT UNSIGNED,
    gender          ENUM('Male','Female','Other') NOT NULL,
    blood_group     ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown') DEFAULT 'Unknown',
    disease_id      INT UNSIGNED NOT NULL,
    zone_id         INT UNSIGNED NOT NULL,
    facility_id     INT UNSIGNED NOT NULL,
    provider_id     INT UNSIGNED,
    admission_date  DATE NOT NULL,
    discharge_date  DATE,
    status          ENUM('Admitted','Monitoring','Recovered','Discharged','Deceased') NOT NULL DEFAULT 'Admitted',
    is_death        TINYINT(1) DEFAULT 0,
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (disease_id)  REFERENCES diseases(disease_id),
    FOREIGN KEY (zone_id)     REFERENCES zones(zone_id),
    FOREIGN KEY (facility_id) REFERENCES facilities(facility_id),
    FOREIGN KEY (provider_id) REFERENCES care_providers(provider_id),
    INDEX idx_patient_disease   (disease_id),
    INDEX idx_patient_zone      (zone_id),
    INDEX idx_patient_status    (status),
    INDEX idx_patient_admitted  (admission_date),
    INDEX idx_patient_facility  (facility_id)
) ENGINE=InnoDB;

-- ============================================================
-- 6. HOTSPOTS
-- ============================================================
CREATE TABLE IF NOT EXISTS hotspots (
    hotspot_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hotspot_name    VARCHAR(200) NOT NULL,
    disease_id      INT UNSIGNED NOT NULL,
    zone_id         INT UNSIGNED NOT NULL,
    active_cases    INT UNSIGNED DEFAULT 0,
    severity        ENUM('Low','Medium','High','Critical') DEFAULT 'Medium',
    latitude        DECIMAL(9,6),
    longitude       DECIMAL(9,6),
    description     TEXT,
    reported_date   DATE,
    is_active       TINYINT(1) DEFAULT 1,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (disease_id) REFERENCES diseases(disease_id),
    FOREIGN KEY (zone_id)    REFERENCES zones(zone_id),
    INDEX idx_hotspot_zone    (zone_id),
    INDEX idx_hotspot_disease (disease_id)
) ENGINE=InnoDB;

-- ============================================================
-- 7. SURVEILLANCE REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS surveillance_reports (
    report_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    disease_id      INT UNSIGNED NOT NULL,
    zone_id         INT UNSIGNED NOT NULL,
    report_date     DATE NOT NULL,
    new_cases       INT UNSIGNED DEFAULT 0,
    recovered       INT UNSIGNED DEFAULT 0,
    deaths          INT UNSIGNED DEFAULT 0,
    total_active    INT UNSIGNED DEFAULT 0,
    is_published    TINYINT(1) DEFAULT 0,
    published_by    VARCHAR(150),
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (disease_id) REFERENCES diseases(disease_id),
    FOREIGN KEY (zone_id)    REFERENCES zones(zone_id),
    INDEX idx_surv_date    (report_date),
    INDEX idx_surv_disease (disease_id),
    INDEX idx_surv_zone    (zone_id)
) ENGINE=InnoDB;

-- ============================================================
-- 8. VACCINATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS vaccinations (
    vaccination_id  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_id      INT UNSIGNED NOT NULL,
    vaccine_name    VARCHAR(150) NOT NULL,
    dose_number     TINYINT UNSIGNED DEFAULT 1,
    vaccination_date DATE NOT NULL,
    facility_id     INT UNSIGNED NOT NULL,
    batch_number    VARCHAR(50),
    administered_by VARCHAR(150),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id)  REFERENCES patients(patient_id),
    FOREIGN KEY (facility_id) REFERENCES facilities(facility_id),
    INDEX idx_vacc_patient (patient_id),
    INDEX idx_vacc_date    (vaccination_date)
) ENGINE=InnoDB;

-- ============================================================
-- 9. LAB TESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS lab_tests (
    test_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_id      INT UNSIGNED NOT NULL,
    test_name       VARCHAR(150) NOT NULL,
    test_date       DATE NOT NULL,
    result          ENUM('Positive','Negative','Inconclusive','Pending') DEFAULT 'Pending',
    result_value    VARCHAR(100),
    normal_range    VARCHAR(100),
    facility_id     INT UNSIGNED NOT NULL,
    is_critical     TINYINT(1) DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id)  REFERENCES patients(patient_id),
    FOREIGN KEY (facility_id) REFERENCES facilities(facility_id),
    INDEX idx_lab_patient (patient_id),
    INDEX idx_lab_date    (test_date)
) ENGINE=InnoDB;

-- ============================================================
-- 10. AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
    log_id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    action          VARCHAR(100) NOT NULL,
    table_name      VARCHAR(100),
    record_id       INT UNSIGNED,
    performed_by    VARCHAR(150),
    ip_address      VARCHAR(45),
    details         TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_action (action),
    INDEX idx_audit_time   (created_at)
) ENGINE=InnoDB;
