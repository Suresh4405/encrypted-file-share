# SecureFlow — Secure File Sharing Platform with Playwright E2E Testing

A secure file distribution platform where users upload files, generate temporary share links, and manage protected downloads through a modern dashboard — with a full Playwright end-to-end test suite validating every core workflow before release.

**Video Walkthrough:** [Watch here](https://drive.google.com/file/d/1-gqdM1BakdswJqEJ-DJGXwLWwtYBMlMJ/preview)

---

## What It Does

- User authentication with JWT
- Upload files through a dashboard UI
- Generate temporary, expiring share links for uploaded files
- Protected downloads — access is gated behind the share link and its expiry
- File management dashboard (view, organize, revoke access)
- Full Playwright end-to-end test suite covering the complete user workflow

---

## Tech Stack

**Frontend:** React.js
**Backend:** Node.js, Express
**Database:** MongoDB
**Auth:** JWT
**Testing:** Playwright (end-to-end)

---

## Architecture

A straightforward client-server flow, with the emphasis on secure authentication, protected file access, and temporary share-link generation:

```
User (Browser)
   → React.js Dashboard UI
   → Node.js API (JWT Auth)
   → MongoDB (Users & Files)
   → Storage (Documents)
```

**Secure sharing workflow:** Login → Upload File → Generate Link → Set Expiry → Share URL → Protected Download

---

## Testing: Why Playwright, and What Changed

Development started with manual validation for uploads, downloads, authentication, and share-link generation. As features grew, repetitive manual testing became time-consuming and started missing edge cases — the kind of thing that's easy to skip when you're checking the same five flows for the tenth time.

Playwright replaced that with complete end-to-end automation: the entire application workflow — auth, upload, link generation, expiry, protected download — can now be validated with a single command before every release. New UI changes can be verified in minutes instead of repeating a full manual pass.

**Testing flow:** Manual Validation → One-Time Setup → Run Tests → Auto Validation → HTML Reports → Confident Releases

Test suite lives in `/e2e`.

---

## Project Structure

```
client/    → React frontend (dashboard, upload UI, share-link UI)
server/    → Node.js + Express backend (auth, file handling, share-link logic)
e2e/       → Playwright end-to-end test suite
```

---

## Running Locally

```bash
git clone https://github.com/Suresh4405/encrypted-file-share.git
cd encrypted-file-share

# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

Set up a `.env` file in `server/` with your MongoDB connection string and JWT secret, then run both the client and server dev servers.

**Running the E2E tests:**
```bash
cd e2e
npm install
npx playwright test
```
Playwright generates an HTML report after each run summarizing pass/fail status across the full workflow.

---

## Links

- **Portfolio:** [sureshcodes.vercel.app/secure-share](https://sureshcodes.vercel.app/secure-share)
- **LinkedIn:** [linkedin.com/in/sureshm2002](https://www.linkedin.com/in/sureshm2002)
