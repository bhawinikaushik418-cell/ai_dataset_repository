import React from 'react';
import { User, Mail, Shield, Calendar, LogOut, CheckCircle, Database, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/Badge';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          User Account Profile
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Academic credentials, permission level, and repository security profile
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Avatar header */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-900 to-indigo-900 text-white flex items-center justify-center text-2xl font-extrabold uppercase shadow-lg shadow-slate-900/10">
            {user?.name ? user.name[0] : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={user?.role}>{user?.role}</Badge>
              <Badge variant={user?.status}>{user?.status}</Badge>
            </div>
          </div>
        </div>

        {/* Credentials Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Unique User ID
            </span>
            <span className="font-mono font-bold text-slate-800">
              #{user?.userId || user?.user_id}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Authorization Role
            </span>
            <span className="font-bold text-indigo-700">
              {user?.role === 'ADMIN' ? 'System Administrator' : 'Student / Researcher'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Password Security
            </span>
            <span className="font-medium text-emerald-700 flex items-center gap-1">
              <CheckCircle size={13} /> Bcrypt Hash (Salt 10)
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Session Mechanism
            </span>
            <span className="font-medium text-slate-700">
              Stateless JWT + RevokedTokens Blacklist
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={logout}
            className="px-5 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <LogOut size={14} /> Invalidate Session & Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
