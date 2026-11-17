import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore, verifyRequestUser } from "./_lib/firebase-admin.js";
import { normalizeNewPatient } from "./_lib/patient-validation.js";

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

    const db = getAdminFirestore();

    if (req.method === "GET") {
      const snapshot = await db.collection("patients")
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
          createdAt: asIso(data.createdAt),
          updatedAt: asIso(data.updatedAt)
        };
      });

      return res.status(200).json({
        patients,
        count: patients.length,
        limit: MAX_RESULTS
      });
    }

    const patientInput = normalizeNewPatient(req.body);
    const patientRef = db.collection("patients").doc();
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

    const measurement = patientInput.initialMeasurement;
    if (Object.keys(measurement).length > 0) {
      const measurementRef = patientRef.collection("measurements").doc();
      batch.create(measurementRef, {
        ...measurement,
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
      message: "Expediente creado. La cuenta individual del paciente se vinculará en el siguiente paso."
    });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("Admin patient API failed:", error?.name || "Error", error?.code || "");
    return res.status(status).json({
      error: status >= 500
        ? "No se pudo completar la operación de pacientes."
        : error.message
    });
  }
}
