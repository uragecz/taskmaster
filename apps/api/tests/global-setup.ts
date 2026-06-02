import { execSync } from "node:child_process";

/** Ensure the dedicated test database exists before any test runs. */
export default function setup(): void {
  const sql =
    "SELECT 1 FROM pg_database WHERE datname='taskmaster_test'";
  const cmd =
    `docker exec taskmaster-postgres psql -U taskmaster -d postgres -tc "${sql}" | grep -q 1 ` +
    `|| docker exec taskmaster-postgres psql -U taskmaster -d postgres -c "CREATE DATABASE taskmaster_test"`;

  try {
    execSync(cmd, { stdio: "ignore" });
  } catch {
    throw new Error(
      "Could not ensure 'taskmaster_test' database. Is the Postgres container running? (docker compose up -d postgres)",
    );
  }
}
