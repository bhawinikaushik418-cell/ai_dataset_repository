import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Trash2, ExternalLink, AlertCircle, Plus } from 'lucide-react';
import api from '../../api/client';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function MyUploadsPage() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUploads = async () => {
    try {
      const res = await api.get('/datasets/my/uploads');
      setUploads(res.data || []);
    } catch (err) {
      console.error('Failed to fetch uploads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  const handleDelete = async (datasetId) => {
    if (!confirm('Are you sure you want to delete this dataset? This will remove metadata and physical files.')) {
      return;
    }

    try {
      await api.delete(`/datasets/${datasetId}`);
      setUploads((prev) => prev.filter((d) => d.dataset_id !== datasetId));
    } catch (err) {
      alert(err.message || 'Failed to delete dataset.');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  if (loading) return <LoadingSpinner text="Loading your submissions..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            My Dataset Submissions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track administrator approvals, verification feedback, and published benchmark status
          </p>
        </div>

        <Link
          to="/upload"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all self-start sm:self-auto"
        >
          <Plus size={15} /> Upload Another Dataset
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {uploads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Dataset Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Access Level</th>
                  <th className="py-3.5 px-4">Format / Size</th>
                  <th className="py-3.5 px-4">Approval Status</th>
                  <th className="py-3.5 px-4">Downloads</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {uploads.map((d) => (
                  <tr key={d.dataset_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <Link to={`/datasets/${d.dataset_id}`} className="hover:text-brand-600 transition-colors">
                        {d.dataset_name}
                      </Link>
                      <span className="block text-[11px] text-slate-400 font-normal mt-0.5">
                        {new Date(d.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{d.category_name}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={d.access_level}>{d.access_level}</Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono">{d.file_format}</span> • {formatSize(d.file_size_bytes)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={d.approval_status}>{d.approval_status}</Badge>
                      {d.approval_status === 'REJECTED' && d.rejection_reason && (
                        <p className="text-[11px] text-rose-600 mt-1 flex items-start gap-1">
                          <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                          <span>{d.rejection_reason}</span>
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">{d.total_downloads || 0}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        to={`/datasets/${d.dataset_id}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 inline-block transition-colors"
                        title="View Details"
                      >
                        <ExternalLink size={14} />
                      </Link>
                      <button
                        onClick={() => handleDelete(d.dataset_id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 inline-block transition-colors"
                        title="Delete Submission"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center space-y-3">
            <Upload size={36} className="mx-auto text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">No dataset submissions yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Contribute your first machine learning benchmark file to the repository.
            </p>
            <Link
              to="/upload"
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              <Plus size={14} /> Upload Dataset
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
