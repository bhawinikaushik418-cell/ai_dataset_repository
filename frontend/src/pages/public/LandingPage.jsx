import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Database, Sparkles, Shield, ArrowRight, CheckCircle2, Download, Layers, Activity } from 'lucide-react';
import api from '../../api/client';
import DatasetCard from '../../components/DatasetCard';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function LandingPage() {
  const [featuredDatasets, setFeaturedDatasets] = useState([]);
  const [stats, setStats] = useState({ datasets: 0, categories: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLandingData() {
      try {
        const [dsRes, catRes] = await Promise.all([
          api.get('/datasets?limit=3&sort=popular'),
          api.get('/categories')
        ]);
        setFeaturedDatasets(dsRes.data || []);
        setStats({
          datasets: dsRes.meta?.total || dsRes.data?.length || 0,
          categories: catRes.data?.length || 0
        });
      } catch (err) {
        console.error('Failed to load landing data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLandingData();
  }, []);

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pb-16 lg:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold mb-6">
            <Sparkles size={14} className="text-brand-600 animate-pulse" />
            Next-Gen Academic DBMS PBL System with AI Matching
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
            Discover, Share & Audit{' '}
            <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI/ML Datasets
            </span>{' '}
            with Intelligent Precision
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A production-grade, 3NF normalized relational repository built on MySQL 8.
            Features role-based access control, cryptographic verification, and a 100-point content-based recommendation engine.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/datasets"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-brand-600 text-white font-bold text-sm shadow-lg shadow-brand-500/25 hover:bg-brand-700 transition-all hover:-translate-y-0.5"
            >
              Browse Repository
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/recommendations"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold text-sm shadow-sm hover:bg-slate-50 transition-all hover:-translate-y-0.5"
            >
              <Sparkles size={16} className="text-brand-600" />
              Try AI Recommender
            </Link>
          </div>

          {/* Metrics bar */}
          <div className="mt-14 max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm">
            <div>
              <p className="text-2xl font-extrabold text-slate-900">{stats.datasets || '5+'}</p>
              <p className="text-xs font-medium text-slate-500">Real UCI Datasets</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-brand-600">{stats.categories || '4'}</p>
              <p className="text-xs font-medium text-slate-500">Academic Domains</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-indigo-600">3NF</p>
              <p className="text-xs font-medium text-slate-500">Normalized Schema</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-purple-600">100 pt</p>
              <p className="text-xs font-medium text-slate-500">Weighted + TF-IDF</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Datasets Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Featured Datasets</h2>
            <p className="text-sm text-slate-500 mt-1">
              Real benchmark machine learning collections with verified citations
            </p>
          </div>
          <Link
            to="/datasets"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            View all ({stats.datasets}) <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner text="Retrieving verified datasets from MySQL..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredDatasets.map((dataset) => (
              <DatasetCard key={dataset.dataset_id} dataset={dataset} />
            ))}
          </div>
        )}
      </section>

      {/* DBMS Architectural Pillars */}
      <section className="bg-slate-900 text-white py-16 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Engineered for DBMS Excellence
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Beyond simple CRUD — rigorously built targeting Third Normal Form (3NF) relational compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                <Layers size={20} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">3NF Relational Integrity</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Atomic candidate keys, complete functional dependencies, and zero update anomalies. Composite M:N junction tables and stored functional expression indexes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-4">
                <Shield size={20} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Audited RBAC & Access Gates</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Role-based middleware guards, server-side JWT revocation, and download access request gates preventing unauthorized file retrieval.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
                <Sparkles size={20} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Content-Based Recommender</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Structured 100-point weighted scoring (Task, Domain, Format, Difficulty, Quality) blended with mathematical TF-IDF vector cosine similarity.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
