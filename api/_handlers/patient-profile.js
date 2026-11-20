import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore, verifyRequestUser } from "./firebase-admin.js";
import {
  getPreviewPatientsCollection,
  getPreviewUsersCollection
} from "./staging-firestore.js";
import {
  getLinkedPatientId,
  isPatientRecordLinkedToUser
} from "./patient-session-authorization.js";
import { getPatientPortalAccessState } from "./patient-portal-access.js";
import {
  toPatientVisibleProfile,
  toPatientVisibleMeasurement
} from "./patient-portal-data.js";

const MAX_MEASUREMENTS = 30;
const getWeekStartDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - 6);
  return date.toISOString().slice(0, 10);
};
const getBoliviaDateKey = (date) => new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/La_Paz",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
}).format(date);

function validateDailyLog(body = {}) {
  const allowed = ["waterMl", "proteinGrams", "activityMinutes", "activityDone", "activityType", "meals"];
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  if (Object.keys(body).some((key) => !allowed.includes(key))) return false;
  if (!Number.isFinite(body.waterMl) || body.waterMl < 0 || body.waterMl > 7000) return false;
  if (!Number.isFinite(body.proteinGrams) || body.proteinGrams < 0 || body.proteinGrams > 300) return false;
  if (!Number.isInteger(body.activityMinutes) || body.activityMinutes < 0 || body.activityMinutes > 1440) return false;
  const activityTypes = ["Caminata", "Fuerza / pesas", "Bicicleta", "Natación", "Baile", "Movilidad / estiramiento", "Otra actividad"];
  if ("activityDone" in body && typeof body.activityDone !== "boolean") return false;
  if ("activityType" in body && body.activityType !== null && !activityTypes.includes(body.activityType)) return false;
  if (body.activityDone === true && (body.activityMinutes < 1 || !activityTypes.includes(body.activityType))) return false;
  if (body.activityDone === false && body.activityMinutes !== 0) return false;
  const meals = body.meals;
  if (!meals || typeof meals !== "object" || Array.isArray(meals)) return false;
  const mealKeys = Object.keys(meals);
  if (mealKeys.some((key) => !["breakfast", "lunch", "dinner", "snacks"].includes(key))) return false;
  if (!["breakfast", "lunch", "dinner"].every((key) => typeof meals[key] === "boolean")) return false;
  if ("snacks" in meals && typeof meals.snacks !== "boolean") return false;
  return true;
}

export function createPatientProfileHandler(dependencies = {}) {
  const verifyUser = dependencies.verifyRequestUser || verifyRequestUser;
  const getFirestore = dependencies.getAdminFirestore || getAdminFirestore;
  const getUsersCollection = dependencies.getPreviewUsersCollection || getPreviewUsersCollection;
  const getPatientsCollection = dependencies.getPreviewPatientsCollection || getPreviewPatientsCollection;
  const serverTimestamp = dependencies.serverTimestamp || (() => FieldValue.serverTimestamp());
  const now = dependencies.now || (() => new Date());

  return async function patientProfileHandler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    if (!["GET", "POST"].includes(req.method)) {
      res.setHeader("Allow", "GET, POST");
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

      const dateKey = getBoliviaDateKey(now());
      const dailyLogRef = patientRef.collection("dailyLogs").doc(dateKey);

      if (req.method === "POST") {
        if (!validateDailyLog(req.body)) {
          return res.status(400).json({ error: "El registro diario contiene datos inválidos." });
        }

        try {
          const entry = {
            dateKey,
            proteinGrams: req.body.proteinGrams,
            waterMl: req.body.waterMl,
            electrolytesTaken: false,
            meals: req.body.meals,
            activityMinutes: req.body.activityMinutes,
            activityDone: req.body.activityDone ?? req.body.activityMinutes > 0,
            activityType: req.body.activityDone === true ? req.body.activityType : (req.body.activityMinutes > 0 ? req.body.activityType || null : null),
            createdAt: serverTimestamp()
          };
          await dailyLogRef.create(entry);
          return res.status(201).json({
            saved: true,
            dailyLog: {
              dateKey,
              proteinGrams: entry.proteinGrams,
              waterMl: entry.waterMl,
              electrolytesTaken: false,
              meals: entry.meals,
              activityMinutes: entry.activityMinutes,
              activityDone: entry.activityDone,
              activityType: entry.activityType
            }
          });
        } catch (writeError) {
          if (writeError.code === 6 || writeError.code === "already-exists" || writeError.code === "ALREADY_EXISTS") {
            return res.status(409).json({ error: "Ya existe un registro diario enviado para hoy." });
          }
          throw writeError;
        }
      }

      const [measurementsSnapshot, dailyLogSnapshot, activityHistorySnapshot] = await Promise.all([
        patientRef.collection("measurements")
          .orderBy("recordedAt", "desc")
          .limit(MAX_MEASUREMENTS)
          .get(),
        dailyLogRef.get(),
        patientRef.collection("dailyLogs")
          .where("dateKey", ">=", getWeekStartDateKey(dateKey))
          .where("dateKey", "<=", dateKey)
          .orderBy("dateKey", "asc")
          .get()
      ]);

      const dailyLog = dailyLogSnapshot.exists
        ? { id: dailyLogSnapshot.id, ...dailyLogSnapshot.data() }
        : null;

      return res.status(200).json({
        patient: toPatientVisibleProfile(patientData, patientSnapshot.id),
        measurements: measurementsSnapshot.docs.map((document) =>
          toPatientVisibleMeasurement(document.data(), document.id, patientData.heightCm)
        ),
        dailyLog: dailyLog ? {
          dateKey: dailyLog.dateKey,
          proteinGrams: dailyLog.proteinGrams,
          waterMl: dailyLog.waterMl,
          meals: dailyLog.meals || null,
          activityMinutes: dailyLog.activityMinutes ?? null,
          activityDone: dailyLog.activityDone ?? (Number(dailyLog.activityMinutes) > 0),
          activityType: dailyLog.activityType || null
        } : null,
        activityHistory: activityHistorySnapshot.docs.map((document) => {
          const entry = document.data();
          return {
            dateKey: entry.dateKey || document.id,
            activityMinutes: Number.isInteger(entry.activityMinutes) ? entry.activityMinutes : null,
            activityDone: typeof entry.activityDone === "boolean" ? entry.activityDone : Number(entry.activityMinutes) > 0,
            activityType: typeof entry.activityType === "string" ? entry.activityType : null
          };
        })
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
