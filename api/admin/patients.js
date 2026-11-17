import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore, verifyRequestUser } from "../_lib/firebase-admin.js";
import { getPreviewPatientsCollection } from "../_lib/staging-firestore.js";
import { normalizeNewPatient } from "../_lib/patient-validation.js";

const MAX_RESULTS = 100;

function asIso(value) {
  return value?.toDate ? value.toDate().toISOString() : null;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const decoded = await verifyRequestUser(req);
    if (decoded.admin !== true) {
      return res.status(403).json({ error: "Se requiere una cuenta médica autorizada." });
    }

    // Preview patient data uses a dedicated namespace inside the project's
    // existing (default) database. The endpoint rejects non-Preview deployments.
    // This avoids requiring the paid named-database feature on the Spark plan.
    const db = getAdminFirestore();
    const patientsCollection = getPreviewPatientsCollection(db);

    if (req.method === "GET") {
      const snapshot = await patientsCollection
        .orderBy("createdAt", "desc")
        .limit(MAX_RESULTS)
        .get();

      const patients = snapshot.docs.map((document) => {
        const data = document.data();
        return {
          id: document.id,
          displayName: data.displayName || "",
          phoneE164: data.phoneE164 || null,
          ageYears: data.ageYears ?? null,
          status: data.status || "unknown",
          accountStatus: data.accountStatus || "unlinked",
          invitedEmail: data.invitedEmail || null,
          createdAt: asIso(data.createdAt),
          updatedAt: asIso(data.updatedAt)
        };
      });

      return res.status(200).json({ patients, count: patients.length, limit: MAX_RESULTS });
    }

    const patientInput = normalizeNewPatient(req.body);
    const patientRef = patientsCollection.doc();
    const batch = db.batch();

    batch.create(patientRef, {
      displayName: patientInput.displayName,
      phoneE164: patientInput.phoneE164,
      ...(patientInput.ageYears !== undefined ? { ageYears: patientInput.ageYears } : {}),
      status: "pending_account",
      accountStatus: "unlinked",
      schemaVersion: 1,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdByUid: decoded.uid
    });

    if (Object.keys(patientInput.initialMeasurement).length > 0) {
      const measurementRef = patientRef.collection("measurements").doc();
      batch.create(measurementRef, {
        ...patientInput.initialMeasurement,
        recordedAt: FieldValue.serverTimestamp(),
        recordedByUid: decoded.uid,
        source: "initial_registration"
      });
    }

    const auditRef = patientRef.collection("auditLogs").doc();
    batch.create(auditRef, {
      action: "patient.created",
      actorUid: decoded.uid,
      occurredAt: FieldValue.serverTimestamp(),
      source: "admin_api"
    });

    await batch.commit();

    return res.status(201).json({
      patient: {
        id: patientRef.id,
        displayName: patientInput.displayName,
        phoneE164: patientInput.phoneE164,
        ageYears: patientInput.ageYears ?? null,
        status: "pending_account",
        accountStatus: "unlinked"
      },
      message: "Expediente provisional creado en el espacio aislado de Preview. La cuenta individual todavía no está vinculada."
    });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("Admin patient API failed:", error?.name || "Error", error?.code || "");
    return res.status(status).json({
      error: status >= 500
        ? "No se pudo completar la operación de pacientes. Comprueba la base de pruebas configurada."
        : error.message
    });
  }
}
