# Reminder migration report — complete

Firebase stays on **Spark**. Apps Script + Gmail is the only reminder system.

The obsolete `functions/` directory (Cloud Functions, Resend, RAWG callables, scheduled `processReminders`) has been **removed** from the repository.

---

## After cleanup

| Item | Status |
| --- | --- |
| `functions/` | Deleted |
| `firebase.json` functions block | Removed |
| `getFirebaseFunctions` | Removed from `src/firebase/config.js` |
| `httpsCallable` | Not present in `src/` |
| Resend | Not present in the repo |
| `apps-script/` | Kept |
| `firestore.rules` | Unchanged |

Frontend still uses Firebase Auth + Firestore only. Game search reads the Firestore catalog. Reminders are Apps Script.

See [APPS_SCRIPT_SETUP.md](./APPS_SCRIPT_SETUP.md) for the live reminder setup.
