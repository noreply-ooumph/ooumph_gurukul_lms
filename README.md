# OOUMPH Gurukul LMS

A three-portal Learning Management System for the Ooumph DAO Platform — built with vanilla JS and Supabase (auth + database + file storage). No build tools, no frameworks, runs from any static host.

## Portals

| Portal | File | Who uses it |
|---|---|---|
| **Student** | `ooumph-user-portal.html` | Students — watch content, save to watchlist, like, view study materials |
| **Teacher** | `ooumph-admin-portal.html` | Teachers — upload videos/PDFs/images/CSVs to their assigned track |
| **Super Admin** | `super-admin-portal.html` | Admins — manage all users, content, and tracks |

## Setup

### 1. Create a Supabase Project

Go to [supabase.com](https://supabase.com) → New Project.

### 2. Run the Schema

In your Supabase dashboard → **SQL Editor** → paste and run the contents of `supabase/schema.sql`.

### 3. Configure Credentials

Open `js/supabase-config.js` and replace:

```js
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Find these values in: Supabase Dashboard → Project Settings → API.

### 4. Create User Accounts

In Supabase Dashboard → **Authentication → Users → Invite user** (or Add user):

**Super Admins** (create first):
- `admin@ooumph.com` — set a password
- `praveen@ooumph.com` — set a password

Then run in SQL Editor to assign roles:
```sql
UPDATE public.profiles SET role='super_admin', full_name='Super Admin', phone='+91 99999 00000' WHERE email='admin@ooumph.com';
UPDATE public.profiles SET role='super_admin', full_name='Praveen Mishra', phone='+91 88888 11111' WHERE email='praveen@ooumph.com';
```

**Teachers** — create via Auth dashboard, then:
```sql
UPDATE public.profiles SET role='teacher', full_name='Dr. Rajesh Sharma', track='Agriculture', qualification='PhD Agriculture' WHERE email='rajesh.sharma@ooumph.com';
-- repeat for each teacher (see teachers.csv for full list)
```

**Students** — create via Auth dashboard, then:
```sql
UPDATE public.profiles SET role='student', full_name='Rahul Kumar', track='Agriculture', qualification='Diploma (Polytechnic)' WHERE email='rahul.kumar@gmail.com';
-- repeat for each student (see test_registrations.csv for full list)
```

> **Tip:** Use the Super Admin portal's Add User flow to create new students/teachers going forward — it calls Supabase auth under the hood.

### 5. Storage Buckets

The schema.sql creates two buckets automatically:
- `content` — stores uploaded videos, PDFs, CSVs (private, auth-required)
- `thumbnails` — stores image thumbnails (public)

If the SQL insert fails for storage, create them manually in Supabase → Storage.

### 6. Deploy

Since all files are static HTML, deploy anywhere:

**GitHub Pages** (simplest):
```bash
# Already on GitHub — just enable Pages in repo Settings → Pages → Deploy from branch main
```

**Vercel / Netlify**: drag and drop the folder.

## DAO Tracks

Agriculture · Healthcare · Education · Commerce · Governance · Media · Telecom · Engineering · Energy

## Tech Stack

- **Frontend:** Vanilla JS, CSS (no framework, no build step)
- **Backend:** [Supabase](https://supabase.com) — PostgreSQL + Auth + Storage
- **Auth:** Supabase email/password (JWT)
- **Storage:** Supabase Storage (S3-compatible, up to 500MB per file on free tier)
- **Hosting:** GitHub Pages / any static host

## File Structure

```
ooumph_gurukul_lms/
├── index.html                  # Landing page — links to all 3 portals
├── ooumph-user-portal.html     # Student portal
├── ooumph-admin-portal.html    # Teacher portal
├── super-admin-portal.html     # Super Admin portal
├── js/
│   └── supabase-config.js      # ← PUT YOUR CREDENTIALS HERE
├── supabase/
│   └── schema.sql              # Run this in Supabase SQL Editor
└── README.md
```

## Security Notes

- All database tables have **Row Level Security (RLS)** enabled
- Students only see content for their assigned track
- Teachers can only upload/delete content for their track
- Super admins have full read/write access
- Passwords are handled entirely by Supabase Auth (bcrypt hashed, never stored in your DB)
- The `anon` key in `supabase-config.js` is safe to expose — RLS policies enforce access control
