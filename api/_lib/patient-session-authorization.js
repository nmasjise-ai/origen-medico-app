const PATIENT_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

export function getLinkedPatientId(userData, uid) {
  if (
    !userData ||
    typeof userData !== "object" ||
    typeof uid !== "string" ||
    !uid ||
    userData.uid !== uid ||
    userData.role !== "patient" ||
    typeof userData.patientId !== "string" ||
    !PATIENT_ID_PATTERN.test(userData.patientId)
  ) {
    return null;
  }

  return userData.patientId;
}

export function isPatientRecordLinkedToUser(patientData, uid) {
  return Boolean(
    patientData &&
    typeof patientData === "object" &&
    typeof uid === "string" &&
    uid &&
    patientData.linkedUid === uid &&
    patientData.accountStatus === "linked"
  );
}
