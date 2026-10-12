CREATE TABLE IF NOT EXISTS audit_log (
    log_id BIGSERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'READ', 'UPDATE', 'DELETE')),
    table_name VARCHAR(50) NOT NULL,
    record_id INT,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    notif_id BIGSERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    case_type VARCHAR(10) CHECK (case_type IN ('clinical','autopsy')),
    case_id INT,
    notif_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS case_tags (
    tag_id SERIAL PRIMARY KEY,
    case_type VARCHAR(10) NOT NULL CHECK (case_type IN ('clinical','autopsy')),
    case_id INT NOT NULL,
    tag VARCHAR(50) NOT NULL,
    UNIQUE(case_type, case_id, tag)
);

CREATE TABLE IF NOT EXISTS contact_log (
    log_id SERIAL PRIMARY KEY,
    case_type VARCHAR(10) NOT NULL CHECK (case_type IN ('clinical','autopsy')),
    case_id INT NOT NULL,
    contact_person VARCHAR(100),
    contact_no VARCHAR(20),
    reference VARCHAR(100),
    contents TEXT,
    actions TEXT,
    logged_by INT REFERENCES users(user_id),
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claims (
    claim_id SERIAL PRIMARY KEY,
    case_type VARCHAR(10) NOT NULL CHECK (case_type IN ('clinical','autopsy')),
    case_id INT NOT NULL,
    court_id INT REFERENCES courts(court_id),
    claim_type VARCHAR(50),
    amount DECIMAL(10,2),
    sent_on DATE,
    received_on DATE,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Received', 'Paid')),
    voucher_no VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS court_summons (
    summons_id SERIAL PRIMARY KEY,
    case_type VARCHAR(10) NOT NULL CHECK (case_type IN ('clinical','autopsy')),
    case_id INT NOT NULL,
    court_id INT REFERENCES courts(court_id),
    summons_date DATE,
    summons_no VARCHAR(50),
    received_on DATE,
    document_id INT REFERENCES documents(document_id),
    summoned_doctor_id INT REFERENCES users(user_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS photos (
    photo_id SERIAL PRIMARY KEY,
    case_type VARCHAR(10) NOT NULL CHECK (case_type IN ('clinical','autopsy')),
    case_id INT NOT NULL,
    photo_category VARCHAR(30),
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    taken_at TIMESTAMPTZ,
    annotation TEXT,
    uploaded_by INT NOT NULL REFERENCES users(user_id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_locked BOOLEAN NOT NULL DEFAULT FALSE
);
