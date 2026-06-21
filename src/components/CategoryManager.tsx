import { useState } from 'react';

import type { Category } from '../types';

import ConfirmDialog from './ConfirmDialog';

interface CategoryManagerProps {
  categories: Category[];
  onAdd: (data: Partial<Category>) => Promise<void>;
  onUpdate: (id: string, data: Partial<Category>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

const COLORS = [
  '#3B82F6',
  '#10B981',
  '#F97316',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#EAB308',
  '#6366F1',
  '#DC2626',
  '#F472B6',
  '#A78BFA',
  '#94A3B8',
];

export default function CategoryManager({
  categories,
  onAdd,
  onUpdate,
  onDelete,
  onClose,
}: CategoryManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#3B82F6');
  const [editSubcategories, setEditSubcategories] = useState('');
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#94A3B8');
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
    setEditSubcategories(cat.subcategories.join(', '));
    setError(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await onUpdate(editingId, {
      name: editName.trim(),
      color: editColor,
      subcategories: editSubcategories
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    });
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await onAdd({ name: newName.trim(), color: newColor });
    setNewName('');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setError(null);
      await onDelete(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteTarget(null);
      setError(err instanceof Error ? err.message : 'Cannot delete category');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="mx-4 max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Manage Categories
          </h2>
          <button
            onClick={onClose}
            className="text-slate-300 transition-colors hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-300"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-slate-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-2">
          {categories.map((cat) =>
            editingId === cat.id ? (
              <div
                key={cat.id}
                className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20"
              >
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded border border-slate-200 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  autoFocus
                />
                <div className="flex flex-wrap gap-1">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setEditColor(c)}
                      className={`h-5 w-5 rounded-full border-2 ${editColor === c ? 'border-slate-800 dark:border-slate-200' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 dark:text-slate-500">
                    Subcategories (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editSubcategories}
                    onChange={(e) => setEditSubcategories(e.target.value)}
                    className="w-full rounded border border-slate-200 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="e.g. Rent, Mortgage, Insurance"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEdit}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-700"
              >
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm text-slate-700 dark:text-slate-200">{cat.name}</span>
                  {cat.subcategories.length > 0 && (
                    <span className="text-[10px] text-slate-300 dark:text-slate-500">
                      ({cat.subcategories.length})
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(cat)}
                    className="text-[10px] text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    Edit
                  </button>
                  {!cat.isDefault && (
                    <button
                      onClick={() => setDeleteTarget(cat)}
                      className="text-[10px] text-red-300 hover:text-red-500"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ),
          )}
        </div>

        <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {COLORS.slice(0, 5).map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`h-4 w-4 rounded-full border-2 ${newColor === c ? 'border-slate-800 dark:border-slate-200' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category name"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Category"
          message={`Are you sure you want to delete "${deleteTarget.name}"? Expenses in this category must be reassigned first.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
