import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import SourceBadge from '../components/ui/SourceBadge';
import EmptyState from '../components/ui/EmptyState';
import { getConditionIcon } from '../utils/helpers';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  CloudRain, Wind, Droplets, Sun, AlertTriangle, 
  RefreshCw, ThermometerSun, Info, CalendarDays, Compass, Activity, CheckCircle2
} from 'lucide-react';
import { fetchOpenMeteoWeather, getCalibratedFallbackWeather } from '../services/data/weather/openMeteoProvider';

const Weather = () => {
  const { selectedFarm } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [weatherData, setWeatherData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadWeather() {
      if (!selectedFarm) return;
      setIsRefreshing(true);
      try {
        const lat = selectedFarm.lat || 19.9975;
        const lng = selectedFarm.lng || 73.7898;
        const result = await fetchOpenMeteoWeather(lat, lng);
        if (isMounted) setWeatherData(result);
      } catch {
        if (isMounted) setWeatherData(getCalibratedFallbackWeather());
      } finally {
        if (isMounted) setIsRefreshing(false);
      }
    }

    loadWeather();
    return () => { isMounted = false; };
  }, [selectedFarm]);

  const handleRefresh = async () => {
    if (!selectedFarm) return;
    setIsRefreshing(true);
    try {
      const lat = selectedFarm.lat || 19.9975;
      const lng = selectedFarm.lng || 73.7898;
      const result = await fetchOpenMeteoWeather(lat, lng);
      setWeatherData(result);
    } catch {
      setWeatherData(getCalibratedFallbackWeather());
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!selectedFarm) {
    return (
      <EmptyState
        title="No Farm Selected"
        description="Please select or add a farm parcel to view localized agrometeorological telemetry."
        icon={CloudRain}
      />
    );
  }

  if (!weatherData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center text-[var(--color-text-secondary)]">
            <p>Loading localized agricultural weather stream...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { current, forecast, impacts, source, sourceBadge, isLive } = weatherData;
  const currentIconEmoji = getConditionIcon(current.condition);

  return (
    <div className="space-y-6">
      {/* Header & Data Lineage */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Agri-Weather Intelligence</h1>
            <SourceBadge type={sourceBadge || (isLive ? 'LIVE' : 'MODELED ESTIMATE')} label={source} />
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1 flex items-center gap-2">
            <span className="font-mono flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-primary-600" />
              {selectedFarm.name} ({selectedFarm.lat?.toFixed(4)}°N, {selectedFarm.lng?.toFixed(4)}°E)
            </span>
            <span>•</span>
            <span>WMO Synced</span>
          </p>
        </div>

        <Button 
          variant="secondary" 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="self-start sm:self-auto flex items-center gap-1.5 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary-600' : ''}`} />
          {isRefreshing ? 'Syncing...' : 'Sync Station'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Conditions Card */}
        <Card className="lg:col-span-1 overflow-hidden relative">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Current Observations</span>
              <Badge variant="primary" className="text-[10px] uppercase tracking-wider">
                {isLive ? 'Live Sensor Feed' : 'Calibrated Model'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-50 border border-primary-100 rounded-2xl flex items-center justify-center text-3xl shadow-xs">
                {currentIconEmoji}
              </div>
              <div>
                <div className="text-4xl font-extrabold text-[var(--color-text-primary)]">
                  {current.temp}°C
                </div>
                <div className="text-sm text-[var(--color-text-secondary)] font-medium mt-0.5">
                  {current.description || current.condition}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-[var(--color-border)]">
              <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-[var(--color-surface-secondary)]">
                <span className="text-[10px] text-[var(--color-text-tertiary)] font-semibold flex items-center gap-1 uppercase tracking-wider">
                  <ThermometerSun className="w-3 h-3 text-amber-500" /> Feels Like
                </span>
                <span className="text-sm font-bold text-[var(--color-text-primary)]">{current.feelsLike}°C</span>
              </div>
              <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-[var(--color-surface-secondary)]">
                <span className="text-[10px] text-[var(--color-text-tertiary)] font-semibold flex items-center gap-1 uppercase tracking-wider">
                  <Droplets className="w-3 h-3 text-blue-500" /> Humidity
                </span>
                <span className="text-sm font-bold text-[var(--color-text-primary)]">{current.humidity}%</span>
              </div>
              <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-[var(--color-surface-secondary)]">
                <span className="text-[10px] text-[var(--color-text-tertiary)] font-semibold flex items-center gap-1 uppercase tracking-wider">
                  <Wind className="w-3 h-3 text-teal-500" /> Wind Speed
                </span>
                <span className="text-sm font-bold text-[var(--color-text-primary)]">{current.windSpeed} km/h</span>
              </div>
              <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-[var(--color-surface-secondary)]">
                <span className="text-[10px] text-[var(--color-text-tertiary)] font-semibold flex items-center gap-1 uppercase tracking-wider">
                  <Activity className="w-3 h-3 text-emerald-500" /> Reference ET₀
                </span>
                <span className="text-sm font-bold text-[var(--color-text-primary)]">{current.et0} mm/d</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agricultural Impacts & Explainability Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Agronomic Impact Reasoner (Weather-to-Action)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(impacts || []).map((imp, idx) => {
                const isOptimal = imp.status === 'Optimal' || imp.status === 'Low Risk' || imp.status === 'Standard Water Requirement';
                const isWarning = imp.status === 'High Demand' || imp.status === 'Moderate Risk';
                return (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-xl border flex flex-col justify-between ${
                      isOptimal ? 'bg-green-50/60 border-green-200' : isWarning ? 'bg-amber-50/60 border-amber-200' : 'bg-red-50/60 border-red-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-700">
                          {imp.category}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isOptimal ? 'bg-green-100 text-green-800' : isWarning ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {imp.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-gray-900 mb-1">{imp.title}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">{imp.reason}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 7-Day Forecast Cards */}
      <div>
        <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-3 flex items-center justify-between">
          <span>7-Day Agricultural Micro-Forecast</span>
          <span className="text-xs text-gray-500 font-normal">Source: Open-Meteo High-Resolution Grids</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {forecast.map((dayData, index) => {
            const dayEmoji = getConditionIcon(dayData.condition);
            return (
              <Card key={index} className="text-center hover:border-primary-300 transition-colors">
                <CardContent className="p-3 flex flex-col items-center space-y-2">
                  <span className="font-bold text-[var(--color-text-primary)] text-xs uppercase tracking-wider">{dayData.day}</span>
                  <div className="w-10 h-10 bg-[var(--color-surface-secondary)] rounded-xl flex items-center justify-center text-xl">
                    {dayEmoji}
                  </div>
                  <div className="flex items-baseline gap-1.5 justify-center">
                    <span className="font-extrabold text-[var(--color-text-primary)] text-sm">{dayData.high}°</span>
                    <span className="text-xs text-[var(--color-text-tertiary)]">{dayData.low}°</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md w-full justify-center">
                    <CloudRain className="w-3 h-3 text-blue-500" />
                    {dayData.rain} mm ({dayData.rainProb}%)
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Diurnal Temperature Range (°C)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    domain={[10, 45]}
                    tickFormatter={v => `${v}°`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', fontSize: '12px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="high" name="High Temp (°C)" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="low" name="Low Temp (°C)" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Rainfall & ET0 Forecast */}
        <Card>
          <CardHeader>
            <CardTitle>Precipitation Sum (mm) & Daily ET₀ Evapotranspiration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    domain={[0, 30]}
                    tickFormatter={v => `${v}mm`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', fontSize: '12px' }}
                    formatter={(v) => [`${v} mm`, 'Rainfall']}
                  />
                  <Area type="monotone" dataKey="rain" name="Rainfall (mm)" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#rainGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-[10px] text-[var(--color-text-tertiary)] pt-3 border-t border-[var(--color-border)]">
        Live weather observations provided by Open-Meteo High-Resolution Grids (WMO standard models).
      </p>
    </div>
  );
};

export default Weather;
