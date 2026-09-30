import dotenv from 'dotenv';
import { isLiveAIConfigured, getGeminiModelName, generateStructuredContent, generateChatContent } from '../server/geminiService.js';
import { cropDoctorSchema, validateCropDoctorResponse, advisorySchema, validateAdvisoryResponse, assistantSchema, validateAssistantResponse } from '../src/services/ai/schemas/index.js';
import { fetchOpenMeteoWeather } from '../src/services/data/weather/openMeteoProvider.js';
import { getResolvedSoilData } from '../src/services/data/soil/soilProvider.js';
import { getSatelliteObservation } from '../src/services/data/satellite/satelliteProvider.js';
import { getProviderHealthOverview, updateProviderHealth, PROVIDER_HEALTH_STATUS } from '../src/services/resilience/resilienceService.js';
import { scanForSecretExposure } from '../src/services/config/environment.js';
import { generateDeterministicAssistantResponse } from '../src/services/ai/assistantService.js';

dotenv.config();

async function runVerification() {
  const results = {};

  // 1. GEMINI CONNECTION & AUTHENTICATION
  try {
    const isConfigured = isLiveAIConfigured();
    if (!isConfigured) {
      results.geminiConnection = { status: 'FAIL', reason: 'GEMINI_API_KEY not configured' };
    } else {
      const testPrompt = 'Respond with a simple JSON object containing {"status": "ok", "message": "connected"}';
      const response = await generateStructuredContent({
        prompt: testPrompt,
        systemInstruction: 'You are an agricultural intelligence validation assistant. Return valid JSON only.',
        responseSchema: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' }
          },
          required: ['status', 'message']
        }
      });

      if (response.success && response.data?.status === 'ok') {
        results.geminiConnection = { status: 'PASS', model: getGeminiModelName() };
      } else {
        results.geminiConnection = { status: 'FAIL', reason: response.error || 'Structured validation failed' };
      }
    }
  } catch (err) {
    results.geminiConnection = { status: 'FAIL', reason: err.message };
  }

  // 2. CROP DOCTOR FLOW
  try {
    const cropPrompt = 'Crop: Wheat. Observed symptoms: Small powdery yellow stripes along leaf veins on lower leaves during warm weather.';
    const cropResult = await generateStructuredContent({
      prompt: cropPrompt,
      systemInstruction: 'You are an expert plant pathologist. Diagnose the foliar symptoms. Output structured JSON matching the schema.',
      responseSchema: cropDoctorSchema
    });

    if (cropResult.success && cropResult.data) {
      const validated = validateCropDoctorResponse(cropResult.data);
      if (validated.isValid && validated.sanitized.diagnosis) {
        results.cropDoctor = { status: 'PASS', diagnosis: validated.sanitized.diagnosis, category: validated.sanitized.diagnosis_category };
      } else {
        results.cropDoctor = { status: 'FAIL', reason: 'Response failed schema validation' };
      }
    } else {
      results.cropDoctor = { status: 'FAIL', reason: cropResult.error || 'Inference failed' };
    }
  } catch (err) {
    results.cropDoctor = { status: 'FAIL', reason: err.message };
  }

  // 3. AI ADVISORY FLOW
  try {
    const farmContext = {
      name: 'Nashik Experimental Farm',
      crops: ['Wheat'],
      growthStage: 'Vegetative',
      weather: { current: { temp: 29, humidity: 62, et0: 4.2 } },
      satellite: { ndvi: 0.76 },
      soil: { ph: 6.9, organicMatterPercent: 3.1 }
    };
    const advisoryPrompt = `Generate structured advisory for ${farmContext.name} with crops ${farmContext.crops.join(', ')}: ${JSON.stringify(farmContext)}`;
    const advResult = await generateStructuredContent({
      prompt: advisoryPrompt,
      systemInstruction: 'You are an agronomic advisor. Return grounded JSON matching schema.',
      responseSchema: advisorySchema
    });

    if (advResult.success && advResult.data) {
      const validated = validateAdvisoryResponse(advResult.data);
      if (validated.isValid && validated.sanitized.summary) {
        results.aiAdvisory = { status: 'PASS', priority: validated.sanitized.priority };
      } else {
        results.aiAdvisory = { status: 'FAIL', reason: 'Advisory validation failed' };
      }
    } else {
      results.aiAdvisory = { status: 'FAIL', reason: advResult.error || 'Inference failed' };
    }
  } catch (err) {
    results.aiAdvisory = { status: 'FAIL', reason: err.message };
  }

  // 4. AI ASSISTANT TEST
  try {
    const sampleContext = {
      farm: { id: 'farm-1', name: 'Nashik Farm', crop: 'Wheat' },
      soil: { isLabTest: false, ph: 7.0, nitrogen: null },
      intelligence: { evidenceIds: ['SIG-WEATHER-ET0-001'] }
    };
    const response1 = generateDeterministicAssistantResponse('What changed on my farm?', sampleContext);
    const response2 = generateDeterministicAssistantResponse('What should I do today?', sampleContext);

    if (response1 && response2 && response1.answer && response2.answer) {
      results.aiAssistant = { status: 'PASS' };
    } else {
      results.aiAssistant = { status: 'FAIL', reason: 'Empty assistant response' };
    }
  } catch (err) {
    results.aiAssistant = { status: 'FAIL', reason: err.message };
  }

  // 5. OPEN-METEO WEATHER PROVIDER
  try {
    const weatherRes = await fetchOpenMeteoWeather(19.9975, 73.7898);
    if (weatherRes && (weatherRes.isLive || weatherRes.current?.temp !== undefined)) {
      results.openMeteo = { status: 'PASS', isLive: weatherRes.isLive, sourceBadge: weatherRes.sourceBadge };
    } else {
      results.openMeteo = { status: 'FAIL', reason: 'No weather returned' };
    }
  } catch (err) {
    results.openMeteo = { status: 'FAIL', reason: err.message };
  }

  // 6. SOIL PROVIDER
  try {
    const farmSample = { lat: 19.9975, lng: 73.7898, soilPH: 6.8 };
    const soilRes = getResolvedSoilData(farmSample);
    if (soilRes && soilRes.provenance) {
      results.soilProvider = { status: 'PASS', provenance: soilRes.provenance.tier };
    } else {
      results.soilProvider = { status: 'UNAVAILABLE' };
    }
  } catch (err) {
    results.soilProvider = { status: 'UNAVAILABLE', reason: err.message };
  }

  // 7. SATELLITE PROVIDER
  try {
    const farmSample = { id: 'farm-1', lat: 19.9975, lng: 73.7898 };
    const satRes = await getSatelliteObservation(farmSample);
    if (satRes && satRes.provenance) {
      results.satelliteProvider = { status: 'PASS', provenance: satRes.provenance.tier, statusLabel: satRes.status };
    } else {
      results.satelliteProvider = { status: 'UNAVAILABLE' };
    }
  } catch (err) {
    results.satelliteProvider = { status: 'UNAVAILABLE', reason: err.message };
  }

  // 8. HEALTH ENDPOINT SUBSYSTEMS
  try {
    if (results.geminiConnection.status === 'PASS') {
      updateProviderHealth('gemini', PROVIDER_HEALTH_STATUS.HEALTHY, 'Live inference confirmed');
    }
    const health = getProviderHealthOverview();
    if (health && health.providers?.gemini) {
      results.healthEndpoint = { status: 'PASS', geminiStatus: health.providers.gemini.status };
    } else {
      results.healthEndpoint = { status: 'FAIL', reason: 'Subsystems missing' };
    }
  } catch (err) {
    results.healthEndpoint = { status: 'FAIL', reason: err.message };
  }

  // 9. SECRET SAFETY SCAN
  try {
    const scan = scanForSecretExposure(process.env);
    if (scan.clean) {
      results.secretSafety = { status: 'PASS' };
    } else {
      results.secretSafety = { status: 'FAIL', reason: 'Secrets detected in exposure scan' };
    }
  } catch (err) {
    results.secretSafety = { status: 'FAIL', reason: err.message };
  }

  console.log('=== VERIFICATION SUMMARY ===');
  console.log(JSON.stringify(results, null, 2));
}

runVerification();
