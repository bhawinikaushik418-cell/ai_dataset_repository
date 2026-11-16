import React, { useEffect, useState } from 'react';
import { Folders, Plus, Edit2, Trash2, Database, AlertCircle } from 'lucide-react';
import api from '../../api/client';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function CategoryManagerPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.category_id}`, { name, description });
      } else {
        await api.post('/categories', { name, description });
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      setError(err.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (categoryId, datasetCount) => {
    if (datasetCount > 0) {
      alert(`Cannot delete category: ${datasetCount} dataset(s) are currently assigned to it.`);
      return;
    }

    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await api.delete(`/categories/${categoryId}`);
      setCategories((prev) => prev.filter((c) => c.category_id !== categoryId));
    } catch (err) {
      alert(err.message || 'Failed to delete category.');
    }
  };

  if (loading) return <LoadingSpinner text="Retrieving categories from MySQL..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Academic Category Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure dataset classification domains and maintain relational taxonomic integrity
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all self-start sm:self-auto"
        >
          <Plus size={15} /> Add New Category
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">Category Name</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Assigned Datasets</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {categories.map((c) => (
                <tr key={c.category_id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                    #{c.category_id}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{c.name}</td>
                  <td className="py-3.5 px-4 max-w-sm text-slate-600">
                    {c.description || <span className="text-slate-400 italic">No description provided</span>}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]">
                      {c.dataset_count || 0} datasets
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1.5">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      title="Edit Category"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(c.category_id, c.dataset_count)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create or Edit Category */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create New Academic Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Category Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Environmental Science & Climate"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the taxonomic domain and target research focus..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || name.trim().length < 2}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 disabled:opacity-40"
            >
              {submitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
