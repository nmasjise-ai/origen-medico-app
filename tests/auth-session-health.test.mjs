import test from "node:test";
import assert from "node:assert/strict";
import { createAuthSessionHandler } from "../api/auth/session.js";

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

test("health mode initializes Firebase Admin without requiring a bearer token", async () => {
  let initialized = false;
  const handler = createAuthSessionHandler({
    getAdminAuth() { initialized = true; return {}; }
  });
  const res = responseRecorder();

  await handler({ method: "GET", query: { mode: "health" }, headers: {} }, res);

  assert.equal(initialized, true);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    ok: true,
    service: "origen-medico-api",
    firebaseAdmin: "ready"
  });
  assert.equal(res.headers["Cache-Control"], "no-store");
});

test("health mode returns a safe 503 when Firebase Admin cannot initialize", async () => {
  const handler = createAuthSessionHandler({
    getAdminAuth() { throw new Error("private credential details"); }
  });
  const res = responseRecorder();

  await handler({ method: "GET", query: { mode: "health" }, headers: {} }, res);

  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.body, {
    ok: false,
    service: "origen-medico-api",
    firebaseAdmin: "not-ready",
    error: "The server could not initialize Firebase Admin. Check the private Preview credential configuration."
  });
  assert.equal(JSON.stringify(res.body).includes("private credential details"), false);
});

test("normal session endpoint still requires and verifies a bearer token", async () => {
  const handler = createAuthSessionHandler({
    verifyRequestUser: async () => ({
      uid: "demo-uid",
      email: "demo@example.test",
      admin: true
    })
  });
  const missingToken = responseRecorder();
  await handler({ method: "GET", query: {}, headers: {} }, missingToken);
  assert.equal(missingToken.statusCode, 401);

  const authenticated = responseRecorder();
  await handler({
    method: "GET",
    query: {},
    headers: { authorization: "Bearer demo-token" }
  }, authenticated);
  assert.equal(authenticated.statusCode, 200);
  assert.deepEqual(authenticated.body, {
    authenticated: true,
    uid: "demo-uid",
    email: "demo@example.test",
    admin: true
  });
});

test("session and health routes reject methods other than GET", async () => {
  const handler = createAuthSessionHandler();
  const res = responseRecorder();

  await handler({ method: "POST", query: { mode: "health" }, headers: {} }, res);

  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, "GET");
});
