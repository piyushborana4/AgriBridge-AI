import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard, MapPin, Map, Leaf, Cloud, FlaskConical, Stethoscope,
  BrainCircuit, Sprout, Bell, Globe, Cpu, BookOpen, Settings,
  Menu, X, ChevronDown, User, CheckSquare, BookMarked, Bot
} from 'lucide-react';
import { cn } from '../../utils/helpers';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/action-center', label: 'Action Center', icon: CheckSquare },
  { to: '/assistant', label: 'AI Assistant', icon: Bot },
  { to: '/farm-journal', label: 'Farm Journal', icon: BookMarked },
  { to: '/farms', label: 'My Farms', icon: MapPin },
  { to: '/farm-map', label: 'Farm Map & Twin', icon: Map },
  { to: '/crop-health', label: 'Crop Health', icon: Leaf },
  { to: '/weather', label: 'Weather', icon: Cloud },
  { to: '/soil-health', label: 'Soil Health', icon: FlaskConical },
  { to: '/crop-doctor', label: 'Crop Doctor', icon: Stethoscope },
  { to: '/ai-advisory', label: 'AI Advisory', icon: BrainCircuit },
  { to: '/regenerative-plan', label: 'Regenerative Plan', icon: Sprout },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/brics-network', label: 'BRICS Network', icon: Globe },
  { to: '/ai-models', label: 'AI Models', icon: Cpu },
  { to: '/knowledge-hub', label: 'Knowledge Hub', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [farmDropdownOpen, setFarmDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { state, dispatch, selectedFarm, unreadAlerts } = useApp();
  const location = useLocation();

  const currentPage = navItems.find(item => {
    if (item.to === '/') return location.pathname === '/';
    return location.pathname.startsWith(item.to);
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface-secondary)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-[var(--color-border)] flex flex-col transition-transform duration-200 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-[var(--color-border)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Leaf className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-[var(--color-text-primary)] leading-tight">AgriBridge AI</h1>
              <p className="text-[10px] text-[var(--color-text-tertiary)] leading-tight">Intelligent Agriculture</p>
            </div>
          </div>
          <button
            className="ml-auto lg:hidden p-1.5 rounded-md hover:bg-gray-100"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3" aria-label="Sidebar navigation">
          <ul className="space-y-0.5">
            {navItems.map(item => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-[var(--color-text-secondary)] hover:bg-gray-50 hover:text-[var(--color-text-primary)]'
                    )
                  }
                >
                  <item.icon className="w-[18px] h-[18px] shrink-0" />
                  <span>{item.label}</span>
                  {item.label === 'Alerts' && unreadAlerts > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadAlerts}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-[var(--color-border)] flex items-center px-4 md:px-6 shrink-0 gap-3">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page title */}
          <div className="hidden sm:block">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {currentPage?.label || 'AgriBridge AI'}
            </h2>
          </div>

          <div className="flex-1" />

          {/* Farm selector */}
          <div className="relative">
            <button
              onClick={() => { setFarmDropdownOpen(!farmDropdownOpen); setNotifOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border)] hover:bg-gray-50 text-sm transition-colors max-w-[200px]"
              aria-label="Select farm"
              aria-expanded={farmDropdownOpen}
            >
              <MapPin className="w-4 h-4 text-primary-600 shrink-0" />
              <span className="truncate text-[var(--color-text-primary)]">{selectedFarm?.name || 'Select Farm'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-tertiary)] shrink-0" />
            </button>
            {farmDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setFarmDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-[var(--color-border)] rounded-xl shadow-lg z-40 py-1 animate-fade-in">
                  {state.farms.map(farm => (
                    <button
                      key={farm.id}
                      onClick={() => { dispatch({ type: 'SELECT_FARM', payload: farm.id }); setFarmDropdownOpen(false); }}
                      className={cn(
                        'w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors',
                        farm.id === state.selectedFarmId ? 'bg-primary-50 text-primary-700' : 'text-[var(--color-text-primary)]'
                      )}
                    >
                      <div className="font-medium">{farm.name}</div>
                      <div className="text-xs text-[var(--color-text-tertiary)]">{farm.location}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); setFarmDropdownOpen(false); }}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label={`Notifications, ${unreadAlerts} unread`}
            >
              <Bell className="w-5 h-5 text-[var(--color-text-secondary)]" />
              {unreadAlerts > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center">
                  {unreadAlerts}
                </span>
              )}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-[var(--color-border)] rounded-xl shadow-lg z-40 animate-fade-in">
                  <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadAlerts > 0 && (
                      <button
                        onClick={() => dispatch({ type: 'MARK_ALL_READ' })}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {state.alerts.filter(a => !a.read).length === 0 ? (
                      <p className="px-4 py-6 text-sm text-[var(--color-text-tertiary)] text-center">
                        No unread notifications
                      </p>
                    ) : (
                      state.alerts.filter(a => !a.read).map(alert => (
                        <div key={alert.id} className="px-4 py-3 border-b border-[var(--color-border-light)] hover:bg-gray-50">
                          <div className="flex items-start gap-2">
                            <span className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0',
                              alert.type === 'critical' ? 'bg-red-500' : alert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                            )} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[var(--color-text-primary)]">{alert.title}</p>
                              <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5 line-clamp-2">{alert.message}</p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DISMISS_ALERT', payload: alert.id }); }}
                              className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] shrink-0"
                              aria-label={`Dismiss alert: ${alert.title}`}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User */}
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center" aria-label="User profile">
            <User className="w-4 h-4 text-primary-700" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" role="main">
          <div className="p-4 md:p-6 max-w-[1400px] mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
