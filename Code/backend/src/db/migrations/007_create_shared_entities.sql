CREATE TABLE IF NOT EXISTS clinical_examinations (
    exam_id SERIAL PRIMARY KEY,
    clinical_case_id INT NOT NULL REFERENCES clinical_cases(case_id),
    exam_findings TEXT,
    nature_of_injury_hurt VARCHAR(255),
    vascular_weapon VARCHAR(255),
    created_date DATE,
    findings TEXT
);

CREATE TABLE IF NOT EXISTS clinical_reviews (
    review_id SERIAL PRIMARY KEY,
    clinical_case_id INT NOT NULL REFERENCES clinical_cases(case_id),
    reviewing_doctor_id INT REFERENCES users(user_id),
    review_date DATE,
    specimen_type VARCHAR(100),
    article_date DATE,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS documents (
    document_id SERIAL PRIMARY KEY,
    case_type VARCHAR(10) NOT NULL CHECK (case_type IN ('clinical','autopsy')),
    case_id INT NOT NULL,
    doc_category VARCHAR(30) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_mime_type VARCHAR(50),
    file_size_bytes BIGINT,
    version SMALLINT NOT NULL DEFAULT 1,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    previous_version_id INT REFERENCES documents(document_id),
    uploaded_by INT NOT NULL REFERENCES users(user_id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_locked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS investigations (
    investigation_id SERIAL PRIMARY KEY,
    case_type VARCHAR(10) NOT NULL CHECK (case_type IN ('clinical','autopsy')),
    case_id INT NOT NULL,
    specimen_type VARCHAR(100) NOT NULL,
    specimen_no SMALLINT,
    ix_no VARCHAR(30),
    ct_no VARCHAR(30),
    date_sampled DATE,
    sent_to VARCHAR(100),
    date_results DATE,
    results TEXT,
    result_document_id INT REFERENCES documents(document_id),
    status VARCHAR(20) NOT NULL DEFAULT 'Ordered' CHECK (status IN ('Ordered', 'To Be Sent', 'Pending', 'Completed', 'Discarded')),
    discarded_on DATE,
    created_by INT NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_locked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS court_records (
    record_id SERIAL PRIMARY KEY,
    case_type VARCHAR(10) NOT NULL CHECK (case_type IN ('clinical','autopsy')),
    case_id INT NOT NULL,
    court_id INT REFERENCES courts(court_id),
    court_name VARCHAR(150),
    case_number VARCHAR(50),
    date_of_court_visit DATE,
    judge_order TEXT,
    codification_cases TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
    report_id SERIAL PRIMARY KEY,
    case_type VARCHAR(10) NOT NULL CHECK (case_type IN ('clinical','autopsy')),
    case_id INT NOT NULL,
    report_type_id INT NOT NULL REFERENCES report_types(type_id),
    generated_on TIMESTAMPTZ,
    generated_by INT REFERENCES users(user_id),
    dispatched_on DATE,
    dispatched_to VARCHAR(100),
    dispatched_via VARCHAR(50),
    certificate_no VARCHAR(50),
    rc_no VARCHAR(50),
    document_id INT REFERENCES documents(document_id),
    is_finalized BOOLEAN NOT NULL DEFAULT FALSE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS referrals (
    referral_id SERIAL PRIMARY KEY,
    case_type VARCHAR(10) NOT NULL CHECK (case_type IN ('clinical','autopsy')),
    case_id INT NOT NULL,
    department_id INT NOT NULL REFERENCES departments(department_id),
    referred_doctor_name VARCHAR(100),
    referral_date DATE NOT NULL,
    referral_document_id INT REFERENCES documents(document_id),
    response_document_id INT REFERENCES documents(document_id),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed')),
    completed_on DATE,
    created_by INT NOT NULL REFERENCES users(user_id),
    is_locked BOOLEAN NOT NULL DEFAULT FALSE
);
