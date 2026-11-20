import test from "node:test";
import assert from "node:assert/strict";
import { createPatientProfileHandler } from "../api/patient/profile.js";

const uidA = "qa-patient-a-uid";
const patientIdA = "patient_qa_a_123";

function makeResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: undefined,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

function makeHandler({
  decoded = { uid: uidA, email_verified: true },
  userData = { uid: uidA, role: "patient", patientId: patientIdA },
  patientData = {
    displayName: "Paciente QA A",
    email: "qa-a@example.test",
    heightCm: 180,
    linkedUid: uidA,
    accountStatus: "linked"
  },
  measurements = [{
    id: "measurement-qa-1",
    data: () => ({
      weightKg: 81,
      waistCm: 92,
      recordedAt: new Date("2026-11-18T10:00:00.000Z"),
      recordedByUid: "private-clinician-uid"
    })
  }]
} = {}) {
  let measurementReads = 0;
  const userSnapshot = {
    exists: Boolean(userData),
    data: () => userData
  };
  const patientSnapshot = {
    exists: Boolean(patientData),
    id: patientIdA,
    data: () => patientData
  };
  const handler = createPatientProfileHandler({
    verifyRequestUser: async () => decoded,
    getAdminFirestore: () => ({}),
    getPreviewUsersCollection: () => ({
      doc: (id) => {
        assert.equal(id, decoded.uid);
        return { get: async () => userSnapshot };
      }
    }),
    getPreviewPatientsCollection: () => ({
      doc: (id) => {
        assert.equal(id, patientIdA);
        return {
          get: async () => patientSnapshot,
          collection: (name) => {
            if (name === "dailyLogs") {
              return {
                doc: () => ({ get: async () => ({ exists: false }) }),
                where: () => ({
                  where: () => ({
                    orderBy: () => ({ get: async () => ({ docs: [] }) })
                  })
                })
              };
            }
            assert.equal(name, "measurements");
            return {
              orderBy: (field, direction) => {
                assert.equal(field, "recordedAt");
                assert.equal(direction, "desc");
                return {
                  limit: (count) => {
                    assert.equal(count, 30);
                    return {
                      get: async () => {
                        measurementReads += 1;
                        return { docs: measurements };
                      }
                    };
                  }
                };
              }
            };
          }
        };
      }
    })
  });
  return { handler, getMeasurementReads: () => measurementReads };
}

test("patient profile rejects an unverified account before reading Firestore", async () => {
  const { handler, getMeasurementReads } = makeHandler({
    decoded: { uid: uidA, email_verified: false }
  });
  const res = makeResponse();

  await handler({ method: "GET" }, res);

  assert.equal(res.statusCode, 403);
  assert.equal(getMeasurementReads(), 0);
  assert.equal(res.headers["Cache-Control"], "no-store");
});

test("patient profile rejects a record linked to a different UID", async () => {
  const { handler, getMeasurementReads } = makeHandler({
    patientData: {
      displayName: "Paciente QA A",
      linkedUid: "different-patient-uid",
      accountStatus: "linked"
    }
  });
  const res = makeResponse();

  await handler({ method: "GET" }, res);

  assert.equal(res.statusCode, 404);
  assert.equal(getMeasurementReads(), 0);
});

test("patient profile blocks a suspended account before reading measurements", async () => {
  const { handler, getMeasurementReads } = makeHandler({
    patientData: {
      displayName: "Paciente QA A",
      linkedUid: uidA,
      accountStatus: "linked",
      portalAccessStatus: "suspended"
    }
  });
  const res = makeResponse();

  await handler({ method: "GET" }, res);

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.accessSuspended, true);
  assert.equal(getMeasurementReads(), 0);
});

test("patient profile returns only allowlisted profile and measurement fields", async () => {
  const { handler, getMeasurementReads } = makeHandler({
    patientData: {
      displayName: "Paciente QA A",
      email: "qa-a@example.test",
      heightCm: 180,
      linkedUid: uidA,
      accountStatus: "linked",
      doctorNotes: "internal-only",
      activeInvitationHash: "secret-hash"
    }
  });
  const res = makeResponse();

  await handler({ method: "GET" }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(getMeasurementReads(), 1);
  assert.equal(res.body.patient.displayName, "Paciente QA A");
  assert.equal("linkedUid" in res.body.patient, false);
  assert.equal("doctorNotes" in res.body.patient, false);
  assert.equal("activeInvitationHash" in res.body.patient, false);
  assert.equal(res.body.measurements[0].bmi, 25);
  assert.equal("recordedByUid" in res.body.measurements[0], false);
});
