import { getAdminFirestore, verifyRequestUser } from "../_lib/firebase-admin.js";

const DEFAULT_APP_ID = "origen-medico-glpi-bo";
const MAX_ARTIFACT_IDS_TO_SCAN = 100;

const DEMO_PATIENT_IDS = new Set(["pat-sofia", "pat-carlos", "pat-valeria"]);
const DEMO_LEAD_IDS = new Set(["lead-1"]);
const DEMO_REQUEST_IDS = new Set(["req-1"]);

function emptyCounts() {
  return {
    patients: 0,
    demoPatientRecords: 0,
    unclassifiedPatientRecords: 0,
    webLeads: 0,
    demoWebLeads: 0,
    prescriptionRequests: 0,
    demoPrescriptionRequests: 0
  };
}

function countPayload(payload) {
  const patients = Array.isArray(payload?.patients) ? payload.patients : [];
  const leads = Array.isArray(payload?.webLeads) ? payload.webLeads : [];
  const requests = Array.isArray(payload?.rxRequests) ? payload.rxRequests : [];

  const demoPatientRecords = patients.filter((item) => DEMO_PATIENT_IDS.has(item?.id)).length;
  const demoWebLeads = leads.filter((item) => DEMO_LEAD_IDS.has(item?.id)).length;
  const demoPrescriptionRequests = requests.filter((item) => DEMO_REQUEST_IDS.has(item?.id)).length;

  return {
    patients: patients.length,
    demoPatientRecords,
    unclassifiedPatientRecords: patients.length - demoPatientRecords,
    webLeads: leads.length,
    demoWebLeads,
    prescriptionRequests: requests.length,
    demoPrescriptionRequests
  };
}

function addCounts(total, current) {
  for (const key of Object.keys(total)) total[key] += current[key] || 0;
}

async function readLegacyDocument(db, appId) {
  const path = `artifacts/${appId}/public/data/clinic_state/main`;
  const snapshot = await db.doc(path).get();

  if (!snapshot.exists) return { exists: false, path };

  const rawPayload = snapshot.get("payload");
  let payload;

  try {
    payload = typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload;
  } catch {
    return {
      exists: true,
      parsed: false,
      updatedAt: snapshot.updateTime?.toDate?.().toISOString() || null,
      payloadBytes: typeof rawPayload === "string" ? Buffer.byteLength(rawPayload, "utf8") : null
    };
  }

  if (!payload || typeof payload !== "object") {
    return {
      exists: true,
      parsed: false,
      updatedAt: snapshot.updateTime?.toDate?.().toISOString() || null,
      payloadBytes: typeof rawPayload === "string" ? Buffer.byteLength(rawPayload, "utf8") : null
    };
  }

  return {
    exists: true,
    parsed: true,
    updatedAt: snapshot.updateTime?.toDate?.().toISOString() || null,
    payloadBytes: typeof rawPayload === "string" ? Buffer.byteLength(rawPayload, "utf8") : null,
    counts: countPayload(payload)
  };
}

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

    const db = getAdminFirestore();
    const artifactDocuments = await db.collection("artifacts").listDocuments();
    const candidateAppIds = new Set([DEFAULT_APP_ID]);

    for (const documentRef of artifactDocuments.slice(0, MAX_ARTIFACT_IDS_TO_SCAN)) {
      candidateAppIds.add(documentRef.id);
    }

    const checks = await Promise.all(
      [...candidateAppIds].map((appId) => readLegacyDocument(db, appId))
    );

    const found = checks.filter((item) => item.exists);
    const parsed = found.filter((item) => item.parsed === true);
    const unparsedCount = found.filter((item) => item.parsed === false).length;
    const totals = emptyCounts();

    for (const item of parsed) addCounts(totals, item.counts);

    const lastUpdated = parsed
      .map((item) => item.updatedAt)
      .filter(Boolean)
      .sort()
      .at(-1) || null;

    const totalPayloadBytes = found.reduce((sum, item) => sum + (item.payloadBytes || 0), 0);
    const truncated = artifactDocuments.length > MAX_ARTIFACT_IDS_TO_SCAN;

    return res.status(200).json({
      exists: found.length > 0,
      parsed: unparsedCount === 0,
      matchingDocuments: found.length,
      scannedArtifactRoots: Math.min(artifactDocuments.length, MAX_ARTIFACT_IDS_TO_SCAN),
      defaultPathChecked: true,
      scanTruncated: truncated,
      updatedAt: lastUpdated,
      payloadBytes: totalPayloadBytes,
      unparsedDocuments: unparsedCount,
      counts: totals,
      message: found.length === 0
        ? "No se encontró ningún documento clínico legado en la ruta predeterminada ni en los documentos encontrados bajo artifacts. No se devolvió contenido clínico."
        : unparsedCount > 0
          ? "Se encontraron documentos legados; algunos no pudieron interpretarse. No se devolvió contenido clínico."
          : "Auditoría ampliada completada. Se revisó la ruta predeterminada y las raíces de artifacts encontradas. No se devolvieron nombres, teléfonos ni contenido clínico."
    });
  } catch (error) {
    console.error("Legacy data audit failed:", error?.name || "Error", error?.code || "");
    const status = error.statusCode || 500;
    return res.status(status).json({
      error: status === 401
        ? "Inicia sesión nuevamente."
        : status === 403
          ? "Se requiere una sesión de médico autorizada."
          : "No se pudo completar la auditoría ampliada de datos antiguos."
    });
  }
}
