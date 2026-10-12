INSERT INTO report_types (type_code, type_name, applies_to) VALUES
  ('MLR', 'Medico-Legal Report', 'clinical'),
  ('TOX', 'Toxicology Report', 'both'),
  ('STI', 'STI Report', 'clinical'),
  ('PSYCH', 'Psychiatry Report', 'clinical'),
  ('PMR', 'Post-Mortem Report', 'autopsy'),
  ('COD', 'Cause of Death Form', 'autopsy'),
  ('HISTO', 'Histology Report', 'autopsy'),
  ('MICRO', 'Microbiology Report', 'autopsy')
ON CONFLICT (type_code) DO NOTHING;
