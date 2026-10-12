-- Clear previous test data to prevent duplicates
TRUNCATE TABLE body_releases, autopsy_cases, clinical_cases, patients RESTART IDENTITY CASCADE;

-- Seed Patients
INSERT INTO patients (full_name, nic, sex, address, age_years, contact_no, religion)
VALUES 
('John Doe', '199012345V', 'Male', '123 Main St, Kandy', 35, '0771234567', 'Christianity'),
('Jane Smith', '198598765V', 'Female', '456 Oak Rd, Colombo', 40, '0719876543', 'Buddhism'),
('Ahmed Ali', '197045612X', 'Male', '789 Pine Ln, Galle', 55, '0754561234', 'Islam');

-- Seed Clinical Cases
INSERT INTO clinical_cases (patient_id, examining_doctor_id, patient_type, case_status, cme_no, examined_date, created_by)
VALUES
(1, 2, 'Outpatient', 'Open', 'CME/2026.01/01', '2026-07-22', 2),
(2, 2, 'Inward', 'Report Generated', 'CME/2026.01/02', '2026-07-22', 2);

-- Seed Autopsy Cases
INSERT INTO autopsy_cases (patient_id, examining_doctor_id, morgue_no, verdict, case_status, pm_no, pm_date, created_by)
VALUES
(3, 2, 'MORGUE-901', 'Natural', 'Closed', '1/07.1 PM dr_ameen', '2026-07-20', 2);

-- Add Body Release for Autopsy
INSERT INTO body_releases (case_id, nok_name, nok_relationship, release_date)
VALUES
(1, 'Fatima Ali', 'Wife', '2026-07-21');
