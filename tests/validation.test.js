const { validateReading } = require("../src/validation");

describe("validateReading", () => {
  test("accepte une mesure valide", () => {
    const reading = {
      sensorId: "soil-01",
      temperature: 31.2,
      humidity: 24.7,
      timestamp: "2026-08-03T20:00:00Z",
    };

    const result = validateReading(reading);

    expect(result.valid).toBe(true);
    expect(result.message).toBe("Mesure valide.");
  });

  test("rejette un objet nul", () => {
    const result = validateReading(null);

    expect(result.valid).toBe(false);
    expect(result.message).toBe("La mesure doit être un objet.");
  });

  test("rejette sensorId manquant", () => {
    const reading = {
      temperature: 31.2,
      humidity: 24.7,
      timestamp: "2026-08-03T20:00:00Z",
    };

    const result = validateReading(reading);

    expect(result.valid).toBe(false);
    expect(result.message).toBe("sensorId doit être une chaîne non vide.");
  });

  test("rejette sensorId vide", () => {
    const reading = {
      sensorId: "   ",
      temperature: 31.2,
      humidity: 24.7,
      timestamp: "2026-08-03T20:00:00Z",
    };

    const result = validateReading(reading);

    expect(result.valid).toBe(false);
    expect(result.message).toBe("sensorId doit être une chaîne non vide.");
  });

  test("rejette temperature non nombre", () => {
    const reading = {
      sensorId: "soil-01",
      temperature: "31.2",
      humidity: 24.7,
      timestamp: "2026-08-03T20:00:00Z",
    };

    const result = validateReading(reading);

    expect(result.valid).toBe(false);
    expect(result.message).toBe("temperature doit être un nombre.");
  });

  test("rejette humidity non nombre", () => {
    const reading = {
      sensorId: "soil-01",
      temperature: 31.2,
      humidity: "24.7",
      timestamp: "2026-08-03T20:00:00Z",
    };

    const result = validateReading(reading);

    expect(result.valid).toBe(false);
    expect(result.message).toBe("humidity doit être un nombre.");
  });

  test("rejette humidity < 0", () => {
    const reading = {
      sensorId: "soil-01",
      temperature: 31.2,
      humidity: -5,
      timestamp: "2026-08-03T20:00:00Z",
    };

    const result = validateReading(reading);

    expect(result.valid).toBe(false);
    expect(result.message).toBe("humidity doit être comprise entre 0 et 100.");
  });

  test("rejette humidity > 100", () => {
    const reading = {
      sensorId: "soil-01",
      temperature: 31.2,
      humidity: 125,
      timestamp: "2026-08-03T20:00:00Z",
    };

    const result = validateReading(reading);

    expect(result.valid).toBe(false);
    expect(result.message).toBe("humidity doit être comprise entre 0 et 100.");
  });

  test("rejette timestamp invalide", () => {
    const reading = {
      sensorId: "soil-01",
      temperature: 31.2,
      humidity: 24.7,
      timestamp: "date-invalide",
    };

    const result = validateReading(reading);

    expect(result.valid).toBe(false);
    expect(result.message).toBe("timestamp doit être une date valide.");
  });
});