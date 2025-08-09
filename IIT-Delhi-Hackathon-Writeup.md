# FocusFuel — IIT Delhi Hackathon Write-up

## Elevator Pitch
FocusFuel is an AI-powered academic coach that triangulates a student’s focus sessions, tasks, mood, and reflections to deliver data-driven insights and coaching. Parents interact via Telegram in natural language to get real-time progress, patterns, and actionable guidance—turning daily activity into measurable consistency gains.

## Features
- Student productivity tracking
  - Focus sessions with duration, trends, and consistency
  - Tasks with priority, details, completion, and insights
  - Mood logging and study reflections for wellbeing/context
  - Emergency help logging for escalation awareness
- AI academic coach (Telegram)
  - Natural-language Q&A for parents about progress, habits, and focus
  - Weekly/instant summaries with concrete metrics and tips
  - HTML-formatted, coach-style responses (concise and actionable)
- Parent integration
  - Simple linking via Telegram Chat ID from the app’s “Parent Reports” modal
  - Toggle weekly reports; send test message from the app
- Gamified habit loop
  - Bonsai growth tied to study time and consistency to drive engagement
- Secure, scalable backend
  - Supabase Postgres + Auth with RLS; Prisma schema & migrations
  - Server-only service-role aggregation; client uses anon key
- Deployed and demo-ready
  - Vercel-hosted web app + API routes; Telegram webhook to production URL

## Tech Stack
- Frontend: Next.js 15 (App Router), TypeScript, React, Framer Motion, Tailwind-style classes
- Backend/API: Next.js Route Handlers (`src/app/api/*`)
- Database: Supabase (Postgres) + Prisma ORM/migrations
- Auth: Supabase Auth (NextAuth wiring present as needed)
- Messaging: Telegram Bot API (webhook)
- AI: Google Gemini 1.5 for coach-style responses
- Deployment: Vercel (prod), GitHub (CI/CD)
- Tooling: ESLint, TSConfig, React Hot Toast, scripts for webhook setup

## Implementation
### Data Model (core)
- User: `id`, `email`, `name`, `image`, `parent_chat_id`, `parent_reports_enabled`
- Task: `title`, `details`, `priority`, `completed`, `createdAt`, `completedAt`
- FocusSession: `duration` (seconds), `createdAt`
- Mood: `mood`, `createdAt`
- Reflection: session notes (focus/distractions, duration)
- EmergencyLog: `issue`, `createdAt`

### Architecture
- Next.js UI for students + settings; “Parent Reports” modal handles Chat ID linking and report toggles
- Supabase admin client (server-side) aggregates data securely for summaries/insights
- API routes:
  - `/api/parent-settings`: save parent chat ID + enable flag
  - `/api/send-telegram-update`: compose weekly/instant summaries and send to Telegram
  - `/api/telegram-webhook`: handle incoming Telegram messages → resolve linked student → aggregate data → call Gemini → reply

### AI Flow
1) Aggregate last-day/week/month focus, tasks, moods, reflections, emergencies
2) Build a structured prompt for Gemini with metrics and context
3) Generate a coach-style, HTML-formatted response with strengths, trends, and actionable steps
4) Fail-safe fallback: deterministic summary if the AI call fails

### Security & Privacy
- RLS on tables; server handlers use service role key (never exposed to client)
- Parent linkage is explicit (Chat ID + enable toggle)
- Environment variables managed in platform; no secrets in client bundle

### Deployment & Webhook
- Push to GitHub → Vercel builds/deploys web and API routes
- Telegram webhook set to `https://<vercel-app>.vercel.app/api/telegram-webhook`
- Health checks via Telegram `getWebhookInfo`; observability via logs

