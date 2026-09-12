# Gacha Daily

Personal daily checklist for gacha games: complete today’s tasks, keep streaks, and get an evening reminder if anything is left.

The frontend is React + Firebase Auth + Cloud Firestore (Spark). Reminder email is Google Apps Script + Gmail. See [APPS_SCRIPT_SETUP.md](./APPS_SCRIPT_SETUP.md).

## Stack

- React, Vite, JavaScript, Tailwind CSS
- React Router, Lucide React, Recharts
- Firebase Auth, Cloud Firestore
- Google Apps Script + Gmail (reminders)
- GitHub Pages (frontend)

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy

- Frontend: GitHub Actions workflow `.github/workflows/deploy.yml`
- Reminders: Apps Script time-driven trigger ([APPS_SCRIPT_SETUP.md](./APPS_SCRIPT_SETUP.md))
- Firestore rules/indexes: `firebase deploy --only firestore` ([FIREBASE_SETUP.md](./FIREBASE_SETUP.md))
