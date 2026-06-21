import { useState, useRef } from 'react';

import type { BackupData } from '../types';
import * as api from '../services/api';

import ConfirmDialog from './ConfirmDialog';

export default function BackupRestore() {
  const [status, setStatus] = useState<string | null>(null);
  const [pendingRestore, setPendingRestore] = useState<BackupData | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const data = await api.fetchBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `budget-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('Backup exported successfully');
    } catch {
      setStatus('Export failed');
    }
    setTimeout(() => setStatus(null), 3000);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupData;
      if (!data.version) {
        setStatus('Invalid backup file');
        if (fileRef.current) fileRef.current.value = '';
        setTimeout(() => setStatus(null), 3000);
        return;
      }
      setPendingRestore(data);
    } catch {
      setStatus('Import failed — invalid file');
      if (fileRef.current) fileRef.current.value = '';
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const confirmRestore = async () => {
    if (!pendingRestore) return;
    try {
      await api.restoreBackup(pendingRestore);
      setStatus('Data restored successfully. Reloading...');
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setStatus('Restore failed');
      setTimeout(() => setStatus(null), 3000);
    }
    setPendingRestore(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">Data</h3>
      <div className="flex gap-3">
        <button
          onClick={handleExport}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
        >
          Export Backup
        </button>
        <label className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
          Import Backup
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
      </div>
      {status && <p className="text-sm text-slate-500 dark:text-slate-400">{status}</p>}

      {pendingRestore && (
        <ConfirmDialog
          title="Restore Backup"
          message="This will replace all your data with the backup. Are you sure?"
          confirmLabel="Restore"
          onConfirm={confirmRestore}
          onCancel={() => {
            setPendingRestore(null);
            if (fileRef.current) fileRef.current.value = '';
          }}
        />
      )}
    </div>
  );
}
