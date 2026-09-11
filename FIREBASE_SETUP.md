# Firebase Integration Report — Gacha Daily

Firebase, RAWG, and Resend are **not configured** in this repository. No project credentials or API keys were invented. Complete the steps below before the app can authenticate, persist data, search extra games, or send reminder emails.

Replace `YOUR_FIREBASE_PROJECT_ID` in `.firebaserc` with the real project ID after the Firebase project exists.

---

## 1. Firebase services required

- Firebase Authentication (Google provider)
- Cloud Firestore
- Cloud Functions (2nd gen)
- Cloud Scheduler (used by the scheduled function)

---

## 2. Firebase Console settings that must be enabled

1. Create a Firebase project.
2. Register a **Web app**. Copy the Firebase config object values into `.env` / GitHub Actions secrets.
3. Enable **Authentication → Sign-in method → Google**.
4. Create a **Firestore** database (production mode is fine; this repo deploys rules).
5. Enable **Blaze** billing. Cloud Functions, Scheduler, and outbound RAWG/Resend calls require it.
6. Add authorized domains:
   - `localhost`
   - `YOUR_GITHUB_USER.github.io`

Recommended Firestore location: `asia-southeast1` (closest common region to `Asia/Ho_Chi_Minh`). Functions in this repo default to `us-central1` unless you change `VITE_FIREBASE_FUNCTIONS_REGION` and the function region together.

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

RAWG imports use `rawg-{rawgId}`.

| Field | Type |
| --- | --- |
| name, slug, icon, iconUrl, coverUrl, description, publisher | string |
| source | `manual` or `rawg` |
| sourceId | string or number |
| active | boolean |
| released | string or null |
| platforms | string[] |
| createdAt, updatedAt | timestamp |

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

Written only by Cloud Functions. Prevents duplicate reminder emails for the same local date.

---

## 4. Firestore security rules

Deployed from `firestore.rules`:

- Signed-in users can **read** `games/{gameId}`.
- Clients **cannot** write the global catalog.
- Users can read/write only `users/{uid}` and subcollections they own.
- Daily log IDs must equal `{date}_{gameId}`.
- `reminderLogs` are read-only for clients.

---

## 5. Indexes

`firestore.indexes.json` defines one composite index:

- Collection `games`: `source` ASC + `sourceId` ASC

Single-field filters (`active == true`, `enabled == true`, `date == ...`) use automatic indexes.

---

## 6. Authentication providers

Enable **Google** only. Do not add email/password for this app.

OAuth consent screen: add the app name and support email. For GitHub Pages, add the Pages origin to authorized domains.

---

## 7. Cloud Functions

| Name | Purpose | Trigger | Secrets / params |
| --- | --- | --- | --- |
| `searchGames` | Search Firestore catalog and RAWG; return normalized games | Callable HTTPS | `RAWG_API_KEY` |
| `importGame` | Persist selected RAWG metadata into `games/{id}` if missing | Callable HTTPS | `RAWG_API_KEY` |
| `seedCatalog` | Idempotently insert the nine starter catalog games | Callable HTTPS | none |
| `processReminders` | Email users with incomplete dailies at their reminder time | Cloud Scheduler every 15 minutes (UTC) | `RESEND_API_KEY`, params `APP_URL`, `RESEND_FROM` |

Function files:

- `functions/index.js`
- `functions/games.js`
- `functions/email.js`

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

## 8. Environment variables and secrets

### Frontend (safe for the browser; do not commit real values)

Copy `.env.example` to `.env`:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_FUNCTIONS_REGION=us-central1
```

GitHub Actions uses the same names as repository secrets.

`VITE_BASE_PATH` is set in CI to `/<repository-name>/` for GitHub Pages. Locally it defaults to `/`.

### Backend (never use `VITE_*`)

```text
RAWG_API_KEY
RESEND_API_KEY
APP_URL=https://YOUR_GITHUB_USER.github.io/gacha-daily
RESEND_FROM=Gacha Daily <alerts@your-verified-domain>
```

Do not put RAWG, Resend, or service-account keys in React.

---

## 9. Cloud Scheduler jobs

`processReminders` is declared as:

```text
schedule: every 15 minutes
timeZone: UTC
```

Behavior:

1. Load all `users`.
2. Skip users with reminders disabled or missing email.
3. Convert current time to the user's `timezone`.
4. If local `HH:mm` is inside a 15-minute window starting at `reminderTime`, continue.
5. Compute today's `YYYY-MM-DD` in that timezone.
6. Skip if `users/{uid}/reminderLogs/{date}` exists.
7. Load enabled tracked games and today's daily logs.
8. If any tracked game is incomplete, send one Resend email and write the reminder log.
9. If sending fails, do not write the log so a later window can retry.

---

## 10. Email (Resend)

1. Create a Resend account.
2. Verify a sending domain (required for production).
3. Create an API key and store it as `RESEND_API_KEY`.
4. Set `RESEND_FROM` to a verified sender.

Email HTML is generated in `functions/email.js`. The dashboard button uses `APP_URL`.

---

## 11. RAWG

1. Create an API key at RAWG.
2. Store it as `RAWG_API_KEY`.
3. The browser never sees this key.

```text
React → searchGames / importGame → RAWG → Firestore catalog → React
```

If RAWG is down, Firestore catalog search still works after `seedCatalog` has run.

---

## 12. Local commands

```bash
npm install
cd functions
npm install
cd ..
```

Copy `.env.example` to `.env` and fill the Firebase web config.

```bash
npm run dev
```

Local URL: `http://localhost:5173`

```bash
npm run build
npm run preview
```

---

## 13. Firebase CLI commands

```bash
npm install -g firebase-tools
firebase login
```

Edit `.firebaserc` so `projects.default` is your real project ID, then:

```bash
firebase use YOUR_FIREBASE_PROJECT_ID
firebase functions:secrets:set RAWG_API_KEY
firebase functions:secrets:set RESEND_API_KEY
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only functions
```

Set `APP_URL` and `RESEND_FROM` for the functions (Google Cloud Console environment variables, or a local untracked `functions/.env`):

```text
APP_URL=https://YOUR_GITHUB_USER.github.io/gacha-daily
RESEND_FROM=Gacha Daily <alerts@your-domain>
```

Deploy rules, indexes, and functions together:

```bash
firebase deploy --only firestore,functions
```

Copy `functions/.env.example` to `functions/.env` (gitignored) for `APP_URL` and `RESEND_FROM`.

After Auth works, open the app while signed in. The client calls `seedCatalog` to insert the nine starter games if they are missing.

---

## 14. Manual Firebase Console entries

- Google provider enablement
- Authorized domains
- Firestore database creation and region
- Billing account (Blaze)
- OAuth support email
- Confirm the Scheduler job after the first functions deploy

---

## 15. GitHub Pages

1. Push this repository to GitHub. The workflow uses `/<repository-name>/` as the Vite base path.
2. Settings → Pages → GitHub Actions.
3. Add repository secrets for every `VITE_FIREBASE_*` value.
4. Add the Pages URL to Firebase Auth authorized domains.
5. Set Functions `APP_URL` to that Pages URL.
6. Push to `main` or `master`, or run **Deploy GitHub Pages**.

SPA refreshes are handled by copying `dist/index.html` to `dist/404.html` during `npm run build`.

Firebase Hosting is not used for the frontend.

---

## Security notes

- Users can only read/write their own `users/{uid}` tree.
- Catalog writes happen only through the Admin SDK in Cloud Functions.
- Reminder emails and RAWG keys stay on the server.
- Completing a daily uses a deterministic document ID, so repeats cannot create duplicates or inflate streaks.
- Removing a game sets `enabled: false`; it does not delete `dailyLogs`.
