import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Database, Sparkles, Upload, User, LogOut, Shield, ChevronDown, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Badge from './Badge';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Database size={20} />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
                AIXplore
              </span>
              <span className="text-[10px] block font-mono font-semibold text-brand-600 -mt-1 tracking-wider uppercase">
                DBMS Dataset Hub
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/datasets"
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                isActive('/datasets')
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Repository
            </Link>

            <Link
              to="/recommendations"
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                isActive('/recommendations')
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Sparkles size={16} className="text-brand-500" />
              AI Recommender
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Dashboard
                </Link>

                <Link
                  to="/upload"
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    isActive('/upload')
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Upload size={15} />
                  Upload
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                      location.pathname.startsWith('/admin')
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-indigo-600 hover:bg-indigo-50'
                    }`}
                  >
                    <Shield size={15} />
                    Admin Center
                  </Link>
                )}
              </>
            )}
          </div>

          {/* User Profile / Auth Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-slate-200 hover:border-slate-300 bg-white transition-all focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase">
                    {user?.name ? user.name[0] : 'U'}
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-bold text-slate-800 leading-tight">
                      {user?.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {user?.role}
                    </span>
                  </div>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900">{user?.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                      <div className="mt-1.5">
                        <Badge variant={user?.role}>{user?.role}</Badge>
                      </div>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <User size={14} /> My Profile
                    </Link>

                    <Link
                      to="/my-uploads"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Upload size={14} /> My Submissions
                    </Link>

                    <Link
                      to="/my-downloads"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Database size={14} /> Download History
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50"
                      >
                        <Shield size={14} /> Admin Portal
                      </Link>
                    )}

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 text-white shadow-sm shadow-brand-500/20 hover:bg-brand-700 transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          <Link
            to="/datasets"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Repository
          </Link>
          <Link
            to="/recommendations"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            AI Recommender
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Dashboard
              </Link>
              <Link
                to="/upload"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Upload Dataset
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-indigo-700 bg-indigo-50"
                >
                  Admin Portal
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left block px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                Sign Out ({user?.name})
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm font-bold text-slate-700 border border-slate-200 rounded-xl"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm font-bold text-white bg-brand-600 rounded-xl"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
