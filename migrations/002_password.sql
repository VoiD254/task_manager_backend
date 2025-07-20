DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='password'
  ) THEN
    ALTER TABLE users ADD COLUMN password TEXT NOT NULL;
  END IF;
END;
$$;
