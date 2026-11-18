import { getAdminFirestore, verifyRequestUser } from "../_lib/firebase-admin.js";
import {
  getPreviewPatientsCollection,
  getPreviewUsersCollection
} from "../_lib/staging-firestore.js";
import {
  getLinkedPatientId,
  isPatientRecordLinkedToUser
} from "../_lib/patient-session-authorization.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const decoded = await verifyRequestUser(req);
    if (decoded.admin === true || decoded.email_verified !== true) {
      return res.status(403).json({ error: "Se requiere una cuenta de paciente con correo verificado." });
    }

    const db = getAdminFirestore();
    const users = getPreviewUsersCollection(db);
    const userSnapshot = await users.doc(decoded.uid).get();

    if (!userSnapshot.exists) {
      return res.status(404).json({ linked: false, error: "Esta cuenta todavía no está vinculada a un expediente." });
    }

    const patientId = getLinkedPatientId(userSnapshot.data(), decoded.uid);
    if (!patientId) {
      return res.status(404).json({ linked: false, error: "Esta cuenta todavía no está vinculada a un expediente." });
    }

    const patientSnapshot = await getPreviewPatientsCollection(db).doc(patientId).get();

    if (
      !patientSnapshot.exists ||
      !isPatientRecordLinkedToUser(patientSnapshot.data(), decoded.uid)
    ) {
      return res.status(404).json({ linked: false, error: "No se encontró un expediente vinculado a esta cuenta." });
    }

    const patient = patientSnapshot.data();
    return res.status(200).json({
      linked: true,
      patient: {
        id: patientSnapshot.id,
        displayName: patient.displayName || "",
        email: patient.email || decoded.email,
        ageYears: patient.ageYears ?? null,
        status: patient.status || "active"
      }
    });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("Patient session lookup failed:", error?.name || "Error", error?.code || "");
    return res.status(status).json({
      error: status >= 500
        ? "No se pudo consultar la cuenta de paciente."
        : error.message
    });
  }
}
