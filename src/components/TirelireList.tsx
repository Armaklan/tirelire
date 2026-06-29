import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Plus, Wallet, Trash2 } from 'lucide-react';
import { triggerAutoSave } from '../services/autoSaveService';

interface TirelireListProps {
  onSelectTirelire: (id: number) => void;
}

export const TirelireList: React.FC<TirelireListProps> = ({ onSelectTirelire }) => {
  const tirelires = useLiveQuery(() => db.tirelires.toArray());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPocketMoney, setNewPocketMoney] = useState(0);

  const addTirelire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    await db.tirelires.add({
      name: newName,
      pocketMoney: newPocketMoney,
      balance: 0
    });
    await triggerAutoSave();
    setNewName('');
    setNewPocketMoney(0);
    setShowAddForm(false);
  };

  const handlePocketMoney = async () => {
    if (!tirelires) return;
    for (const tirelire of tirelires) {
      if (tirelire.id !== undefined && tirelire.pocketMoney > 0) {
        await db.transaction('rw', db.tirelires, db.operations, async () => {
          await db.tirelires.update(tirelire.id!, {
            balance: tirelire.balance + tirelire.pocketMoney
          });
          await db.operations.add({
            tirelireId: tirelire.id!,
            type: 'deposit',
            name: 'Argent de poche',
            amount: tirelire.pocketMoney,
            date: new Date()
          });
        });
      }
    }
    await triggerAutoSave();
  };

  const deleteTirelire = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Voulez-vous vraiment supprimer cette tirelire ?')) {
      await db.tirelires.delete(id);
      await db.operations.where('tirelireId').equals(id).delete();
      await triggerAutoSave();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Mes Tirelires</h2>
        <button
          onClick={handlePocketMoney}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <Wallet size={18} />
          Argent de poche
        </button>
      </div>

      <div className="grid gap-4">
        {tirelires?.map((t) => (
          <div
            key={t.id}
            onClick={() => onSelectTirelire(t.id!)}
            className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow flex justify-between items-center"
          >
            <div>
              <h3 className="font-bold text-lg">{t.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Argent de poche: {t.pocketMoney}€
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {t.balance.toFixed(2)}€
                </p>
              </div>
              <button
                onClick={(e) => deleteTirelire(t.id!, e)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
        {tirelires?.length === 0 && !showAddForm && (
          <p className="text-center text-gray-500 py-8">Aucune tirelire. Créez-en une !</p>
        )}
      </div>

      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 p-4 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-all"
        >
          <Plus size={24} />
          Ajouter une tirelire
        </button>
      ) : (
        <form onSubmit={addTirelire} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-blue-200 dark:border-blue-900 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom</label>
            <input
              autoFocus
              required
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2"
              placeholder="Ex: Vacances"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Argent de poche mensuel (€)</label>
            <input
              required
              type="number"
              step="0.01"
              value={newPocketMoney}
              onChange={(e) => setNewPocketMoney(parseFloat(e.target.value) || 0)}
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium"
            >
              Créer
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex-1 bg-gray-200 dark:bg-gray-700 py-2 rounded-lg font-medium"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
