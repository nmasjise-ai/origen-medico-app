import { isVerifiedAdministrator } from "../../_lib/admin-authorization.js";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore, verifyRequestUser } from "../../_lib/firebase-admin.js";
import { getPreviewPatientsCollection } from "../../_lib/staging-firestore.js";
import { validatePatientMeasurement, validatePreviewPatientId } from "../../_lib/measurement-validation.js";
import { normalizePatientProfile } from "../../_lib/patient-validation.js";

const MAX_MEASUREMENTS = 30;
const getBoliviaDateKey = (date) => new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/La_Paz", year: "numeric", month: "2-digit", day: "2-digit"
}).format(date);
const getWeekStartDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - 6);
  return date.toISOString().slice(0, 10);
};
function asIso(value) {
  return value?.toDate ? value.toDate().toISOString() : null;
}

function normalizeStoredDemographics(data) {
  let ageYears = data.ageYears ?? null;
  let birthDate = data.birthDate || null;
  const createdDate = asIso(data.createdAt)?.slice(0, 10) || null;

  // Older Preview forms could persist today's date and age 0 as defaults.
  // Treat that exact creation-date + zero-age combination as missing data.
  if (Number(ageYears) === 0 && birthDate && createdDate === birthDate) {
    ageYears = null;
    birthDate = null;
  }
  return { ageYears, birthDate };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET" && req.method !== "POST" && req.method !== "PATCH") {
    res.setHeader("Allow", "GET, POST, PATCH");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const decoded = await verifyRequestUser(req);
    if (!isVerifiedAdministrator(decoded)) {
      return res.status(403).json({ error: "Se requiere una cuenta médica autorizada." });
    }

    const patientId = validatePreviewPatientId(req.query?.patientId);
    const db = getAdminFirestore();
    const patients = getPreviewPatientsCollection(db);
    const patientRef = patients.doc(patientId);
    const patientSnapshot = await patientRef.get();

    if (!patientSnapshot.exists) {
      return res.status(404).json({ error: "No se encontró el expediente de prueba." });
    }

    if (req.method === "GET") {
      const todayKey = getBoliviaDateKey(new Date());
      const [measurementsSnapshot, activitySnapshot] = await Promise.all([
        patientRef.collection("measurements")
          .orderBy("recordedAt", "desc")
          .limit(MAX_MEASUREMENTS)
          .get(),
        patientRef.collection("dailyLogs")
          .where("dateKey", ">=", getWeekStartDateKey(todayKey))
          .where("dateKey", "<=", todayKey)
          .orderBy("dateKey", "asc")
          .get()
      ]);

      const measurements = measurementsSnapshot.docs.map((document) => {
        const data = document.data();
        return {
          id: document.id,
          weightKg: data.weightKg ?? null,
          waistCm: data.waistCm ?? null,
          muscleKg: data.muscleKg ?? null,
          bodyFatPct: data.bodyFatPct ?? null,
          // Height is snapshotted per measurement. Do not backfill historical
          // records from the mutable profile height.
          heightCm: data.heightCm ?? null,
          bmi: data.weightKg && data.heightCm
            ? Number((data.weightKg / Math.pow(data.heightCm / 100, 2)).toFixed(1))
            : null,
          recordedAt: asIso(data.recordedAt),
          source: data.source || "manual"
        };
      });

      const data = patientSnapshot.data();
      const demographics = normalizeStoredDemographics(data);
      return res.status(200).json({
        patient: {
          id: patientSnapshot.id,
          displayName: data.displayName || "",
          phoneE164: data.phoneE164 || null,
          ageYears: demographics.ageYears,
          birthDate: demographics.birthDate,
          sexAtBirth: data.sexAtBirth || null,
          heightCm: data.heightCm ?? null,
          waterGoalMl: data.waterGoalMl ?? null,
          proteinGoalGrams: data.proteinGoalGrams ?? null,
          activeDiagnoses: data.activeDiagnoses || "",
          medicalHistory: data.medicalHistory || "",
          surgicalHistory: data.surgicalHistory || "",
          familyHistory: data.familyHistory || "",
          allergies: data.allergies || "",
          concomitantMedications: data.concomitantMedications || "",
          status: data.status || "unknown",
          accountStatus: data.accountStatus || "unlinked",
          createdAt: asIso(data.createdAt),
          updatedAt: asIso(data.updatedAt)
        },
        measurements,
        activityHistory: activitySnapshot.docs.map((document) => {
          const entry = document.data();
          return {
            dateKey: entry.dateKey || document.id,
            activityMinutes: Number.isInteger(entry.activityMinutes) ? entry.activityMinutes : null,
            activityDone: typeof entry.activityDone === "boolean" ? entry.activityDone : Number(entry.activityMinutes) > 0,
            activityType: typeof entry.activityType === "string" ? entry.activityType : null
          };
        })
      });
    }

    if (req.method === "PATCH") {
      const profile = normalizePatientProfile(req.body?.profile);
      const batch = db.batch();
      batch.update(patientRef, {
        ...profile,
        schemaVersion: 2,
        updatedAt: FieldValue.serverTimestamp()
      });
      const auditRef = patientRef.collection("auditLogs").doc();
      batch.create(auditRef, {
        action: "patient.profile_updated",
        actorUid: decoded.uid,
        occurredAt: FieldValue.serverTimestamp(),
        source: "admin_api"
      });
      await batch.commit();
      return res.status(200).json({
        patient: { id: patientRef.id, ...profile },
        message: "Perfil clínico actualizado en el espacio de pruebas."
      });
    }

    const measurement = validatePatientMeasurement(req.body?.measurement);
    if (measurement.heightCm === undefined && patientSnapshot.data().heightCm) {
      measurement.heightCm = patientSnapshot.data().heightCm;
    }
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
