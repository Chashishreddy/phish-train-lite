# Phishing Detection Awareness Platform

This repository contains a local-only training scaffold for running internal phishing awareness simulations. It includes a Node.js (Express) API, SQLite persistence, and a lightweight React admin dashboard.

> **Safety first:** The implementation enforces allowlists, explicit approvals, simulated credential capture, and automatic debriefs. Review the guidance below before launching any campaign.

## Project structure

```
backend/   – Express API, SQLite database, mailer, landing pages, tracking endpoints
frontend/  – React + Vite admin dashboard for managing campaigns and reviewing analytics
```

## Safety & legal checklist

1. **Obtain written approval** from HR and your security leadership before sending any simulation.
2. **Maintain the employee allowlist**. Campaign recipients must be in the allowlist stored by the API. Upload or define allowlisted employees via the admin dashboard or API before scheduling a campaign.
3. **Respect the "do not send" blacklist.** The backend blocks common external domains (gmail.com, yahoo.com, outlook.com, hotmail.com) to ensure exercises never leave the organization. Customize `safety.js` if you need stricter rules.
4. **Approve every campaign.** The `approval` flag must be set to `true` (via the dashboard or `/api/campaigns/:id/approve`) before any send is queued. No email is dispatched without approval.
5. **Do not collect credentials.** Landing pages only log simulated events (`simulated_entry = 1`) and never capture sensitive data. Maintain that behaviour when customizing HTML or server routes.
6. **Use console transport unless cleared.** The default mail transport logs messages to the console. Only enable SMTP sending after verifying the allowlist and safety review. Update `mailer.js` with your approved SMTP host if needed.
7. **Automatic debriefing is mandatory.** Configure an end time for each campaign so the scheduler can send debrief messages reminding recipients that the event was a simulation.
8. **Keep it internal.** This tool is meant solely for your organization’s employees. Never target customers or external addresses.

## Backend setup (Express + SQLite)

1. Ensure you have Node.js 18+ installed.
2. Install dependencies (requires npm access):
   ```bash
   cd backend
   npm install
   ```
3. Configure environment variables as needed:
   - `PORT` – API port (default `4000`).
   - `BASE_URL` – Public base URL used in emails (defaults to `http://localhost:PORT`).
   - `PUBLIC_TRACKING_URL` – Optional explicit tracking domain (otherwise `BASE_URL`).
   - `MAIL_FROM` – Default `from` address for notifications and debriefs.
   - `DEBRIEF_URL` – Link to your training resources (defaults to `https://intranet/security-awareness`).
   - `ADMIN_ORIGIN` – Allowed CORS origin for the admin dashboard (default `*`).
4. Start the API:
   ```bash
   npm run start
   ```
5. The API automatically creates `backend/data/phish-train-lite.sqlite` on first run and seeds the required tables.

### Key API routes

- `GET /api/allowlist` – View allowlisted employees and safety blacklist.
- `POST /api/allowlist` – Add/update allowlisted employees (JSON body).
- `POST /api/allowlist/upload` – Upload CSV (email,name,department) data.
- `GET /api/templates` – Retrieve the three starter templates.
- `POST /api/campaigns` – Create a campaign (recipients must be on the allowlist).
- `PUT /api/campaigns/:id` – Update campaign details, toggle enable-sending, or replace recipients.
- `POST /api/campaigns/:id/approve` – Explicitly approve a campaign before delivery.
- `POST /api/campaigns/:id/send` – Queue an approved campaign for sending (respect rate limits and allowlist).
- `GET /api/campaigns/:id/analytics` – Aggregated metrics (delivered, opened, clicked, submitted).
- `GET /api/campaigns/:id/export` – CSV export of campaign events with simulated flags only.
- Tracking and landing routes: `/track/open/:token.gif`, `/track/click/:token`, `/landing/:token`.

### Mail transport notes

`mailer.js` defaults to a console transport that prints email payloads. Update the transport configuration to use SMTP **only** after the campaign has been approved, an allowlist has been verified, and the security team has cleared real delivery.

## Frontend setup (React admin dashboard)

1. Ensure Node.js 18+ is installed.
2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   Vite proxies `/api` requests to `http://localhost:4000` by default. Adjust `VITE_API_BASE` or the proxy in `vite.config.js` if the backend runs elsewhere.

### Admin dashboard features

- Maintain the employee allowlist (manual entries or CSV upload) and view blocked domains.
- Create campaign drafts, select from three templates, schedule start/end times, define managers for notifications, and choose recipients strictly from the allowlist.
- Approve campaigns and toggle delivery only when safe.
- View open/click/submit analytics with simple rate charts and export CSV results for reporting.
- Receive manager notifications automatically when click rates exceed 50%.

## Testing notes

Automated tests are not included in this scaffold. Exercise the API manually using the dashboard or HTTP clients (e.g., curl, Postman) and verify email output via the console transport before enabling real SMTP delivery.

## Responsible use reminder

- Coordinate every simulation with HR, legal, and leadership stakeholders.
- Communicate clearly in debrief emails that the campaign was a training exercise and share further learning resources.
- Store only the minimal training data required (no credentials, no sensitive personal data).
- Respect employee privacy, labour regulations, and regional laws governing security awareness programs.

Stay safe and keep your colleagues informed!
