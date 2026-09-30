/**
 * AgriBridge AI — Agronomic Knowledge Model & Literature Citations
 * Links deterministic calculations to established agricultural literature and research institutions.
 */

export const AGRONOMIC_KNOWLEDGE_BASE = {
  water_balance_fao56: {
    id: 'KB-FAO-56',
    title: 'FAO Irrigation and Drainage Paper No. 56: Crop Evapotranspiration',
    authors: 'Allen, R. G., Pereira, L. S., Raes, D., & Smith, M. (1998)',
    publisher: 'Food and Agriculture Organization of the United Nations (FAO), Rome',
    keyConcepts: [
      'Dual crop coefficient (Kc) approach for actual evapotranspiration ETc',
      'Hargreaves and Penman-Monteith reference ET₀ formulations',
      'Root zone depletion and yield response factor (Ky) to water deficit'
    ],
    application: 'Used for water balance, ETc calculations, and irrigation timing advisory.'
  },
  icar_onion_management: {
    id: 'KB-ICAR-DOGR',
    title: 'Good Agricultural Practices for Onion and Garlic',
    authors: 'ICAR - Directorate of Onion and Garlic Research (DOGR)',
    publisher: 'Indian Council of Agricultural Research, Rajgurunagar, Pune',
    keyConcepts: [
      'Phenological stage duration and water sensitivity during bulb initiation',
      'Purple Blotch (Alternaria porri) microclimate infection thresholds (T: 20-30°C, RH >80%)',
      'Withholding irrigation 10-15 days prior to harvest for bulb curing'
    ],
    application: 'Used for onion growth stage profiling and disease conduciveness modeling.'
  },
  irri_rice_knowledge_bank: {
    id: 'KB-IRRI-RKB',
    title: 'Rice Knowledge Bank & Standard Evaluation System',
    authors: 'International Rice Research Institute (IRRI)',
    publisher: 'IRRI, Los Baños, Philippines',
    keyConcepts: [
      'Alternate Wetting and Drying (AWD) water management',
      'High-temperature spikelet sterility thresholds (>35°C during anthesis)',
      'Magnaporthe oryzae (Rice Blast) sporulation humidity dependencies'
    ],
    application: 'Used for paddy phenology, heatwave spikelet risk, and blast favorability.'
  },
  cimmyt_wheat_maize: {
    id: 'KB-CIMMYT-AGRO',
    title: 'Agronomic Principles of Wheat & Maize Production in Low-Latitude Environments',
    authors: 'CIMMYT Global Conservation Agriculture Program',
    publisher: 'International Maize and Wheat Improvement Center, Mexico',
    keyConcepts: [
      'Crown root initiation (CRI) critical water timing',
      'Terminal heat stress mitigation during grain filling',
      'Anthesis-silking interval (ASI) drought sensitivity in maize'
    ],
    application: 'Used for wheat and maize phenology and climate risk evaluations.'
  },
  soil_water_usda: {
    id: 'KB-USDA-NRCS-SOIL',
    title: 'Soil Quality and Available Water Capacity Field Reference',
    authors: 'USDA Natural Resources Conservation Service (NRCS)',
    publisher: 'United States Department of Agriculture',
    keyConcepts: [
      'Soil texture classification vs Available Water Capacity (AWC)',
      'Organic matter influence on water retention and soil aggregation',
      'Infiltration rate and aeration porosity dynamics'
    ],
    application: 'Used in Soil-Water Dynamics engine for waterlogging and drought risk calculations.'
  }
};

/**
 * Retrieves knowledge citations relevant to a given crop or topic
 */
export function getAgronomicCitations(topicOrCrop) {
  if (!topicOrCrop) return Object.values(AGRONOMIC_KNOWLEDGE_BASE);
  const query = topicOrCrop.toLowerCase();
  return Object.values(AGRONOMIC_KNOWLEDGE_BASE).filter(entry => 
    entry.title.toLowerCase().includes(query) ||
    entry.application.toLowerCase().includes(query) ||
    entry.keyConcepts.some(c => c.toLowerCase().includes(query))
  );
}
