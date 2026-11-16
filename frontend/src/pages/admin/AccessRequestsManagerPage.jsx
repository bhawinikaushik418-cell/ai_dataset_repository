import React, { useEffect, useState } from 'react';
import { KeyRound, Check, X, Search, AlertCircle, Clock } from 'lucide-react';
import api from '../../api/client';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AccessRequestsManagerPage() {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Reject Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      const url = statusFilter
        ? `/access-requests?status=${statusFilter}`
        : '/access-requests';
      const res = await api.get(url);
      setRequests(res.data || []);
    } catch (err) {
      console.error('Failed to load access requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleApprove = async (requestId) => {
    if (!confirm('Approve access for this student to download the restricted dataset?')) return;

    try {
      await api.patch(`/access-requests/${requestId}/review`, { status: 'APPROVED' });
      setRequests((prev) =>
        prev.map((r) => (r.request_id === requestId ? { ...r, status: 'APPROVED' } : r))
      );
      alert('Access granted! The user can now download the dataset.');
    } catch (err) {
      alert(err.message || 'Failed to approve request.');
    }
  };

  const openRejectModal = (request) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;

    setSubmitting(true);
    try {
      await api.patch(`/access-requests/${selectedRequest.request_id}/review`, {
        status: 'REJECTED',
        rejection_reason: rejectionReason.trim()
      });
      setRequests((prev) =>
        prev.map((r) =>
          r.request_id === selectedRequest.request_id
            ? { ...r, status: 'REJECTED', rejection_reason: rejectionReason.trim() }
            : r
        )
      );
      setRejectModalOpen(false);
      alert('Access request rejected.');
    } catch (err) {
      alert(err.message || 'Failed to reject access request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Retrieving access requests from MySQL..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Restricted Dataset Access Control
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Grant or deny researcher access to sensitive medical cohorts and private benchmarks
          </p>
        </div>

        {/* Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-44"
        >
          <option value="">Status: All</option>
          <option value="PENDING">Pending Only</option>
          <option value="APPROVED">Approved Only</option>
          <option value="REJECTED">Rejected Only</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {requests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Applicant</th>
                  <th className="py-3.5 px-4">Dataset</th>
                  <th className="py-3.5 px-4">Research Justification</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Requested At</th>
                  <th className="py-3.5 px-4 text-right">Access Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {requests.map((r) => (
                  <tr key={r.request_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{r.applicant_name}</span>
                      <span className="text-[11px] text-slate-400 block">{r.applicant_email}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{r.dataset_name}</span>
                      <span className="text-[11px] text-slate-400 block">{r.domain}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-700 line-clamp-2">{r.justification}</p>
                      {r.status === 'REJECTED' && r.rejection_reason && (
                        <p className="text-[11px] text-rose-600 mt-1">
                          Reason: {r.rejection_reason}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={r.status}>{r.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(r.requested_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {r.status === 'PENDING' ? (
                        <div className="space-x-1.5">
                          <button
                            onClick={() => handleApprove(r.request_id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
                          >
                            <Check size={13} /> Grant
                          </button>
                          <button
                            onClick={() => openRejectModal(r)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors"
                          >
                            <X size={13} /> Deny
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          Resolved ({r.reviewer_name || 'Admin'})
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
            <h3 className="text-base font-bold text-slate-800">No requests found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are currently no access requests matching the filter criteria.
            </p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Deny Dataset Access Request"
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <p className="text-xs text-slate-600">
            Please document the institutional reason for denying access to {selectedRequest?.applicant_name} for dataset {selectedRequest?.dataset_name}.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Reason for Denial *
            </label>
            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Incomplete institutional IRB endorsement or missing project advisor signature..."
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
              {submitting ? 'Denying...' : 'Confirm Denial'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
