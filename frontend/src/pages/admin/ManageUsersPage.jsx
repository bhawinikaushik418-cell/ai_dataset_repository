import React, { useEffect, useState } from 'react';
import { Users, Search, Shield, Ban, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../api/client';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!confirm(`Are you sure you want to change user #${userId} status to ${nextStatus}?`)) {
      return;
    }

    try {
      await api.patch(`/auth/users/${userId}/status`, { status: nextStatus });
      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, status: nextStatus } : u))
      );
    } catch (err) {
      alert(err.message || 'Failed to update user status.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
    );
  });

  if (loading) return <LoadingSpinner text="Querying platform users from MySQL..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            User Account Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit platform actors, monitor upload/download activity, and manage suspension status
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={14} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Submissions</th>
                <th className="py-3.5 px-4">Downloads</th>
                <th className="py-3.5 px-4">Registered Date</th>
                <th className="py-3.5 px-4 text-right">Account Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredUsers.map((u) => (
                <tr key={u.user_id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase">
                        {u.name ? u.name[0] : 'U'}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{u.name}</span>
                        <span className="text-[11px] text-slate-400 block">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={u.role}>{u.role}</Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={u.status}>{u.status}</Badge>
                  </td>
                  <td className="py-3.5 px-4 font-bold">{u.uploaded_datasets_count || 0}</td>
                  <td className="py-3.5 px-4 font-bold">{u.total_downloads_count || 0}</td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {u.role !== 'ADMIN' ? (
                      <button
                        onClick={() => handleToggleStatus(u.user_id, u.status)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          u.status === 'ACTIVE'
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? (
                          <>
                            <Ban size={13} /> Suspend
                          </>
                        ) : (
                          <>
                            <CheckCircle size={13} /> Activate
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Protected Admin</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
