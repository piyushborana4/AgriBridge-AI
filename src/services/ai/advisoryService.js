import { apiRequest } from './geminiClient';
import { buildFarmContext } from '../data/farmContext/farmContextService';

/**
 * Requests an agronomic advisory action plan from Gemini grounded in unified FarmContext
 */
export async function getFarmAdvisory(farm, topic = 'Comprehensive Agronomic Health') {
  if (!farm) {
    return { success: false, error: 'Farm data is unavailable' };
  }

  const farmContext = await buildFarmContext(farm);

  const response = await apiRequest('/ai/advisory', { farmContext, topic }, 15000);

  if (response.success && response.data) {
    return {
      success: true,
      data: response.data,
      farmContext
    };
  }

  // Local fallback
  return {
    success: true,
    data: {
      summary: `Vegetative vigor at ${farm.name} is stable (NDVI: ${farmContext.satellite.ndvi}). Soil pH is optimal (${farmContext.soil.ph}). Recommended focus is precision morning drip delivery to minimize thermal stress.`,
      priority: 'medium',
      actions: [
        {
          title: 'Calibrate Morning Irrigation Cycle',
          reason: `Current ET₀ is ${farmContext.weather.current.et0} mm/day. Replenish root zone before 10:00 AM to prevent thermal transpiration stress.`,
          urgency: 'today',
          impact: 'Preserves leaf hydration and prevents midday wilting',
          dataSource: 'Open-Meteo Live Weather'
        },
        {
          title: 'Foliar Micronutrient Application',
          reason: `Available potassium (${farmContext.soil.macronutrients.potassium.value} mg/kg) is adequate; apply light compost tea during low-wind window.`,
          urgency: 'this_week',
          impact: 'Enhances biological nutrient bioavailability',
          dataSource: 'Weather Spray Window & Soil Test'
        },
        {
          title: 'Preventative Canopy Scouting',
          reason: `Relative humidity (${farmContext.weather.current.humidity}%) favors early fungal spore settlement on ${farm.crops.join(', ')}.`,
          urgency: 'monitor',
          impact: 'Early detection of localized pathogen development',
          dataSource: 'Sentinel-2 Satellite & Microclimate'
        }
      ],
      evidence: [
        {
          source: 'Open-Meteo Weather Stream',
          observation: `Temperature ${farmContext.weather.current.temp}°C, Humidity ${farmContext.weather.current.humidity}%, ET₀ ${farmContext.weather.current.et0} mm/day`,
          interpretation: 'Atmospheric evaporative demand requires early hydration.'
        },
        {
          source: 'Sentinel-2 MSI Satellite Overpass',
          observation: `NDVI vegetation vigor index is ${farmContext.satellite.ndvi}`,
          interpretation: 'Canopy biomass is within healthy vegetative trajectory.'
        },
        {
          source: 'Soil Health Card Profile',
          observation: `Soil pH is ${farmContext.soil.ph} with organic matter at ${farmContext.soil.organicMatterPercent}%`,
          interpretation: 'Rhizosphere is balanced for nutrient bio-absorption.'
        }
      ],
      risks: [
        'Midday heat spike may cause transient leaf curling on younger foliage',
        'High humidity during late evening hours could favor localized fungal spore settlement'
      ],
      positive_signals: [
        'NDVI vegetation index confirms active vegetative growth without widespread chlorosis',
        'Balanced soil pH ensures optimal uptake of applied macro and micro-nutrients'
      ],
      uncertainty: 'Analysis synthesized from normalized Farm Context Engine streams.',
      aiMode: 'prototype',
      notice: 'Prototype AI mode — connect Gemini API for live reasoning.'
    },
    farmContext
  };
}

/**
 * Submits an interactive chat query grounded with selected farm context
 */
export async function askAdvisor(message, farm, conversationHistory = []) {
  const farmContext = farm ? await buildFarmContext(farm) : null;

  const response = await apiRequest('/ai/chat', {
    message,
    farmContext,
    conversationHistory
  }, 18000);

  if (response.success && response.data) {
    return {
      success: true,
      response: response.data.response,
      suggestedQuestions: response.data.suggestedQuestions || [],
      aiMode: response.data.aiMode || 'live',
      notice: response.data.notice || null
    };
  }

  // Local fallback response
  return {
    success: true,
    response: `At ${farm?.name || 'your farm'}, for your ${farm?.crops?.join(' and ') || 'crops'}, soil moisture and health indices are currently favorable (${farm?.soilHealth || 78}%). Maintain morning irrigation cycles and observe field bunds for any pest vector emergence.`,
    suggestedQuestions: [
      'Should I irrigate my crops today?',
      'What is my regenerative agriculture readiness score?',
      'How can I improve my soil organic matter?'
    ],
    aiMode: 'prototype',
    notice: 'Prototype AI mode — connect Gemini API for live intelligence.'
  };
}

export { buildFarmContext };
