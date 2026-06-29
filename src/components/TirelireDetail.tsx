import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { ArrowLeft, PlusCircle, MinusCircle, History, Edit2, Check, X, Coins } from 'lucide-react';
import { triggerAutoSave } from '../services/autoSaveService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TirelireDetailProps {
  tirelireId: number;
  onBack: () => void;
}

export const TirelireDetail: React.FC<TirelireDetailProps> = ({ tirelireId, onBack }) => {
  const tirelire = useLiveQuery(() => db.tirelires.get(tirelireId), [tirelireId]);
  const operations = useLiveQuery(
    () => db.operations
      .where('tirelireId')
      .equals(tirelireId)
      .reverse()
      .limit(10)
      .toArray(),
    [tirelireId]
  );

  const [amount, setAmount] = useState(0);
  const [opName, setOpName] = useState('');
  const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit');
  
  const [isEditingPocketMoney, setIsEditingPocketMoney] = useState(false);
  const [editedPocketMoney, setEditedPocketMoney] = useState(0);

  if (!tirelire) return <div>Chargement...</div>;

  const handleUpdatePocketMoney = async () => {
    await db.tirelires.update(tirelireId, { pocketMoney: editedPocketMoney });
    setIsEditingPocketMoney(false);
    triggerAutoSave();
  };

  const startEditing = () => {
    setEditedPocketMoney(tirelire.pocketMoney);
    setIsEditingPocketMoney(true);
  };

  const handleOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !opName) return;

    const newBalance = type === 'deposit' 
      ? tirelire.balance + amount 
      : tirelire.balance - amount;

    await db.transaction('rw', db.tirelires, db.operations, async () => {
      await db.tirelires.update(tirelireId, { balance: newBalance });
      await db.operations.add({
        tirelireId,
        type,
        name: opName,
        amount,
        date: new Date()
      });
    });

    triggerAutoSave();
    setAmount(0);
    setOpName('');
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <ArrowLeft size={20} />
        Retour
      </button>

      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-xl opacity-90">{tirelire.name}</h2>
          <p className="text-4xl font-bold mt-2">{tirelire.balance.toFixed(2)}€</p>
          <div className="flex justify-between items-end mt-4">
            <p className="text-sm opacity-75">Solde actuel</p>
            
            <div className="text-right">
              {isEditingPocketMoney ? (
                <div className="flex items-center gap-2 bg-white/20 p-1 rounded-lg">
                  <input
                    type="number"
                    step="0.01"
                    className="w-20 bg-transparent border-none text-white font-bold focus:ring-0 p-0 text-right"
                    value={editedPocketMoney || ''}
                    onChange={(e) => setEditedPocketMoney(parseFloat(e.target.value) || 0)}
                    autoFocus
                  />
                  <button onClick={handleUpdatePocketMoney} className="hover:text-green-300" title="Valider">
                    <Check size={18} />
                  </button>
                  <button onClick={() => setIsEditingPocketMoney(false)} className="hover:text-red-300" title="Annuler">
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div 
                  className="flex items-center gap-2 group cursor-pointer hover:bg-white/10 px-2 py-1 -mr-2 rounded-lg transition-colors" 
                  onClick={startEditing}
                  title="Modifier l'argent de poche"
                >
                  <p className="text-sm">
                    Argent de poche: <span className="font-bold">{tirelire.pocketMoney.toFixed(2)}€</span>
                  </p>
                  <Edit2 size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
          </div>
        </div>
        <Coins className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12" />
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setType('deposit')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
              type === 'deposit' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            <PlusCircle size={18} />
            Dépôt
          </button>
          <button
            onClick={() => setType('withdrawal')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
              type === 'withdrawal' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            <MinusCircle size={18} />
            Paiement
          </button>
        </div>

        <form onSubmit={handleOperation} className="space-y-3">
          <input
            required
            type="text"
            placeholder="Nom de l'opération (ex: Pizza, Cadeau)"
            value={opName}
            onChange={(e) => setOpName(e.target.value)}
            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2"
          />
          <input
            required
            type="number"
            step="0.01"
            placeholder="Montant (€)"
            value={amount || ''}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2"
          />
          <button
            type="submit"
            className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
              type === 'deposit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            Valider le {type === 'deposit' ? 'dépôt' : 'paiement'}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-gray-500 font-medium">
          <History size={18} />
          <h3>Dernières opérations</h3>
        </div>
        <div className="space-y-2">
          {operations?.map((op) => (
            <div
              key={op.id}
              className="flex justify-between items-center p-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800"
            >
              <div>
                <p className="font-medium">{op.name}</p>
                <p className="text-xs text-gray-400">
                  {format(op.date, 'dd MMMM yyyy HH:mm', { locale: fr })}
                </p>
              </div>
              <p className={`font-bold ${op.type === 'deposit' ? 'text-green-600' : 'text-red-500'}`}>
                {op.type === 'deposit' ? '+' : '-'}{op.amount.toFixed(2)}€
              </p>
            </div>
          ))}
          {operations?.length === 0 && (
            <p className="text-center text-gray-400 py-4 italic">Aucun historique</p>
          )}
        </div>
      </div>
    </div>
  );
};
