# Apps Script reminder setup — Gacha Daily

This is the Spark-plan reminder system: **Google Apps Script + Gmail + Firestore REST**. It replaces Firebase Cloud Functions, Cloud Scheduler, and Resend for email only.

It does **not** change Firestore security rules. Clients still cannot write `reminderLogs`. Apps Script writes those documents with the script owner's **Google Cloud IAM** token, which bypasses Security Rules the same way the Admin SDK did.

Production dashboard link used in emails:

```text
https://pugthelowleecorn.github.io/gacha-daily/dashboard
```

Source of truth in this repo:

```text
apps-script/appsscript.json
apps-script/Config.gs
apps-script/Firestore.gs
apps-script/Email.gs
apps-script/Reminders.gs
apps-script/Triggers.gs
```

---

## 1. Create the Apps Script project

1. Open [Google Apps Script](https://script.google.com/).
2. Click **New project**.
3. Name it `Gacha Daily Reminders`.
4. Delete the default `Code.gs` contents (or keep the file and paste from this repo).
5. Create matching files and paste the repo sources:

   | Apps Script file | Repo file |
   | --- | --- |
   | `appsscript.json` | `apps-script/appsscript.json` |
   | `Config.gs` | `apps-script/Config.gs` |
   | `Firestore.gs` | `apps-script/Firestore.gs` |
   | `Email.gs` | `apps-script/Email.gs` |
   | `Reminders.gs` | `apps-script/Reminders.gs` |
   | `Triggers.gs` | `apps-script/Triggers.gs` |

To show the manifest in the editor: **Project Settings** (gear) → enable **Show "appsscript.json" manifest file in editor**.

Optional `clasp` push from `apps-script/`:

```bash
npm install -g @google/clasp
clasp login
clasp create --type standalone --title "Gacha Daily Reminders"
# or copy .clasp.json.example to .clasp.json and set scriptId
clasp push
```

Do not commit a real `.clasp.json` script ID if you prefer to keep it local (the example file is safe).

---

## 2. Enable the manifest and required OAuth scopes

`apps-script/appsscript.json` already lists:

```text
https://www.googleapis.com/auth/datastore
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/script.external_request
https://www.googleapis.com/auth/script.scriptapp
https://www.googleapis.com/auth/userinfo.email
```

| Scope | Why |
| --- | --- |
| `datastore` | Firestore REST API read/write with the script owner's IAM identity |
| `gmail.send` | Send the reminder through Gmail |
| `script.external_request` | `UrlFetchApp` calls to Firestore |
| `script.scriptapp` | Create/list/delete the 15-minute trigger |
| `userinfo.email` | Test helper `sendTestReminderEmail()` |

Do not add `gmail.modify` or full Gmail access. Do not add a service-account JSON key.

---

## 3. How Firestore access works

1. The script calls `ScriptApp.getOAuthToken()`.
2. It sends that bearer token to:

   ```text
   https://firestore.googleapis.com/v1/projects/{projectId}/databases/(default)/documents/...
   ```

3. This is **Google Cloud IAM**, not Firebase Auth. Security Rules are not evaluated for this path.
4. Therefore: **do not weaken `firestore.rules`**. Keep `reminderLogs` client-read-only.

Required GCP setup on the same project as Firebase (`dk354-daily` unless you changed it):

1. Open [Google Cloud Console](https://console.cloud.google.com/) → select the Firebase GCP project.
2. Enable **Cloud Firestore API** (also listed as Firestore API).
3. **IAM** → grant the **same Google account that owns the Apps Script project**:

   - `Cloud Datastore User` (`roles/datastore.user`)

   That account can read `users`, subcollections, and `games`, and can write `reminderLogs`.

If the Apps Script owner is already the Firebase project Owner, the role is usually already sufficient.

Set the project ID in Apps Script:

**Project Settings → Script properties**

| Property | Example |
| --- | --- |
| `FIRESTORE_PROJECT_ID` | `dk354-daily` |
| `DASHBOARD_URL` | `https://pugthelowleecorn.github.io/gacha-daily/dashboard` |
| `FIRESTORE_DATABASE_ID` | `(default)` (optional) |

If `FIRESTORE_PROJECT_ID` is omitted, `Config.gs` falls back to `dk354-daily`.

---

## 4. Authorize Gmail sending

1. In the Apps Script editor, select function `sendTestReminderEmail`.
2. Click **Run**.
3. Complete the OAuth consent prompt.
4. Grant Gmail send and Cloud Datastore access.
5. Check the script owner's inbox (and spam) for the test message.

Emails are sent **from the Gmail account that authorized the script**, to each user's `users/{uid}.email`. Gmail daily sending limits apply. This project is a personal tracker, so that is expected.

---

## 5. Create the 15-minute trigger (avoid duplicates)

Preferred: run `createReminderTrigger` once from the editor.

That function:

- lists existing project triggers
- creates `processReminders` every 15 minutes **only if none exist**

Manual UI alternative:

1. **Triggers** (clock icon) → **Add trigger**
2. Function: `processReminders`
3. Event source: **Time-driven**
4. Type: **Minutes timer**
5. Interval: **Every 15 minutes**
6. Save and authorize if asked

Check **Triggers** and keep **exactly one** `processReminders` time-driven trigger. If you created extras, run `deleteReminderTriggers` then `createReminderTrigger`, or delete duplicates in the UI.

---

## 6. Test the reminder manually

| Function | What it does |
| --- | --- |
| `sendTestReminderEmail` | Sends one sample email to the script owner. Does **not** write `reminderLogs`. |
| `processRemindersForce` | Same logic as production, but **ignores the 15-minute window**. Still skips `reminderEnabled === false`, missing email, empty lists, completed days, and existing `reminderLogs/{dateKey}`. Writes the log only after Gmail succeeds. |
| `processReminders` | Production runner used by the trigger. |

Before `processRemindersForce`:

1. In the app, enable reminders, set timezone, set `reminderTime`.
2. Leave at least one tracked game incomplete for **today in that timezone**.
3. Confirm `users/{uid}/reminderLogs/{YYYY-MM-DD}` does not exist yet.
4. Run `processRemindersForce`.
5. Confirm the Gmail arrives and the reminder log document is created.

To retest the same local date, delete that `reminderLogs/{dateKey}` document in Firestore (console, as project admin), then run `processRemindersForce` again.

---

## 7. Production behavior (unchanged vs Cloud Function)

1. Load all `users`.
2. Skip `reminderEnabled === false` or missing `email`.
3. Use `timezone` or `Asia/Ho_Chi_Minh`.
4. Use `reminderTime` or `23:30`.
5. Continue only if local `HH:mm` is in the 15-minute window (unless force).
6. Today's key is `YYYY-MM-DD` in the user timezone.
7. Skip if `users/{uid}/reminderLogs/{dateKey}` exists.
8. Load `games` with `enabled == true`.
9. Load `dailyLogs` with `date == dateKey`.
10. Incomplete = tracked and not `status === completed`.
11. If none incomplete, send nothing.
12. Resolve names from `games/{gameId}`.
13. Perfect-day streak uses consecutive completed dates for every currently enabled tracked game.
14. Send one Gmail.
15. Write `reminderLogs/{dateKey}` only after send succeeds (`date`, `sentAt`, `incompleteGameIds`).

---

## 8. What not to do

- Do not put a service-account JSON in this repo or in Apps Script.
- Do not change `firestore.rules` for reminders.
- Do not make Firestore public.
- Do not create more than one 15-minute Apps Script trigger.
