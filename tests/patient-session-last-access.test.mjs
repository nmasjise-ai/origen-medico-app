import test from "node:test";
import assert from "node:assert/strict";
import { createPatientSessionHandler } from "../api/patient/session.js";

function responseRecorder() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(name, value) { this.headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

function makeDatabase({ user, patient }) {
  const updates = [];
  const db = {};
  const users = {
    doc(uid) {
      assert.equal(uid, "uid_AAAAAAAA");
      return {
        async get() {
          return { exists: Boolean(user), data: () => user };
        },
        async update(value) { updates.push(value); }
      };
    }
  };
  const patients = {
    doc(id) {
      assert.equal(id, "patient_AAAAA");
      return {
        async get() {
          return { id, exists: Boolean(patient), data: () => patient };
        }
      };
    }
  };
  return {
    db,
    updates,
    getPreviewUsersCollection: () => users,
    getPreviewPatientsCollection: () => patients
  };
}

test("verified linked patient session records last access on its own user mapping", async () => {
  const database = makeDatabase({
    user: { uid: "uid_AAAAAAAA", role: "patient", patientId: "patient_AAAAA" },
    patient: {
      displayName: "Paciente A",
      linkedUid: "uid_AAAAAAAA",
      accountStatus: "linked",
      status: "active"
    }
  });
  const timestamp = { sentinel: "server timestamp" };
  const handler = createPatientSessionHandler({
    verifyRequestUser: async () => ({
      uid: "uid_AAAAAAAA",
      email: "demo.a@example.test",
      email_verified: true,
      admin: false
    }),
    getAdminFirestore: () => database.db,
    getPreviewUsersCollection: database.getPreviewUsersCollection,
    getPreviewPatientsCollection: database.getPreviewPatientsCollection,
    serverTimestamp: () => timestamp
  });
  const res = responseRecorder();

  await handler({ method: "GET" }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.patient.displayName, "Paciente A");
  assert.deepEqual(database.updates, [{
    lastAccessAt: timestamp,
    lastAccessSource: "patient_portal"
  }]);
  assert.equal(res.headers["Cache-Control"], "no-store");
});

test("unlinked, unverified, or mismatched patients do not record last access", async () => {
  const cases = [
    {
      decoded: { uid: "uid_AAAAAAAA", email_verified: false, admin: false },
      user: { uid: "uid_AAAAAAAA", role: "patient", patientId: "patient_AAAAA" },
      patient: { linkedUid: "uid_AAAAAAAA", accountStatus: "linked" },
      expected: 403
    },
    {
      decoded: { uid: "uid_AAAAAAAA", email_verified: true, admin: false },
      user: null,
      patient: null,
      expected: 404
    },
    {
      decoded: { uid: "uid_AAAAAAAA", email_verified: true, admin: false },
      user: { uid: "uid_AAAAAAAA", role: "patient", patientId: "patient_AAAAA" },
      patient: { linkedUid: "uid_BBBBBBBB", accountStatus: "linked" },
      expected: 404
    },
    {
      decoded: { uid: "uid_AAAAAAAA", email_verified: true, admin: false },
      user: {
        uid: "uid_AAAAAAAA",
        role: "patient",
        patientId: "patient_AAAAA",
        portalAccessStatus: "suspended"
      },
      patient: { linkedUid: "uid_AAAAAAAA", accountStatus: "linked" },
      expected: 403
    }
  ];

  for (const item of cases) {
    const database = makeDatabase(item);
    const handler = createPatientSessionHandler({
      verifyRequestUser: async () => item.decoded,
      getAdminFirestore: () => database.db,
      getPreviewUsersCollection: database.getPreviewUsersCollection,
      getPreviewPatientsCollection: database.getPreviewPatientsCollection,
      serverTimestamp: () => ({ sentinel: true })
    });
    const res = responseRecorder();
    await handler({ method: "GET" }, res);
    assert.equal(res.statusCode, item.expected);
    assert.deepEqual(database.updates, []);
  }
});
