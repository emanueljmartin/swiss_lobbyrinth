import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  RefreshCw, CheckCircle, XCircle, Clock, Database,
  AlertTriangle, ChevronRight, ExternalLink, Loader
} from 'lucide-react';

interface SyncLog {
  id: string;
  source_name: string;
  sync_type: string;
  status: string;
  records_fetched: number;
  records_inserted: number;
  records_updated: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
}

interface SourceFreshness {
  source_name: string;
  last_sync_started: string | null;
  last_sync_completed: string | null;
  last_status: string | null;
  last_records_fetched: number | null;
  total_sync_runs: number;
}

interface RawCounts {
  parliament_members: number;
  parliament_votes: number;
  parliament_votings: number;
  lobbywatch_mandates: number;
  lobbywatch_access: number;
  zefix_companies: number;
}

const SOURCES = [
  {
    key: 'parliament',
    label: 'Parliament.ch OData',
    description: 'Official Swiss Parliament voting records, councillors, sessions',
    url: 'https://ws.parlament.ch/odata.svc',
    functionSlug: 'sync-parliament-votes',
    modes: [
      { value: 'votes', label: 'Votes + Individual Votings' },
      { value: 'members', label: 'Councillor Profiles' },
      { value: 'all', label: 'Everything' },
    ],
    color: 'blue',
  },
  {
    key: 'lobbywatch',
    label: 'Lobbywatch SPARQL',
    description: 'Lobbying mandates, interest bindings, access badges (Zutrittsberechtigung)',
    url: 'https://lod.lobbywatch.ch',
    functionSlug: 'sync-lobbywatch',
    modes: [
      { value: 'mandates', label: 'Mandates & Interest Bindings' },
      { value: 'access', label: 'Access Rights (Zutrittsberechtigung)' },
      { value: 'all', label: 'Everything' },
    ],
    color: 'emerald',
  },
  {
    key: 'zefix',
    label: 'Zefix Company Registry',
    description: 'Swiss commercial registry — legal form, UID, status, purpose enrichment',
    url: 'https://www.zefix.admin.ch',
    functionSlug: 'sync-zefix',
    modes: [
      { value: 'search', label: 'Enrich Organizations by Name' },
    ],
    color: 'orange',
  },
];

function colorClasses(color: string, variant: 'bg' | 'text' | 'border') {
  const map: Record<string, Record<string, string>> = {
    blue:    { bg: 'bg-blue-900/40',    text: 'text-blue-300',    border: 'border-blue-700' },
    emerald: { bg: 'bg-emerald-900/40', text: 'text-emerald-300', border: 'border-emerald-700' },
    orange:  { bg: 'bg-orange-900/40',  text: 'text-orange-300',  border: 'border-orange-700' },
  };
  return map[color]?.[variant] ?? '';
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'success') return (
    <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
      <CheckCircle size={12} /> success
    </span>
  );
  if (status === 'error') return (
    <span className="flex items-center gap-1 text-red-400 text-xs font-medium">
      <XCircle size={12} /> error
    </span>
  );
  if (status === 'running') return (
    <span className="flex items-center gap-1 text-yellow-400 text-xs font-medium animate-pulse">
      <Loader size={12} className="animate-spin" /> running
    </span>
  );
  return <span className="text-slate-500 text-xs">{status}</span>;
}

function timeAgo(ts: string | null): string {
  if (!ts) return 'never';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function DataIngestionView() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [freshness, setFreshness] = useState<SourceFreshness[]>([]);
  const [rawCounts, setRawCounts] = useState<RawCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggerState, setTriggerState] = useState<Record<string, { running: boolean; mode: string; result: string | null }>>({});

  const load = useCallback(async () => {
    const [logsRes, freshnessRes, pmRes, pvRes, pvgRes, lmRes, laRes, zcRes] = await Promise.all([
      supabase.from('data_sync_log').select('*').order('started_at', { ascending: false }).limit(50),
      supabase.from('data_source_freshness').select('*'),
      supabase.from('parliament_members_raw').select('id', { count: 'exact', head: true }),
      supabase.from('parliament_votes_raw').select('id', { count: 'exact', head: true }),
      supabase.from('parliament_votings_raw').select('id', { count: 'exact', head: true }),
      supabase.from('lobbywatch_mandates_raw').select('id', { count: 'exact', head: true }),
      supabase.from('lobbywatch_access_rights_raw').select('id', { count: 'exact', head: true }),
      supabase.from('zefix_companies_raw').select('id', { count: 'exact', head: true }),
    ]);

    setLogs((logsRes.data ?? []) as SyncLog[]);
    setFreshness((freshnessRes.data ?? []) as SourceFreshness[]);
    setRawCounts({
      parliament_members: pmRes.count ?? 0,
      parliament_votes: pvRes.count ?? 0,
      parliament_votings: pvgRes.count ?? 0,
      lobbywatch_mandates: lmRes.count ?? 0,
      lobbywatch_access: laRes.count ?? 0,
      zefix_companies: zcRes.count ?? 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function triggerSync(slug: string, sourceKey: string, mode: string) {
    setTriggerState(s => ({ ...s, [sourceKey]: { running: true, mode, result: null } }));
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const resp = await fetch(
        `${supabaseUrl}/functions/v1/${slug}?mode=${mode}`,
        { headers: { Authorization: `Bearer ${anonKey}`, 'Content-Type': 'application/json' } }
      );
      const json = await resp.json();
      setTriggerState(s => ({
        ...s,
        [sourceKey]: { running: false, mode, result: json.success ? `Done — ${json.total_fetched ?? json.fetched ?? '?'} records` : `Error: ${json.error}` }
      }));
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setTriggerState(s => ({ ...s, [sourceKey]: { running: false, mode, result: `Error: ${msg}` } }));
    }
  }

  const getFreshness = (sourceKey: string) =>
    freshness.find(f => f.source_name.startsWith(sourceKey)) ?? null;

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader className="animate-spin text-slate-400" size={24} />
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1">Data Ingestion</h1>
        <p className="text-slate-400 text-sm">
          Trigger syncs from Swiss political transparency data sources. All data is fetched in real-time from official public APIs.
        </p>
      </div>

      {/* Raw record counts */}
      {rawCounts && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Parliament Members', value: rawCounts.parliament_members, sub: 'ws.parlament.ch' },
            { label: 'Parliamentary Votes', value: rawCounts.parliament_votes, sub: 'Bills & motions' },
            { label: 'Individual Vote Records', value: rawCounts.parliament_votings, sub: 'MP-level decisions' },
            { label: 'Lobbywatch Mandates', value: rawCounts.lobbywatch_mandates, sub: 'lod.lobbywatch.ch' },
            { label: 'Access Badges', value: rawCounts.lobbywatch_access, sub: 'Zutrittsberechtigung' },
            { label: 'Zefix Companies', value: rawCounts.zefix_companies, sub: 'zefix.admin.ch' },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</div>
              <div className="text-sm text-slate-300 mt-0.5">{stat.label}</div>
              <div className="text-xs text-slate-500 mt-1">{stat.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Source cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Data Sources</h2>
        {SOURCES.map(source => {
          const state = triggerState[source.key];
          const fresh = getFreshness(source.key);

          return (
            <div
              key={source.key}
              className={`bg-slate-900 border rounded-xl overflow-hidden ${colorClasses(source.color, 'border')}`}
            >
              <div className={`px-5 py-4 border-b border-slate-800 flex items-start justify-between`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold ${colorClasses(source.color, 'text')}`}>{source.label}</h3>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 hover:text-slate-300 transition"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <p className="text-sm text-slate-400">{source.description}</p>
                </div>
                <div className="text-right text-xs text-slate-500 flex-shrink-0 ml-4">
                  {fresh ? (
                    <>
                      <div className="flex items-center gap-1 justify-end mb-1">
                        <Clock size={10} />
                        Last sync: {timeAgo(fresh.last_sync_completed)}
                      </div>
                      {fresh.last_status && <StatusBadge status={fresh.last_status} />}
                    </>
                  ) : (
                    <span className="text-slate-600">Never synced</span>
                  )}
                </div>
              </div>

              <div className="px-5 py-4 flex items-center gap-3 flex-wrap">
                {source.modes.map(m => (
                  <button
                    key={m.value}
                    onClick={() => triggerSync(source.functionSlug, source.key, m.value)}
                    disabled={state?.running}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed
                      ${colorClasses(source.color, 'bg')} ${colorClasses(source.color, 'text')} hover:brightness-125`}
                  >
                    {state?.running && state.mode === m.value
                      ? <Loader size={14} className="animate-spin" />
                      : <RefreshCw size={14} />
                    }
                    {m.label}
                  </button>
                ))}

                {state?.result && (
                  <span className={`text-xs ml-2 ${state.result.startsWith('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
                    {state.result.startsWith('Error') ? <AlertTriangle size={12} className="inline mr-1" /> : <CheckCircle size={12} className="inline mr-1" />}
                    {state.result}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sync history */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Sync History</h2>
          <button onClick={load} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition">
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Source</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Fetched</th>
                <th className="text-right px-4 py-3">Inserted</th>
                <th className="text-right px-4 py-3">Duration</th>
                <th className="text-left px-4 py-3">Started</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">
                    No sync runs yet. Trigger a sync above to begin ingesting real data.
                  </td>
                </tr>
              ) : logs.map(log => (
                <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                  <td className="px-4 py-3 text-slate-300 font-medium">{log.source_name}</td>
                  <td className="px-4 py-3 text-slate-500">{log.sync_type}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={log.status} />
                    {log.error_message && (
                      <div className="text-xs text-red-400 mt-0.5 max-w-xs truncate" title={log.error_message}>
                        {log.error_message}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">{(log.records_fetched ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{(log.records_inserted ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {log.duration_seconds != null ? `${log.duration_seconds.toFixed(1)}s` : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{timeAgo(log.started_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provenance note */}
      <div className="flex items-start gap-3 bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-slate-400">
        <Database size={16} className="text-slate-500 flex-shrink-0 mt-0.5" />
        <div>
          <span className="text-slate-300 font-medium">Data provenance: </span>
          All records include a <code className="text-xs bg-slate-800 px-1 rounded">fetched_at</code> timestamp
          and <code className="text-xs bg-slate-800 px-1 rounded">raw_json</code> preserving the original source payload.
          Parliament data sourced from{' '}
          <a href="https://ws.parlament.ch/odata.svc" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            ws.parlament.ch <ChevronRight size={10} className="inline" />
          </a>{' '}
          — Lobbying data from{' '}
          <a href="https://lod.lobbywatch.ch" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
            lod.lobbywatch.ch <ChevronRight size={10} className="inline" />
          </a>{' '}
          — Company data from{' '}
          <a href="https://www.zefix.admin.ch" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">
            zefix.admin.ch <ChevronRight size={10} className="inline" />
          </a>
        </div>
      </div>
    </div>
  );
}
