/** Convex-backed data access layer. */
export type DbMode = "convex";

export function getDbMode(): DbMode {
  return "convex";
}

export function isLocalDatabaseEnabled(): boolean {
  return false;
}

export function prefersPostgresPool(): boolean {
  return false;
}
