import test from "node:test";
import assert from "node:assert/strict";
import { createPatientApiHandler } from "../api/patient.js";

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

test("patient API dispatcher preserves the profile and session handler contracts", async () => {
  const calls = [];
  const handler = createPatientApiHandler({
    profileHandler: async (req, res) => { calls.push(["profile", req.method]); return res.status(200).json({ route: "profile" }); },
    sessionHandler: async (req, res) => { calls.push(["session", req.method]); return res.status(200).json({ route: "session" }); }
  });

  const profile = responseRecorder();
  await handler({ method: "GET", query: { mode: "profile" } }, profile);
  assert.equal(profile.statusCode, 200);
  assert.deepEqual(profile.body, { route: "profile" });

  const session = responseRecorder();
  await handler({ method: "GET", query: { mode: "session" } }, session);
  assert.equal(session.statusCode, 200);
  assert.deepEqual(session.body, { route: "session" });
  assert.deepEqual(calls, [["profile", "GET"], ["session", "GET"]]);
});

test("patient API dispatcher rejects unknown modes without exposing data", async () => {
  const handler = createPatientApiHandler({
    profileHandler: async () => { throw new Error("must not run"); },
    sessionHandler: async () => { throw new Error("must not run"); }
  });
  const res = responseRecorder();

  await handler({ method: "GET", query: { mode: "admin" } }, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.headers["Cache-Control"], "no-store");
  assert.deepEqual(res.body, { error: "Patient API route not found." });
});
