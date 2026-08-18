# sampleMONK – Aktueller Arbeitsstatus (CURRENT_TODO)

## Fortschritt (aus TODOLAST.md / Professionalization)

✅ #1-#5 Stufe-1 · ✅ #7 OPFS · ✅ #8 CRDT · ✅ #9 EQ · ✅ #10 Spatial · ✅ #11 stem-ai
✅ #13 RBAC/Audit

### ✅ #13 Audit-Log & RBAC für gesamte Session — FERTIG
- Neu `src/utils/rbac.ts`: Rollen admin/producer/engineer/guest, Aktionsmatrix
  (lock/unlock/edit/master/state/routing/kick/assign), `roleForUser`,
  `can`, `assertCan` (loggt Audit bei Verweigerung), `SESSION_HOST_USER`/`SESSION_ROLE`.
- `useRoom.ts`: kickUser RBAC-gestützt (admin) + Audit, gibt `myRole` zurück.
- `hubConnector.ts`: lockPlugin/unlockPlugin RBAC-geprüft + Audit, In-Memory-Lock-Registry.
- `usePluginState.ts`: Audit-Event bei Plugin-Zustandswechsel.

## GECOMMITTET (Branch main)
1af327a Stufe-1 · f9624ea P9 · a3e82cc P8 · 84ecee3 P7 · 5560990 P11 · f21f534 P10
Nächster Commit: P13 RBAC/Audit (uncommitted)

## Offen (aus TODOLAST.md)
#6 WASM-DSP (braucht wasm-pack/Rust-Build) · #12 Mediasoup (große Infrastruktur)
#14 Instrumenten-Bibliothek (50+ Instrumente)

## Tooling-Hinweis
Robuste Dateiänderung: Terminal-heredoc bzw. python-Inserter.
