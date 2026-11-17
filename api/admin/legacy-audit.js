import { getAdminFirestore, verifyRequestUser } from "../_lib/firebase-admin.js";

const LEGACY_DOCUMENT_PATH = "artifacts/origen-medico-glpi-bo/public/data/clinic_state/main";

const DEMO_PATIENT_IDS = new Set([
  "pat-sofia",
  "pat-carlos",
  "pat-valeria"
]);

const DEMO_LEAD_IDS = new Set(["lead-1"]);
const DEMO_REQUEST_IDS = new Set(["req-1"]);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const decoded = await verifyRequestUser(req);
    if (decoded.admin !== true) {
      return res.status(403).json({ error: "Administrator access required." });
    }

    const snapshot = await getAdminFirestore().doc(LEGACY_DOCUMENT_PATH).get();

    if (!snapshot.exists) {
      return res.status(200).json({
        exists: false,
        message: "No se encontró el documento clínico legado en la ruta esperada.",
        counts: {
          patients: 0,
          demoPatientRecords: 0,
          unclassifiedPatientRecords: 0,
          webLeads: 0,
          demoWebLeads: 0,
          prescriptionRequests: 0,
          demoPrescriptionRequests: 0
        }
      });
    }

    const rawPayload = snapshot.get("payload");
    let payload;

    try {
      payload = typeof rawPayload === "string"
        ? JSON.parse(rawPayload)
        : rawPayload;
    } catch {
      return res.status(200).json({
        exists: true,
        parsed: false,
        message: "El documento existe, pero el payload no pudo interpretarse. No se devolvió su contenido."
      });
    }

    if (!payload || typeof payload !== "object") {
      return res.status(200).json({
        exists: true,
        parsed: false,
        message: "El documento existe, pero su estructura no es la esperada. No se devolvió su contenido."
      });
    }

    const patients = Array.isArray(payload.patients) ? payload.patients : [];
    const leads = Array.isArray(payload.webLeads) ? payload.webLeads : [];
    const requests = Array.isArray(payload.rxRequests) ? payload.rxRequests : [];

    const demoPatientRecords = patients.filter((item) => DEMO_PATIENT_IDS.has(item?.id)).length;
    const demoWebLeads = leads.filter((item) => DEMO_LEAD_IDS.has(item?.id)).length;
    const demoPrescriptionRequests = requests.filter((item) => DEMO_REQUEST_IDS.has(item?.id)).length;
    const rawBytes = typeof rawPayload === "string" ? Buffer.byteLength(rawPayload, "utf8") : null;

    return res.status(200).json({
      exists: true,
      parsed: true,
      updatedAt: snapshot.updateTime?.toDate?.().toISOString() || null,
      payloadBytes: rawBytes,
      counts: {
        patients: patients.length,
        demoPatientRecords,
        unclassifiedPatientRecords: patients.length - demoPatientRecords,
        webLeads: leads.length,
        demoWebLeads,
        prescriptionRequests: requests.length,
        demoPrescriptionRequests
      },
      message: "Auditoría de metadatos completada. No se devolvieron nombres, teléfonos ni contenido clínico."
    });
  } catch (error) {
    console.error("Legacy data audit failed:", error?.name || "Error", error?.code || "");
    const status = error.statusCode || 500;
    return res.status(status).json({
      error: status === 401
        ? "Inicia sesión nuevamente."
        : status === 403
          ? "Se requiere una sesión de médico autorizada."
          : "No se pudo completar la auditoría de datos antiguos."
    });
  }
}
