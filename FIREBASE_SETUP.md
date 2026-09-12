# Firebase Integration Report — Gacha Daily

The live app on Spark uses **Firebase Authentication + Cloud Firestore**. Daily reminder emails run on **Google Apps Script + Gmail**. Follow [APPS_SCRIPT_SETUP.md](./APPS_SCRIPT_SETUP.md) for reminders.

Firebase Cloud Functions, Cloud Scheduler, and Resend are **not** part of this repository.

---

## 1. Firebase services required

- Firebase Authentication (Google provider)
- Cloud Firestore

Reminders: Google Apps Script + Gmail (outside Firebase billing). Spark is enough.

---

## 2. Firebase Console settings that must be enabled

1. Create a Firebase project.
2. Register a **Web app**. Copy the Firebase config object values into `.env` / GitHub Actions secrets.
3. Enable **Authentication → Sign-in method → Google**.
4. Create a **Firestore** database (production mode is fine; this repo deploys rules).
5. Stay on **Spark**. Do not deploy Cloud Functions.
6. Add authorized domains:
   - `localhost`
   - `pugthelowleecorn.github.io`

Recommended Firestore location: `asia-southeast1` (closest common region to `Asia/Ho_Chi_Minh`).

---

## 3. Firestore collections / documents

### `users/{uid}`

| Field | Type | Notes |
| --- | --- | --- |
| uid | string | Firebase Auth UID |
| displayName | string | |
| email | string | |
| photoURL | string | |
| timezone | string | Default `Asia/Ho_Chi_Minh` |
| reminderEnabled | boolean | Default `true` |
| reminderTime | string | Default `23:30` (`HH:mm`) |
| createdAt | timestamp | |
| updatedAt | timestamp | |

Created on first successful Google sign-in. Existing settings are not overwritten on later logins.

### `games/{gameId}`

Global catalog. Seeded IDs:

- `genshin-impact`
- `zenless-zone-zero`
- `honkai-star-rail`
- `wuthering-waves`
- `arknights`
- `nikke`
- `blue-archive`
- `punishing-gray-raven`
- `reverse-1999`

| Field | Type |
| --- | --- |
| name, slug, icon, iconUrl, coverUrl, description, publisher | string |
| source | `manual` or `rawg` |
| sourceId | string or number |
| active | boolean |
| released | string or null |
| platforms | string[] |
| createdAt, updatedAt | timestamp |

The React app searches this catalog in Firestore. New titles are added by writing catalog documents (Console or admin), not from the browser.

### `users/{uid}/games/{gameId}`

| Field | Type | Notes |
| --- | --- | --- |
| gameId | string | |
| enabled | boolean | `false` means stop future tracking |
| trackingStartedAt | timestamp | |
| trackingEndedAt | timestamp | Set on remove |
| addedAt, updatedAt | timestamp | |

Historical daily logs are never deleted when a game is removed.

### `users/{uid}/dailyLogs/{date}_{gameId}`

Example: `2026-09-11_genshin-impact`

| Field | Type |
| --- | --- |
| gameId | string |
| date | `YYYY-MM-DD` |
| status | `completed` or `skipped` |
| completedAt | timestamp |

Missed days are derived: tracked on that date and no completed/skipped log.

### `users/{uid}/reminderLogs/{YYYY-MM-DD}`

Written only by Google Apps Script after a successful Gmail send. Prevents duplicate reminder emails for the same local date. Clients can read; they cannot write.

---

## 4. Firestore security rules

Deployed from `firestore.rules` (do not weaken them for Apps Script):

- Signed-in users can **read** `games/{gameId}`.
- Clients **cannot** write the global catalog.
- Users can read/write only `users/{uid}` and subcollections they own (except `reminderLogs`).
- Daily log IDs must equal `{date}_{gameId}`.
- `reminderLogs` are read-only for clients. Apps Script writes them with Cloud IAM.

---

## 5. Indexes

`firestore.indexes.json` defines one composite index:

- Collection `games`: `source` ASC + `sourceId` ASC

Single-field filters (`active == true`, `enabled == true`, `date == ...`) use automatic indexes.

---

## 6. Authentication providers

Enable **Google** only. Do not add email/password for this app.

OAuth consent screen: add the app name and support email. For GitHub Pages, add `pugthelowleecorn.github.io` to authorized domains.

---

## 7. Reminders (Apps Script)

There is no Cloud Functions backend in this repo.

| Piece | Role |
| --- | --- |
| `apps-script/Reminders.gs` `processReminders` | 15-minute time-driven trigger |
| GmailApp | Sends the reminder |
| Firestore REST + OAuth | Reads users/games/logs; writes `reminderLogs` |

Dashboard link in emails: `https://pugthelowleecorn.github.io/gacha-daily/dashboard`

Full steps: [APPS_SCRIPT_SETUP.md](./APPS_SCRIPT_SETUP.md).

Frontend Firebase files:

- `src/firebase/config.js`
- `src/services/authService.js`
- `src/services/userService.js`
- `src/services/gameService.js`
- `src/services/userGameService.js`
- `src/services/dailyService.js`
- `src/context/AuthContext.jsx`
- `src/context/TrackerContext.jsx`

---

## 8. Environment variables

Frontend (safe for the browser; do not commit real values). Create a local `.env`:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

GitHub Actions uses the same names as repository secrets.

`VITE_BASE_PATH` is set in CI to `/<repository-name>/` for GitHub Pages. Locally it defaults to `/`.

Do not put service-account keys, Gmail passwords, or Resend keys in React. Reminder sending does not use `VITE_*` variables.

---

## 9. Reminder schedule

Production reminders are a **15-minute time-driven Apps Script trigger** calling `processReminders`.

Behavior:

1. Load all `users`.
2. Skip users with reminders disabled or missing email.
3. Convert current time to the user's `timezone`.
4. If local `HH:mm` is inside a 15-minute window starting at `reminderTime`, continue.
5. Compute today's `YYYY-MM-DD` in that timezone.
6. Skip if `users/{uid}/reminderLogs/{date}` exists.
7. Load enabled tracked games and today's daily logs.
8. If any tracked game is incomplete, send one Gmail and write the reminder log.
9. If sending fails, do not write the log so a later window can retry.

---

## 10. Local commands

```bash
npm install
npm run dev
```

Local URL: `http://localhost:5173`

```bash
npm run build
npm run preview
```

---

## 11. Firebase CLI commands

```bash
npm install -g firebase-tools
firebase login
firebase use dk354-daily
firebase deploy --only firestore:rules,firestore:indexes
```

Do not run `firebase deploy --only functions`. This repo has no Functions source.

---

## 12. Manual Firebase Console entries

- Google provider enablement
- Authorized domains
- Firestore database creation and region
- OAuth support email

---

## 13. GitHub Pages

1. Push this repository to GitHub. The workflow uses `/<repository-name>/` as the Vite base path.
2. Settings → Pages → GitHub Actions.
3. Add repository secrets for every `VITE_FIREBASE_*` value listed above.
4. Add the Pages URL to Firebase Auth authorized domains.
5. Set Apps Script `DASHBOARD_URL` to `https://pugthelowleecorn.github.io/gacha-daily/dashboard`.
6. Push to `main` or `master`, or run **Deploy GitHub Pages**.

SPA refreshes are handled by copying `dist/index.html` to `dist/404.html` during `npm run build`.

Firebase Hosting is not used for the frontend.

---

## Security notes

- Users can only read/write their own `users/{uid}` tree (except `reminderLogs` writes).
- The game catalog is client-read-only.
- Reminder emails are sent from the Apps Script owner's Gmail. Firestore reminder logs are written with that account's Cloud IAM token, not by weakening Security Rules.
- Completing a daily uses a deterministic document ID, so repeats cannot create duplicates or inflate streaks.
- Removing a game sets `enabled: false`; it does not delete `dailyLogs`.
