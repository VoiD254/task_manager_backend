CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW (),
  updated_at TIMESTAMPTZ DEFAULT NOW ()
);

CREATE TABLE IF NOT EXISTS tasks (
  task_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  title VARCHAR(60) NOT NULL,
  task_description VARCHAR(200),
  task_date_time TIMESTAMPTZ NOT NULL, 
  notes VARCHAR(200),
  is_completed BOOLEAN DEFAULT FALSE,
  is_synced BOOLEAN DEFAULT FALSE,
  is_marked_for_deletion BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW (),
  updated_at TIMESTAMPTZ DEFAULT NOW ()
);
