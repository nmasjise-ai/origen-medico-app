import test from "node:test";
import assert from "node:assert/strict";
import { createPatientProfileHandler } from "../api/_handlers/patient-profile.js";

function makeResponse() {
  return {
    headers: {}, statusCode: 200, body: undefined,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

function makeHarness({ userData, patientData, decoded, now } = {}) {
  const store = new Map();
  const uid = "patient-a-uid";
  const patientId = "patient-a-qa";
  const resolvedUser = userData ?? { uid, role: "patient", patientId };
  const resolvedPatient = patientData ?? {
    displayName: "Paciente A", linkedUid: uid, accountStatus: "linked", heightCm: 170
  };
  const resolvedDecoded = decoded ?? { uid, email_verified: true };
  const handler = createPatientProfileHandler({
    verifyRequestUser: async () => resolvedDecoded,
    getAdminFirestore: () => ({}),
    now: now || (() => new Date("2026-11-19T12:00:00.000Z")),
    serverTimestamp: () => new Date("2026-11-19T12:00:00.000Z"),
    getPreviewUsersCollection: () => ({
      doc: () => ({ get: async () => ({ exists: Boolean(resolvedUser), data: () => resolvedUser }) })
    }),
    getPreviewPatientsCollection: () => ({
      doc: () => ({
        get: async () => ({ exists: Boolean(resolvedPatient), id: patientId, data: () => resolvedPatient }),
        collection: (name) => {
          if (name === "measurements") return {
            orderBy: () => ({ limit: () => ({ get: async () => ({ docs: [] }) }) })
          };
          if (name === "dailyLogs") return {
            where: () => ({
              where: () => ({
                orderBy: () => ({
                  get: async () => ({
                    docs: [...store.entries()].map(([id, value]) => ({ id, data: () => value }))
                  })
                })
              })
            }),
            doc: (id) => ({
              get: async () => {
                const value = store.get(id);
                return { exists: Boolean(value), id, data: () => value };
              },
              create: async (value) => {
                if (store.has(id)) {
                  const error = new Error("Already exists");
                  error.code = 6;
                  throw error;
                }
                store.set(id, value);
              }
            })
          };
          throw new Error("Unexpected collection");
        }
      })
    })
  });
  return { handler, store };
}

const validBody = {
  waterMl: 2100,
  proteinGrams: 85,
  activityMinutes: 30,
  activityDone: true,
  activityType: "Caminata",
  meals: { breakfast: true, lunch: true, dinner: false, snacks: true }
};

test("patient can create one validated daily log for the Bolivia calendar date", async () => {
  const { handler, store } = makeHarness();
  const res = makeResponse();

  await handler({ method: "POST", body: validBody }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.saved, true);
  assert.equal(res.body.dailyLog.dateKey, "2026-11-19");
  assert.equal(store.size, 1);
  assert.equal(store.get("2026-11-19").electrolytesTaken, false);
  assert.equal(store.get("2026-11-19").activityDone, true);
  assert.equal(store.get("2026-11-19").activityType, "Caminata");
});

test("patient cannot overwrite a daily log already submitted for the day", async () => {
  const { handler } = makeHarness();
  const first = makeResponse();
  const second = makeResponse();

  await handler({ method: "POST", body: validBody }, first);
  await handler({ method: "POST", body: { ...validBody, waterMl: 2500 } }, second);

  assert.equal(first.statusCode, 201);
  assert.equal(second.statusCode, 409);
});

test("daily log API rejects invalid values, meal fields and extra data", async () => {
  const cases = [
    { ...validBody, waterMl: 7001 },
    { ...validBody, proteinGrams: -1 },
    { ...validBody, activityMinutes: 1441 },
    { ...validBody, activityDone: "yes" },
    { ...validBody, activityType: "actividad no permitida" },
    { ...validBody, activityDone: true, activityMinutes: 0 },
    { ...validBody, meals: { breakfast: true, lunch: true, dinner: "yes" } },
    { ...validBody, patientId: "patient-b" }
  ];

  for (const body of cases) {
    const { handler } = makeHarness();
    const res = makeResponse();
    await handler({ method: "POST", body }, res);
    assert.equal(res.statusCode, 400);
  }
});

test("daily log API denies suspended and mismatched patient accounts", async () => {
  const suspended = makeHarness({
    patientData: {
      displayName: "Paciente A", linkedUid: "patient-a-uid",
      accountStatus: "linked", portalAccessStatus: "suspended"
    }
  });
  const suspendedResponse = makeResponse();
  await suspended.handler({ method: "POST", body: validBody }, suspendedResponse);
  assert.equal(suspendedResponse.statusCode, 403);

  const mismatched = makeHarness({
    patientData: {
      displayName: "Paciente A", linkedUid: "another-uid", accountStatus: "linked"
    }
  });
  const mismatchResponse = makeResponse();
  await mismatched.handler({ method: "POST", body: validBody }, mismatchResponse);
  assert.equal(mismatchResponse.statusCode, 404);
});

test("patient profile returns today's daily log without internal metadata", async () => {
  const { handler, store } = makeHarness();
  store.set("2026-11-19", {
    dateKey: "2026-11-19", proteinGrams: 85, waterMl: 2100,
    meals: validBody.meals, activityMinutes: 30,
    activityDone: true, activityType: "Caminata",
    createdAt: new Date(), internalAudit: "private"
  });
  const res = makeResponse();

  await handler({ method: "GET" }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.dailyLog.dateKey, "2026-11-19");
  assert.equal("internalAudit" in res.body.dailyLog, false);
  assert.equal(res.body.dailyLog.activityDone, true);
  assert.equal(res.body.dailyLog.activityType, "Caminata");
  assert.deepEqual(res.body.activityHistory, [{ dateKey: "2026-11-19", activityMinutes: 30, activityDone: true, activityType: "Caminata", waterMl: 2100, proteinGrams: 85, meals: { breakfast: true, lunch: true, dinner: false, snacks: true } }]);
});

test("daily log API rejects administrator and unverified identities", async () => {
  const cases = [
    { decoded: { uid: "patient-a-uid", admin: true, email_verified: true } },
    { decoded: { uid: "patient-a-uid", email_verified: false } }
  ];

  for (const options of cases) {
    const { handler } = makeHarness(options);
    const res = makeResponse();
    await handler({ method: "POST", body: validBody }, res);
    assert.equal(res.statusCode, 403);
  }
});

test("daily log API rejects a user mapping that does not belong to the authenticated UID", async () => {
  const { handler, store } = makeHarness({
    userData: { uid: "patient-b-uid", role: "patient", patientId: "patient-b-qa" }
  });
  const res = makeResponse();

  await handler({ method: "POST", body: validBody }, res);

  assert.equal(res.statusCode, 404);
  assert.equal(store.size, 0);
});


test("daily log date key follows Bolivia local time across UTC midnight", async () => {
  const { handler, store } = makeHarness({
    now: () => new Date("2026-11-20T02:30:00.000Z")
  });
  const res = makeResponse();

  await handler({ method: "POST", body: validBody }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.dailyLog.dateKey, "2026-11-19");
  assert.equal(store.has("2026-11-19"), true);
  assert.equal(store.has("2026-11-20"), false);
});

test("daily log endpoint rejects unsupported HTTP methods", async () => {
  const { handler } = makeHarness();
  const res = makeResponse();

  await handler({ method: "DELETE" }, res);

  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, "GET, POST");
});
