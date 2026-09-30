/**
 * AgriBridge AI - Intelligence Type Definitions & Schema Contracts
 * Provides canonical TypeScript/JSDoc type specifications for deterministic signals,
 * risks, evidence lineage, and AI decision structures.
 */

/**
 * @typedef {'weather' | 'satellite' | 'soil' | 'crop' | 'disease' | 'irrigation' | 'history'} SignalType
 * @typedef {'increasing' | 'decreasing' | 'stable' | 'unknown'} SignalDirection
 * @typedef {'normal' | 'watch' | 'warning' | 'critical' | 'unknown'} SignalStatus
 * @typedef {'high' | 'medium' | 'low' | 'unknown'} DataQualityLevel
 * 
 * @typedef {Object} FarmSignal
 * @property {string} id
 * @property {SignalType} type
 * @property {string} metric
 * @property {number | string | null} value
 * @property {string} [unit]
 * @property {string} [timestamp]
 * @property {SignalDirection} [direction]
 * @property {SignalStatus} [status]
 * @property {string} source
 * @property {DataQualityLevel} dataQuality
 * @property {string} [description]
 */

/**
 * @typedef {'water_stress' | 'heat_stress' | 'cold_stress' | 'disease' | 'pest' | 'rainfall' | 'soil' | 'vegetation' | 'field_operation' | 'other'} RiskCategory
 * @typedef {'low' | 'moderate' | 'high' | 'critical' | 'unknown'} RiskLevel
 * @typedef {'today' | 'this_week' | 'monitor' | 'none'} RiskUrgency
 * 
 * @typedef {Object} FarmRisk
 * @property {string} id
 * @property {RiskCategory} category
 * @property {RiskLevel} level
 * @property {number} score - Normalized 0-100 numerical risk component
 * @property {string} title
 * @property {string} summary
 * @property {string[]} evidence
 * @property {'low' | 'moderate' | 'high' | 'unknown'} likelihood
 * @property {'low' | 'moderate' | 'high' | 'unknown'} impact
 * @property {string} [recommendedAction]
 * @property {RiskUrgency} urgency
 */

/**
 * @typedef {'irrigation' | 'crop_monitoring' | 'field_operation' | 'soil' | 'disease' | 'weather' | 'regenerative' | 'general'} RecommendationCategory
 * 
 * @typedef {Object} FarmRecommendation
 * @property {string} id
 * @property {string} title
 * @property {string} action
 * @property {string} reason
 * @property {'low' | 'medium' | 'high'} priority
 * @property {'today' | 'this_week' | 'monitor'} urgency
 * @property {string[]} evidenceIds
 * @property {'high' | 'moderate' | 'low'} confidence
 * @property {boolean} requiresVerification
 * @property {RecommendationCategory} category
 * @property {string} [expectedBenefit]
 */

/**
 * @typedef {Object} EvidenceItem
 * @property {string} id
 * @property {'weather' | 'satellite' | 'soil' | 'crop' | 'crop_doctor' | 'history'} source
 * @property {string} observation
 * @property {string} [value]
 * @property {string} [timestamp]
 * @property {'high' | 'medium' | 'low'} quality
 * @property {string} [interpretation]
 */

/**
 * @typedef {Object} FarmAnomaly
 * @property {string} id
 * @property {string} metric
 * @property {'normal' | 'watch' | 'declining' | 'rapid_decline' | 'insufficient_data'} status
 * @property {number} changePct
 * @property {string} description
 * @property {string} detectedAt
 */

/**
 * @typedef {Object} FarmOpportunity
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} category
 */

/**
 * @typedef {Object} DataQualitySummary
 * @property {number} overallScore - 0 to 100
 * @property {'high' | 'moderate' | 'partial' | 'insufficient'} rating
 * @property {Array<{ stream: string, status: string, quality: string, ageHours?: number }>} streams
 */

/**
 * @typedef {'healthy' | 'watch' | 'attention' | 'critical' | 'insufficient_data'} OverallFarmStatus
 * 
 * @typedef {Object} FarmIntelligence
 * @property {string} farmId
 * @property {string} farmName
 * @property {string} generatedAt
 * @property {OverallFarmStatus} overallStatus
 * @property {number} farmRiskIndex - Normalized 0 to 100 aggregated risk
 * @property {RiskLevel} riskLevel
 * @property {FarmSignal[]} signals
 * @property {FarmRisk[]} risks
 * @property {FarmOpportunity[]} opportunities
 * @property {FarmRecommendation[]} recommendations
 * @property {FarmAnomaly[]} anomalies
 * @property {EvidenceItem[]} evidence
 * @property {DataQualitySummary} dataQuality
 * @property {string[]} limitations
 * @property {Object} [whatChanged]
 * @property {Object} [brief]
 */

export const EMPTY_INTELLIGENCE = {
  farmId: '',
  farmName: '',
  generatedAt: new Date().toISOString(),
  overallStatus: 'insufficient_data',
  farmRiskIndex: 0,
  riskLevel: 'unknown',
  signals: [],
  risks: [],
  opportunities: [],
  recommendations: [],
  anomalies: [],
  evidence: [],
  dataQuality: { overallScore: 0, rating: 'insufficient', streams: [] },
  limitations: ['Insufficient telemetry streams to compile farm intelligence.']
};
