CREATE TABLE IF NOT EXISTS police_stations (
    station_id SERIAL PRIMARY KEY,
    station_name VARCHAR(100) UNIQUE NOT NULL,
    contact_no VARCHAR(20),
    district VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS courts (
    court_id SERIAL PRIMARY KEY,
    court_name VARCHAR(150) NOT NULL,
    court_type VARCHAR(30) CHECK (court_type IN ('Magistrate','District','High','Supreme','Other')),
    location VARCHAR(150)
);

CREATE TABLE IF NOT EXISTS departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS report_types (
    type_id SERIAL PRIMARY KEY,
    type_code VARCHAR(20) UNIQUE NOT NULL,
    type_name VARCHAR(100) NOT NULL,
    applies_to VARCHAR(10) CHECK (applies_to IN ('clinical','autopsy','both'))
);

CREATE TABLE IF NOT EXISTS cod_abbreviations (
    abbr_id SERIAL PRIMARY KEY,
    abbreviation VARCHAR(50) UNIQUE NOT NULL,
    full_text TEXT NOT NULL,
    area VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS cod_rules (
    rule_id SERIAL PRIMARY KEY,
    phrase VARCHAR(255) NOT NULL,
    target_bookmark VARCHAR(50) NOT NULL,
    insert_text TEXT NOT NULL,
    append_mode BOOLEAN NOT NULL DEFAULT TRUE,
    priority SMALLINT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);
