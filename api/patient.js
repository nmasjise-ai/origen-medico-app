import { createPatientProfileHandler } from "./_handlers/patient-profile.js";
import { createPatientSessionHandler } from "./_handlers/patient-session.js";

export function createPatientApiHandler({
  profileHandler = createPatientProfileHandler(),
  sessionHandler = createPatientSessionHandler()
} = {}) {
  return async function patientApiHandler(req, res) {
    const mode = typeof req.query?.mode === "string" ? req.query.mode : "";
    if (mode === "profile") return profileHandler(req, res);
    if (mode === "session") return sessionHandler(req, res);
    res.setHeader("Cache-Control", "no-store");
    return res.status(404).json({ error: "Patient API route not found." });
  };
}

export default createPatientApiHandler();
