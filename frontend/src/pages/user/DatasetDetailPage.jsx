import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Download,
  Lock,
  CheckCircle,
  ExternalLink,
  Shield,
  FileCode,
  Calendar,
  User,
  Star,
  MessageSquare,
  AlertCircle,
  Clock,
  ArrowLeft
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/Badge';
import StarRating from '../../components/StarRating';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function DatasetDetailPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();

  const [dataset, setDataset] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Request Access Modal State
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [justification, setJustification] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestMsg, setRequestMsg] = useState('');

  // New Review Form State
  const [newReviewText, setNewReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const loadDatasetDetails = async () => {
    try {
      const [dsRes, revRes] = await Promise.all([
        api.get(`/datasets/${id}`),
        api.get(`/reviews/${id}`)
      ]);
      setDataset(dsRes.data);
      setReviews(revRes.data || []);

      if (isAuthenticated) {
        try {
          const ratingRes = await api.get(`/ratings/${id}/my`);
          if (ratingRes.data?.rating) {
            setUserRating(ratingRes.data.rating);
          }
        } catch {
          // No rating yet
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load dataset details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatasetDetails();
  }, [id, isAuthenticated]);

  const handleDownload = async () => {
    if (!isAuthenticated) {
      alert('Authentication required. Please log in to download datasets.');
      return;
    }

    try {
      const response = await fetch(`/api/datasets/${id}/download`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        alert(errJson.message || 'Download denied by security gate.');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = dataset.file_name || `dataset_${id}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Error initiating download: ' + err.message);
    }
  };

  const handleRate = async (starValue) => {
    if (!isAuthenticated) {
      alert('Please sign in to rate this dataset.');
      return;
    }

    try {
      await api.post('/ratings', { dataset_id: id, rating: starValue });
      setUserRating(starValue);
      // Reload dataset to get recalculated average rating
      const dsRes = await api.get(`/datasets/${id}`);
      setDataset(dsRes.data);
    } catch (err) {
      alert(err.message || 'Failed to submit rating.');
    }
  };

  const handlePostReview = async (e) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;

    setReviewSubmitting(true);
    try {
      await api.post('/reviews', { dataset_id: id, review_text: newReviewText });
      setNewReviewText('');
      const revRes = await api.get(`/reviews/${id}`);
      setReviews(revRes.data || []);
    } catch (err) {
      alert(err.message || 'Failed to post review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      setReviews((prev) => prev.filter((r) => r.review_id !== reviewId));
    } catch (err) {
      alert(err.message || 'Failed to delete review.');
    }
  };

  const handleAccessRequestSubmit = async (e) => {
    e.preventDefault();
    setRequestSubmitting(true);
    setRequestMsg('');

    try {
      await api.post('/access-requests', {
        dataset_id: id,
        justification
      });
      setRequestModalOpen(false);
      setJustification('');
      alert('Access request submitted successfully! An administrator will review your research intent.');
      loadDatasetDetails();
    } catch (err) {
      setRequestMsg(err.message || 'Failed to submit access request.');
    } finally {
      setRequestSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Retrieving dataset from MySQL..." />;

  if (error || !dataset) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <AlertCircle size={36} className="mx-auto text-rose-500 mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Dataset Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">{error || 'The requested dataset could not be located.'}</p>
        <Link to="/datasets" className="mt-4 inline-block px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
          Back to repository
        </Link>
      </div>
    );
  }

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          to="/datasets"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Repository
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant={dataset.domain}>{dataset.domain}</Badge>
              <Badge variant={dataset.file_format}>{dataset.file_format}</Badge>
              <Badge variant={dataset.difficulty_level}>{dataset.difficulty_level}</Badge>
              <Badge variant={dataset.access_level}>
                {dataset.access_level === 'RESTRICTED' ? (
                  <span className="flex items-center gap-1"><Lock size={12} /> Restricted Access</span>
                ) : (
                  <span className="flex items-center gap-1"><CheckCircle size={12} /> Public Access</span>
                )}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {dataset.dataset_name}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Category: <span className="font-semibold text-slate-700">{dataset.category_name}</span> • Task: <span className="font-semibold text-brand-700">{dataset.task_type}</span>
            </p>
          </div>

          {/* Action Button: Download or Request Access */}
          <div className="flex flex-col sm:items-end gap-2">
            {dataset.has_access ? (
              <button
                onClick={handleDownload}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-lg shadow-brand-500/20 transition-all hover:-translate-y-0.5"
              >
                <Download size={16} /> Download ({formatSize(dataset.file_size_bytes)})
              </button>
            ) : dataset.latestAccessRequest?.status === 'PENDING' ? (
              <div className="px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold flex items-center gap-2">
                <Clock size={16} /> Access Request Pending Review
              </div>
            ) : (
              <button
                onClick={() => setRequestModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all hover:-translate-y-0.5"
              >
                <Lock size={16} /> Request Restricted Access
              </button>
            )}

            <span className="text-[11px] text-slate-400">
              {dataset.total_downloads || 0} total downloads audited
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="py-6 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider text-[11px]">
            Dataset Overview & Description
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {dataset.description}
          </p>
        </div>

        {/* Detailed Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">License</span>
            <span className="font-bold text-slate-800">{dataset.license}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Data Type</span>
            <span className="font-bold text-slate-800">{dataset.data_type}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">File Name</span>
            <span className="font-bold text-slate-800 font-mono text-[11px] truncate block">{dataset.file_name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Uploaded By</span>
            <span className="font-bold text-slate-800">{dataset.uploader_name}</span>
          </div>
        </div>

        {/* Citation & Source URL */}
        <div className="pt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1.5">
            {dataset.tags && dataset.tags.map((tag) => (
              <span key={tag} className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                #{tag}
              </span>
            ))}
          </div>

          <a
            href={dataset.source_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
          >
            Original UCI Repository Source <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Community Ratings & Reviews Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Community Ratings & Reviews</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Peer peer-review feedback and empirical observations
            </p>
          </div>

          {/* Interactive User Rating Bar */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600">Your Rating:</span>
            <StarRating
              rating={userRating}
              interactive={true}
              onRate={handleRate}
              size={20}
              showCount={false}
            />
          </div>
        </div>

        {/* Post a Review Form */}
        {isAuthenticated ? (
          <form onSubmit={handlePostReview} className="space-y-3">
            <textarea
              rows={3}
              value={newReviewText}
              onChange={(e) => setNewReviewText(e.target.value)}
              placeholder="Share empirical observations, data hygiene remarks, or benchmark modeling results..."
              className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={reviewSubmitting || !newReviewText.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-40"
              >
                {reviewSubmitting ? 'Posting...' : 'Post Review'}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl text-center">
            <Link to="/login" className="font-bold text-brand-600 hover:underline">Sign in</Link> to post a review or rate this benchmark.
          </p>
        )}

        {/* Reviews List */}
        <div className="space-y-4 pt-2">
          {reviews.length > 0 ? (
            reviews.map((rev) => (
              <div key={rev.review_id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center uppercase">
                      {rev.user_name ? rev.user_name[0] : 'U'}
                    </div>
                    <span className="text-xs font-bold text-slate-800">{rev.user_name}</span>
                    {rev.user_rating && (
                      <span className="text-xs text-amber-500 font-bold flex items-center gap-0.5">
                        <Star size={12} className="fill-amber-400" /> {rev.user_rating}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                    {(user?.role === 'ADMIN' || user?.userId === rev.user_id) && (
                      <button
                        onClick={() => handleDeleteReview(rev.review_id)}
                        className="text-[11px] font-semibold text-rose-500 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed pl-8">
                  {rev.review_text}
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">
              No reviews written yet. Be the first to provide feedback!
            </p>
          )}
        </div>
      </div>

      {/* Modal: Request Restricted Access */}
      <Modal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        title="Request Access to Restricted Dataset"
      >
        <form onSubmit={handleAccessRequestSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            This dataset (<strong className="text-slate-900">{dataset.dataset_name}</strong>) contains sensitive medical/restricted attributes.
            Please specify your academic or research justification below for administrator review.
          </p>

          {requestMsg && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
              {requestMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Research Justification & Institutional Affiliation
            </label>
            <textarea
              rows={4}
              required
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="e.g. Graduate semester project on cardiovascular diagnostics under Prof. Turing..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRequestModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={requestSubmitting || justification.trim().length < 10}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 disabled:opacity-40"
            >
              {requestSubmitting ? 'Submitting...' : 'Submit Access Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
