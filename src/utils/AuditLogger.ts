/**
 * Audit-Logger – GOOGLE/FIRESTORE-ENTKOPPELT.
 *
 * Frueher wurden Audit-Events in die Firestore-Collection `audit_log` geschrieben.
 * Jetzt werden sie nur noch in der Browser-Konsole (und optional localStorage) geloggt.
 */

const LOCAL_AUDIT_KEY = 'samplemonk_audit_log';

export const logAuditEvent = async (userId: string, action: string, details: any) => {
  try {
    const entry = { userId, action, details, timestamp: new Date().toISOString() };
    console.info('[audit]', action, 'by', userId, details ?? '');
    // Optional: kurze Historie im localStorage behalten
    try {
      const raw = localStorage.getItem(LOCAL_AUDIT_KEY);
      const list = raw ? JSON.parse(raw) : [];
      list.push(entry);
      localStorage.setItem(LOCAL_AUDIT_KEY, JSON.stringify(list.slice(-100)));
    } catch { /* localStorage voll/blockiert – egal */ }
  } catch (e) {
    console.error('Failed to log audit event:', e);
  }
};
