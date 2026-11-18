import { isVerifiedAdministrator } from "../_lib/admin-authorization.js";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore, verifyRequestUser } from "../_lib/firebase-admin.js";
import {
  getPreviewInvitationsCollection,
  getPreviewPatientsCollection
} from "../_lib/staging-firestore.js";
import { validatePreviewPatientId } from "../_lib/measurement-validation.js";
import {
  createInvitationToken,
  hashInvitationToken,
  INVITATION_TTL_MS,
  normalizeInvitationEmail
} from "../_lib/invitation-security.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const decoded = await verifyRequestUser(req);
    if (!isVerifiedAdministrator(decoded)) {
      return res.status(403).json({ error: "Se requiere una cuenta médica autorizada." });
    }

    const patientId = validatePreviewPatientId(req.body?.patientId);
    const email = normalizeInvitationEmail(req.body?.email);
    const db = getAdminFirestore();
    const patients = getPreviewPatientsCollection(db);
    const invitations = getPreviewInvitationsCollection(db);
    const patientRef = patients.doc(patientId);

    const token = createInvitationToken();
    const tokenHash = hashInvitationToken(token);
    const invitationRef = invitations.doc(tokenHash);
    const expiresAtMs = Date.now() + INVITATION_TTL_MS;
    const expiresAt = Timestamp.fromMillis(expiresAtMs);

    await db.runTransaction(async (transaction) => {
      const patientSnapshot = await transaction.get(patientRef);
      if (!patientSnapshot.exists) {
        const error = new Error("No se encontró el expediente de prueba.");
        error.statusCode = 404;
        throw error;
      }

      const patient = patientSnapshot.data();
      if (patient.linkedUid || patient.accountStatus === "linked") {
        const error = new Error("Este expediente ya tiene una cuenta vinculada.");
        error.statusCode = 409;
        throw error;
      }

      if (!["unlinked", "invited"].includes(patient.accountStatus)) {
        const error = new Error("El expediente no está disponible para invitación.");
        error.statusCode = 409;
        throw error;
      }

      if (patient.status !== "pending_account" && patient.status !== "pending") {
        const error = new Error("El estado del expediente no permite emitir una invitación.");
        error.statusCode = 409;
        throw error;
      }

      const previousHash = patient.activeInvitationHash;
      let previousInvitationSnapshot = null;
      let previousInvitationRef = null;

      if (typeof previousHash === "string" && /^[a-f0-9]{64}$/.test(previousHash)) {
        previousInvitationRef = invitations.doc(previousHash);
        previousInvitationSnapshot = await transaction.get(previousInvitationRef);
      }

      if (
        previousInvitationSnapshot?.exists &&
        previousInvitationSnapshot.get("status") === "pending"
      ) {
        transaction.update(previousInvitationRef, {
          status: "revoked",
          revokedAt: FieldValue.serverTimestamp(),
          revokedByUid: decoded.uid
        });
      }

      transaction.create(invitationRef, {
        tokenHash,
        patientId,
        email,
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
        createdByUid: decoded.uid,
        expiresAt
      });

      transaction.update(patientRef, {
        accountStatus: "invited",
        invitedEmail: email,
        activeInvitationHash: tokenHash,
        invitationExpiresAt: expiresAt,
        updatedAt: FieldValue.serverTimestamp()
      });
    });

    return res.status(201).json({
      invitation: {
        email,
        token,
        expiresAt: new Date(expiresAtMs).toISOString(),
        expiresInDays: 7
      },
      message: "Invitación creada. Copia el enlace y compártelo únicamente con el correo indicado."
    });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("Admin invitation creation failed:", error?.name || "Error", error?.code || "");
    return res.status(status).json({
      error: status >= 500
        ? "No se pudo crear la invitación."
        : error.message
    });
  }
}
