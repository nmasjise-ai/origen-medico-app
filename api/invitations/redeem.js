import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore, verifyRequestUser } from "../_lib/firebase-admin.js";
import {
  getPreviewInvitationsCollection,
  getPreviewPatientsCollection,
  getPreviewUsersCollection
} from "../_lib/staging-firestore.js";
import {
  hashInvitationToken,
  normalizeInvitationToken
} from "../_lib/invitation-security.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const decoded = await verifyRequestUser(req);
    if (decoded.admin === true || decoded.email_verified !== true || !decoded.email) {
      return res.status(403).json({ error: "Verifica el correo invitado e inicia sesión con esa cuenta de paciente." });
    }

    const token = normalizeInvitationToken(req.body?.token);
    const email = String(decoded.email).trim().toLowerCase();
    const tokenHash = hashInvitationToken(token);
    const db = getAdminFirestore();
    const invitationRef = getPreviewInvitationsCollection(db).doc(tokenHash);
    const patients = getPreviewPatientsCollection(db);
    const users = getPreviewUsersCollection(db);
    const userRef = users.doc(decoded.uid);

    let linkedPatient = null;

    await db.runTransaction(async (transaction) => {
      const invitationSnapshot = await transaction.get(invitationRef);
      if (!invitationSnapshot.exists) {
        const error = new Error("La invitación no es válida o ha vencido.");
        error.statusCode = 404;
        throw error;
      }

      const invitation = invitationSnapshot.data();
      const patientRef = patients.doc(invitation.patientId);
      const [patientSnapshot, userSnapshot] = await Promise.all([
        transaction.get(patientRef),
        transaction.get(userRef)
      ]);

      const expiryMs = invitation.expiresAt?.toMillis?.() || 0;
      if (
        invitation.status !== "pending" ||
        expiryMs <= Date.now() ||
        invitation.email !== email ||
        invitation.tokenHash !== tokenHash ||
        !patientSnapshot.exists ||
        patientSnapshot.get("accountStatus") !== "invited" ||
        patientSnapshot.get("activeInvitationHash") !== tokenHash ||
        patientSnapshot.get("linkedUid") ||
        userSnapshot.exists
      ) {
        const error = new Error("La invitación no es válida, no corresponde al correo o ya fue utilizada.");
        error.statusCode = 409;
        throw error;
      }

      const patient = patientSnapshot.data();
      linkedPatient = {
        id: patientSnapshot.id,
        displayName: patient.displayName || ""
      };

      transaction.create(userRef, {
        uid: decoded.uid,
        email,
        role: "patient",
        patientId: patientSnapshot.id,
        invitationHash: tokenHash,
        createdAt: FieldValue.serverTimestamp(),
        linkedAt: FieldValue.serverTimestamp()
      });

      transaction.update(patientRef, {
        accountStatus: "linked",
        status: "active",
        email,
        linkedUid: decoded.uid,
        linkedAt: FieldValue.serverTimestamp(),
        activeInvitationHash: FieldValue.delete(),
        invitationExpiresAt: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp()
      });

      transaction.update(invitationRef, {
        status: "used",
        usedAt: FieldValue.serverTimestamp(),
        usedByUid: decoded.uid
      });

      const auditRef = patientRef.collection("auditLogs").doc();
      transaction.create(auditRef, {
        action: "patient.account_linked",
        actorUid: decoded.uid,
        occurredAt: FieldValue.serverTimestamp(),
        source: "invitation_redemption"
      });
    });

    return res.status(200).json({
      linked: true,
      patient: linkedPatient,
      message: "La cuenta quedó vinculada a su expediente."
    });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("Invitation redemption failed:", error?.name || "Error", error?.code || "");
    return res.status(status).json({
      error: status >= 500
        ? "No se pudo activar la cuenta. Inténtalo más tarde."
        : error.message
    });
  }
}
