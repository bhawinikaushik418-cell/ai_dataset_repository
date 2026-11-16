import React from 'react';

export default function Badge({ variant = 'default', children, className = '' }) {
  const variants = {
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
    PUBLIC: 'bg-blue-50 text-blue-700 border-blue-200',
    RESTRICTED: 'bg-purple-50 text-purple-700 border-purple-200',
    ADMIN: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold',
    USER: 'bg-slate-100 text-slate-700 border-slate-200',
    BEGINNER: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    INTERMEDIATE: 'bg-blue-50 text-blue-700 border-blue-200',
    ADVANCED: 'bg-orange-50 text-orange-700 border-orange-200',
    CSV: 'bg-teal-50 text-teal-700 border-teal-200',
    ZIP: 'bg-violet-50 text-violet-700 border-violet-200',
    default: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  const selected = variants[variant] || variants.default;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${selected} ${className}`}
    >
      {children}
    </span>
  );
}
