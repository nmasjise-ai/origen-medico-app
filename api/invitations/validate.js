import { getAdminFirestore } from "../_lib/firebase-admin.js";
import {
  getPreviewInvitationsCollection,
  getPreviewPatientsCollection
} from "../_lib/staging-firestore.js";
import { validatePreviewPatientId } from "../_lib/measurement-validation.js";
import {
  hashInvitationToken,
  invitationIsActive,
  normalizeInvitationEmail,
  normalizeInvitationToken
} from "../_lib/invitation-security.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const token = normalizeInvitationToken(req.body?.token);
    const email = normalizeInvitationEmail(req.body?.email);
    const db = getAdminFirestore();
    const invitationRef = getPreviewInvitationsCollection(db).doc(hashInvitationToken(token));
    const snapshot = await invitationRef.get();

    if (!snapshot.exists || !invitationIsActive(snapshot.data(), email)) {
      return res.status(404).json({ valid: false, error: "La invitación no es válida, no corresponde al correo o ha vencido." });
    }

    const invitation = snapshot.data();
    const patients = getPreviewPatientsCollection(db);
    const patientId = validatePreviewPatientId(invitation.patientId);
    const patientSnapshot = await patients.doc(patientId).get();

    if (
      !patientSnapshot.exists ||
      patientSnapshot.get("accountStatus") !== "invited" ||
      patientSnapshot.get("activeInvitationHash") !== invitation.tokenHash ||
      patientSnapshot.get("linkedUid")
    ) {
      return res.status(404).json({ valid: false, error: "La invitación no es válida, no corresponde al correo o ha vencido." });
    }

    return res.status(200).json({ valid: true, message: "Invitación válida." });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 400) {
      return res.status(400).json({ valid: false, error: "La invitación no es válida o ha vencido." });
    }
    console.error("Invitation validation failed:", error?.name || "Error", error?.code || "");
    return res.status(500).json({ valid: false, error: "No se pudo validar la invitación." });
  }
}
