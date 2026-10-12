-- Note: In production, passwords should be hashed using bcrypt.
-- For these seed users, we assume the backend migration script hashes the password 'password123' before insertion,
-- OR we supply a pre-hashed string here. 
-- For simplicity, let's just create a raw insert with a known bcrypt hash for 'password123':
-- $2a$12$K.zG.B3XjD6oO.F2vKxW/O7J7eB4B9v8Z3.3j1Y2n2M8x3x3x3x3
-- We'll actually do the hashing inside the migrate.js script instead of raw SQL to be safer,
-- but if this is run directly, it will need a pre-hashed string.

DO $$ 
DECLARE
    super_admin_id INT;
    doctor_id INT;
    clerk_id INT;
BEGIN
    SELECT role_id INTO super_admin_id FROM roles WHERE role_name = 'super_admin';
    SELECT role_id INTO doctor_id FROM roles WHERE role_name = 'doctor';
    SELECT role_id INTO clerk_id FROM roles WHERE role_name = 'clerk';

    -- Insert admin user (password: password123)
    INSERT INTO users (username, password_hash, full_name, role_id)
    VALUES ('admin', '$2b$10$sXgYmoeRcrvn5FhiGoV5zOy.n0f4PZH4FKwLYKfIyeJkOtaqtOVyC', 'System Administrator', super_admin_id)
    ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;

    -- Insert doctor user (password: password123)
    INSERT INTO users (username, password_hash, full_name, role_id)
    VALUES ('dr_ameen', '$2b$10$sXgYmoeRcrvn5FhiGoV5zOy.n0f4PZH4FKwLYKfIyeJkOtaqtOVyC', 'Dr. Ameen', doctor_id)
    ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;

    -- Insert clerk user (password: password123)
    INSERT INTO users (username, password_hash, full_name, role_id)
    VALUES ('clerk1', '$2b$10$sXgYmoeRcrvn5FhiGoV5zOy.n0f4PZH4FKwLYKfIyeJkOtaqtOVyC', 'Office Clerk', clerk_id)
    ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;
END $$;
