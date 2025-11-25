# Phish Train Lite - Codebase Overview

This is a **full-stack phishing awareness training platform** designed for internal organizational use to educate employees about security threats.

## Project Structure

```
Phish Train Lite/
├── backend/                 # Express.js API server
│   ├── data/               # SQLite database storage
│   │   └── phish-train-lite.sqlite
│   ├── node_modules/       # Backend dependencies
│   ├── db.js              # Database initialization and schema
│   ├── mailer.js          # Email transport configuration
│   ├── safety.js          # Domain allowlist/blacklist logic
│   ├── server.js          # Main Express API server
│   ├── templates.js       # Phishing email templates
│   └── package.json       # Backend dependencies
│
├── frontend/              # React admin dashboard
│   ├── src/
│   │   ├── App.jsx       # Main React application
│   │   ├── main.jsx      # React entry point
│   │   └── styles.css    # Application styling
│   ├── node_modules/     # Frontend dependencies
│   ├── index.html        # HTML entry point
│   ├── vite.config.js    # Vite build configuration
│   └── package.json      # Frontend dependencies
│
├── ARCHITECTURE.md           # Architecture diagrams and technical design
├── CLAUDE.md                 # This file
├── README.md                 # Project documentation
└── SCENARIO-SIMULATION.md    # Simulation testing scenarios guide
```

> **📊 For visual architecture diagrams, see [ARCHITECTURE.md](ARCHITECTURE.md)**
> Includes system architecture, database schema, request flows, and component diagrams.
>
> **🧪 For simulation testing scenarios, see [SCENARIO-SIMULATION.md](SCENARIO-SIMULATION.md)**
> Comprehensive guide with 30+ testing scenarios for the simulation engine.

## Application Type

**Full-Stack Web Application** - Internal Security Awareness Training Platform

This is a complete phishing simulation platform consisting of:
- **Backend**: RESTful API server (Node.js/Express)
- **Frontend**: Single-page admin dashboard (React)
- **Database**: SQLite for data persistence
- **Email System**: Nodemailer for campaign delivery

## Key Files and Their Roles

### Backend Files

#### `backend/server.js` (512 lines)
- Main Express server with all API routes
- Campaign management endpoints
- Email tracking endpoints (open/click tracking)
- Landing page generation and form submission
- Automated campaign scheduler (runs every 60 seconds)
- Analytics and export functionality

#### `backend/db.js` (71 lines)
- SQLite database initialization
- Creates 5 tables: employees, campaigns, campaign_targets, campaign_events, system_settings
- Auto-creates database file on first run

#### `backend/safety.js` (13 lines)
- Blocks external email domains (gmail, yahoo, outlook, hotmail)
- Validates email addresses against blacklist

#### `backend/mailer.js` (35 lines)
- Email transport factory
- Defaults to console logging (safe mode)
- Configurable SMTP transport for real sending

#### `backend/templates.js` (23 lines)
- 3 pre-built phishing email templates
- Variable substitution for personalization

### Frontend Files

#### `frontend/src/App.jsx` (434 lines)
- Complete React admin dashboard
- 5 main components: AllowlistManager, CampaignForm, CampaignList, CampaignAnalytics, App
- Manages employee allowlist, campaign creation, analytics visualization

#### `frontend/vite.config.js` (16 lines)
- Vite dev server on port 5173
- Proxies /api requests to backend (port 4000)

## Technology Stack

### Backend
- **Runtime**: Node.js (requires 18+)
- **Framework**: Express 4.18.2
- **Database**: SQLite3 5.1.6
- **Email**: Nodemailer 6.9.8
- **Security**: express-rate-limit 6.7.0 (100 requests/minute)
- **Module System**: CommonJS

### Frontend
- **Framework**: React 18.2.0
- **Build Tool**: Vite 4.5.0
- **Styling**: Plain CSS (no framework)
- **Module System**: ES Modules
- **UI**: Custom components (no UI library)

### Database Schema

**Tables:**
1. **employees** - email, name, department
2. **campaigns** - name, template, scheduling, approval flags, SMTP config
3. **campaign_targets** - recipient list with unique tokens
4. **campaign_events** - tracking data: delivered, opened, clicked, submitted
5. **system_settings** - key-value store

## Core Features

### 1. Employee Allowlist Management
- Manual entry and CSV upload
- Domain blacklist enforcement
- Prevents external email targeting

### 2. Campaign Management
- Create campaigns from 3 pre-built templates
- Schedule campaigns with start/end times
- Approval workflow (campaigns must be approved before sending)
- Enable/disable sending toggle
- SMTP configuration per campaign

### 3. Email Tracking
- Open tracking via 1x1 pixel GIF
- Click tracking via redirect URLs
- Form submission tracking (simulated credential capture)
- IP address hashing for privacy

### 4. Security & Safety Features
- Mandatory approval process
- Domain blacklist (blocks public email providers)
- Rate limiting (100 req/min)
- Console-only email transport by default
- Simulated credential capture (no real data stored)
- Automatic debrief emails at campaign end

### 5. Analytics & Reporting
- Real-time metrics: delivered, opened, clicked, submitted
- Calculated rates: open rate, click rate, submit rate
- Visual progress bars
- CSV export of campaign events
- Manager notifications when click rate exceeds 50%

### 6. Automated Operations
Scheduler checks every 60 seconds for:
- Approved campaigns ready to send
- Campaigns ready for debrief (end_time reached)
- Automatic status transitions (draft → scheduled → running → completed)

### 7. Simulation Engine
- Generate realistic employee engagement events for testing
- Configurable rates: open rate, click rate, submit rate
- Separate real events from simulated test data
- Test manager notification thresholds
- Clear and re-run simulations
- Validate campaign effectiveness before sending
- **See [SCENARIO-SIMULATION.md](SCENARIO-SIMULATION.md) for 30+ testing scenarios**

## Email Templates

1. **Login Verification Notice** - mimics security alerts
2. **Updated Security Policy** - urgent compliance requests
3. **Package Delivery** - low-pressure delivery notifications

## Landing Page Behavior

- Displays fake login form pre-filled with employee email
- Records submission as "simulated_entry = 1"
- Shows immediate debrief message after submission
- Never stores actual credentials

## Architecture Patterns

### 1. Separation of Concerns
- Clean separation between backend API and frontend UI
- Modular backend (db, mailer, safety, templates as separate modules)
- Component-based frontend architecture

### 2. Security-First Design
- Multiple safety gates (approval, allowlist, domain blacklist, enable_sending flag)
- Privacy-conscious (IP hashing, no credential storage)
- Default-safe configuration (console transport)

### 3. RESTful API Design
- Resource-based endpoints (/api/campaigns, /api/allowlist)
- Standard HTTP methods (GET, POST, PUT)
- Consistent error handling with JSON responses

### 4. Token-Based Tracking
- Unique SHA-256 tokens per recipient per campaign
- Stateless tracking (no session management)
- URL-based event attribution

### 5. Database Design
- Normalized schema with foreign keys
- Event sourcing for campaign analytics
- Audit trail (created_at, updated_at timestamps)

## Safety Features

The platform is designed with **strong ethical guardrails**:

1. ✅ Multiple approval gates before sending
2. ✅ Allowlist-only targeting
3. ✅ Public domain blacklist
4. ✅ Simulated data capture (ethical testing)
5. ✅ Mandatory debrief mechanism
6. ✅ Manager notifications for high-risk behavior
7. ✅ Rate limiting to prevent abuse
8. ✅ Blocks public email providers (Gmail, Yahoo, Outlook, Hotmail)
9. ✅ Default-safe email mode (console logging)
10. ✅ IP address hashing for privacy

## Running the Application

### Backend
```bash
cd backend
npm install
node server.js
```
- Runs on port **4000**
- Database auto-created at `backend/data/phish-train-lite.sqlite`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
- Dev server on port **5173**
- Proxies API requests to backend

## Development Workflow

- Backend uses CommonJS modules
- Frontend uses ES6 modules
- Promise-based async operations throughout
- Utility functions for common operations (runQuery, runGet, runExecute)
- Environment variable configuration for deployment flexibility
- Hot reload via Vite

## API Endpoints

### Allowlist Management
- `GET /api/allowlist` - Get all allowed employees
- `POST /api/allowlist` - Add employee to allowlist
- `POST /api/allowlist/upload` - CSV upload

### Campaign Management
- `GET /api/campaigns` - Get all campaigns
- `POST /api/campaigns` - Create new campaign
- `PUT /api/campaigns/:id/approve` - Approve campaign
- `PUT /api/campaigns/:id/send` - Toggle sending

### Analytics
- `GET /api/campaigns/:id/analytics` - Get campaign metrics
- `GET /api/campaigns/:id/events/export` - Export CSV

### Tracking
- `GET /track/:token/pixel.gif` - Track email opens
- `GET /track/:token/click` - Track link clicks
- `GET /landing/:token` - Landing page
- `POST /landing/:token/submit` - Form submission

## Notes for AI Assistants

- This is an **ethical security awareness training tool** for internal organizational use
- All safety features are intentional and should be preserved
- The platform is designed to prevent misuse (domain blacklist, approval workflow, etc.)
- Default configuration is safe (console-only email transport)
- Any modifications should maintain or enhance safety features
- The simulated credential capture is for training purposes only
- Manager notifications help identify employees who need additional training
- Debrief messages are crucial for the educational aspect

## Common Tasks

### Adding a new email template
Edit `backend/templates.js` to add a new template object with subject, body, and landing page HTML.

### Modifying the domain blacklist
Edit `backend/safety.js` to update the `BLOCKED_DOMAINS` array.

### Changing the scheduler interval
Modify the `setInterval` value in `backend/server.js` (currently 60000ms = 60 seconds).

### Adding new tracking events
Add new event types in `backend/server.js` and update the analytics queries accordingly.

### Customizing the UI
Edit `frontend/src/styles.css` for styling changes or `frontend/src/App.jsx` for component modifications.
