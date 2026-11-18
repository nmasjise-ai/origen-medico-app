export function getPatientPortalAccessState(userData, patientData) {
  const userStatus = userData?.portalAccessStatus || "enabled";
  const patientStatus = patientData?.portalAccessStatus || "enabled";
  const enabled = userStatus === "enabled" && patientStatus === "enabled";
  return {
    enabled,
    status: enabled ? "enabled" : "suspended",
    reason: !enabled
      ? (patientData?.portalAccessReason || userData?.portalAccessReason || "admin")
      : null
  };
}

export function validatePortalAccessChange(input) {
  const action = input?.action;
  const reason = typeof input?.reason === "string" ? input.reason.trim() : "";
  if (!["suspend", "reactivate"].includes(action)) {
    const error = new Error("Acción de acceso no válida.");
    error.statusCode = 400;
    throw error;
  }
  if (action === "suspend" && reason.length < 5) {
    const error = new Error("Indica un motivo de suspensión de al menos 5 caracteres.");
    error.statusCode = 400;
    throw error;
  }
  if (reason.length > 300) {
    const error = new Error("El motivo no puede superar 300 caracteres.");
    error.statusCode = 400;
    throw error;
  }
  return { action, reason };
}
