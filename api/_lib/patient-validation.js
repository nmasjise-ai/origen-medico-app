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

export function normalizeNewPatient(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    fail("Datos de paciente no válidos.");
  }

  const allowedKeys = new Set(["displayName", "phone", "ageYears", "initialMeasurement"]);
  if (Object.keys(input).some((key) => !allowedKeys.has(key))) {
    fail("El formulario contiene campos no permitidos.");
  }

  const displayName = typeof input.displayName === "string" ? input.displayName.trim().replace(/\s+/g, " ") : "";
  if (displayName.length < 2 || displayName.length > MAX_NAME_LENGTH) {
    fail("El nombre debe tener entre 2 y 120 caracteres.");
  }

  let phoneE164 = null;
  if (input.phone !== undefined && input.phone !== null && String(input.phone).trim() !== "") {
    const digits = String(input.phone).replace(/\D/g, "");
    if (digits.length < 8 || digits.length > MAX_PHONE_DIGITS) {
      fail("El teléfono debe contener entre 8 y 15 dígitos.");
    }
    phoneE164 = digits.startsWith("591") ? `+${digits}` : `+591${digits}`;
  }

  const ageYears = optionalNumber(input.ageYears, "edad", 1, 120, true);

  const rawMeasurement = input.initialMeasurement ?? {};
  if (!rawMeasurement || typeof rawMeasurement !== "object" || Array.isArray(rawMeasurement)) {
    fail("La medición inicial no es válida.");
  }

  const allowedMeasurements = new Set(["weightKg", "waistCm", "muscleKg", "bodyFatPct"]);
  if (Object.keys(rawMeasurement).some((key) => !allowedMeasurements.has(key))) {
    fail("La medición inicial contiene campos no permitidos.");
  }

  const initialMeasurement = {};
  const fields = {
    weightKg: [20, 400],
    waistCm: [30, 250],
    muscleKg: [2, 150],
    bodyFatPct: [1, 75]
  };

  for (const [field, [min, max]] of Object.entries(fields)) {
    const value = optionalNumber(rawMeasurement[field], field, min, max);
    if (value !== undefined) initialMeasurement[field] = value;
  }

  return {
    displayName,
    phoneE164,
    ...(ageYears !== undefined ? { ageYears } : {}),
    initialMeasurement
  };
}
