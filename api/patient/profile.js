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
import {
  toPatientVisibleProfile,
  toPatientVisibleMeasurement
} from "../_lib/patient-portal-data.js";

const MAX_MEASUREMENTS = 30;

export function createPatientProfileHandler(dependencies = {}) {
  const verifyUser = dependencies.verifyRequestUser || verifyRequestUser;
  const getFirestore = dependencies.getAdminFirestore || getAdminFirestore;
  const getUsersCollection = dependencies.getPreviewUsersCollection || getPreviewUsersCollection;
  const getPatientsCollection = dependencies.getPreviewPatientsCollection || getPreviewPatientsCollection;

  return async function patientProfileHandler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method not allowed." });
    }

    try {
      const decoded = await verifyUser(req);
      if (decoded.admin === true || decoded.email_verified !== true) {
        return res.status(403).json({
          error: "Se requiere una cuenta de paciente con correo verificado."
        });
      }

      const db = getFirestore();
      const userSnapshot = await getUsersCollection(db).doc(decoded.uid).get();
      if (!userSnapshot.exists) {
        return res.status(404).json({
          error: "Esta cuenta todavía no está vinculada a un expediente."
        });
      }

      const userData = userSnapshot.data();
      const patientId = getLinkedPatientId(userData, decoded.uid);
      if (!patientId) {
        return res.status(404).json({
          error: "Esta cuenta todavía no está vinculada a un expediente."
        });
      }

      const patientRef = getPatientsCollection(db).doc(patientId);
      const patientSnapshot = await patientRef.get();
      if (!patientSnapshot.exists) {
        return res.status(404).json({
          error: "No se encontró un expediente vinculado a esta cuenta."
        });
      }

      const patientData = patientSnapshot.data();
      if (!isPatientRecordLinkedToUser(patientData, decoded.uid)) {
        return res.status(404).json({
          error: "No se encontró un expediente vinculado a esta cuenta."
        });
      }

      const access = getPatientPortalAccessState(userData, patientData);
      if (!access.enabled) {
        return res.status(403).json({
          accessSuspended: true,
          error: "El acceso al portal está temporalmente suspendido. Contacta al consultorio para recibir asistencia."
        });
      }

      const measurementsSnapshot = await patientRef
        .collection("measurements")
        .orderBy("recordedAt", "desc")
        .limit(MAX_MEASUREMENTS)
        .get();

      return res.status(200).json({
        patient: toPatientVisibleProfile(patientData, patientSnapshot.id),
        measurements: measurementsSnapshot.docs.map((document) =>
          toPatientVisibleMeasurement(document.data(), document.id, patientData.heightCm)
        )
      });
    } catch (error) {
      const status = error.statusCode || 500;
      console.error("Patient profile lookup failed:", error?.name || "Error", error?.code || "");
      return res.status(status).json({
        error: status >= 500
          ? "No se pudo consultar el expediente. Inténtalo más tarde."
          : error.message
      });
    }
  };
}

export default createPatientProfileHandler();
