import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle, TrendingUp, Activity, Bell, Clock, Zap } from 'lucide-react';

interface Alert {
  id: string;
  alert_type: string;
  severity: string;
  politician_id: string | null;
  title: string;
  description: string | null;
  created_at: string;
}

interface ActivityEvent {
  id: string;
  event_type: string;
  politician_id: string | null;
  impact_score: number | null;
  event_data: unknown;
  created_at: string;
}

interface VotingAnomaly {
  id: string;
  politician_id: string;
  anomaly_type: string;
  severity: number;
  expected_vote: string;
  actual_vote: string;
  confidence_score: number;
  created_at: string;
}

export default function MonitoringDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [anomalies, setAnomalies] = useState<VotingAnomaly[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  async function fetchMonitoringData() {
    try {
      const [alertsRes, activityRes, anomaliesRes] = await Promise.all([
        supabase
          .from('alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('activity_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('voting_anomalies')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(15)
      ]);

      if (alertsRes.data) setAlerts(alertsRes.data);
      if (activityRes.data) setActivity(activityRes.data);
      if (anomaliesRes.data) setAnomalies(anomaliesRes.data);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getSeverityColor(severity: string) {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function getAlertIcon(type: string) {
    switch (type) {
      case 'new_conflict':
      case 'interest_conflict':
        return <AlertTriangle className="h-5 w-5" />;
      case 'voting_anomaly':
      case 'party_defection':
        return <Zap className="h-5 w-5" />;
      case 'lobbying_spike':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  }

  function timeAgo(date: string) {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL').length;
  const highAlerts = alerts.filter(a => a.severity === 'HIGH').length;
  const totalAnomalies = anomalies.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="h-6 w-6 text-blue-600" />
          Real-Time Monitoring Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Live alerts and activity tracking
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4 flex-1">
              <div className="text-sm text-gray-500">Critical Alerts</div>
              <div className="text-2xl font-bold text-red-600">{criticalAlerts}</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
              <Bell className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4 flex-1">
              <div className="text-sm text-gray-500">High Priority</div>
              <div className="text-2xl font-bold text-orange-600">{highAlerts}</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-purple-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4 flex-1">
              <div className="text-sm text-gray-500">Voting Anomalies</div>
              <div className="text-2xl font-bold text-purple-600">{totalAnomalies}</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4 flex-1">
              <div className="text-sm text-gray-500">Live Events</div>
              <div className="text-2xl font-bold text-green-600">{activity.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Feed */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Alerts
            </h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {alerts.slice(0, 15).map((alert) => (
              <div key={alert.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 ${getSeverityColor(alert.severity)} p-2 rounded-lg`}>
                    {getAlertIcon(alert.alert_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
                        {alert.description && (
                          <p className="text-xs text-gray-600 mt-1">{alert.description}</p>
                        )}
                      </div>
                      <span className={`flex-shrink-0 inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {timeAgo(alert.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No alerts yet
              </div>
            )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Log
            </h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {activity.slice(0, 12).map((event) => (
              <div key={event.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 capitalize">
                    {event.event_type.replace('_', ' ')}
                  </span>
                </div>
                {event.impact_score && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Impact</span>
                      <span className="text-xs font-semibold text-gray-900">{Math.round(event.impact_score)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-blue-600 h-1 rounded-full"
                        style={{ width: `${event.impact_score}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {timeAgo(event.created_at)}
                </p>
              </div>
            ))}
            {activity.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No activity yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Voting Anomalies */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            Detected Voting Anomalies
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Anomaly Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actual</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {anomalies.slice(0, 10).map((anomaly) => (
                <tr key={anomaly.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 capitalize">
                      {anomaly.anomaly_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {anomaly.expected_vote}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-red-600">
                    {anomaly.actual_vote}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-green-600 h-1 rounded-full"
                          style={{ width: `${(anomaly.confidence_score || 0) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">{Math.round((anomaly.confidence_score || 0) * 100)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {timeAgo(anomaly.created_at)}
                  </td>
                </tr>
              ))}
              {anomalies.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No anomalies detected
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
