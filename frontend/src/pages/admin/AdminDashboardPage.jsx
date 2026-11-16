import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  Database,
  CheckSquare,
  KeyRound,
  Download,
  Star,
  Folders,
  ArrowRight,
  Clock
} from 'lucide-react';
import api from '../../api/client';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminAnalytics() {
      try {
        const res = await api.get('/admin/analytics');
        setAnalytics(res.data);
      } catch (err) {
        console.error('Failed to load admin analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminAnalytics();
  }, []);

  if (loading) return <LoadingSpinner text="Aggregating repository analytics..." />;

  const kpis = analytics?.kpis || {};
  const topDownloaded = analytics?.top_downloaded || [];
  const recentDownloads = analytics?.recent_downloads || [];

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-500/30">
            <ShieldAlert size={14} className="text-indigo-400" />
            Repository Administrator Console
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            System Overview & Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Manage student access requests, review unverified dataset submissions, configure academic categories, and audit data download activity.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Users</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{kpis.total_users || 0}</p>
          <Link to="/admin/users" className="text-[11px] font-semibold text-brand-600 hover:underline mt-1 block">
            Manage users →
          </Link>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Datasets</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{kpis.total_datasets || 0}</p>
          <span className="text-[11px] text-emerald-600 font-medium block mt-1">
            {kpis.approved_datasets || 0} published
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm">
          <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending Submissions</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{kpis.pending_approvals || 0}</p>
          <Link to="/admin/approvals" className="text-[11px] font-bold text-amber-700 hover:underline mt-1 block">
            Review submissions →
          </Link>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-200 bg-purple-50/20 shadow-sm">
          <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Pending Access Reqs</p>
          <p className="text-2xl font-extrabold text-purple-600 mt-1">{kpis.pending_access_requests || 0}</p>
          <Link to="/admin/access-requests" className="text-[11px] font-bold text-purple-700 hover:underline mt-1 block">
            Review requests →
          </Link>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Downloads</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{kpis.total_downloads || 0}</p>
          <span className="text-[11px] text-slate-400 font-medium block mt-1">Audited events</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Rating</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{kpis.overall_avg_rating || '0.0'}</p>
          <span className="text-[11px] text-amber-500 font-medium block mt-1">Across repository</span>
        </div>
      </div>

      {/* Main Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Downloaded Datasets */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Most Downloaded Datasets</h2>
            <Link to="/admin/analytics" className="text-xs font-bold text-brand-600 hover:underline">
              Deep Analytics →
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {topDownloaded.map((d, idx) => (
              <div key={d.dataset_id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 font-bold text-slate-500 flex items-center justify-center text-[11px]">
                    #{idx + 1}
                  </span>
                  <div>
                    <Link to={`/datasets/${d.dataset_id}`} className="font-bold text-slate-900 hover:text-brand-600">
                      {d.dataset_name}
                    </Link>
                    <span className="block text-[11px] text-slate-400">{d.domain}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-800">{d.total_downloads} downloads</span>
                  <span className="block text-[11px] text-amber-500 font-semibold">★ {d.avg_rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Download Audit Log */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Live Download Audit Log</h2>
            <span className="text-[11px] text-slate-400">Preserved in Downloads table</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {recentDownloads.map((log) => (
              <div key={log.download_id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">{log.dataset_name}</span>
                  <span className="block text-[11px] text-slate-400">
                    By {log.user_name} ({log.user_email || 'Audit Log'})
                  </span>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <span className="font-mono">{log.ip_address}</span>
                  <span className="block">{new Date(log.downloaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
