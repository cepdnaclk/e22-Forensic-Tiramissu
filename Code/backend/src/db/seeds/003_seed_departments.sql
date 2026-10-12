INSERT INTO departments (department_name) VALUES
  ('Psychiatry'), ('Gynecology'), ('ENT'), ('Ophthalmology'),
  ('Orthopedics'), ('Radiology'), ('Pathology'), ('Pediatrics')
ON CONFLICT (department_name) DO NOTHING;
