import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore, verifyRequestUser } from "../_lib/firebase-admin.js";
import {
  getPreviewPatientsCollection,
  getPreviewUsersCollection
} from "../_lib/staging-firestore.js";
import {
  getLinkedPatientId,
  isPatientRecordLinkedToUser
} from "../_lib/patient-session-authorization.js";
import { getPatientPortalAccessState } from "../_lib/patient-portal-access.js";

export function createPatientSessionHandler(dependencies = {}) {
  const verifyUser = dependencies.verifyRequestUser || verifyRequestUser;
  const getFirestore = dependencies.getAdminFirestore || getAdminFirestore;
  const getUsersCollection = dependencies.getPreviewUsersCollection || getPreviewUsersCollection;
  const getPatientsCollection = dependencies.getPreviewPatientsCollection || getPreviewPatientsCollection;
  const serverTimestamp = dependencies.serverTimestamp || (() => FieldValue.serverTimestamp());

  return async function patientSessionHandler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method not allowed." });
    }

    try {
      const decoded = await verifyUser(req);
      if (decoded.admin === true || decoded.email_verified !== true) {
        return res.status(403).json({ error: "Se requiere una cuenta de paciente con correo verificado." });
      }

      const db = getFirestore();
      const users = getUsersCollection(db);
      const userRef = users.doc(decoded.uid);
      const userSnapshot = await userRef.get();

      if (!userSnapshot.exists) {
        return res.status(404).json({ linked: false, error: "Esta cuenta todavía no está vinculada a un expediente." });
      }

      const userData = userSnapshot.data();
      const patientId = getLinkedPatientId(userData, decoded.uid);
      if (!patientId) {
        return res.status(404).json({ linked: false, error: "Esta cuenta todavía no está vinculada a un expediente." });
      }

      const patientSnapshot = await getPatientsCollection(db).doc(patientId).get();
      if (!patientSnapshot.exists) {
        return res.status(404).json({ linked: false, error: "No se encontró un expediente vinculado a esta cuenta." });
      }

      const patientData = patientSnapshot.data();
      if (!isPatientRecordLinkedToUser(patientData, decoded.uid)) {
        return res.status(404).json({ linked: false, error: "No se encontró un expediente vinculado a esta cuenta." });
      }

      const access = getPatientPortalAccessState(userData, patientData);
      if (!access.enabled) {
        return res.status(403).json({
          accessSuspended: true,
          error: "El acceso al portal está temporalmente suspendido. Contacta al consultorio para recibir asistencia."
        });
      }

      // Store access metadata only on the authenticated user's mapping.
      // Never store passwords, tokens, IP addresses, or clinical details here.
      await userRef.update({
        lastAccessAt: serverTimestamp(),
        lastAccessSource: "patient_portal"
      });

      return res.status(200).json({
        linked: true,
        patient: {
          id: patientSnapshot.id,
          displayName: patientData.displayName || "",
          email: patientData.email || decoded.email,
          ageYears: patientData.ageYears ?? null,
          status: patientData.status || "active"
        }
      });
    } catch (error) {
      const status = error.statusCode || 500;
      console.error("Patient session lookup failed:", error?.name || "Error", error?.code || "");
      return res.status(status).json({
        error: status >= 500 ? "No se pudo consultar la cuenta de paciente." : error.message
      });
    }
  };
}

export default createPatientSessionHandler();
