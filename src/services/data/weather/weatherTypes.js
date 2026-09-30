/**
 * Weather Data Types & WMO Interpretation
 */

export const WMO_WEATHER_CODES = {
  0: { description: 'Clear sky', condition: 'Sunny', icon: 'Sun' },
  1: { description: 'Mainly clear', condition: 'Mostly Sunny', icon: 'Sun' },
  2: { description: 'Partly cloudy', condition: 'Partly Cloudy', icon: 'CloudSun' },
  3: { description: 'Overcast', condition: 'Cloudy', icon: 'Cloud' },
  45: { description: 'Fog', condition: 'Foggy', icon: 'CloudFog' },
  48: { description: 'Depositing rime fog', condition: 'Foggy', icon: 'CloudFog' },
  51: { description: 'Light drizzle', condition: 'Drizzle', icon: 'CloudDrizzle' },
  53: { description: 'Moderate drizzle', condition: 'Drizzle', icon: 'CloudDrizzle' },
  55: { description: 'Dense drizzle', condition: 'Drizzle', icon: 'CloudDrizzle' },
  61: { description: 'Slight rain', condition: 'Light Rain', icon: 'CloudRain' },
  63: { description: 'Moderate rain', condition: 'Rain', icon: 'CloudRain' },
  65: { description: 'Heavy rain', condition: 'Heavy Rain', icon: 'CloudRain' },
  71: { description: 'Slight snow fall', condition: 'Snow', icon: 'CloudSnow' },
  73: { description: 'Moderate snow fall', condition: 'Snow', icon: 'CloudSnow' },
  75: { description: 'Heavy snow fall', condition: 'Heavy Snow', icon: 'CloudSnow' },
  80: { description: 'Slight rain showers', condition: 'Showers', icon: 'CloudRain' },
  81: { description: 'Moderate rain showers', condition: 'Showers', icon: 'CloudRain' },
  82: { description: 'Violent rain showers', condition: 'Heavy Showers', icon: 'CloudRain' },
  95: { description: 'Thunderstorm', condition: 'Thunderstorm', icon: 'CloudLightning' },
  96: { description: 'Thunderstorm with slight hail', condition: 'Thunderstorm with Hail', icon: 'CloudLightning' },
  99: { description: 'Thunderstorm with heavy hail', condition: 'Severe Thunderstorm', icon: 'CloudLightning' },
};

export function interpretWMOCode(code) {
  return WMO_WEATHER_CODES[code] || {
    description: 'Unknown weather pattern',
    condition: 'Variable',
    icon: 'Cloud'
  };
}
