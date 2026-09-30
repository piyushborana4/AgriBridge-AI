/**
 * AgriBridge AI — AI Evaluation Metrics Engine (Phase 8)
 * Computes mathematically sound, honest metrics for classification, confidence calibration,
 * uncertainty handling, grounding coverage, and regression without data fabrication.
 */

import { GROUNDING_LEVELS } from './evaluationContracts.js';

/**
 * Calculates per-class and aggregate classification metrics
 * @param {object} params
 * @param {Array<{ actual: string, predicted: string }>} params.data - Pairs of ground truth and predictions
 * @param {Array<string>} [params.classes] - Optional explicit list of classes
 * @returns {object} Precision, Recall, F1, Accuracy, Confusion Matrix, Support
 */
export function calculateClassificationMetrics({ data = [], classes = null }) {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      sampleCount: 0,
      accuracy: 0,
      macroF1: 0,
      microF1: 0,
      perClass: {},
      confusionMatrix: { matrix: {}, classes: [] },
      message: 'No evaluation samples provided'
    };
  }

  // Derive unique classes if not provided
  const classSet = new Set(classes || []);
  data.forEach(item => {
    if (item.actual) classSet.add(item.actual);
    if (item.predicted) classSet.add(item.predicted);
  });
  const classList = Array.from(classSet);

  // Initialize confusion matrix: actual (rows) -> predicted (cols) -> count
  const matrix = {};
  classList.forEach(actualClass => {
    matrix[actualClass] = {};
    classList.forEach(predClass => {
      matrix[actualClass][predClass] = 0;
    });
  });

  let correctCount = 0;
  data.forEach(item => {
    const act = item.actual;
    const pred = item.predicted;
    if (matrix[act] && matrix[act][pred] !== undefined) {
      matrix[act][pred] += 1;
    }
    if (act === pred) {
      correctCount += 1;
    }
  });

  const accuracy = Number((correctCount / data.length).toFixed(4));

  // Compute per-class Precision, Recall, F1, Support
  const perClass = {};
  let macroPrecisionSum = 0;
  let macroRecallSum = 0;
  let macroF1Sum = 0;
  let activeClassesCount = 0;

  classList.forEach(c => {
    const tp = matrix[c][c] || 0;
    
    // False positives: sum of column c for all rows except c
    let fp = 0;
    classList.forEach(otherActual => {
      if (otherActual !== c) {
        fp += matrix[otherActual][c] || 0;
      }
    });

    // False negatives: sum of row c for all columns except c
    let fn = 0;
    classList.forEach(otherPred => {
      if (otherPred !== c) {
        fn += matrix[c][otherPred] || 0;
      }
    });

    // True negatives
    const tn = data.length - (tp + fp + fn);
    const support = tp + fn;

    const precision = (tp + fp) > 0 ? Number((tp / (tp + fp)).toFixed(4)) : 0;
    const recall = (tp + fn) > 0 ? Number((tp / (tp + fn)).toFixed(4)) : 0;
    const f1 = (precision + recall) > 0 ? Number(((2 * precision * recall) / (precision + recall)).toFixed(4)) : 0;

    perClass[c] = {
      tp,
      fp,
      fn,
      tn,
      support,
      precision,
      recall,
      f1
    };

    if (support > 0 || (tp + fp) > 0) {
      macroPrecisionSum += precision;
      macroRecallSum += recall;
      macroF1Sum += f1;
      activeClassesCount += 1;
    }
  });

  const macroPrecision = activeClassesCount > 0 ? Number((macroPrecisionSum / activeClassesCount).toFixed(4)) : 0;
  const macroRecall = activeClassesCount > 0 ? Number((macroRecallSum / activeClassesCount).toFixed(4)) : 0;
  const macroF1 = activeClassesCount > 0 ? Number((macroF1Sum / activeClassesCount).toFixed(4)) : 0;

  return {
    sampleCount: data.length,
    accuracy,
    macroPrecision,
    macroRecall,
    macroF1,
    perClass,
    confusionMatrix: {
      classes: classList,
      matrix
    }
  };
}

/**
 * Calculates abstention and uncertainty metrics
 * @param {Array<{ actual: string, predicted: string, isUncertain?: boolean }>} data
 * @returns {object} Abstention and uncertainty statistics
 */
export function calculateAbstentionMetrics(data = []) {
  if (!Array.isArray(data) || data.length === 0) {
    return { sampleCount: 0, uncertainRate: 0, safeAbstentionRate: 0, message: 'No samples provided' };
  }

  let totalUncertain = 0;
  let safeAbstentions = 0; // Model abstained when ground truth was indeed ambiguous or low-quality
  let falseAbstentions = 0; // Model abstained on clear diagnosable samples

  data.forEach(item => {
    const isUncertain = item.isUncertain || item.predicted === 'uncertain' || item.predicted === 'unknown';
    if (isUncertain) {
      totalUncertain += 1;
      if (item.actual === 'uncertain' || item.actual === 'unknown' || item.isAmbiguous) {
        safeAbstentions += 1;
      } else {
        falseAbstentions += 1;
      }
    }
  });

  return {
    sampleCount: data.length,
    uncertainCount: totalUncertain,
    uncertainRate: Number((totalUncertain / data.length).toFixed(4)),
    safeAbstentions,
    safeAbstentionRate: totalUncertain > 0 ? Number((safeAbstentions / totalUncertain).toFixed(4)) : 0,
    falseAbstentions
  };
}

/**
 * Calculates confidence calibration buckets and over/under-confidence metrics
 * @param {Array<{ actual: string, predicted: string, confidence: number }>} data
 * @returns {object} Calibration buckets and flags
 */
export function calculateConfidenceCalibration(data = []) {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      status: 'no_labels',
      sampleCount: 0,
      buckets: [],
      message: 'No labeled evaluation data available for calibration.'
    };
  }

  const buckets = [
    { range: '0-20%', min: 0.0, max: 0.2, samples: 0, correct: 0, sumConf: 0 },
    { range: '20-40%', min: 0.2, max: 0.4, samples: 0, correct: 0, sumConf: 0 },
    { range: '40-60%', min: 0.4, max: 0.6, samples: 0, correct: 0, sumConf: 0 },
    { range: '60-80%', min: 0.6, max: 0.8, samples: 0, correct: 0, sumConf: 0 },
    { range: '80-100%', min: 0.8, max: 1.0, samples: 0, correct: 0, sumConf: 0 }
  ];

  let overconfidentCount = 0; // Conf >= 0.80 and incorrect
  let underconfidentCount = 0; // Conf < 0.60 and correct

  data.forEach(item => {
    const conf = Math.max(0, Math.min(1, Number(item.confidence) || 0));
    const isCorrect = item.actual === item.predicted;

    const bucket = buckets.find(b => conf >= b.min && (b.max === 1.0 ? conf <= b.max : conf < b.max)) || buckets[buckets.length - 1];
    bucket.samples += 1;
    bucket.sumConf += conf;
    if (isCorrect) bucket.correct += 1;

    if (conf >= 0.8 && !isCorrect) {
      overconfidentCount += 1;
    }
    if (conf < 0.6 && isCorrect) {
      underconfidentCount += 1;
    }
  });

  const formattedBuckets = buckets.map(b => ({
    range: b.range,
    sampleCount: b.samples,
    avgConfidence: b.samples > 0 ? Number((b.sumConf / b.samples).toFixed(3)) : null,
    actualAccuracy: b.samples > 0 ? Number((b.correct / b.samples).toFixed(3)) : null,
    calibrationGap: b.samples > 0 ? Number(((b.sumConf / b.samples) - (b.correct / b.samples)).toFixed(3)) : null
  }));

  return {
    status: 'evaluated',
    sampleCount: data.length,
    buckets: formattedBuckets,
    overconfidentCount,
    overconfidenceRate: Number((overconfidentCount / data.length).toFixed(4)),
    underconfidentCount,
    underconfidenceRate: Number((underconfidentCount / data.length).toFixed(4))
  };
}

/**
 * Calculates Evidence Coverage and Grounding Score for AI recommendations
 * @param {object} params
 * @param {Array<string>} params.citedEvidenceIds - Evidence IDs referenced in AI output
 * @param {Array<string>} params.availableEvidenceIds - Valid Evidence IDs from Farm Context
 * @returns {object} Evidence coverage report
 */
export function calculateEvidenceCoverage({ citedEvidenceIds = [], availableEvidenceIds = [] }) {
  const availableSet = new Set(availableEvidenceIds || []);
  const citedList = Array.isArray(citedEvidenceIds) ? citedEvidenceIds : [];

  const validCited = [];
  const invalidCited = [];

  citedList.forEach(id => {
    if (availableSet.has(id)) {
      validCited.push(id);
    } else {
      invalidCited.push(id);
    }
  });

  const coverageRatio = availableSet.size > 0 
    ? Number((validCited.length / availableSet.size).toFixed(3)) 
    : 1.0;

  const hasFabricatedIds = invalidCited.length > 0;

  let groundingLevel = GROUNDING_LEVELS.FULLY_GROUNDED;
  if (hasFabricatedIds || validCited.length === 0 && citedList.length > 0) {
    groundingLevel = GROUNDING_LEVELS.UNSUPPORTED;
  } else if (coverageRatio < 0.3) {
    groundingLevel = GROUNDING_LEVELS.PARTIALLY_GROUNDED;
  } else if (coverageRatio < 0.7) {
    groundingLevel = GROUNDING_LEVELS.MOSTLY_GROUNDED;
  }

  return {
    citedCount: citedList.length,
    validCitedCount: validCited.length,
    invalidCited,
    hasFabricatedIds,
    coverageRatio,
    groundingLevel
  };
}

/**
 * Calculates standard regression metrics (MAE, RMSE, R²)
 * @param {Array<{ actual: number, predicted: number }>} data
 * @returns {object} Regression evaluation metrics
 */
export function calculateRegressionMetrics(data = []) {
  if (!Array.isArray(data) || data.length === 0) {
    return { sampleCount: 0, mae: null, rmse: null, r2: null, message: 'No samples provided' };
  }

  let absErrorSum = 0;
  let sqErrorSum = 0;
  let actualSum = 0;

  data.forEach(d => {
    const err = d.predicted - d.actual;
    absErrorSum += Math.abs(err);
    sqErrorSum += err * err;
    actualSum += d.actual;
  });

  const meanActual = actualSum / data.length;
  let totalVariance = 0;
  data.forEach(d => {
    totalVariance += (d.actual - meanActual) * (d.actual - meanActual);
  });

  const mae = Number((absErrorSum / data.length).toFixed(3));
  const rmse = Number(Math.sqrt(sqErrorSum / data.length).toFixed(3));
  const r2 = totalVariance > 0 ? Number((1 - (sqErrorSum / totalVariance)).toFixed(3)) : 1.0;

  return {
    sampleCount: data.length,
    mae,
    rmse,
    r2
  };
}
