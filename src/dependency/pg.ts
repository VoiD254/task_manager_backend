import { Pool } from "pg";
import configuration from "../../configuration";

const isProduction = configuration.NODE_ENV === "production";

const pool = new Pool({
  connectionString: configuration.DATABASE_URL,
  ssl: isProduction
    ? { rejectUnauthorized: false } // Neon requires SSL
    : false,
});

export default pool;
