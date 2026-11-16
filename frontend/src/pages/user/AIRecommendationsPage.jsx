import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Search,
  CheckCircle2,
  Lock,
  ArrowRight,
  Download,
  Info,
  Cpu,
  Layers,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import api from '../../api/client';
import Badge from '../../components/Badge';
import StarRating from '../../components/StarRating';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AIRecommendationsPage() {
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState('');
  const [taskType, setTaskType] = useState('');
  const [dataType, setDataType] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const [recommendations, setRecommendations] = useState([]);
  const [extractedAttrs, setExtractedAttrs] = useState({});
  const [activeFilters, setActiveFilters] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);

  // Initial load recommendations
  useEffect(() => {
    handleRecommend();
  }, []);

  const handleRecommend = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/recommendations', {
        query: query.trim() || undefined,
        domain: domain || undefined,
        task_type: taskType || undefined,
        data_type: dataType || undefined,
        difficulty_level: difficulty || undefined,
        limit: 6
      });

      const payload = res.data || {};
      setRecommendations(payload.recommendations || []);
      setExtractedAttrs(payload.extracted_attributes || {});
      setActiveFilters(payload.active_filters || {});
    } catch (err) {
      console.error('Failed to generate recommendations:', err);
      alert('Error querying recommender engine: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetQuery = (presetText, presetDomain, presetTask, presetDiff, presetDataType) => {
    setQuery(presetText);
    setDomain(presetDomain || '');
    setTaskType(presetTask || '');
    setDifficulty(presetDiff || '');
    setDataType(presetDataType || '');
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
        alert(errJson.message || 'Download denied. Please request access first.');
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
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-brand-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-xs font-semibold mb-3 border border-purple-500/30">
            <Cpu size={14} className="text-purple-300" />
            Content-Based Algorithm (TF-IDF + Weighted Scoring)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Intelligent Dataset Recommender
          </h1>
          <p className="text-xs sm:text-sm text-purple-200 mt-2 leading-relaxed">
            Enter your natural language research requirements or select project attributes.
            Our algorithm evaluates <strong>100-point structured scoring</strong> plus <strong>TF-IDF vector cosine similarity</strong> across verified MySQL dataset metadata.
          </p>
          <p className="text-[11px] text-purple-300/80 mt-2 italic">
            * Note: This is an interpretable content-based relational recommender system, not a black-box deep learning model.
          </p>
        </div>
      </div>

      {/* Recommender Form Console */}
      <form onSubmit={handleRecommend} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Describe Your Research Goal or Modeling Intent
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. I need a beginner-level image classification dataset for agriculture..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>
        </div>

        {/* Structured Constraint Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Domain (+25 pts)</label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Any Domain</option>
              <option value="Agriculture">Agriculture</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Life Sciences">Life Sciences</option>
              <option value="Social Sciences">Social Sciences</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Task (+30 pts)</label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Any Task</option>
              <option value="Classification">Classification</option>
              <option value="Regression">Regression</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Data Type (+20 pts)</label>
            <select
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Any Data Type</option>
              <option value="Tabular">Tabular</option>
              <option value="Image">Image</option>
              <option value="Text">Text</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Difficulty (+10 pts)</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Any Difficulty</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>
        </div>

        {/* NLP Auto-Extraction Feedback */}
        {Object.keys(extractedAttrs).length > 0 && (
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex flex-wrap items-center gap-2 text-xs text-indigo-900">
            <span className="font-bold flex items-center gap-1">
              <SlidersHorizontal size={13} /> Extracted from your prompt:
            </span>
            {extractedAttrs.domain && (
              <span className="bg-white px-2 py-0.5 rounded-md border border-indigo-200 text-[11px]">
                Domain: <strong>{extractedAttrs.domain}</strong>
              </span>
            )}
            {extractedAttrs.task_type && (
              <span className="bg-white px-2 py-0.5 rounded-md border border-indigo-200 text-[11px]">
                Task: <strong>{extractedAttrs.task_type}</strong>
              </span>
            )}
            {extractedAttrs.data_type && (
              <span className="bg-white px-2 py-0.5 rounded-md border border-indigo-200 text-[11px]">
                Type: <strong>{extractedAttrs.data_type}</strong>
              </span>
            )}
            {extractedAttrs.difficulty_level && (
              <span className="bg-white px-2 py-0.5 rounded-md border border-indigo-200 text-[11px]">
                Difficulty: <strong>{extractedAttrs.difficulty_level}</strong>
              </span>
            )}
          </div>
        )}

        {/* Quick Sample Query Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-slate-500">
          <span className="font-semibold text-[11px]">Try sample queries:</span>
          <button
            type="button"
            onClick={() => handlePresetQuery('beginner level classification for botany and plant species', 'Life Sciences', 'Classification', 'BEGINNER', 'Tabular')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-[11px] font-medium transition-colors"
          >
            "Beginner plant classification"
          </button>
          <button
            type="button"
            onClick={() => handlePresetQuery('intermediate clinical patient diagnostics and cardiology', 'Healthcare', 'Classification', 'INTERMEDIATE', 'Tabular')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-[11px] font-medium transition-colors"
          >
            "Clinical cardiology diagnostics"
          </button>
          <button
            type="button"
            onClick={() => handlePresetQuery('student achievement secondary education exam grades regression', 'Social Sciences', 'Regression', 'BEGINNER', 'Tabular')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-[11px] font-medium transition-colors"
          >
            "Student academic achievement"
          </button>
          <button
            type="button"
            onClick={() => handlePresetQuery('beginner level classification for agriculture viticulture wine', 'Agriculture', 'Classification', 'BEGINNER', 'Tabular')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-[11px] font-medium transition-colors"
          >
            "Agriculture wine quality"
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all flex items-center gap-2"
          >
            <Sparkles size={15} />
            {loading ? 'Executing Recommendation Engine...' : 'Generate Recommendations'}
          </button>
        </div>
      </form>

      {/* Algorithm Transparency & Scoring Rubric */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <Info size={16} className="text-purple-600 flex-shrink-0" />
          <span>100-Point Weighted Scoring Rubric:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium">
          <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Task Match: <strong>30 pts</strong></span>
          <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Domain Match: <strong>25 pts</strong></span>
          <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Data Type: <strong>20 pts</strong></span>
          <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Difficulty: <strong>10 pts</strong></span>
          <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Quality: <strong>10 pts</strong></span>
          <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Rating: <strong>5 pts</strong></span>
          <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold border border-purple-200">+ TF-IDF Cosine Similarity</span>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Ranked Recommendations {recommendations.length > 0 && `(${recommendations.length} Matches)`}
          </h2>
        </div>

        {loading ? (
          <LoadingSpinner text="Computing weighted scores and TF-IDF cosine vector similarities..." />
        ) : recommendations.length > 0 ? (
          <div className="space-y-4">
            {recommendations.map((dataset) => {
              const isExpanded = expandedCard === dataset.dataset_id;
              const breakdown = dataset.score_breakdown || {};

              return (
                <div
                  key={dataset.dataset_id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 rounded-xl bg-purple-100 text-purple-900 font-extrabold text-xs">
                          Rank #{dataset.ranking}
                        </span>
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs">
                          {dataset.match_percentage}% Match
                        </span>
                        <Badge variant={dataset.domain}>{dataset.domain}</Badge>
                        <Badge variant={dataset.access_level}>{dataset.access_level}</Badge>
                      </div>

                      <Link to={`/datasets/${dataset.dataset_id}`}>
                        <h3 className="text-lg font-bold text-slate-900 hover:text-brand-600 transition-colors">
                          {dataset.dataset_name}
                        </h3>
                      </Link>

                      <p className="text-xs text-slate-500 mt-1">
                        {dataset.category_name} • Task: <span className="font-semibold text-slate-700">{dataset.task_type}</span> • Format: <span className="font-mono">{dataset.file_format}</span>
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {dataset.has_access && (
                        <button
                          onClick={() => handleDownload(dataset.dataset_id, dataset.dataset_name)}
                          className="p-2.5 rounded-xl bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-600 font-bold text-xs transition-colors"
                          title="Download Permitted Dataset"
                        >
                          <Download size={16} />
                        </button>
                      )}

                      <Link
                        to={`/datasets/${dataset.dataset_id}`}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-brand-600 text-white font-bold text-xs transition-colors inline-flex items-center gap-1.5"
                      >
                        Inspect Details <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {dataset.description}
                  </p>

                  {/* Score Breakdown Pill Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs pt-1">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold">Task Match</span>
                      <span className="font-extrabold text-slate-800">{breakdown.task_points || 0}/30</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold">Domain Match</span>
                      <span className="font-extrabold text-slate-800">{breakdown.domain_points || 0}/25</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold">Data Type</span>
                      <span className="font-extrabold text-slate-800">{breakdown.data_type_points || 0}/20</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold">Difficulty</span>
                      <span className="font-extrabold text-slate-800">{breakdown.difficulty_points || 0}/10</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold">Quality</span>
                      <span className="font-extrabold text-slate-800">{breakdown.quality_points || 0}/10</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold">Rating</span>
                      <span className="font-extrabold text-slate-800">{breakdown.rating_points || 0}/5</span>
                    </div>
                  </div>

                  {/* Toggle Detailed Reasons */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setExpandedCard(isExpanded ? null : dataset.dataset_id)}
                      className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 focus:outline-none"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {isExpanded ? 'Hide Mathematical Reasoning' : 'View Detailed Recommendation Reasoning'}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-2 text-xs animate-in fade-in duration-150">
                        <p className="font-bold text-purple-950 text-[11px] uppercase tracking-wider">
                          Why this dataset was recommended:
                        </p>
                        <ul className="space-y-1.5 text-purple-900">
                          {dataset.reasons && dataset.reasons.map((reason, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle2 size={13} className="text-purple-600 flex-shrink-0 mt-0.5" />
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>

                        {dataset.matched_keywords && dataset.matched_keywords.length > 0 && (
                          <div className="pt-2 mt-2 border-t border-purple-200/60 flex items-center gap-2">
                            <span className="font-bold text-[11px] text-purple-800">TF-IDF Matched Tokens:</span>
                            <div className="flex flex-wrap gap-1">
                              {dataset.matched_keywords.map((kw, idx) => (
                                <span key={idx} className="bg-white px-2 py-0.5 rounded text-[10px] font-mono text-purple-700 border border-purple-200">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
            <Sparkles size={36} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">No recommendation matches</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your query or constraints to discover matching datasets.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
