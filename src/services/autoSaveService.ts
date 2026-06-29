import { db, exportData } from '../db';

export async function getFileHandle() {
  const setting = await db.settings.get('autoSaveHandle');
  return setting?.value as FileSystemFileHandle | undefined;
}

export async function setFileHandle(handle: FileSystemFileHandle | null) {
  if (handle) {
    await db.settings.put({ key: 'autoSaveHandle', value: handle });
  } else {
    await db.settings.delete('autoSaveHandle');
  }
}

export async function verifyPermission(handle: FileSystemFileHandle, withRequest = false) {
  const options = { mode: 'readwrite' as const };
  // @ts-ignore
  if ((await handle.queryPermission(options)) === 'granted') {
    return true;
  }
  if (withRequest) {
    // @ts-ignore
    if ((await handle.requestPermission(options)) === 'granted') {
      return true;
    }
  }
  return false;
}

export async function triggerAutoSave() {
  const handle = await getFileHandle();
  if (!handle) return;

  try {
    // We try to verify permission and request it if necessary
    // This works because triggerAutoSave is called from user gestures
    if (!(await verifyPermission(handle, true))) {
        console.warn('Auto-save skipped: Permission not granted');
        return;
    }

    const data = await exportData();
    const writable = await handle.createWritable();
    await writable.write(data);
    await writable.close();
  } catch (err) {
    console.error('Auto-save failed:', err);
  }
}

export function isFileSystemAccessSupported() {
  return 'showSaveFilePicker' in window;
}
