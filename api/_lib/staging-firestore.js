export function getStagingFirestoreDatabaseId(env = process.env) {
  if (env.VERCEL_ENV !== "preview") {
    const error = new Error("Patient write operations are restricted to a Vercel Preview environment.");
    error.statusCode = 503;
    throw error;
  }

  const databaseId = String(env.ORIGEN_STAGING_FIRESTORE_DATABASE_ID || "").trim();

  if (!databaseId || databaseId === "(default)") {
    const error = new Error("A separate named Firestore database must be configured for Preview.");
    error.statusCode = 503;
    throw error;
  }

  if (!/^[a-z][a-z0-9-]{2,61}[a-z0-9]$/.test(databaseId)) {
    const error = new Error("The configured Preview Firestore database ID is invalid.");
    error.statusCode = 503;
    throw error;
  }

  return databaseId;
}
