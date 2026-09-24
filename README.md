# SBK SLK Prediction Contest

A mobile-first web application for the Soccer Blues of Keralam (SBK) WhatsApp group members to predict match scores. Built with Next.js App Router, Tailwind CSS, and Supabase.

## Features
- Mobile-first, app-like UI matching SBK branding.
- English and Malayalam support.
- User authentication (Google OAuth) and admin approval workflow.
- Score prediction with exact match deadlines (5 mins before kickoff in IST).
- Automated scoring and leaderboard generation.
- Downloadable WhatsApp share cards with native sharing API support.
- Admin Dashboard for managing results and approving users.

## Prerequisites
- Node.js 18+
- A Supabase Project (Free tier is sufficient)

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Supabase Database Setup**
   - Go to your Supabase project dashboard -> SQL Editor.
   - Copy the contents of `schema.sql` and run it to create tables, types, and RLS policies.
   - (Optional) Copy and run `seed.sql` to generate sample teams and upcoming fixtures.

3. **Environment Variables**
   - Copy `.env.example` to `.env.local`
   ```bash
   cp .env.example .env.local
   ```
   - Fill in the values for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase Project Settings -> API.

4. **Run the Development Server**
   ```bash
   npm run dev
   ```
   - Open [http://localhost:3000](http://localhost:3000)

## Creating an Admin Account
Since this app uses a private approval flow:
1. Sign in to the app with your Google account. You will see a "Pending Approval" screen.
2. Go to your Supabase dashboard -> Table Editor -> `profiles`.
3. Find your user row, and change the `status` to `approved` and `role` to `admin`.
4. Refresh the web app. You will now have access to the app and the Admin Dashboard (accessible at `/admin`).

## Logo Note
A temporary SVG placeholder logo (`public/sbk-logo.svg`) is used because extracting a clean, high-resolution circular logo with a transparent background from the provided UI concept image was not possible without loss of quality. Please replace `public/sbk-logo.svg` with the original, high-quality circular SBK logo file.
