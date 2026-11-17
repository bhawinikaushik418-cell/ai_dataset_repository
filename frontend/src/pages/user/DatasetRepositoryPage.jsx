import React, { useEffect, useState } from 'react';
import { Search, Filter, RotateCcw, Database } from 'lucide-react';
import api from '../../api/client';
import DatasetCard from '../../components/DatasetCard';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function DatasetRepositoryPage() {
  const [datasets, setDatasets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState('');
  const [taskType, setTaskType] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [accessLevel, setAccessLevel] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Load Categories for filter dropdown
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.get('/categories');
        setCategories(res.data || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Fetch Datasets matching filters
  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (domain) params.append('domain', domain);
      if (taskType) params.append('task_type', taskType);
      if (difficulty) params.append('difficulty_level', difficulty);
      if (accessLevel) params.append('access_level', accessLevel);
      if (categoryId) params.append('category_id', categoryId);
      params.append('sort', sort);
      params.append('page', page);
      params.append('limit', 9);

      const res = await api.get(`/datasets?${params.toString()}`);
      setDatasets(res.data || []);
      setPagination(res.meta || { total: res.data?.length || 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to fetch datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, [page, sort, domain, taskType, difficulty, accessLevel, categoryId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDatasets();
  };

  const handleResetFilters = async () => {
    setSearch('');
    setDomain('');
    setTaskType('');
    setDifficulty('');
    setAccessLevel('');
    setCategoryId('');
    setSort('newest');
    setPage(1);
    setLoading(true);
    try {
      const res = await api.get('/datasets?sort=newest&page=1&limit=9');
      setDatasets(res.data || []);
      setPagination(res.meta || { total: res.data?.length || 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to reset dataset filters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (datasetId, datasetName) => {
    try {
      const response = await fetch(`/api/datasets/${datasetId}/download`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        alert(errJson.message || 'Download denied. Please ensure you have requested and received access.');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${datasetName.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Error initiating download: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          AI/ML Dataset Repository
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Explore benchmark machine learning datasets with relational metadata and verified citations
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        {/* Search Input Row */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by dataset name, keyword, or description (e.g. Iris, Cancer, Wine)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            Search
          </button>
        </form>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Category Dropdown */}
          <select
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>{c.name}</option>
            ))}
          </select>

          {/* Domain Dropdown */}
          <select
            value={domain}
            onChange={(e) => { setDomain(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Domains</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Life Sciences">Life Sciences</option>
            <option value="Agriculture">Agriculture</option>
            <option value="Social Sciences">Social Sciences</option>
            <option value="Computer Vision">Computer Vision</option>
            <option value="NLP">NLP</option>
          </select>

          {/* Task Type Dropdown */}
          <select
            value={taskType}
            onChange={(e) => { setTaskType(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Tasks</option>
            <option value="Classification">Classification</option>
            <option value="Regression">Regression</option>
            <option value="Clustering">Clustering</option>
          </select>

          {/* Difficulty Dropdown */}
          <select
            value={difficulty}
            onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Difficulties</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>

          {/* Access Level Dropdown */}
          <select
            value={accessLevel}
            onChange={(e) => { setAccessLevel(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Access: All</option>
            <option value="PUBLIC">Public</option>
            <option value="RESTRICTED">Restricted</option>
          </select>

          {/* Sort Order */}
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="newest">Sort: Newest</option>
            <option value="popular">Sort: Popularity</option>
            <option value="rating">Sort: Top Rated</option>
            <option value="name">Sort: Name (A-Z)</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {(search || domain || taskType || difficulty || accessLevel || categoryId) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <RotateCcw size={13} /> Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Dataset Grid */}
      {loading ? (
        <LoadingSpinner text="Querying MySQL dataset catalog..." />
      ) : datasets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {datasets.map((dataset) => (
            <DatasetCard
              key={dataset.dataset_id}
              dataset={dataset}
              onDownload={handleDownload}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Database size={36} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No matching datasets found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search filters or clearing keyword parameters.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 font-medium">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} datasets)
          </p>
          <div className="flex gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
