import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Database, Clock, ExternalLink } from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function MyDownloadsPage() {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDownloads() {
      try {
        const res = await api.get('/datasets/my/downloads');
        setDownloads(res.data || []);
      } catch (err) {
        console.error('Failed to load downloads:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDownloads();
  }, []);

  const handleDownload = async (datasetId, datasetName) => {
    try {
      const response = await fetch(`/api/datasets/${datasetId}/download`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        alert('Download error. Please verify session.');
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

  if (loading) return <LoadingSpinner text="Retrieving download audit records..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Personal Download Audit History
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Historical log of datasets retrieved under your academic account (stored in MySQL Downloads table)
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {downloads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Audit ID</th>
                  <th className="py-3.5 px-4">Dataset Name</th>
                  <th className="py-3.5 px-4">Domain / Task</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Format</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {downloads.map((dl) => (
                  <tr key={dl.download_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      #{dl.download_id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <Link to={`/datasets/${dl.dataset_id}`} className="hover:text-brand-600 transition-colors">
                        {dl.dataset_name}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      {dl.domain} • <span className="text-slate-500">{dl.task_type}</span>
                    </td>
                    <td className="py-3.5 px-4">{dl.category_name}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">{dl.file_format}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(dl.downloaded_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDownload(dl.dataset_id, dl.dataset_name)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-600 font-bold text-xs transition-colors"
                      >
                        <Download size={12} /> Re-download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center space-y-3">
            <Download size={36} className="mx-auto text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">No download history</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't downloaded any datasets yet. Browse the repository to find benchmarks.
            </p>
            <Link
              to="/datasets"
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Browse Repository
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
