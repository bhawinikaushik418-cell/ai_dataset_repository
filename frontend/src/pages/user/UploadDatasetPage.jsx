import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileUp, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function UploadDatasetPage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Form State
  const [datasetName, setDatasetName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [license, setLicense] = useState('Creative Commons Attribution 4.0');
  const [domain, setDomain] = useState('Life Sciences');
  const [taskType, setTaskType] = useState('Classification');
  const [dataType, setDataType] = useState('Tabular');
  const [difficultyLevel, setDifficultyLevel] = useState('BEGINNER');
  const [accessLevel, setAccessLevel] = useState('PUBLIC');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.get('/categories');
        setCategories(res.data || []);
        if (res.data && res.data.length > 0) {
          setCategoryId(res.data[0].category_id);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['csv', 'zip'].includes(ext)) {
        setError('Only .csv and .zip files are allowed for dataset uploads.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedFile) {
      setError('Please choose a .csv or .zip file to upload.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('dataset_file', selectedFile);
      formData.append('dataset_name', datasetName);
      formData.append('description', description);
      formData.append('source_url', sourceUrl);
      formData.append('license', license);
      formData.append('domain', domain);
      formData.append('task_type', taskType);
      formData.append('data_type', dataType);
      formData.append('difficulty_level', difficultyLevel);
      formData.append('access_level', accessLevel);
      formData.append('category_id', categoryId);
      formData.append('tags', tags);

      // We use native fetch or api client with multipart
      const token = localStorage.getItem('token');
      const response = await fetch('/api/datasets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Dataset upload failed.');
      }

      alert('Dataset submitted successfully! ' + (data.message || ''));
      navigate('/my-uploads');
    } catch (err) {
      setError(err.message || 'Failed to submit dataset.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCategories) {
    return <LoadingSpinner text="Preparing upload form..." />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Upload New AI/ML Dataset
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Catalog real dataset metadata and upload files (.csv or .zip) for relational indexing
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
          <AlertCircle size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Section 1: Core Details */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-2 border-b border-slate-100">
            1. Basic Metadata
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Dataset Name *
            </label>
            <input
              type="text"
              required
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              placeholder="e.g. Chronic Kidney Disease Diagnostic Cohort"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Comprehensive Description *
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed summary of attributes, sampling methodology, and prediction targets..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Official Source URL *
              </label>
              <input
                type="url"
                required
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://archive.ics.uci.edu/dataset/..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                License & Attribution *
              </label>
              <input
                type="text"
                required
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                placeholder="e.g. Creative Commons Attribution 4.0"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Taxonomic Classification */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-2 border-b border-slate-100">
            2. ML Attributes & Classification
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Category *</label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Scientific Domain *</label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Healthcare">Healthcare</option>
                <option value="Life Sciences">Life Sciences</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Social Sciences">Social Sciences</option>
                <option value="Computer Vision">Computer Vision</option>
                <option value="NLP">NLP</option>
                <option value="Finance">Finance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Task Type *</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Classification">Classification</option>
                <option value="Regression">Regression</option>
                <option value="Clustering">Clustering</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Data Type *</label>
              <select
                value={dataType}
                onChange={(e) => setDataType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Tabular">Tabular</option>
                <option value="Image">Image</option>
                <option value="Text">Text</option>
                <option value="Time-Series">Time-Series</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Difficulty *</label>
              <select
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Access Permission *</label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="PUBLIC">Public Access</option>
                <option value="RESTRICTED">Restricted (Requires Admin Approval)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. oncology, biopsy, pathology, diagnostic"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Section 3: File Attachment */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-2 border-b border-slate-100">
            3. Dataset File Attachment
          </h2>

          <div className="border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-2xl p-6 text-center transition-colors">
            <input
              type="file"
              id="file-upload"
              accept=".csv,.zip"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
              <FileUp size={36} className="text-brand-600 mb-2" />
              <span className="text-xs font-bold text-slate-800">
                {selectedFile ? selectedFile.name : 'Click to select CSV or ZIP archive'}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">
                {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Maximum file size 50MB (.csv, .zip)'}
              </span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? 'Uploading & Indexing...' : 'Submit Dataset to Repository'}
            <ArrowRight size={15} />
          </button>
        </div>
      </form>
    </div>
  );
}
