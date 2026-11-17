import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore, verifyRequestUser } from "../../_lib/firebase-admin.js";
import { getPreviewPatientsCollection } from "../../_lib/staging-firestore.js";

const MAX_MEASUREMENTS = 30;
const MEASUREMENT_LIMITS = {
  weightKg: [20, 400],
  waistCm: [30, 250],
  muscleKg: [2, 150],
  bodyFatPct: [1, 75]
};

function validateMeasurement(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    const error = new Error("Datos de medición no válidos.");
    error.statusCode = 400;
    throw error;
  }

  const keys = Object.keys(input);
  if (keys.some((key) => !Object.hasOwn(MEASUREMENT_LIMITS, key))) {
    const error = new Error("La medición contiene campos no permitidos.");
    error.statusCode = 400;
    throw error;
  }

  const result = {};
  for (const key of keys) {
    const value = input[key];
    if (value === "" || value === null || value === undefined) continue;
    const number = Number(value);
    const [min, max] = MEASUREMENT_LIMITS[key];
    if (!Number.isFinite(number) || number < min || number > max) {
      const error = new Error(`El valor de ${key} está fuera del rango permitido.`);
      error.statusCode = 400;
      throw error;
    }
    result[key] = number;
  }

  if (Object.keys(result).length === 0) {
    const error = new Error("Introduce al menos una medición.");
    error.statusCode = 400;
    throw error;
  }

  return result;
}

function asIso(value) {
  return value?.toDate ? value.toDate().toISOString() : null;
}

function getPatientId(req) {
  const raw = req.query?.patientId;
  const patientId = Array.isArray(raw) ? raw[0] : raw;
  if (typeof patientId !== "string" || !/^[A-Za-z0-9_-]{8,128}$/.test(patientId)) {
    const error = new Error("Identificador de expediente no válido.");
    error.statusCode = 400;
    throw error;
  }
  return patientId;
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

    const patientId = getPatientId(req);
    const db = getAdminFirestore();
    const patients = getPreviewPatientsCollection(db);
    const patientRef = patients.doc(patientId);
    const patientSnapshot = await patientRef.get();

    if (!patientSnapshot.exists) {
      return res.status(404).json({ error: "No se encontró el expediente de prueba." });
    }

    if (req.method === "GET") {
      const measurementsSnapshot = await patientRef.collection("measurements")
        .orderBy("recordedAt", "desc")
        .limit(MAX_MEASUREMENTS)
        .get();

      const measurements = measurementsSnapshot.docs.map((document) => {
        const data = document.data();
        return {
          id: document.id,
          weightKg: data.weightKg ?? null,
          waistCm: data.waistCm ?? null,
          muscleKg: data.muscleKg ?? null,
          bodyFatPct: data.bodyFatPct ?? null,
          recordedAt: asIso(data.recordedAt),
          source: data.source || "manual"
        };
      });

      const data = patientSnapshot.data();
      return res.status(200).json({
        patient: {
          id: patientSnapshot.id,
          displayName: data.displayName || "",
          phoneE164: data.phoneE164 || null,
          ageYears: data.ageYears ?? null,
          status: data.status || "unknown",
          accountStatus: data.accountStatus || "unlinked",
          createdAt: asIso(data.createdAt),
          updatedAt: asIso(data.updatedAt)
        },
        measurements
      });
    }

    const measurement = validateMeasurement(req.body?.measurement);
    const batch = db.batch();
    const measurementRef = patientRef.collection("measurements").doc();

    batch.create(measurementRef, {
      ...measurement,
      recordedAt: FieldValue.serverTimestamp(),
      recordedByUid: decoded.uid,
      source: "manual_control"
    });

    const auditRef = patientRef.collection("auditLogs").doc();
    batch.create(auditRef, {
      action: "measurement.created",
      actorUid: decoded.uid,
      occurredAt: FieldValue.serverTimestamp(),
      source: "admin_api"
    });

    batch.update(patientRef, { updatedAt: FieldValue.serverTimestamp() });
    await batch.commit();

    return res.status(201).json({
      measurement: { id: measurementRef.id, ...measurement, source: "manual_control" },
      message: "Medición registrada en el espacio de pruebas."
    });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("Admin patient detail API failed:", error?.name || "Error", error?.code || "");
    return res.status(status).json({
      error: status >= 500
        ? "No se pudo consultar o actualizar el expediente de prueba."
        : error.message
    });
  }
}
