import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  Sparkles,
  Upload,
  FolderGit2,
  Download,
  KeyRound,
  User,
  ShieldAlert,
  Users,
  CheckSquare,
  Folders,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, isAdmin } = useAuth();

  const userNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Dataset Hub', path: '/datasets', icon: Database },
    { name: 'AI Recommender', path: '/recommendations', icon: Sparkles },
    { name: 'Upload Dataset', path: '/upload', icon: Upload },
    { name: 'My Submissions', path: '/my-uploads', icon: FolderGit2 },
    { name: 'My Downloads', path: '/my-downloads', icon: Download },
    { name: 'Access Requests', path: '/access-requests', icon: KeyRound },
    { name: 'My Profile', path: '/profile', icon: User }
  ];

  const adminNav = [
    { name: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Dataset Approvals', path: '/admin/approvals', icon: CheckSquare },
    { name: 'Access Requests', path: '/admin/access-requests', icon: KeyRound },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Category Manager', path: '/admin/categories', icon: Folders },
    { name: 'Analytics & KPIs', path: '/admin/analytics', icon: BarChart3 }
  ];

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
      isActive
        ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  const adminLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
      isActive
        ? 'bg-indigo-700 text-white shadow-sm shadow-indigo-600/20'
        : 'text-indigo-900/80 hover:text-indigo-950 hover:bg-indigo-100/60'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex-shrink-0 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-6">
        {/* User Hub */}
        <div>
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            User Workspace
          </p>
          <nav className="space-y-1">
            {userNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.path} to={item.path} end={item.path === '/dashboard'} className={linkClass}>
                  <Icon size={16} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Admin Hub (Conditional) */}
        {isAdmin && (
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5 px-3 mb-2">
              <ShieldAlert size={14} className="text-indigo-600" />
              <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                Admin Control
              </p>
            </div>
            <nav className="space-y-1 bg-indigo-50/50 p-1.5 rounded-2xl border border-indigo-100/60">
              {adminNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.path} to={item.path} end={item.path === '/admin'} className={adminLinkClass}>
                    <Icon size={16} />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* User Card at bottom of sidebar */}
      <div className="pt-4 border-t border-slate-100">
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
          <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
          <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
              {user?.role}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
