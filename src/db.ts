import Dexie, { type Table } from 'dexie';

export interface Operation {
  id?: number;
  tirelireId: number;
  type: 'deposit' | 'withdrawal';
  name: string;
  amount: number;
  date: Date;
}

export interface Tirelire {
  id?: number;
  name: string;
  pocketMoney: number;
  balance: number;
}

export class MyDatabase extends Dexie {
  tirelires!: Table<Tirelire>;
  operations!: Table<Operation>;
  settings!: Table<{ key: string, value: any }>;

  constructor() {
    super('TirelireDB');
    this.version(2).stores({
      tirelires: '++id, name',
      operations: '++id, tirelireId, date',
      settings: 'key'
    });
  }
}

export const db = new MyDatabase();

export async function exportData() {
  const tirelires = await db.tirelires.toArray();
  const operations = await db.operations.toArray();
  return JSON.stringify({ tirelires, operations }, null, 2);
}

export async function importData(jsonString: string) {
  const data = JSON.parse(jsonString);
  if (!data.tirelires || !data.operations) throw new Error('Format de fichier invalide');
  
  await db.transaction('rw', db.tirelires, db.operations, async () => {
    await db.tirelires.clear();
    await db.operations.clear();
    await db.tirelires.bulkAdd(data.tirelires);
    await db.operations.bulkAdd(data.operations);
  });
}

export async function clearAllData() {
  await db.transaction('rw', db.tirelires, db.operations, async () => {
    await db.tirelires.clear();
    await db.operations.clear();
  });
}
