import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Download,
  Database,
  Users,
  Star,
  Folders,
  Clock,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Lock,
  ExternalLink,
  Layers,
  Activity,
  RefreshCw
} from 'lucide-react';
import api from '../../api/client';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const loadAnalytics = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/admin/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) return <LoadingSpinner text="Computing SQL aggregate metrics from MySQL 8..." />;

  const kpis = analytics?.kpis || {};
  const topDownloaded = analytics?.top_downloaded || [];
  const categories = analytics?.category_distribution || [];
  const domains = analytics?.domain_distribution || [];
  const accessDist = analytics?.access_distribution || [];
  const recentUploads = analytics?.recent_uploads || [];
  const recentDownloads = analytics?.recent_downloads || [];

  // Max download count for bar scaling
  const maxDownloads = topDownloaded.length > 0
    ? Math.max(...topDownloaded.map((d) => d.total_downloads), 1)
    : 1;

  const totalCatDownloads = categories.reduce((sum, c) => sum + Number(c.total_downloads || 0), 0) || 1;

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header with Refresh button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="text-indigo-600" />
            Repository Analytics & Database Metrics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time MySQL aggregates, download frequency analytics, and access request distribution
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all self-start sm:self-auto"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin text-brand-600' : ''} />
          {refreshing ? 'Recalculating...' : 'Refresh Metrics'}
        </button>
      </div>

      {/* Primary KPI Statistic Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Card 1: Users */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Registered Users</span>
            <Users size={16} className="text-indigo-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{kpis.total_users || 0}</p>
          <Link to="/admin/users" className="text-[11px] text-brand-600 font-semibold hover:underline block">
            Manage users →
          </Link>
        </div>

        {/* Card 2: Approved Datasets */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Approved Datasets</span>
            <Database size={16} className="text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{kpis.approved_datasets || 0}</p>
          <p className="text-[11px] text-slate-400">
            of {kpis.total_datasets || 0} total created
          </p>
        </div>

        {/* Card 3: Total Downloads */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Downloads</span>
            <Download size={16} className="text-brand-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{kpis.total_downloads || 0}</p>
          <p className="text-[11px] text-emerald-600 font-semibold">
            100% verified audit logs
          </p>
        </div>

        {/* Card 4: Average Rating */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg User Rating</span>
            <Star size={16} className="text-amber-500 fill-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{kpis.overall_avg_rating || '0.00'}</p>
          <p className="text-[11px] text-slate-400">
            Across active community
          </p>
        </div>

        {/* Card 5: Pending Submissions */}
        <div className={`p-5 rounded-2xl border shadow-sm space-y-2 ${
          kpis.pending_approvals > 0 ? 'bg-amber-50/40 border-amber-200' : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Pending Approvals</span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <p className="text-3xl font-extrabold text-amber-700">{kpis.pending_approvals || 0}</p>
          <Link to="/admin/approvals" className="text-[11px] text-amber-800 font-bold hover:underline block">
            Review queue →
          </Link>
        </div>

        {/* Card 6: Pending Access Requests */}
        <div className={`p-5 rounded-2xl border shadow-sm space-y-2 ${
          kpis.pending_access_requests > 0 ? 'bg-purple-50/40 border-purple-200' : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800">Access Requests</span>
            <Lock size={16} className="text-purple-600" />
          </div>
          <p className="text-3xl font-extrabold text-purple-700">{kpis.pending_access_requests || 0}</p>
          <Link to="/admin/access-requests" className="text-[11px] text-purple-800 font-bold hover:underline block">
            Review grants →
          </Link>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Visual Chart 1: Most Downloaded Benchmarks Bar Chart */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-600" />
              Most Downloaded Benchmarks
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">Downloads Bar Chart</span>
          </div>

          <div className="space-y-4 pt-2">
            {topDownloaded.map((ds, idx) => {
              const widthPct = Math.max(8, Math.round((ds.total_downloads / maxDownloads) * 100));

              return (
                <div key={ds.dataset_id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <Link
                      to={`/datasets/${ds.dataset_id}`}
                      className="font-bold text-slate-900 hover:text-brand-600 transition-colors flex items-center gap-1.5"
                    >
                      <span className="text-slate-400 font-mono text-[11px]">#{idx + 1}</span>
                      {ds.dataset_name}
                      <span className="text-[11px] text-slate-400 font-normal">({ds.domain})</span>
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-800">{ds.total_downloads} dl</span>
                      <span className="text-amber-500 font-bold text-[11px]">★ {ds.avg_rating}</span>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-brand-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visual Chart 2: Category Distribution & Engagement Share */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Folders size={18} className="text-indigo-600" />
              Academic Category Popularity & Volume
            </h2>
            <Link to="/admin/categories" className="text-xs font-bold text-brand-600 hover:underline">
              Manage →
            </Link>
          </div>

          <div className="space-y-3 pt-2">
            {categories.map((cat) => {
              const sharePct = Math.round((Number(cat.total_downloads || 0) / totalCatDownloads) * 100);

              return (
                <div key={cat.category_id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{cat.category_name}</span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {cat.dataset_count} datasets assigned
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-indigo-700">{cat.total_downloads} downloads</span>
                      <span className="block text-[11px] text-slate-400 font-mono">{sharePct}% of volume</span>
                    </div>
                  </div>

                  {/* Percentage Progress Bar */}
                  <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, sharePct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid 2: Scientific Domain & Access Level Distribution */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Domain Distribution */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-2 border-b border-slate-100 flex items-center gap-2">
            <Layers size={15} className="text-brand-600" /> Domain Breakdown
          </h2>
          <div className="divide-y divide-slate-100 text-xs">
            {domains.map((dom) => (
              <div key={dom.domain} className="py-2.5 flex items-center justify-between">
                <span className="font-bold text-slate-800">{dom.domain}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">{dom.dataset_count} datasets</span>
                  <span className="font-bold text-brand-600 font-mono">{dom.total_downloads} dl</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Access Distribution */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-2 border-b border-slate-100 flex items-center gap-2">
            <Lock size={15} className="text-purple-600" /> Access Permission Split
          </h2>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {accessDist.map((item) => (
              <div key={item.access_level} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <Badge variant={item.access_level}>{item.access_level}</Badge>
                <p className="text-2xl font-extrabold text-slate-900 mt-2">{item.count}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Approved datasets</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Dataset Submissions Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database size={18} className="text-brand-600" />
              Recent Dataset Uploads
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest contributions across student and researcher workspaces
            </p>
          </div>
          <Link to="/admin/approvals" className="text-xs font-bold text-brand-600 hover:underline">
            View Approvals Queue →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Dataset</th>
                <th className="py-3 px-4">Uploader</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Format / Size</th>
                <th className="py-3 px-4">Access</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Uploaded At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {recentUploads.map((ds) => (
                <tr key={ds.dataset_id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <Link to={`/datasets/${ds.dataset_id}`} className="hover:text-brand-600">
                      {ds.dataset_name}
                    </Link>
                    <span className="block text-[11px] text-slate-400 font-normal">
                      {ds.domain} • {ds.task_type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-800 block">{ds.uploader_name}</span>
                    <span className="text-[11px] text-slate-400 block">{ds.uploader_email}</span>
                  </td>
                  <td className="py-3 px-4">{ds.category_name}</td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    {ds.file_format} • {formatSize(ds.file_size_bytes)}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={ds.access_level}>{ds.access_level}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={ds.approval_status}>{ds.approval_status}</Badge>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500">
                    {new Date(ds.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Download Audit Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Download size={18} className="text-emerald-600" />
              Live Download Audit Trail (MySQL Downloads Table)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified security log of user downloads preserving historical compliance
            </p>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">ON DELETE SET NULL Compliant</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Audit ID</th>
                <th className="py-3 px-4">Dataset Name</th>
                <th className="py-3 px-4">Access Level</th>
                <th className="py-3 px-4">User Identity</th>
                <th className="py-3 px-4">Client IP</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {recentDownloads.map((dl) => (
                <tr key={dl.download_id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">
                    #{dl.download_id}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    <Link to={`/datasets/${dl.dataset_id}`} className="hover:text-brand-600">
                      {dl.dataset_name}
                    </Link>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[11px]">
                    <Badge variant={dl.access_level}>{dl.access_level}</Badge>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="font-bold text-slate-800 block">{dl.user_name}</span>
                    <span className="text-[11px] text-slate-400 block">{dl.user_email || 'Audit Log'}</span>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-500">{dl.ip_address}</td>
                  <td className="py-2.5 px-4 text-right text-slate-500">
                    {new Date(dl.downloaded_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
