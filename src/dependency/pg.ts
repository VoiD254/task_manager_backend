import { Pool } from "pg";
import configuration from "../../configuration";

const pool = new Pool({
  connectionString: configuration.DATABASE_URL,
});

export default pool;
