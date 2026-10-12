CREATE TABLE IF NOT EXISTS patients (
    patient_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    nic VARCHAR(20) UNIQUE,
    passport_no VARCHAR(30),
    address TEXT,
    sex VARCHAR(10) CHECK (sex IN ('Male','Female','Other','Unknown')),
    age_years SMALLINT CHECK (age_years >= 0),
    age_months SMALLINT CHECK (age_months BETWEEN 0 AND 11),
    age_days SMALLINT CHECK (age_days BETWEEN 0 AND 30),
    contact_no VARCHAR(20),
    religion VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
