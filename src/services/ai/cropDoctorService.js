import { apiRequest } from './geminiClient';
import { CONFIG } from '../config';
import { cropDoctorDiagnoses } from '../../data/mockData';
import { buildFarmContext } from '../data/farmContext/farmContextService';

/**
 * Validates the uploaded file before processing
 */
export function validateCropImage(file) {
  if (!file) {
    return { valid: false, error: 'Please select or upload an image file.' };
  }

  if (file.type && !CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return { 
      valid: false, 
      error: `Unsupported image format. Allowed formats: JPG, PNG, WebP.` 
    };
  }

  const maxBytes = CONFIG.MAX_IMAGE_SIZE_MB * 1024 * 1024;
  if (file.size && file.size > maxBytes) {
    return { 
      valid: false, 
      error: `Image exceeds maximum allowed size of ${CONFIG.MAX_IMAGE_SIZE_MB}MB.` 
    };
  }

  return { valid: true };
}

/**
 * Converts a File object to a Base64 string
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Fetches an image URL (such as sample images) and converts to Base64
 */
export async function urlToBase64(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await fileToBase64(blob);
  } catch (e) {
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  }
}

/**
 * Executes Crop Doctor AI analysis via Gemini Multimodal Service
 * with farm telemetry context and evidence breakdown
 */
export async function analyzeCropImage({ file, imageBase64, crop, sampleUrl, farm }) {
  let base64Data = imageBase64;
  let mimeType = file?.type || 'image/jpeg';

  if (!base64Data) {
    if (file) {
      const validation = validateCropImage(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
      try {
        base64Data = await fileToBase64(file);
        mimeType = file.type;
      } catch (err) {
        return { success: false, error: 'Failed to read image file.' };
      }
    } else if (sampleUrl) {
      base64Data = await urlToBase64(sampleUrl);
    } else {
      return { success: false, error: 'No image data provided for analysis.' };
    }
  }

  // Resolve farm context if farm is provided
  let farmContext = null;
  if (farm) {
    try {
      farmContext = await buildFarmContext(farm);
    } catch {
      // Continue without full context
    }
  }

  const payload = {
    crop: crop || 'General Crop',
    imageBase64: base64Data,
    mimeType: mimeType || 'image/jpeg',
    farmContext
  };

  const response = await apiRequest('/ai/crop-doctor', payload, 20000);

  if (response.success && response.data) {
    const result = response.data;
    const confidence = Number(result.confidence) || 0;
    const isLowConfidence = confidence < CONFIG.CONFIDENCE_THRESHOLD_UNCERTAIN;
    const isNotPlant = result.diagnosis_category === 'uncertain' && 
      (result.diagnosis?.toLowerCase().includes('not a plant') || result.diagnosis?.toLowerCase().includes('unable to identify'));

    return {
      success: true,
      data: {
        crop: result.crop || crop,
        plant_part: result.plant_part || 'leaf',
        diagnosis: result.diagnosis || 'Foliar Assessment',
        diagnosis_category: result.diagnosis_category || 'disease',
        confidence: confidence,
        severity: result.severity || 'moderate',
        symptoms: Array.isArray(result.symptoms) ? result.symptoms : [],
        possible_causes: Array.isArray(result.possible_causes) ? result.possible_causes : [],
        recommended_actions: Array.isArray(result.recommended_actions) ? result.recommended_actions : [],
        prevention: Array.isArray(result.prevention) ? result.prevention : [],
        needs_expert_review: result.needs_expert_review !== undefined ? result.needs_expert_review : true,
        uncertainty_reason: result.uncertainty_reason || '',
        evidence: result.evidence || {
          visual: 'Observable foliar discoloration',
          weatherCorrelation: farmContext ? `Observed with current ambient humidity of ${farmContext.weather.current.humidity}%` : 'Standard environmental correlation',
          dataLineage: ['Multimodal Foliar Image', 'Microclimate Telemetry']
        },
        aiMode: result.aiMode || 'prototype',
        model: result.model || 'Gemini Multimodal',
        notice: result.notice || null,
        isLowConfidence,
        isNotPlant
      }
    };
  }

  // Graceful local fallback if server is completely offline
  const fallback = getLocalMockDiagnosis(crop, farmContext);
  return {
    success: true,
    data: {
      ...fallback,
      aiMode: 'prototype',
      model: 'Prototype Model',
      notice: 'Prototype AI mode — connect Gemini API for live analysis.',
      isLowConfidence: false,
      isNotPlant: false
    }
  };
}

function getLocalMockDiagnosis(crop = 'Wheat', farmContext = null) {
  const c = (crop || 'Wheat').toLowerCase();
  const matched = cropDoctorDiagnoses.find(d => (d.cropName || '').toLowerCase().includes(c)) || cropDoctorDiagnoses[0];

  return {
    crop: matched.cropName || crop,
    plant_part: 'leaf',
    diagnosis: matched.diagnosis,
    diagnosis_category: 'disease',
    confidence: matched.confidence || 87,
    severity: (matched.severity || 'Moderate').toLowerCase(),
    symptoms: matched.symptoms || ['Discolored leaf margins', 'Reduced photosynthetic area'],
    possible_causes: [
      'Elevated canopy humidity',
      'Atmospheric pathogen spores transported by wind'
    ],
    recommended_actions: [
      'Inspect surrounding rows to determine spread boundary',
      'Prune and safely isolate heavily infected lower foliage',
      'Optimize morning drip irrigation to prevent standing leaf wetness',
      'Consult local extension agronomist for certified intervention protocols'
    ],
    prevention: [
      'Implement seasonal crop rotation',
      'Maintain balanced potassium-nitrogen ratios',
      'Source certified disease-free seed batches'
    ],
    needs_expert_review: true,
    uncertainty_reason: '',
    evidence: {
      visual: 'Distinct foliar margins with localized chlorosis',
      weatherCorrelation: farmContext ? `Correlates with recent relative humidity of ${farmContext.weather.current.humidity}%` : 'Elevated microclimate moisture',
      dataLineage: ['RGB Foliar Image', 'Open-Meteo Weather Stream']
    }
  };
}
