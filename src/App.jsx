import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/ui/ErrorBoundary';

const ActionCenter = lazy(() => import('./pages/ActionCenter'));
const FarmJournal = lazy(() => import('./pages/FarmJournal'));
const AgriBridgeAssistant = lazy(() => import('./pages/AgriBridgeAssistant'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MyFarms = lazy(() => import('./pages/MyFarms'));
const CropHealth = lazy(() => import('./pages/CropHealth'));
const Weather = lazy(() => import('./pages/Weather'));
const SoilHealth = lazy(() => import('./pages/SoilHealth'));
const CropDoctor = lazy(() => import('./pages/CropDoctor'));
const AIAdvisory = lazy(() => import('./pages/AIAdvisory'));
const RegenerativePlan = lazy(() => import('./pages/RegenerativePlan'));
const Alerts = lazy(() => import('./pages/Alerts'));
const BRICSNetwork = lazy(() => import('./pages/BRICSNetwork'));
const AIModels = lazy(() => import('./pages/AIModels'));
const KnowledgeHub = lazy(() => import('./pages/KnowledgeHub'));
const FarmMap = lazy(() => import('./pages/FarmMap'));
const Settings = lazy(() => import('./pages/Settings'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <span className="text-xs text-[var(--color-text-tertiary)] font-medium">Loading telemetry module...</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/action-center" element={<ActionCenter />} />
              <Route path="/farm-journal" element={<FarmJournal />} />
              <Route path="/assistant" element={<AgriBridgeAssistant />} />
              <Route path="/farms" element={<MyFarms />} />
              <Route path="/crop-health" element={<CropHealth />} />
              <Route path="/weather" element={<Weather />} />
              <Route path="/soil-health" element={<SoilHealth />} />
              <Route path="/crop-doctor" element={<CropDoctor />} />
              <Route path="/ai-advisory" element={<AIAdvisory />} />
              <Route path="/regenerative-plan" element={<RegenerativePlan />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/brics-network" element={<BRICSNetwork />} />
              <Route path="/ai-models" element={<AIModels />} />
              <Route path="/farm-map" element={<FarmMap />} />
              <Route path="/farms/:farmId/map" element={<FarmMap />} />
              <Route path="/farms/:farmId/fields" element={<FarmMap />} />
              <Route path="/farms/:farmId/timeline" element={<FarmMap />} />
              <Route path="/farms/:farmId/spatial-intelligence" element={<FarmMap />} />
              <Route path="/knowledge-hub" element={<KnowledgeHub />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Layout>
    </BrowserRouter>
  );
}
