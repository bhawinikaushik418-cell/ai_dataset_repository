import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Database, Upload, Download, KeyRound, Sparkles, ArrowRight, Clock, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import DatasetCard from '../../components/DatasetCard';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ uploads: 0, downloads: 0, requests: 0 });
  const [recentDownloads, setRecentDownloads] = useState([]);
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [uploadsRes, downloadsRes, requestsRes, recRes] = await Promise.all([
          api.get('/datasets/my/uploads'),
          api.get('/datasets/my/downloads'),
          api.get('/access-requests/my'),
          api.post('/recommendations', { limit: 2 })
        ]);

        setStats({
          uploads: uploadsRes.data?.length || 0,
          downloads: downloadsRes.data?.length || 0,
          requests: requestsRes.data?.length || 0
        });

        setRecentDownloads((downloadsRes.data || []).slice(0, 5));
        setRecommended(recRes.data || []);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading user workspace..." />;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-3 border border-brand-500/30">
            Student / Researcher Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Discover verified machine learning benchmarks, submit access requests for sensitive restricted data, and run our weighted AI recommender.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/datasets"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition-all"
            >
              <Database size={15} /> Browse Datasets
            </Link>
            <Link
              to="/recommendations"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md transition-all border border-white/10"
            >
              <Sparkles size={15} /> AI Recommendation Engine
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Submissions</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{stats.uploads}</p>
            <Link to="/my-uploads" className="text-xs font-semibold text-brand-600 hover:underline mt-2 inline-block">
              View upload status →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Upload size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Downloads</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{stats.downloads}</p>
            <Link to="/my-downloads" className="text-xs font-semibold text-brand-600 hover:underline mt-2 inline-block">
              Audit log history →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Download size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Access Requests</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{stats.requests}</p>
            <Link to="/access-requests" className="text-xs font-semibold text-brand-600 hover:underline mt-2 inline-block">
              Check approval status →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <KeyRound size={22} />
          </div>
        </div>
      </div>

      {/* Main Grid: Recommended Datasets & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recommended column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-brand-600" />
              <h2 className="text-lg font-bold text-slate-900">Recommended for Your Research</h2>
            </div>
            <Link to="/recommendations" className="text-xs font-bold text-brand-600 hover:underline">
              Custom AI Match →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recommended.length > 0 ? (
              recommended.map((dataset) => (
                <DatasetCard key={dataset.dataset_id} dataset={dataset} />
              ))
            ) : (
              <p className="text-sm text-slate-500 py-6">No recommendations found yet.</p>
            )}
          </div>
        </div>

        {/* Recent Downloads Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-slate-600" />
            <h2 className="text-lg font-bold text-slate-900">Recent Downloads</h2>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm divide-y divide-slate-100">
            {recentDownloads.length > 0 ? (
              recentDownloads.map((item) => (
                <div key={item.download_id} className="py-3 first:pt-0 last:pb-0">
                  <Link
                    to={`/datasets/${item.dataset_id}`}
                    className="text-xs font-bold text-slate-900 hover:text-brand-600 transition-colors line-clamp-1"
                  >
                    {item.dataset_name}
                  </Link>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                    <span>{item.category_name}</span>
                    <span>{new Date(item.downloaded_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                No files downloaded yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
