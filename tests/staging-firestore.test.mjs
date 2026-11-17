import test from "node:test";
import assert from "node:assert/strict";
import { getStagingFirestoreDatabaseId } from "../api/_lib/staging-firestore.js";

test("allows only a named staging database in Vercel Preview", () => {
  assert.equal(
    getStagingFirestoreDatabaseId({
      VERCEL_ENV: "preview",
      ORIGEN_STAGING_FIRESTORE_DATABASE_ID: "origen-staging"
    }),
    "origen-staging"
  );
});

test("rejects production environment", () => {
  assert.throws(
    () => getStagingFirestoreDatabaseId({
      VERCEL_ENV: "production",
      ORIGEN_STAGING_FIRESTORE_DATABASE_ID: "origen-staging"
    }),
    /Preview environment/
  );
});

test("rejects the default database to prevent Preview writes into production data", () => {
  assert.throws(
    () => getStagingFirestoreDatabaseId({
      VERCEL_ENV: "preview",
      ORIGEN_STAGING_FIRESTORE_DATABASE_ID: "(default)"
    }),
    /separate named Firestore database/
  );
});

test("rejects missing or invalid database IDs", () => {
  assert.throws(
    () => getStagingFirestoreDatabaseId({ VERCEL_ENV: "preview" }),
    /separate named Firestore database/
  );
  assert.throws(
    () => getStagingFirestoreDatabaseId({
      VERCEL_ENV: "preview",
      ORIGEN_STAGING_FIRESTORE_DATABASE_ID: "Prod_Database"
    }),
    /invalid/
  );
});
