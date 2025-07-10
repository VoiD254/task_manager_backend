import fs from 'fs';
import path from 'path';
import pool from "../src/dependency/pg";

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`🗂️  Found ${files.length} migration file(s).`);

  try {
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      console.log(`⚙️  Running migration: ${file}`);
      await pool.query(sql);
      console.log(`✅ Success: ${file}`);
    }

    console.log('🎉 All migrations completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error(`❌ Migration failed:`, err);
    process.exit(1); // exit with failure
  } finally {
    await pool.end();
    console.log('🔌 Connection closed.');
  }
}

runMigrations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Migration script crashed:', err);
    process.exit(1);
  }
);
