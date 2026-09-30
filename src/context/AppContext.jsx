import { createContext, useContext, useReducer, useEffect } from 'react';
import { farms as defaultFarms, alerts as defaultAlerts, defaultSettings } from '../data/mockData';

const AppContext = createContext(null);

const STORAGE_KEY = 'agribridge-state';

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        selectedFarmId: parsed.selectedFarmId || defaultFarms[0].id,
        farms: parsed.farms && parsed.farms.length > 0 ? parsed.farms : [...defaultFarms],
        createdFarms: parsed.createdFarms || [],
        settings: { ...defaultSettings, ...parsed.settings },
        alerts: parsed.alerts || [...defaultAlerts],
        dismissedAlertIds: parsed.dismissedAlertIds || [],
        notifications: parsed.notifications || [],
      };
    }
  } catch (e) {
    console.warn('Failed to load state from localStorage:', e);
  }
  return null;
}

const initialState = loadState() || {
  selectedFarmId: defaultFarms[0].id,
  farms: [...defaultFarms],
  createdFarms: [],
  settings: { ...defaultSettings },
  alerts: [...defaultAlerts],
  dismissedAlertIds: [],
  notifications: [],
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SELECT_FARM':
      return { ...state, selectedFarmId: action.payload };

    case 'ADD_FARM': {
      const newFarm = {
        ...action.payload,
        id: `farm-custom-${Date.now()}`,
        soilHealth: 0,
        cropHealth: 0,
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      return {
        ...state,
        farms: [...state.farms, newFarm],
        createdFarms: [...state.createdFarms, newFarm.id],
      };
    }

    case 'UPDATE_FARM': {
      const updated = state.farms.map(f =>
        f.id === action.payload.id ? { ...f, ...action.payload } : f
      );
      return { ...state, farms: updated };
    }

    case 'DELETE_FARM': {
      const filtered = state.farms.filter(f => f.id !== action.payload);
      const newSelected = state.selectedFarmId === action.payload
        ? (filtered[0]?.id || null)
        : state.selectedFarmId;
      return {
        ...state,
        farms: filtered,
        createdFarms: state.createdFarms.filter(id => id !== action.payload),
        selectedFarmId: newSelected,
      };
    }

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'DISMISS_ALERT':
      return {
        ...state,
        dismissedAlertIds: [...state.dismissedAlertIds, action.payload],
        alerts: state.alerts.map(a =>
          a.id === action.payload ? { ...a, read: true } : a
        ),
      };

    case 'MARK_ALL_READ':
      return {
        ...state,
        alerts: state.alerts.map(a => ({ ...a, read: true })),
      };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications].slice(0, 50),
      };

    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Persist to localStorage on state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        selectedFarmId: state.selectedFarmId,
        farms: state.farms,
        createdFarms: state.createdFarms,
        settings: state.settings,
        alerts: state.alerts,
        dismissedAlertIds: state.dismissedAlertIds,
        notifications: state.notifications,
      }));
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  }, [state]);

  const selectedFarm = state.farms.find(f => f.id === state.selectedFarmId) || state.farms[0];
  const unreadAlerts = state.alerts.filter(a => !a.read).length;

  return (
    <AppContext.Provider value={{ state, dispatch, selectedFarm, unreadAlerts }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
