# 🎓 Comet Passport — JSOM Digital Identity

A shareable digital passport for Naveen Jindal School of Management students.
Built with React + Vite + Supabase.

---

## ✨ Features

- **Email verification on sign-up** — Supabase sends a confirmation link
- **Passwordless magic link sign-in** — one-click login, no passwords ever
- **5-page passport** — Cover, Profile, About Me, Your JSOM, Memories
- **Auto-save** — About Me fields save to the database as you type
- **Protected routes** — unauthenticated users are redirected to sign-in

---

## 🚀 Setup Guide

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project** — give it a name (e.g. `jsom-passport`)
3. Wait ~2 minutes for it to provision

### 2. Set Up the Database

1. In your Supabase dashboard, go to **SQL Editor → New Query**
2. Paste the entire contents of `supabase-schema.sql`
3. Click **Run** — you should see `Success`

### 3. Configure Auth Settings

In Supabase dashboard → **Authentication → Settings**:

- **Site URL**: set to `http://localhost:5173` for development
  *(change to your live URL before deploying, e.g. `https://jsompassport.vercel.app`)*
- **Redirect URLs**: add `http://localhost:5173/auth/callback`
  *(also add your production URL when deploying)*
- **Email Auth**: should be enabled by default ✓
- **Confirm email**: make sure this is **ON** (so verification emails are sent)

### 4. Get Your API Keys

Go to **Project Settings → API**:

- Copy **Project URL** → this is `VITE_SUPABASE_URL`
- Copy **anon public** key → this is `VITE_SUPABASE_ANON_KEY`

### 5. Configure Environment Variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your values:

```
VITE_SUPABASE_URL=https://abcdefghij.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

### 6. Add Your Logo and JSOM Building Image

Place your images in `src/assets/`:
- `jsom-logo.png` — the UTD/JSOM logo (transparent background)
- `jsom-building.jpg` — the JSOM building photo

Then in `src/pages/PassportPage.jsx`, uncomment and update these lines:

```jsx
// Cover page logo (around line 90):
import jsomLogo from '../assets/jsom-logo.png'
<img src={jsomLogo} alt="UTD JSOM" style={{ width: 190 }} />

// JSOM building photo (around line 170):
import jsomBuilding from '../assets/jsom-building.jpg'
<img src={jsomBuilding} style={{ width: '100%', height: 130, objectFit: 'cover' }} />
```

Do the same in `src/pages/AuthPage.jsx` for the logo on the auth screen.

### 7. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 📦 Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo to [vercel.com](https://vercel.com) for auto-deploys.

**After deploying**, update Supabase:
- **Site URL** → your Vercel URL
- **Redirect URLs** → add `https://your-app.vercel.app/auth/callback`

Add your env vars in Vercel dashboard → Project Settings → Environment Variables.

---

## 🗂 Project Structure

```
jsom-passport/
├── src/
│   ├── lib/
│   │   ├── supabase.js       # Supabase client + all auth & DB helpers
│   │   └── AuthContext.jsx   # React context — session, user, passport state
│   ├── pages/
│   │   ├── AuthPage.jsx      # Sign up + magic link sign in
│   │   ├── AuthCallback.jsx  # Handles email verification & magic link redirect
│   │   └── PassportPage.jsx  # The 5-page passport UI
│   ├── App.jsx               # Router + protected routes
│   └── main.jsx              # Entry point
├── supabase-schema.sql       # Run this in Supabase SQL editor
├── .env.example              # Copy to .env.local and fill in keys
└── index.html
```

---

## 🔐 Auth Flow Explained

```
SIGN UP:
  User fills form → signUp() → Supabase sends verification email
  User clicks link → /auth/callback → passport row created in DB → /passport

SIGN IN (returning user):
  User enters email → signInWithMagicLink() → Supabase sends magic link email
  User clicks link → /auth/callback → session established → /passport
```

---

## 🛠 Customising the Email Templates

In Supabase dashboard → **Authentication → Email Templates**:

- **Confirm signup** — customise the verification email
- **Magic Link** — customise the sign-in email

Suggested subject for magic link: *"Your Comet Passport login link 🎓"*
