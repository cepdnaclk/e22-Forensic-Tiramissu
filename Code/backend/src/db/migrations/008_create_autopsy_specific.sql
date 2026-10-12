CREATE TABLE IF NOT EXISTS autopsy_examinations (
    exam_id SERIAL PRIMARY KEY,
    autopsy_case_id INT UNIQUE NOT NULL REFERENCES autopsy_cases(case_id),
    external_examination TEXT,
    internal_examination TEXT,
    examination_data TEXT,
    date_of_exam TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS cause_of_death (
    cod_id SERIAL PRIMARY KEY,
    case_id INT UNIQUE NOT NULL REFERENCES autopsy_cases(case_id),
    cod_immediate TEXT,
    cod_1b TEXT,
    cod_1c TEXT,
    cod_1d TEXT,
    cod_2 TEXT,
    maternal_death BOOLEAN DEFAULT FALSE,
    specimens_retained TEXT,
    comments TEXT,
    generated_on TIMESTAMPTZ,
    generated_by INT REFERENCES users(user_id),
    document_id INT REFERENCES documents(document_id),
    is_finalized BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS body_releases (
    release_id SERIAL PRIMARY KEY,
    case_id INT UNIQUE NOT NULL REFERENCES autopsy_cases(case_id),
    nok_name VARCHAR(255),
    nok_relationship VARCHAR(50),
    nok_nic VARCHAR(20),
    nok_contact VARCHAR(20),
    release_date DATE,
    release_time TIME,
    releasing_tech VARCHAR(100),
    dc_no VARCHAR(30),
    cemetery TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
