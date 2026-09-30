export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    // If it's something like "Apr", "May", return as-is
    return dateStr;
  }
  return d.toLocaleDateString('en-IN', {
    day: options.day || 'numeric',
    month: options.month || 'short',
    year: options.year !== undefined ? options.year : 'numeric',
    ...options
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatNumber(n, decimals = 0) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function getHealthColor(score, type = 'text') {
  if (type === 'bg') {
    return getHealthBg(score);
  }
  if (score >= 85) return 'text-emerald-600';
  if (score >= 70) return 'text-amber-600';
  if (score >= 50) return 'text-orange-500';
  if (score > 0) return 'text-red-600';
  return 'text-gray-500';
}

export function getHealthBg(score) {
  if (score >= 85) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (score >= 70) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (score >= 50) return 'bg-orange-50 text-orange-700 border-orange-200';
  if (score > 0) return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-gray-50 text-gray-700 border-gray-200';
}

export function getHealthLabel(score) {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  if (score > 0) return 'Needs Attention';
  return 'No Data';
}

export function getSeverityColor(severity, type = 'all') {
  const norm = (severity || 'info').toLowerCase();
  if (type === 'text') {
    const textMap = {
      critical: 'text-red-700',
      warning: 'text-amber-700',
      info: 'text-blue-700',
      success: 'text-emerald-700',
    };
    return textMap[norm] || textMap.info;
  }
  if (type === 'bg') {
    const bgMap = {
      critical: 'bg-red-50',
      warning: 'bg-amber-50',
      info: 'bg-blue-50',
      success: 'bg-emerald-50',
    };
    return bgMap[norm] || bgMap.info;
  }
  if (type === 'border') {
    const borderMap = {
      critical: 'border-red-200',
      warning: 'border-amber-200',
      info: 'border-blue-200',
      success: 'border-emerald-200',
    };
    return borderMap[norm] || borderMap.info;
  }
  const map = {
    critical: 'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return map[norm] || map.info;
}

export function getSeverityDot(severity) {
  const norm = (severity || 'info').toLowerCase();
  const map = {
    critical: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
    success: 'bg-emerald-500',
  };
  return map[norm] || map.info;
}

export function getConditionIcon(condition) {
  const map = {
    'Sunny': '☀️',
    'Partly Cloudy': '⛅',
    'Cloudy': '☁️',
    'Rain': '🌧️',
    'Thunderstorm': '⛈️',
    'Snow': '❄️',
  };
  return map[condition] || '🌤️';
}

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
