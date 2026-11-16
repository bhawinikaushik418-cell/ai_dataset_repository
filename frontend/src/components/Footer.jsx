import React from 'react';
import { Database, ExternalLink, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white">
              <Database size={15} />
            </div>
            <span className="text-sm font-extrabold text-slate-900">AIXplore</span>
            <span className="text-xs text-slate-400">| DBMS PBL Academic Repository</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500 font-medium">
            <a
              href="https://archive.ics.uci.edu"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-brand-600 transition-colors"
            >
              UCI ML Repository <ExternalLink size={12} />
            </a>
            <span className="flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-600" /> MySQL 8 3NF Relational Engine
            </span>
          </div>

          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} AI Dataset Repository. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
