# AI KAVASH — Threat Protection System

AI-powered security platform that detects, analyzes, and blocks fake links, malicious messages, fraudulent transactions, and other security threats for organizations. Built with Vite, React, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Link Scanner** — Paste any URL and get an instant fake/real verdict powered by a heuristic AI analysis engine
- **Background Auto-Scanner** — Runs automatically after login, continuously scanning and blocking malicious content 24/7
- **Threat Feed** — Full threat log with search, filtering, status updates, and detail views
- **Blocked Items** — Manage blocked links, messages, and content
- **Report Threat** — Submit threats with automatic AI risk scoring
- **Employee Management** — Manager-only employee list CRUD
- **Transaction Tracking** — Manager-only income/expense tracking with summary cards
- **SMS Alerts** — Send security alerts to employees via a Supabase Edge Function
- **Analytics** — Charts showing 7-day threat trends, breakdowns by type/source, and status distribution
- **Authentication** — Three login methods:
  - Password (email + password)
  - Email OTP (receive a 6-digit code via email)
  - Phone OTP (receive a 6-digit code via SMS)
  - OTP-based password reset (enter OTP → set new password → sign in)
- **Role-Based Access** — Manager-only pages (Employees, Transactions, SMS Alerts)
- **Row Level Security** — All database tables are protected with owner-scoped RLS policies

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React 18 + TypeScript |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions, RLS) |
| Testing | Vitest |

## Getting Started

### Prerequisites

- Node.js 18 or higher
- A Supabase project (free tier works)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/ai-kavash.git
cd ai-kavash
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root (see `.env.example`):

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:

```bash
npm run dev
```

5. Open your browser to the URL shown in the terminal.

### Database Setup

The Supabase migrations are in `supabase/migrations/`. Apply them through the Supabase MCP tools or the Supabase dashboard to create the required tables:

- `company_profiles` — Organization profiles with role-based access
- `threats` — Detected and reported threats with AI analysis
- `blocked_items` — Blocked malicious content
- `employees` — Organization employee lists
- `transactions` — Income/expense tracking
- `sms_alerts` — SMS alert history

All tables have Row Level Security enabled with owner-scoped policies using `auth.uid()`.

### Edge Functions

The `send-sms-alert` edge function handles SMS alert delivery. Deploy it through the Supabase dashboard or MCP tools.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |
| `npm run test:coverage` | Run tests with coverage report |

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── BackgroundScanner.tsx   # Auto-scanning background service
│   └── Layout.tsx              # Sidebar navigation layout
├── context/             # React context providers
│   └── AuthContext.tsx         # Auth state and OTP methods
├── lib/                 # Utilities and configuration
│   ├── supabase.ts             # Supabase client and TypeScript types
│   └── threatAnalysis.ts       # AI heuristic threat analysis engine
├── pages/               # Application pages
│   ├── AuthPage.tsx            # Login/signup with OTP tabs
│   ├── Dashboard.tsx           # Threat overview dashboard
│   ├── LinkScanner.tsx         # URL fake/real scanner
│   ├── ReportThreat.tsx        # Threat reporting form
│   ├── ThreatFeed.tsx          # Threat list with filters
│   ├── BlockedItems.tsx        # Blocked content management
│   ├── Employees.tsx           # Employee management (manager)
│   ├── Transactions.tsx        # Transaction tracking (manager)
│   ├── SmsAlerts.tsx           # SMS alert sending (manager)
│   ├── Analytics.tsx           # Charts and analytics
│   └── Settings.tsx            # Organization settings
├── App.tsx              # Root component with routing
└── main.tsx             # Application entry point
```

## Security

- All database tables use Row Level Security with owner-scoped policies
- No service role keys are exposed to the frontend
- Authentication handled entirely through Supabase Auth
- Edge functions use the service role key server-side only
- OTP-based authentication for email, phone, and password reset

## License

MIT — see [LICENSE](LICENSE)
