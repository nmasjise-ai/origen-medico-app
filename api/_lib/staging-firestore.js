const EXPECTED_PREVIEW_NAMESPACE = "previewEnvironments/mejoras-seguridad-origen";

export function getPreviewDataNamespace(env = process.env) {
  if (env.VERCEL_ENV !== "preview") {
    const error = new Error("Patient preview operations are restricted to a Vercel Preview deployment.");
    error.statusCode = 503;
    throw error;
  }

  if (env.ORIGEN_PREVIEW_DATA_NAMESPACE !== EXPECTED_PREVIEW_NAMESPACE) {
    const error = new Error("The isolated Preview data namespace is not configured.");
    error.statusCode = 503;
    throw error;
  }

  return EXPECTED_PREVIEW_NAMESPACE;
}

export function getPreviewPatientsCollection(db, env = process.env) {
  const namespace = getPreviewDataNamespace(env);
  const [rootCollection, rootDocument] = namespace.split("/");
  return db.collection(rootCollection).doc(rootDocument).collection("patients");
}

export function getPreviewInvitationsCollection(db, env = process.env) {
  const namespace = getPreviewDataNamespace(env);
  const [rootCollection, rootDocument] = namespace.split("/");
  return db.collection(rootCollection).doc(rootDocument).collection("invitations");
}

export function getPreviewUsersCollection(db, env = process.env) {
  const namespace = getPreviewDataNamespace(env);
  const [rootCollection, rootDocument] = namespace.split("/");
  return db.collection(rootCollection).doc(rootDocument).collection("users");
}
