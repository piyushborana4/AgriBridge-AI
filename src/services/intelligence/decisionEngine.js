/**
 * Decision Engine - AgriBridge AI (Phase 4)
 * Bridges deterministic intelligence with AI reasoning and explanation.
 * Sends precalculated telemetry and evidence to Gemini and validates the structured output.
 */

import { compileFarmIntelligence } from './farmIntelligenceService.js';
import { validateAIOutput, fallbackSanitizedBrief } from './aiSafetyValidator.js';

/**
 * Generates an AI-reasoned Farm Intelligence Brief grounded in deterministic evidence.
 * @param {Object} farmContext - Unified Farm Context
 * @param {Object} options - Language, previous context, etc.
 * @returns {Promise<Object>} Final intelligence response with deterministic data and AI reasoning
 */
export async function generateFarmIntelligenceBrief(farmContext, options = {}) {
  const language = options.language || 'en';
  const alertHistory = options.alertHistory || [];
  const userActions = options.userActions || [];
  const previousContext = options.previousContext || null;

  // 1. Compile deterministic baseline
  const deterministicIntelligence = compileFarmIntelligence(
    farmContext,
    previousContext,
    alertHistory,
    userActions
  );

  // 2. Attempt AI reasoning via backend API
  try {
    const response = await fetch('/api/intelligence/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmIntelligence: deterministicIntelligence,
        language
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.brief) {
        // Validate with AI Safety Validator
        const validation = validateAIOutput(data.brief, deterministicIntelligence);
        return {
          deterministic: deterministicIntelligence,
          brief: validation.sanitizedOutput,
          safetyValidation: validation,
          source: 'gemini-grounded'
        };
      }
    }
  } catch (err) {
    console.warn('[DecisionEngine] Backend AI evaluation unavailable, using deterministic fallback brief:', err.message);
  }

  // 3. Deterministic Fallback Brief
  const fallback = fallbackSanitizedBrief(deterministicIntelligence);
  return {
    deterministic: deterministicIntelligence,
    brief: fallback,
    safetyValidation: { isValid: true, violations: [], sanitizedOutput: fallback },
    source: 'deterministic-rule-engine'
  };
}

/**
 * Simulates a "What If?" hypothetical agronomic scenario.
 * @param {Object} farmContext - Current Farm Context
 * @param {Object} scenarioParams - e.g. { rainfallModifier: -50, tempModifier: +3, daysWithoutRain: 7 }
 * @returns {Object} Hypothetical scenario evaluation
 */
export function simulateAgronomicScenario(farmContext, scenarioParams = {}) {
  if (!farmContext) return null;

  // Clone farm context for simulation
  const simulatedContext = JSON.parse(JSON.stringify(farmContext));
  
  if (scenarioParams.rainfallModifier !== undefined && simulatedContext.weather) {
    const currentRain = simulatedContext.weather.rainfall7d || 0;
    simulatedContext.weather.rainfall7d = Math.max(0, currentRain + scenarioParams.rainfallModifier);
  }
  
  if (scenarioParams.tempModifier !== undefined && simulatedContext.weather) {
    simulatedContext.weather.temperature = (simulatedContext.weather.temperature || 28) + scenarioParams.tempModifier;
    simulatedContext.weather.tempMax = (simulatedContext.weather.tempMax || 32) + scenarioParams.tempModifier;
  }

  if (scenarioParams.soilMoistureDrop !== undefined && simulatedContext.soil?.moisture) {
    simulatedContext.soil.moisture.surface = Math.max(5, (simulatedContext.soil.moisture.surface || 40) - scenarioParams.soilMoistureDrop);
  }

  // Compile intelligence on simulated state
  const simulatedIntelligence = compileFarmIntelligence(simulatedContext, farmContext);
  
  // Tag as hypothetical
  return {
    isHypothetical: true,
    scenarioName: scenarioParams.name || 'Custom Simulation',
    scenarioDescription: scenarioParams.description || 'Hypothetical environmental modification',
    baselineRisk: farmContext.riskScore || 25,
    simulatedRisk: simulatedIntelligence.riskIndex.overallScore,
    riskDelta: simulatedIntelligence.riskIndex.overallScore - (farmContext.riskScore || 25),
    simulatedIntelligence
  };
}
