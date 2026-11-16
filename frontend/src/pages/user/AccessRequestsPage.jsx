import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, CheckCircle, Clock, AlertCircle, Download, RotateCcw } from 'lucide-react';
import api from '../../api/client';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AccessRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/access-requests/my');
      setRequests(res.data || []);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDownload = async (datasetId, datasetName) => {
    try {
      const response = await fetch(`/api/datasets/${datasetId}/download`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        alert('Download error. Please check access permissions.');
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

  if (loading) return <LoadingSpinner text="Retrieving access requests from MySQL..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Restricted Dataset Access Requests
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor administrative review status for sensitive or medical machine learning datasets
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {requests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Dataset</th>
                  <th className="py-3.5 px-4">Research Justification</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Timestamps</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {requests.map((r) => (
                  <tr key={r.request_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <Link to={`/datasets/${r.dataset_id}`} className="hover:text-brand-600 transition-colors">
                        {r.dataset_name}
                      </Link>
                      <span className="block text-[11px] text-slate-400 font-normal mt-0.5">
                        {r.domain} • {r.task_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-700 line-clamp-2">{r.justification}</p>
                      {r.status === 'REJECTED' && r.rejection_reason && (
                        <div className="mt-1 p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-[11px] flex items-start gap-1">
                          <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                          <span>{r.rejection_reason}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={r.status}>{r.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-500">
                      <div>Requested: {new Date(r.requested_at).toLocaleDateString()}</div>
                      {r.reviewed_at && (
                        <div className="text-slate-400">
                          Reviewed: {new Date(r.reviewed_at).toLocaleDateString()}
                          {r.reviewer_name && ` by ${r.reviewer_name}`}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {r.status === 'APPROVED' ? (
                        <button
                          onClick={() => handleDownload(r.dataset_id, r.dataset_name)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
                        >
                          <Download size={12} /> Download
                        </button>
                      ) : r.status === 'REJECTED' ? (
                        <Link
                          to={`/datasets/${r.dataset_id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                        >
                          <RotateCcw size={12} /> Re-request
                        </Link>
                      ) : (
                        <span className="text-[11px] text-amber-600 font-semibold flex items-center justify-end gap-1">
                          <Clock size={12} /> Under Review
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center space-y-3">
            <KeyRound size={36} className="mx-auto text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">No access requests submitted</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              When you encounter a restricted dataset, request access to unlock download permissions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
