import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Check, X, ExternalLink, AlertCircle, Clock } from 'lucide-react';
import api from '../../api/client';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function DatasetApprovalsPage() {
  const [pendingDatasets, setPendingDatasets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPending = async () => {
    try {
      const res = await api.get('/datasets?approval_status=PENDING&limit=50');
      setPendingDatasets(res.data || []);
    } catch (err) {
      console.error('Failed to load pending datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (datasetId) => {
    if (!confirm('Approve and publish this dataset to the public repository?')) return;

    try {
      await api.patch(`/datasets/${datasetId}/approval`, { status: 'APPROVED' });
      setPendingDatasets((prev) => prev.filter((d) => d.dataset_id !== datasetId));
      alert('Dataset successfully approved and published!');
    } catch (err) {
      alert(err.message || 'Failed to approve dataset.');
    }
  };

  const openRejectModal = (dataset) => {
    setSelectedDataset(dataset);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;

    setSubmitting(true);
    try {
      await api.patch(`/datasets/${selectedDataset.dataset_id}/approval`, {
        status: 'REJECTED',
        rejection_reason: rejectionReason.trim()
      });
      setPendingDatasets((prev) => prev.filter((d) => d.dataset_id !== selectedDataset.dataset_id));
      setRejectModalOpen(false);
      alert('Dataset submission rejected with documented feedback.');
    } catch (err) {
      alert(err.message || 'Failed to reject dataset.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  if (loading) return <LoadingSpinner text="Querying pending dataset submissions..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Dataset Submissions Approval Queue
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review student contributions, inspect metadata completeness, and approve or reject with feedback
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {pendingDatasets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Dataset Name</th>
                  <th className="py-3.5 px-4">Uploader</th>
                  <th className="py-3.5 px-4">Domain / Task</th>
                  <th className="py-3.5 px-4">Format & Size</th>
                  <th className="py-3.5 px-4">Access Level</th>
                  <th className="py-3.5 px-4">Submitted Date</th>
                  <th className="py-3.5 px-4 text-right">Verification Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {pendingDatasets.map((d) => (
                  <tr key={d.dataset_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <Link to={`/datasets/${d.dataset_id}`} className="hover:text-brand-600 transition-colors">
                        {d.dataset_name}
                      </Link>
                      <span className="block text-[11px] text-slate-400 font-normal mt-0.5 line-clamp-1 max-w-xs">
                        {d.description}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{d.uploader_name}</td>
                    <td className="py-3.5 px-4">
                      {d.domain} • <span className="text-slate-500">{d.task_type}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono">{d.file_format}</span> • {formatSize(d.file_size_bytes)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={d.access_level}>{d.access_level}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => handleApprove(d.dataset_id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
                      >
                        <Check size={13} /> Approve
                      </button>
                      <button
                        onClick={() => openRejectModal(d)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors"
                      >
                        <X size={13} /> Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center space-y-3">
            <CheckSquare size={36} className="mx-auto text-emerald-400" />
            <h3 className="text-base font-bold text-slate-800">Queue is clear!</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No dataset submissions currently awaiting administrator approval.
            </p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title={`Reject Submission: ${selectedDataset?.dataset_name || ''}`}
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <p className="text-xs text-slate-600">
            Please document the specific reason for rejecting this dataset (e.g. invalid format, missing citation, or corrupted CSV). The uploader will receive this feedback.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Rejection Reason *
            </label>
            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Attribute column headers missing in CSV. Please re-upload with clean headers..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || rejectionReason.trim().length < 5}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 disabled:opacity-40"
            >
              {submitting ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
