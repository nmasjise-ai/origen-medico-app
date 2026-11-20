import test from "node:test";
import assert from "node:assert/strict";
import { createPatientProfileHandler } from "../api/_handlers/patient-profile.js";

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

function makeDatabase({ users, patients, measurements = {} }) {
  const requestedPatientIds = [];
  let measurementReads = 0;
  const db = {};
  const usersCollection = {
    doc(uid) {
      return {
        async get() {
          const data = users[uid];
          return {
            exists: Boolean(data),
            data: () => data
          };
        }
      };
    }
  };
  const patientsCollection = {
    doc(patientId) {
      requestedPatientIds.push(patientId);
      return {
        async get() {
          const data = patients[patientId];
          return {
            id: patientId,
            exists: Boolean(data),
            data: () => data
          };
        },
        collection(name) {
          if (name === "dailyLogs") {
            return {
              where(field, operator, value) {
                assert.equal(field, "dateKey");
                assert.ok([">=", "<="].includes(operator));
                assert.match(value, /^\d{4}-\d{2}-\d{2}$/);
                return {
                  where(nextField, nextOperator, nextValue) {
                    assert.equal(nextField, "dateKey");
                    assert.ok([">=", "<="].includes(nextOperator));
                    assert.match(nextValue, /^\d{4}-\d{2}-\d{2}$/);
                    return {
                      orderBy(orderField, direction) {
                        assert.equal(orderField, "dateKey");
                        assert.equal(direction, "asc");
                        return { async get() { return { docs: [] }; } };
                      }
                    };
                  }
                };
              },
              doc(logId) {
                return {
                  async get() {
                    return { id: logId, exists: false, data: () => undefined };
                  }
                };
              }
            };
          }
          assert.equal(name, "measurements");
          return {
            orderBy(field, direction) {
              assert.equal(field, "recordedAt");
              assert.equal(direction, "desc");
              return {
                limit(count) {
                  assert.equal(count, 30);
                  return {
                    async get() {
                      measurementReads += 1;
                      return {
                        docs: (measurements[patientId] || []).map((item, index) => ({
                          id: item.id || `measurement-${index + 1}`,
                          data: () => item
                        }))
                      };
                    }
                  };
                }
              };
            }
          };
        }
      };
    }
  };
  return {
    db,
    requestedPatientIds,
    getMeasurementReads: () => measurementReads,
    getPreviewUsersCollection: () => usersCollection,
    getPreviewPatientsCollection: () => patientsCollection
  };
}

function dependenciesFor(uid, database) {
  return {
    verifyRequestUser: async () => ({
      uid,
      admin: false,
      email_verified: true
    }),
    getAdminFirestore: () => database.db,
    getPreviewUsersCollection: database.getPreviewUsersCollection,
    getPreviewPatientsCollection: database.getPreviewPatientsCollection
  };
}

test("patient A receives only the profile mapped to A; a supplied patientId is ignored", async () => {
  const database = makeDatabase({
    users: {
      uid_AAAAAAAA: { uid: "uid_AAAAAAAA", role: "patient", patientId: "patient_AAAAA" },
      uid_BBBBBBBB: { uid: "uid_BBBBBBBB", role: "patient", patientId: "patient_BBBBB" }
    },
    patients: {
      patient_AAAAA: {
        displayName: "Paciente A",
        linkedUid: "uid_AAAAAAAA",
        accountStatus: "linked",
        heightCm: 170
      },
      patient_BBBBB: {
        displayName: "Paciente B",
        linkedUid: "uid_BBBBBBBB",
        accountStatus: "linked",
        heightCm: 160
      }
    }
  });

  const handler = createPatientProfileHandler(dependenciesFor("uid_AAAAAAAA", database));
  const req = { method: "GET", query: { patientId: "patient_BBBBB" } };
  const res = responseRecorder();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.patient.displayName, "Paciente A");
  assert.equal(res.body.patient.id, "patient_AAAAA");
  assert.deepEqual(database.requestedPatientIds, ["patient_AAAAA"]);
});

test("patient A is denied if the account mapping points to patient B", async () => {
  const database = makeDatabase({
    users: {
      uid_AAAAAAAA: { uid: "uid_AAAAAAAA", role: "patient", patientId: "patient_BBBBB" }
    },
    patients: {
      patient_BBBBB: {
        displayName: "Paciente B",
        linkedUid: "uid_BBBBBBBB",
        accountStatus: "linked"
      }
    }
  });

  const handler = createPatientProfileHandler(dependenciesFor("uid_AAAAAAAA", database));
  const res = responseRecorder();

  await handler({ method: "GET" }, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, {
    error: "No se encontró un expediente vinculado a esta cuenta."
  });
});

test("suspended linked patients cannot read their profile or measurements", async () => {
  const database = makeDatabase({
    users: {
      uid_AAAAAAAA: {
        uid: "uid_AAAAAAAA",
        role: "patient",
        patientId: "patient_AAAAA",
        portalAccessStatus: "suspended"
      }
    },
    patients: {
      patient_AAAAA: {
        displayName: "Paciente A",
        linkedUid: "uid_AAAAAAAA",
        accountStatus: "linked"
      }
    }
  });

  const handler = createPatientProfileHandler(dependenciesFor("uid_AAAAAAAA", database));
  const res = responseRecorder();

  await handler({ method: "GET" }, res);

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.accessSuspended, true);
  assert.deepEqual(database.requestedPatientIds, ["patient_AAAAA"]);
});

test("unverified users and administrators cannot use the patient profile endpoint", async () => {
  for (const decoded of [
    { uid: "uid_AAAAAAAA", admin: false, email_verified: false },
    { uid: "uid_ADMINAAA", admin: true, email_verified: true }
  ]) {
    const handler = createPatientProfileHandler({
      verifyRequestUser: async () => decoded,
      getAdminFirestore: () => { throw new Error("database must not be accessed"); }
    });
    const res = responseRecorder();

    await handler({ method: "GET" }, res);

    assert.equal(res.statusCode, 403);
    assert.equal(res.headers["Cache-Control"], "no-store");
  }
});

test("patient profile endpoint rejects methods other than GET and POST", async () => {
  const handler = createPatientProfileHandler({
    verifyRequestUser: async () => { throw new Error("must not authenticate"); }
  });
  const res = responseRecorder();

  await handler({ method: "PATCH" }, res);

  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, "GET, POST");
});


test("an already-open patient portal is denied on its next profile request after suspension", async () => {
  const userA = {
    uid: "uid_AAAAAAAA",
    role: "patient",
    patientId: "patient_AAAAA"
  };
  const database = makeDatabase({
    users: { uid_AAAAAAAA: userA },
    patients: {
      patient_AAAAA: {
        displayName: "Paciente A",
        linkedUid: "uid_AAAAAAAA",
        accountStatus: "linked"
      }
    },
    measurements: {
      patient_AAAAA: [{ weightKg: 81, recordedAt: new Date("2026-11-19T10:00:00.000Z") }]
    }
  });
  const handler = createPatientProfileHandler(dependenciesFor("uid_AAAAAAAA", database));

  const firstResponse = responseRecorder();
  await handler({ method: "GET" }, firstResponse);
  assert.equal(firstResponse.statusCode, 200);
  assert.equal(database.getMeasurementReads(), 1);

  // Simulate an administrator suspending access while the same authenticated
  // browser session remains open. The next protected API request must re-check
  // the current Firestore access state rather than trusting the earlier response.
  userA.portalAccessStatus = "suspended";

  const nextResponse = responseRecorder();
  await handler({ method: "GET" }, nextResponse);

  assert.equal(nextResponse.statusCode, 403);
  assert.equal(nextResponse.body.accessSuspended, true);
  assert.equal("patient" in nextResponse.body, false);
  assert.equal(database.getMeasurementReads(), 1);
  assert.deepEqual(database.requestedPatientIds, ["patient_AAAAA", "patient_AAAAA"]);
});
