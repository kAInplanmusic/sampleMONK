// ============================================================================
// RBAC – Zentrales Rollen-Berechtigungssystem für audioMONASTRY-Sessions
// ----------------------------------------------------------------------------
// Host + bis zu 4 User. Rollen: admin | producer | engineer | guest.
// Konfiguration über Umgebungsvariablen (Vite) bzw. localStorage-Fallback:
//   SESSION_HOST_USER  – uid des Hosts (erhält immer admin)
//   SESSION_ROLE       – default-Rolle für nicht-Host-Teilnehmer
// Nur Open Source, kein Vault/Firestore.
// ============================================================================
import { logAuditEvent } from './AuditLogger';

export type Role = 'admin' | 'producer' | 'engineer' | 'guest';

/** Semantische Aktionen, die über Module hinweg geprüft werden. */
export type Action =
  | 'lock'      // Plugin sperren (B2B-Lock für sich)
  | 'unlock'    // Plugin wieder freigeben
  | 'edit'      // Parameter eines Plugins ändern (nicht gesperrt)
  | 'master'    // Mastering-/Summing-Kette bedienen
  | 'state'     // Plugin-Zustand togglen (OFF/AI/PRO)
  | 'routing'   // Audio-Routing / Monitor-Cue ändern
  | 'kick'      // User aus der Session entfernen
  | 'assign'    // Rolle eines Teilnehmers setzen;

const ROLE_LEVEL: Record<Role, number> = { guest: 0, engineer: 1, producer: 2, admin: 3 };

const ACTION_MIN: Record<Action, Role> = {
  lock: 'producer',
  unlock: 'producer',
  edit: 'producer',
  master: 'engineer',
  state: 'guest',
  routing: 'engineer',
  kick: 'admin',
  assign: 'admin',
};

export const ROLES: Role[] = ['admin', 'producer', 'engineer', 'guest'];

/** Liest die Session-Rollen-Konfiguration (Später: localStorage/Remote). */
export function readSessionConfig(): { hostUid: string; defaultRole: Role } {
  let hostUid = '';
  let defaultRole: Role = 'guest';
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      hostUid = window.localStorage.getItem('SESSION_HOST_USER') || '';
      const r = window.localStorage.getItem('SESSION_ROLE');
      if (r && ROLES.includes(r as Role)) defaultRole = r as Role;
    }
  } catch { /* ignore */ }
  return { hostUid, defaultRole };
}

/** Bestimmt die Rolle eines Users in der Session. Host ist immer admin. */
export function roleForUser(userId: string, roomHostId?: string | null): Role {
  if (roomHostId && userId === roomHostId) return 'admin';
  const { hostUid, defaultRole } = readSessionConfig();
  if (hostUid && userId === hostUid) return 'admin';
  return defaultRole;
}

export function can(role: Role, action: Action): boolean {
  const need = ACTION_MIN[action];
  return ROLE_LEVEL[role] >= ROLE_LEVEL[need];
}

/**
 * Prüft eine Aktion und loggt bei Verweigerung ein Audit-Event.
 * Gibt true zurück, wenn erlaubt.
 */
export async function assertCan(
  userId: string,
  action: Action,
  roomHostId?: string | null,
  context?: { pluginId?: string; reason?: string },
): Promise<boolean> {
  const role = roleForUser(userId, roomHostId);
  const ok = can(role, action);
  if (!ok) {
    await logAuditEvent(userId, `RBAC_DENIED`, {
      action,
      role,
      pluginId: context?.pluginId,
      reason: context?.reason ?? `role '${role}' hat nicht '${action}'`,
    });
  }
  return ok;
}

export { logAuditEvent };
