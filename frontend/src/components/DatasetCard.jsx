import React from 'react';
import { Link } from 'react-router-dom';
import { Download, Lock, CheckCircle, Database, FileText, ArrowRight } from 'lucide-react';
import Badge from './Badge';
import StarRating from './StarRating';

export default function DatasetCard({ dataset, onDownload = null }) {
  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Top Badges & Access Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge variant={dataset.domain}>{dataset.domain}</Badge>
          <div className="flex items-center gap-1.5">
            <Badge variant={dataset.file_format}>{dataset.file_format}</Badge>
            <Badge variant={dataset.access_level}>
              {dataset.access_level === 'RESTRICTED' ? (
                <span className="flex items-center gap-1">
                  <Lock size={11} /> Restricted
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <CheckCircle size={11} /> Public
                </span>
              )}
            </Badge>
          </div>
        </div>

        {/* Title */}
        <Link to={`/datasets/${dataset.dataset_id}`}>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1 mb-1.5">
            {dataset.dataset_name}
          </h3>
        </Link>

        {/* Category & Task */}
        <p className="text-xs font-medium text-slate-500 mb-3 flex items-center gap-1.5">
          <span>{dataset.category_name}</span>
          <span>•</span>
          <span className="text-brand-700 bg-brand-50 px-2 py-0.5 rounded font-mono text-[11px]">
            {dataset.task_type}
          </span>
        </p>

        {/* Description snippet */}
        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed mb-4">
          {dataset.description}
        </p>

        {/* Tags */}
        {dataset.tags && dataset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {dataset.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
              >
                #{tag}
              </span>
            ))}
            {dataset.tags.length > 3 && (
              <span className="text-[11px] text-slate-400 font-medium self-center">
                +{dataset.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Metrics & Actions */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <StarRating
            rating={dataset.avg_rating}
            totalRatings={dataset.total_ratings}
            size={14}
          />
          <span className="text-[11px] text-slate-400 mt-0.5">
            {formatSize(dataset.file_size_bytes)} • {dataset.total_downloads || 0} downloads
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onDownload && dataset.has_access && (
            <button
              onClick={() => onDownload(dataset.dataset_id, dataset.dataset_name)}
              title="Quick Download"
              className="p-2 rounded-xl bg-slate-100 hover:bg-brand-50 text-slate-600 hover:text-brand-600 transition-colors"
            >
              <Download size={16} />
            </button>
          )}

          <Link
            to={`/datasets/${dataset.dataset_id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-brand-600 transition-colors"
          >
            Details
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
