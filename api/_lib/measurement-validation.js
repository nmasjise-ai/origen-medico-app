const MEASUREMENT_LIMITS = {
  weightKg: [20, 400],
  waistCm: [30, 250],
  muscleKg: [2, 150],
  bodyFatPct: [1, 75],
  heightCm: [80, 250]
};

function invalid(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

export function validatePatientMeasurement(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw invalid("Datos de medición no válidos.");
  }

  const keys = Object.keys(input);
  if (keys.some((key) => !Object.hasOwn(MEASUREMENT_LIMITS, key))) {
    throw invalid("La medición contiene campos no permitidos.");
  }

  const result = {};
  for (const key of keys) {
    const value = input[key];
    if (value === "" || value === null || value === undefined) continue;
    const number = Number(value);
    const [min, max] = MEASUREMENT_LIMITS[key];
    if (!Number.isFinite(number) || number < min || number > max) {
      throw invalid(`El valor de ${key} está fuera del rango permitido.`);
    }
    result[key] = number;
  }

  if (Object.keys(result).length === 0) {
    throw invalid("Introduce al menos una medición.");
  }

  return result;
}

export function validatePreviewPatientId(raw) {
  const patientId = Array.isArray(raw) ? raw[0] : raw;
  if (typeof patientId !== "string" || !/^[A-Za-z0-9_-]{8,128}$/.test(patientId)) {
    throw invalid("Identificador de expediente no válido.");
  }
  return patientId;
}
