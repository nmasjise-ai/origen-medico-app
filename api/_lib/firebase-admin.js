import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const APP_NAME = "origen-medico-admin";
const PROJECT_ID = "origen-medico";

export function getAdminAuth() {
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.CUENTA_SERVICIO_FIREBASE_JSON;
  if (!raw) {
    const error = new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured.");
    error.statusCode = 503;
    throw error;
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(raw);
  } catch {
    const error = new Error("FIREBASE_SERVICE_ACCOUNT_JSON must contain valid JSON.");
    error.statusCode = 503;
    throw error;
  }

  if (serviceAccount.project_id !== PROJECT_ID) {
    const error = new Error("The configured service account does not belong to the ORIGEN Médico Firebase project.");
    error.statusCode = 503;
    throw error;
  }

  let app = getApps().find((item) => item.name === APP_NAME);
  if (!app) {
    app = initializeApp(
      {
        credential: cert(serviceAccount),
        projectId: PROJECT_ID
      },
      APP_NAME
    );
  }

  return getAuth(app);
}

export function getBearerToken(req) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

export async function verifyRequestUser(req) {
  const token = getBearerToken(req);
  if (!token) {
    const error = new Error("Missing bearer token.");
    error.statusCode = 401;
    throw error;
  }

  return getAdminAuth().verifyIdToken(token, true);
}
