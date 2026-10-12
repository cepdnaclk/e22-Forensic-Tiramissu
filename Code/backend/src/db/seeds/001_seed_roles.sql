INSERT INTO roles (role_name, description) VALUES
  ('super_admin', 'Full system access, transferable role'),
  ('doctor', 'Examining doctor — case creation, examination, reporting'),
  ('clerk', 'Administrative staff — data entry, document management'),
  ('lab_staff', 'Laboratory and mortuary technicians'),
  ('photographer', 'Crime scene and evidence photographer')
ON CONFLICT (role_name) DO NOTHING;
