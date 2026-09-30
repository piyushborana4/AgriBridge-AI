/**
 * Deterministic Recommendation & Opportunity Engine
 * Prioritizes grounded, actionable field operations and captures positive opportunities.
 */
export function generateCandidateRecommendations(riskIndexOrContext, farmContextOpt = null, evidenceItems = []) {
  const recommendations = [];

  let riskIndex = riskIndexOrContext;
  let farmContext = farmContextOpt || {};

  if (riskIndexOrContext && riskIndexOrContext.name && !riskIndexOrContext.risks) {
    farmContext = riskIndexOrContext;
    riskIndex = { risks: [] };
  }

  const risks = riskIndex?.risks || [];
  const getEvidenceIds = (pattern) => {
    return (evidenceItems || [])
      .filter(e => (e.title + ' ' + e.description + ' ' + e.source).toLowerCase().includes(pattern.toLowerCase()))
      .map(e => e.id);
  };

  const waterRisk = risks.find(r => r.category === 'water');
  const vegRisk = risks.find(r => r.category === 'vegetation');
  const weatherRisk = risks.find(r => r.category === 'weather');
  const diseaseRisk = risks.find(r => r.category === 'disease');
  const soilRisk = risks.find(r => r.category === 'soil');

  // 1. Water & Irrigation Recommendation
  if (waterRisk && waterRisk.score >= 50) {
    const evIds = getEvidenceIds('moisture').concat(getEvidenceIds('rainfall')).concat(getEvidenceIds('water'));
    recommendations.push({
      id: 'rec-water-irrigation-urgent',
      urgency: 'immediate',
      category: 'irrigation',
      title: 'Emergency Deficit Micro-Irrigation',
      action: 'Initiate targeted morning drip cycle before 10:00 AM to restore root-zone field capacity.',
      rationale: waterRisk.description || 'Elevated evaporative water loss and soil moisture deficit.',
      evidenceIds: evIds.length > 0 ? evIds.slice(0, 2) : (evidenceItems.length > 0 ? [evidenceItems[0].id] : []),
      impact: 'Prevents cellular dehydration and stomatal closure.'
    });
  } else if (waterRisk && waterRisk.score >= 35) {
    recommendations.push({
      id: 'rec-water-irrigation-regular',
      urgency: 'this_week',
      category: 'irrigation',
      title: 'Schedule Morning Drip Irrigation Cycle',
      action: 'Run scheduled drip lines for 45 minutes in early morning to minimize solar evaporation.',
      rationale: 'Moderate evapotranspiration rate with low forecast precipitation.',
      evidenceIds: evidenceItems.slice(0, 1).map(e => e.id),
      impact: 'Maintains optimal soil matrix potential.'
    });
  }

  // 2. Weather & Drainage
  if (weatherRisk && weatherRisk.description && (weatherRisk.description.includes('Heavy') || weatherRisk.description.includes('rain'))) {
    recommendations.push({
      id: 'rec-weather-drainage',
      urgency: 'immediate',
      category: 'operational',
      title: 'Clear Field Drainage Trenches & Silt Traps',
      action: 'Inspect plot perimeters and clear drainage furrows to prevent standing water and root asphyxiation.',
      rationale: 'Heavy accumulated rainfall recorded across the parcel.',
      evidenceIds: getEvidenceIds('rainfall').slice(0, 2),
      impact: 'Prevents root-zone hypoxia and fungal damping-off.'
    });
  }

  // 3. Vegetation Stress & Ground Scouting (Safety rule: Never prescribe chemical dosage)
  if (vegRisk && vegRisk.score >= 35) {
    recommendations.push({
      id: 'rec-vegetation-scouting',
      urgency: 'immediate',
      category: 'crop_protection',
      title: 'Targeted Ground Scouting for Foliar Symptoms',
      action: 'Walk the southern and lowland parcels to inspect leaf coloration, collar borders, and root tips.',
      rationale: 'Satellite vegetation index indicates localized vigor reduction.',
      evidenceIds: getEvidenceIds('NDVI').concat(getEvidenceIds('vegetation')).slice(0, 2),
      impact: 'Detects abiotic stress or early pest foci before widespread canopy loss.'
    });
  }

  // 4. Disease Conduciveness & Microclimate Aeration
  if (diseaseRisk && diseaseRisk.score >= 40) {
    recommendations.push({
      id: 'rec-disease-prevention',
      urgency: 'this_week',
      category: 'crop_protection',
      title: 'Canopy Aeration & Preventative Disease Scouting',
      action: 'Prune congested lower foliage to improve inter-row air circulation. If spots appear, scan with Crop Doctor and consult local KVK.',
      rationale: 'Persistent relative humidity and moderate temperatures create high spore germination potential.',
      evidenceIds: getEvidenceIds('humidity').slice(0, 2),
      impact: 'Reduces foliar microclimate humidity and suppresses fungal colonization.'
    });
  }

  // 5. Soil Management
  if (soilRisk && soilRisk.score >= 35) {
    recommendations.push({
      id: 'rec-soil-amendment',
      urgency: 'monitor',
      category: 'soil_management',
      title: 'Organic Soil Amendment Planning',
      action: 'Plan application of well-rotted farmyard manure or vermicompost to buffer soil reaction and enhance organic matter.',
      rationale: 'Soil reaction or organic carbon levels require seasonal replenishment.',
      evidenceIds: getEvidenceIds('soil').slice(0, 2),
      impact: 'Improves cation exchange capacity and beneficial rhizosphere microbial diversity.'
    });
  }

  // Default baseline recommendation if none triggered
  if (recommendations.length === 0) {
    recommendations.push({
      id: 'rec-standard-scouting',
      urgency: 'monitor',
      category: 'operational',
      title: 'Routine Agronomic Field Scouting',
      action: 'Conduct routine weekly crop inspection and maintain standard irrigation schedule.',
      rationale: 'All primary telemetry indices (NDVI, soil moisture, weather) are within optimal bounds.',
      evidenceIds: evidenceItems.slice(0, 2).map(e => e.id),
      impact: 'Maintains steady crop vigor and prevents unexpected yield losses.'
    });
  }

  return recommendations;
}

export function extractOpportunities(farmContext, riskIndex) {
  const opportunities = [];
  if (riskIndex?.overallScore <= 25) {
    opportunities.push({
      id: 'opp-optimal-vigor',
      title: 'Optimal Crop Growth Window',
      description: 'Canopy vigor, moisture balance, and weather forecast are aligned for maximum photosynthetic expansion.',
      potentialYieldGain: '5–8%'
    });
  }
  return opportunities;
}
