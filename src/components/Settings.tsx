import React, { useState, useEffect } from 'react';
import { exportData, importData, clearAllData } from '../db';
import { setFileHandle, getFileHandle, isFileSystemAccessSupported, verifyPermission } from '../services/autoSaveService';
import { ArrowLeft, Download, Upload, Trash2, Save, AlertCircle, CheckCircle, Plus } from 'lucide-react';

interface SettingsProps {
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [autoSaveFile, setAutoSaveFile] = useState<string | null>(null);
  const [isSupported] = useState(isFileSystemAccessSupported());
  const [permissionStatus, setPermissionStatus] = useState<boolean>(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const handle = await getFileHandle();
    if (handle) {
      setAutoSaveFile(handle.name);
      const hasPermission = await verifyPermission(handle);
      setPermissionStatus(hasPermission);
    }
  };

  const handleExport = async () => {
    const data = await exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tirelire-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        await importData(json);
        alert('Données importées avec succès');
        window.location.reload();
      } catch (err) {
        alert('Erreur lors de l\'importation : ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  const handleClear = async () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer toutes les données ? Cette action est irréversible.')) {
      await clearAllData();
      alert('Toutes les données ont été supprimées');
      window.location.reload();
    }
  };

  const handleSelectAutoSave = async () => {
    try {
      // @ts-ignore - showSaveFilePicker is not in all TS libs yet
      const handle = await window.showSaveFilePicker({
        suggestedName: 'tirelire-autosave.json',
        types: [{
          description: 'JSON File',
          accept: { 'application/json': ['.json'] },
        }],
      });
      await setFileHandle(handle);
      setAutoSaveFile(handle.name);
      setPermissionStatus(true);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error(err);
      }
    }
  };

  const handleRequestPermission = async () => {
      const handle = await getFileHandle();
      if (handle) {
          const granted = await verifyPermission(handle, true);
          setPermissionStatus(granted);
      }
  }

  const handleDisableAutoSave = async () => {
      await setFileHandle(null);
      setAutoSaveFile(null);
      setPermissionStatus(false);
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <ArrowLeft size={20} />
        Retour
      </button>

      <h2 className="text-2xl font-bold">Paramètres</h2>

      <div className="space-y-4">
        <section className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Download size={18} /> Sauvegarde
          </h3>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
            >
              <Download size={18} /> Exporter en JSON
            </button>
            <label className="w-full flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 py-2 rounded-lg transition-colors cursor-pointer text-center">
              <Upload size={18} /> Importer un JSON
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </section>

        <section className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Save size={18} /> Auto-save
          </h3>
          {!isSupported ? (
            <p className="text-sm text-amber-600 flex items-center gap-1">
              <AlertCircle size={14} /> L'auto-save n'est pas supporté par votre navigateur.
            </p>
          ) : (
            <div className="space-y-3">
              {autoSaveFile ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700">
                    <span className="text-sm truncate mr-2">{autoSaveFile}</span>
                    <div className="flex items-center gap-2">
                      {permissionStatus ? (
                        <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                      ) : (
                        <button 
                          onClick={handleRequestPermission}
                          className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded flex items-center gap-1 hover:bg-amber-200 transition-colors"
                        >
                          <AlertCircle size={12} /> Autoriser
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleDisableAutoSave}
                    className="text-sm text-red-500 hover:underline"
                  >
                    Désactiver l'auto-save
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSelectAutoSave}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 p-3 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-all"
                >
                  <Plus size={18} /> Définir un fichier d'auto-save
                </button>
              )}
              <p className="text-xs text-gray-500">
                Si activé, les données seront sauvegardées dans ce fichier après chaque opération.
              </p>
            </div>
          )}
        </section>

        <section className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-900/50">
          <h3 className="font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
            <Trash2 size={18} /> Zone de danger
          </h3>
          <button
            onClick={handleClear}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors"
          >
            <Trash2 size={18} /> Vider toutes les données
          </button>
        </section>
      </div>
    </div>
  );
};
