import test from "node:test";
import assert from "node:assert/strict";
import {
  getPreviewDataNamespace,
  getPreviewPatientsCollection,
  getPreviewInvitationsCollection,
  getPreviewUsersCollection
} from "../api/_lib/staging-firestore.js";

const validPreview = {
  VERCEL_ENV: "preview",
  ORIGEN_PREVIEW_DATA_NAMESPACE: "previewEnvironments/mejoras-seguridad-origen"
};

test("allows the explicit isolated namespace only in Vercel Preview", () => {
  assert.equal(
    getPreviewDataNamespace(validPreview),
    "previewEnvironments/mejoras-seguridad-origen"
  );
});

test("rejects production and development deployments", () => {
  assert.throws(
    () => getPreviewDataNamespace({ ...validPreview, VERCEL_ENV: "production" }),
    /Vercel Preview/
  );
  assert.throws(
    () => getPreviewDataNamespace({ ...validPreview, VERCEL_ENV: "development" }),
    /Vercel Preview/
  );
});

test("rejects a missing or unexpected namespace", () => {
  assert.throws(
    () => getPreviewDataNamespace({ VERCEL_ENV: "preview" }),
    /namespace is not configured/
  );
  assert.throws(
    () => getPreviewDataNamespace({
      VERCEL_ENV: "preview",
      ORIGEN_PREVIEW_DATA_NAMESPACE: "patients"
    }),
    /namespace is not configured/
  );
});

test("builds the dedicated nested patients collection path", () => {
  const calls = [];
  const collection = (name) => {
    calls.push(["collection", name]);
    return {
      doc: (id) => {
        calls.push(["doc", id]);
        return {
          collection: (subcollection) => {
            calls.push(["subcollection", subcollection]);
            return { marker: "preview-patients-collection" };
          }
        };
      }
    };
  };

  const result = getPreviewPatientsCollection({ collection }, validPreview);

  assert.equal(result.marker, "preview-patients-collection");
  assert.deepEqual(calls, [
    ["collection", "previewEnvironments"],
    ["doc", "mejoras-seguridad-origen"],
    ["subcollection", "patients"]
  ]);
});


test("builds isolated invitation and user mapping collections in Preview", () => {
  const calls = [];
  const collection = (name) => {
    calls.push(["collection", name]);
    return {
      doc: (id) => {
        calls.push(["doc", id]);
        return {
          collection: (subcollection) => {
            calls.push(["subcollection", subcollection]);
            return { marker: subcollection };
          }
        };
      }
    };
  };

  const db = { collection };
  assert.equal(getPreviewInvitationsCollection(db, validPreview).marker, "invitations");
  assert.equal(getPreviewUsersCollection(db, validPreview).marker, "users");
  assert.deepEqual(calls, [
    ["collection", "previewEnvironments"],
    ["doc", "mejoras-seguridad-origen"],
    ["subcollection", "invitations"],
    ["collection", "previewEnvironments"],
    ["doc", "mejoras-seguridad-origen"],
    ["subcollection", "users"]
  ]);
});

test("invitation and mapping namespaces reject Production", () => {
  const db = { collection: () => { throw new Error("must not access database"); } };
  const production = { ...validPreview, VERCEL_ENV: "production" };
  assert.throws(() => getPreviewInvitationsCollection(db, production), /Vercel Preview/);
  assert.throws(() => getPreviewUsersCollection(db, production), /Vercel Preview/);
});
