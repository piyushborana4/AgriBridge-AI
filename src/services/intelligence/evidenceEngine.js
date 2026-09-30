/**
 * Deterministic Evidence Engine - AgriBridge AI (Phase 4.5)
 * Converts raw sensor streams, anomalies, and satellite observations into traceable EvidenceItem contracts.
 * Assigns canonical evidence IDs (e.g. SIG-SAT-NDVI-001, SIG-WX-RAIN-001) for Gemini grounding.
 */

export function buildEvidenceItems(signalsOrContext, trendsOrSignals = null, anomalies = []) {
  const evidence = [];

  let signals = [];
  if (Array.isArray(signalsOrContext)) {
    signals = signalsOrContext;
  } else if (signalsOrContext?.list) {
    signals = signalsOrContext.list;
  }

  signals.forEach((sig, idx) => {
    const canonicalId = sig.evidenceId || (sig.id ? sig.id.replace(/^sig-/, 'SIG-').toUpperCase() : `SIG-EV-${idx + 1}`);

    evidence.push({
      id: canonicalId,
      canonicalId,
      sigId: sig.id,
      source: sig.source || sig.type || 'sensor',
      sourceType: sig.type,
      title: sig.metric,
      observation: `${sig.metric} recorded at ${sig.value} ${sig.unit || ''}`.trim(),
      value: `${sig.value} ${sig.unit || ''}`.trim(),
      metric: sig.metric,
      timestamp: sig.observedAt || sig.timestamp || new Date().toISOString(),
      confidence: sig.quality === 'high' ? 95 : sig.quality === 'medium' ? 80 : 65,
      dataStatus: sig.dataStatus || 'REAL',
      description: sig.description || `${sig.metric} is ${sig.value} ${sig.unit || ''}`
    });
  });

  // Include anomalies as evidence
  if (Array.isArray(anomalies)) {
    anomalies.forEach((anom, idx) => {
      const anomId = `ANOM-${anom.category?.toUpperCase() || 'ENV'}-${idx + 1}`;
      evidence.push({
        id: anomId,
        canonicalId: anomId,
        source: anom.category || 'anomaly',
        sourceType: 'anomaly',
        title: anom.metric || anom.type,
        observation: anom.description,
        value: anom.value || (anom.currentNdvi !== undefined ? `${anom.currentNdvi}` : 'Active Anomaly'),
        metric: anom.metric || anom.type,
        timestamp: new Date().toISOString(),
        confidence: 90,
        dataStatus: 'DERIVED',
        description: anom.description
      });
    });
  }

  return evidence;
}
