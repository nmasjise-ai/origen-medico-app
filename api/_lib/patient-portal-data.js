function asIso(value) {
  if (value?.toDate && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }
  return null;
}

export function toPatientVisibleProfile(data, id) {
  const heightCm = Number.isFinite(data?.heightCm) ? data.heightCm : null;
  return {
    id,
    displayName: typeof data?.displayName === "string" ? data.displayName : "",
    email: typeof data?.email === "string" ? data.email : null,
    birthDate: typeof data?.birthDate === "string" ? data.birthDate : null,
    ageYears: Number.isFinite(data?.ageYears) ? data.ageYears : null,
    sexAtBirth: ["female", "male", "intersex", "unspecified"].includes(data?.sexAtBirth)
      ? data.sexAtBirth
      : null,
    heightCm,
    activeDiagnoses: typeof data?.activeDiagnoses === "string" ? data.activeDiagnoses : "",
    medicalHistory: typeof data?.medicalHistory === "string" ? data.medicalHistory : "",
    surgicalHistory: typeof data?.surgicalHistory === "string" ? data.surgicalHistory : "",
    familyHistory: typeof data?.familyHistory === "string" ? data.familyHistory : "",
    allergies: typeof data?.allergies === "string" ? data.allergies : "",
    concomitantMedications: typeof data?.concomitantMedications === "string"
      ? data.concomitantMedications
      : "",
    status: typeof data?.status === "string" ? data.status : "unknown",
    createdAt: asIso(data?.createdAt),
    updatedAt: asIso(data?.updatedAt)
  };
}

export function toPatientVisibleMeasurement(data, id, fallbackHeightCm = null) {
  const weightKg = Number.isFinite(data?.weightKg) ? data.weightKg : null;
  const heightCm = Number.isFinite(data?.heightCm)
    ? data.heightCm
    : Number.isFinite(fallbackHeightCm) ? fallbackHeightCm : null;
  const waistCm = Number.isFinite(data?.waistCm) ? data.waistCm : null;
  const muscleKg = Number.isFinite(data?.muscleKg) ? data.muscleKg : null;
  const bodyFatPct = Number.isFinite(data?.bodyFatPct) ? data.bodyFatPct : null;
  const bmi = weightKg && heightCm
    ? Number((weightKg / Math.pow(heightCm / 100, 2)).toFixed(1))
    : null;

  return {
    id,
    weightKg,
    heightCm,
    waistCm,
    muscleKg,
    bodyFatPct,
    bmi,
    recordedAt: asIso(data?.recordedAt)
  };
}
