function validateReading(reading) {
  if (!reading || typeof reading !== "object") {
    return {
      valid: false,
      message: "La mesure doit être un objet.",
    };
  }

  if (
    typeof reading.sensorId !== "string" ||
    reading.sensorId.trim() === ""
  ) {
    return {
      valid: false,
      message: "sensorId doit être une chaîne non vide.",
    };
  }

  if (
    typeof reading.temperature !== "number" ||
    Number.isNaN(reading.temperature)
  ) {
    return {
      valid: false,
      message: "temperature doit être un nombre.",
    };
  }

  if (
    typeof reading.humidity !== "number" ||
    Number.isNaN(reading.humidity)
  ) {
    return {
      valid: false,
      message: "humidity doit être un nombre.",
    };
  }

  if (reading.humidity < 0 || reading.humidity > 100) {
    return {
      valid: false,
      message: "humidity doit être comprise entre 0 et 100.",
    };
  }

  if (
    typeof reading.timestamp !== "string" ||
    Number.isNaN(Date.parse(reading.timestamp))
  ) {
    return {
      valid: false,
      message: "timestamp doit être une date valide.",
    };
  }

  return {
    valid: true,
    message: "Mesure valide.",
  };
}

module.exports = {
  validateReading,
};