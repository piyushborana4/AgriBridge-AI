import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { StatCard } from '../components/ui/StatCard';
import { formatDateTime, cn, getSeverityColor, getSeverityDot } from '../utils/helpers';
import { Bell, Filter, Check, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

const Alerts = () => {
  const { state, dispatch } = useApp();
  const { alerts = [], farms = [] } = state;
  const [severityFilter, setSeverityFilter] = useState('All');
  const [farmFilter, setFarmFilter] = useState('All');

  // Stats
  const totalAlerts = alerts.length;
  const criticalCount = alerts.filter(a => (a.type || a.severity) === 'critical').length;
  const unreadCount = alerts.filter(a => !a.read).length;

  // Derived state
  const filteredAlerts = useMemo(() => {
    return [...alerts]
      .filter(alert => {
        const sev = (alert.type || alert.severity || 'info').toLowerCase();
        const matchesSeverity = severityFilter === 'All' || sev === severityFilter.toLowerCase();
        const matchesFarm = farmFilter === 'All' || alert.farmId === farmFilter;
        return matchesSeverity && matchesFarm;
      })
      .sort((a, b) => {
        // Unread first
        if (a.read === b.read) {
          // Then by date desc
          return new Date(b.timestamp) - new Date(a.timestamp);
        }
        return a.read ? 1 : -1;
      });
  }, [alerts, severityFilter, farmFilter]);

  const handleDismiss = (id) => {
    dispatch({ type: 'DISMISS_ALERT', payload: id });
  };

  const handleMarkAllRead = () => {
    dispatch({ type: 'MARK_ALL_READ' });
  };

  const getFarmName = (farmId) => {
    const farm = farms.find(f => f.id === farmId);
    return farm ? farm.name : 'All Farms';
  };

  const severityOptions = ['All', 'Critical', 'Warning', 'Info', 'Success'];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary-600" />
            Active Farm Alerts & Notices
            {unreadCount > 0 && (
              <Badge variant="danger" className="ml-2">{unreadCount} Unread</Badge>
            )}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Operational warnings, threshold breaches, and scheduled agronomic reminders
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="secondary" onClick={handleMarkAllRead} icon={Check} className="flex-1 md:flex-none">
            Mark All Read
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          label="Total Logged Alerts" 
          value={totalAlerts.toString()} 
          icon={Bell} 
          trendLabel="All time record"
        />
        <StatCard 
          label="Critical Severity" 
          value={criticalCount.toString()} 
          icon={AlertTriangle} 
          trend={criticalCount > 0 ? -1 : 0}
          trendLabel={criticalCount > 0 ? "Requires immediate field action" : "No urgent threats"}
        />
        <StatCard 
          label="Unread Notifications" 
          value={unreadCount.toString()} 
          icon={Info} 
          trendLabel="Awaiting manager review"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-primary-600" />
            Filter Alert Queue
          </CardTitle>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 text-sm border rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {severityOptions.map(opt => (
                <option key={opt} value={opt}>{opt} Severity</option>
              ))}
            </select>
            <select
              value={farmFilter}
              onChange={(e) => setFarmFilter(e.target.value)}
              className="px-3 py-2 text-sm border rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="All">All Farms</option>
              {farms.map(farm => (
                <option key={farm.id} value={farm.id}>{farm.name}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAlerts.length === 0 ? (
            <EmptyState 
              title="No alerts matching criteria" 
              description="There are no notifications matching your selected severity or farm filters." 
              icon={CheckCircle}
            />
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map(alert => {
                const sev = (alert.type || alert.severity || 'info').toLowerCase();
                const isCritical = sev === 'critical';
                const isWarning = sev === 'warning';
                const isSuccess = sev === 'success';
                
                return (
                  <div 
                    key={alert.id} 
                    className={cn(
                      "flex flex-col md:flex-row justify-between gap-4 p-4 rounded-xl border transition-all",
                      !alert.read ? "bg-primary-50/60 border-primary-200 shadow-xs" : "bg-white border-[var(--color-border)]"
                    )}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="mt-0.5 shrink-0">
                        {isCritical ? <XCircle className="h-5 w-5 text-red-600" /> :
                         isWarning ? <AlertTriangle className="h-5 w-5 text-amber-600" /> :
                         isSuccess ? <CheckCircle className="h-5 w-5 text-emerald-600" /> :
                         <Info className="h-5 w-5 text-blue-600" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={cn("w-2 h-2 rounded-full", getSeverityDot(sev))} />
                          <h3 className={cn("text-sm", !alert.read ? "font-bold text-[var(--color-text-primary)]" : "font-medium text-[var(--color-text-secondary)]")}>
                            {alert.title}
                          </h3>
                          {!alert.read && <Badge variant="primary" className="text-[10px]">Unread</Badge>}
                          <Badge variant={isCritical ? 'danger' : isWarning ? 'warning' : isSuccess ? 'success' : 'info'} className="text-[10px] capitalize">
                            {sev}
                          </Badge>
                        </div>
                        <p className="text-[var(--color-text-secondary)] mb-2 text-xs leading-relaxed">{alert.message}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
                          <span className="font-semibold text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] px-2 py-0.5 rounded-md border border-[var(--color-border)]">
                            {getFarmName(alert.farmId)}
                          </span>
                          <span>•</span>
                          <span>{formatDateTime(alert.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex md:flex-col justify-end items-end shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => handleDismiss(alert.id)}>
                        {alert.read ? 'Dismiss' : 'Mark Read'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Alerts;
