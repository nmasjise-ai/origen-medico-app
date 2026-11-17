const MAX_NAME_LENGTH = 120;
const MAX_PHONE_DIGITS = 15;

function fail(message) {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
}

function optionalNumber(value, field, min, max, integer = false) {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number))) {
    fail(`El campo ${field} no tiene un valor válido.`);
  }
  return number;
}

function optionalText(value, field, maxLength) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") fail(`El campo ${field} no es válido.`);
  const normalized = value.trim();
  if (normalized.length > maxLength) fail(`El campo ${field} supera el límite permitido.`);
  return normalized || null;
}

function normalizeBirthDate(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fail("La fecha de nacimiento no es válida.");
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    fail("La fecha de nacimiento no es válida.");
  }
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  if (date.getTime() > todayUtc) fail("La fecha de nacimiento no puede estar en el futuro.");
  const age = today.getUTCFullYear() - date.getUTCFullYear()
    - ((today.getUTCMonth() < date.getUTCMonth()
      || (today.getUTCMonth() === date.getUTCMonth() && today.getUTCDate() < date.getUTCDate())) ? 1 : 0);
  if (age > 120) fail("La fecha de nacimiento supera el rango permitido.");
  return value;
}

export function normalizePatientProfile(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    fail("Datos de perfil no válidos.");
  }
  const allowedKeys = new Set([
    "displayName", "phone", "ageYears", "birthDate", "sexAtBirth", "heightCm",
    "activeDiagnoses", "medicalHistory", "surgicalHistory", "familyHistory", "allergies",
    "concomitantMedications"
  ]);
  if (Object.keys(input).some((key) => !allowedKeys.has(key))) {
    fail("El perfil contiene campos no permitidos.");
  }

  const displayName = typeof input.displayName === "string"
    ? input.displayName.trim().replace(/\s+/g, " ")
    : "";
  if (displayName.length < 2 || displayName.length > MAX_NAME_LENGTH) {
    fail("El nombre debe tener entre 2 y 120 caracteres.");
  }

  let phoneE164 = null;
  if (input.phone !== undefined && input.phone !== null && String(input.phone).trim() !== "") {
    const digits = String(input.phone).replace(/\\D/g, "");
    if (digits.length < 8 || digits.length > MAX_PHONE_DIGITS) {
      fail("El teléfono debe contener entre 8 y 15 dígitos.");
    }
    phoneE164 = digits.startsWith("591") ? `+${digits}` : `+591${digits}`;
  }

  const birthDate = normalizeBirthDate(input.birthDate);
  const suppliedAge = optionalNumber(input.ageYears, "edad", 1, 120, true);
  let ageYears = suppliedAge;
  if (birthDate) {
    const [year, month, day] = birthDate.split("-").map(Number);
    const now = new Date();
    ageYears = now.getUTCFullYear() - year
      - ((now.getUTCMonth() + 1 < month
        || (now.getUTCMonth() + 1 === month && now.getUTCDate() < day)) ? 1 : 0);
  }

  const sexAtBirth = input.sexAtBirth === undefined || input.sexAtBirth === "" ? null : input.sexAtBirth;
  if (sexAtBirth !== null && !["female", "male", "intersex", "not_specified"].includes(sexAtBirth)) {
    fail("El campo sexo biológico no tiene un valor válido.");
  }

  const heightCm = optionalNumber(input.heightCm, "talla", 80, 250);
  return {
    displayName,
    phoneE164,
    ageYears: ageYears ?? null,
    birthDate,
    sexAtBirth,
    heightCm: heightCm ?? null,
    activeDiagnoses: optionalText(input.activeDiagnoses, "diagnósticos activos", 2000),
    medicalHistory: optionalText(input.medicalHistory, "antecedentes médicos", 3000),
    surgicalHistory: optionalText(input.surgicalHistory, "antecedentes quirúrgicos", 2000),
    familyHistory: optionalText(input.familyHistory, "antecedentes familiares", 2000),
    allergies: optionalText(input.allergies, "alergias", 2000),
    concomitantMedications: optionalText(input.concomitantMedications, "medicación concomitante", 3000)
  };
}

export function normalizeNewPatient(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    fail("Datos de paciente no válidos.");
  }
  if (!Object.hasOwn(input, "displayName")) fail("El nombre es obligatorio.");
  const { initialMeasurement: rawMeasurement = {}, ...rawProfile } = input;
  const profile = normalizePatientProfile(rawProfile);

  if (!rawMeasurement || typeof rawMeasurement !== "object" || Array.isArray(rawMeasurement)) {
    fail("La medición inicial no es válida.");
  }

  const fields = {
    weightKg: [20, 400],
    waistCm: [30, 250],
    muscleKg: [2, 150],
    bodyFatPct: [1, 75],
    heightCm: [80, 250]
  };
  if (Object.keys(rawMeasurement).some((key) => !Object.hasOwn(fields, key))) {
    fail("La medición inicial contiene campos no permitidos.");
  }

  const initialMeasurement = {};
  for (const [field, [min, max]] of Object.entries(fields)) {
    const value = optionalNumber(rawMeasurement[field], field, min, max);
    if (value !== undefined) initialMeasurement[field] = value;
  }
  if (initialMeasurement.heightCm === undefined && profile.heightCm !== null) {
    initialMeasurement.heightCm = profile.heightCm;
  }

  return { ...profile, initialMeasurement };
}
