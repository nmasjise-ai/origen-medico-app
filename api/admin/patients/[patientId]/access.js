import { isVerifiedAdministrator } from "../../../_lib/admin-authorization.js";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore, verifyRequestUser } from "../../../_lib/firebase-admin.js";
import { getPreviewPatientsCollection, getPreviewUsersCollection } from "../../../_lib/staging-firestore.js";
import { validatePreviewPatientId } from "../../../_lib/measurement-validation.js";
import { validatePortalAccessChange } from "../../../_lib/patient-portal-access.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const decoded = await verifyRequestUser(req);
    if (!isVerifiedAdministrator(decoded)) {
      return res.status(403).json({ error: "Se requiere una cuenta médica autorizada." });
    }

    const patientId = validatePreviewPatientId(req.query?.patientId);
    const { action, reason } = validatePortalAccessChange(req.body);
    const db = getAdminFirestore();
    const patientRef = getPreviewPatientsCollection(db).doc(patientId);
    const users = getPreviewUsersCollection(db);
    let resultingStatus = action === "suspend" ? "suspended" : "enabled";

    await db.runTransaction(async (transaction) => {
      const patientSnapshot = await transaction.get(patientRef);
      if (!patientSnapshot.exists) {
        const error = new Error("No se encontró el expediente de prueba.");
        error.statusCode = 404;
        throw error;
      }
      const patient = patientSnapshot.data();
      if (patient.accountStatus !== "linked" || !patient.linkedUid) {
        const error = new Error("Solo se puede gestionar el acceso de una cuenta vinculada.");
        error.statusCode = 409;
        throw error;
      }
      const userRef = users.doc(patient.linkedUid);
      const userSnapshot = await transaction.get(userRef);
      if (!userSnapshot.exists || userSnapshot.get("patientId") !== patientId || userSnapshot.get("uid") !== patient.linkedUid) {
        const error = new Error("La vinculación de la cuenta no coincide con el expediente.");
        error.statusCode = 409;
        throw error;
      }

      const now = FieldValue.serverTimestamp();
      const accessFields = action === "suspend"
        ? { portalAccessStatus: "suspended", portalAccessReason: reason, portalAccessChangedAt: now, portalAccessChangedByUid: decoded.uid }
        : { portalAccessStatus: "enabled", portalAccessReason: FieldValue.delete(), portalAccessChangedAt: now, portalAccessChangedByUid: decoded.uid };
      transaction.update(patientRef, { ...accessFields, updatedAt: now });
      transaction.update(userRef, accessFields);
      const auditRef = patientRef.collection("auditLogs").doc();
      transaction.create(auditRef, {
        action: action === "suspend" ? "patient.portal_access_suspended" : "patient.portal_access_reactivated",
        actorUid: decoded.uid,
        occurredAt: now,
        source: "admin_access_api",
        reason: reason || null,
        previousStatus: patient.portalAccessStatus || "enabled",
        newStatus: resultingStatus
      });
    });

    return res.status(200).json({
      patientId,
      portalAccessStatus: resultingStatus,
      message: action === "suspend" ? "Acceso al portal suspendido. El expediente clínico se conserva." : "Acceso al portal rehabilitado."
    });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("Admin patient access update failed:", error?.name || "Error", error?.code || "");
    return res.status(status).json({ error: status >= 500 ? "No se pudo actualizar el acceso del paciente." : error.message });
  }
}
