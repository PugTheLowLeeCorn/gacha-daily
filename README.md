# Gacha Daily

Personal daily checklist for gacha games: complete today’s tasks, keep streaks, and get an evening reminder if anything is left.

This is a React + Firebase application. **Firebase is not configured in the repo.** Follow [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) before signing in.

## Stack

- React, Vite, JavaScript, Tailwind CSS
- React Router, Lucide React, Recharts
- Firebase Auth, Firestore, Cloud Functions
- RAWG (server-side game search)
- Resend (server-side reminder email)
- GitHub Pages (frontend)

## Local development

```bash
npm install
cd functions && npm install && cd ..
cp .env.example .env
```

Fill `.env` with your Firebase web app values, then:

```bash
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy

- Frontend: GitHub Actions workflow `.github/workflows/deploy.yml`
- Backend: `firebase deploy --only firestore,functions`

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for secrets, rules, scheduler, and RAWG/Resend setup.
