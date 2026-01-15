# Phish Train Lite - Complete Application Guide

**A Comprehensive Internal Phishing Awareness Training Platform**

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Purpose of the Platform](#2-purpose-of-the-platform)
3. [Safety & Legal Controls](#3-safety--legal-controls)
4. [Screenshots & Visual Overview](#4-screenshots--visual-overview)
5. [System Architecture](#5-system-architecture)
6. [Backend Breakdown](#6-backend-breakdown)
7. [Frontend Breakdown](#7-frontend-breakdown)
8. [Database Schema](#8-database-schema)
9. [Step-by-Step Usage Guide](#9-step-by-step-usage-guide)
10. [Advanced Features](#10-advanced-features)
11. [Security & Privacy](#11-security--privacy)
12. [Ethical & Legal Reminder](#12-ethical--legal-reminder)
13. [Troubleshooting](#13-troubleshooting)
14. [Conclusion](#14-conclusion)

---

## 1. Introduction

### What is Phish Train Lite?

Phish Train Lite is a **comprehensive, enterprise-grade phishing awareness training platform** designed exclusively for internal employee security education. It provides a safe, controlled, and ethical environment to teach employees how to recognize and respond to phishing attempts.

### Key Characteristics

**✅ Safety-First Design:**
- All simulations run locally within your organization
- No external email addresses allowed
- Mandatory approval workflow before sending
- Simulated credential capture only (never stores real passwords)
- Automatic debrief emails

**✅ Comprehensive Features:**
- 15 realistic phishing email templates
- Real-time analytics and reporting
- Department risk scoring
- Employee training modules
- Certificate generation
- Group-based targeting
- PDF report generation

**✅ Enterprise-Ready:**
- Role-based access control (Admin, Manager, Viewer)
- JWT authentication with refresh tokens
- Audit logging of all actions
- Rate limiting and CSRF protection
- Docker deployment support
- Health monitoring

**✅ Educational Focus:**
- Immediate feedback after clicking
- Training resources library
- Progress tracking
- Completion certificates
- Manager notifications

### Technology Stack

**Backend:**
- Node.js 18+ with Express 4.18.2
- SQLite3 database (embedded, file-based)
- JWT authentication with bcryptjs hashing
- Nodemailer for email handling
- PDFKit for report generation

**Frontend:**
- React 18.2.0 with Vite build tool
- Context API for state management
- Native Fetch API for HTTP
- Plain CSS with earth-tone palette

**DevOps:**
- Docker with multi-stage builds
- docker-compose orchestration
- Health check endpoints
- Volume persistence

---

## 2. Purpose of the Platform

### Primary Objectives

**1. Security Awareness Education**
- Teach employees to recognize phishing tactics
- Demonstrate common social engineering techniques
- Build muscle memory for security-conscious behavior
- Create a culture of security awareness

**2. Risk Assessment**
- Identify high-risk individuals and departments
- Measure organization-wide security posture
- Track improvement over time
- Provide data-driven insights for training

**3. Compliance & Documentation**
- Generate compliance reports for auditors
- Document security training initiatives
- Maintain audit trails of all activities
- Track employee certification

**4. Continuous Improvement**
- Measure campaign effectiveness
- Track click rates, open rates, submit rates
- Identify repeat offenders needing extra training
- Adjust training based on analytics

### Who Should Use This Platform?

**Primary Users:**
- **Security Teams:** Create and manage phishing simulations
- **IT Administrators:** Configure system, manage users
- **HR/Compliance Officers:** Review analytics, generate reports
- **Department Managers:** Monitor team performance

**Target Audience (Recipients):**
- **All Employees:** Receive training emails and complete modules

### What Problems Does It Solve?

✅ **Problem:** Employees clicking phishing links in real attacks
**Solution:** Safe simulations with immediate educational feedback

✅ **Problem:** No visibility into security awareness levels
**Solution:** Comprehensive analytics and reporting

✅ **Problem:** Generic security training doesn't stick
**Solution:** Realistic, personalized phishing scenarios

✅ **Problem:** Difficulty identifying high-risk employees
**Solution:** Risk scoring, repeat offender tracking, department analysis

✅ **Problem:** Time-consuming manual training
**Solution:** Automated campaigns, scheduling, debriefs

✅ **Problem:** Compliance documentation
**Solution:** PDF reports, CSV exports, audit logs

---

## 3. Safety & Legal Controls

### Built-In Safety Mechanisms

#### 1. **Allowlist Enforcement**
**What it does:**
- Only employees explicitly added to allowlist can receive simulations
- Every recipient must be pre-approved
- Prevents accidental external sends

**How it works:**
- CSV upload or manual entry
- Email validation on every add
- Cannot create campaign without allowlist entries
- Recipients selected from allowlist only

**Safety guarantee:**
> No one outside your organization can ever receive a phishing simulation

#### 2. **Domain Blacklist**
**What it does:**
- Blocks common public email domains
- Prevents sending to personal emails

**Blocked domains:**
- gmail.com
- yahoo.com
- outlook.com
- hotmail.com

**Why this matters:**
Ensures simulations stay internal and prevents legal issues from external sends.

#### 3. **Campaign Approval Workflow**
**What it does:**
- Every campaign requires explicit admin approval
- Two-step process: Create → Approve → Send

**Approval flow:**
```
Draft → Approved → Scheduled → Running → Completed
   ↓         ↓          ↓           ↓
 No send  No send  Sends at   Debrief
                  schedule    sent
```

**Who can approve:**
- Admin role only
- Managers can create but not approve
- Prevents unauthorized campaigns

#### 4. **No Real Credential Storage**
**What it does:**
- Landing pages accept form submissions
- Immediately flags as `simulated_entry = 1`
- Never stores actual passwords or sensitive data
- Shows debrief instead

**Database entry:**
```json
{
  "event_type": "submitted",
  "simulated_entry": 1,  // Always 1
  "ip_hash": "hashed",   // Privacy protection
  "timestamp": "2025-11-20T12:00:00Z"
}
```

**Legal protection:**
> No real credentials = no data breach risk

#### 5. **Console Transport (Safe Mode)**
**What it does:**
- Default mode: emails logged to terminal only
- Nothing actually sent over internet
- Perfect for testing and demonstrations

**Enable sending:**
Only when:
- Approval granted
- SMTP configured
- Security team cleared
- `enable_sending = 1` flag set

**Demo mode output:**
```
Simulated email send (console transport):
{
  to: 'employee@company.com',
  subject: 'Action Required: Verify Your Account',
  html: '<html>...</html>'
}
```

#### 6. **Automatic Debriefing**
**What it does:**
- At campaign end time, sends educational emails
- Confirms it was a simulation
- Provides learning resources
- No employee left confused

**Debrief email contains:**
- "This was a training exercise"
- What to watch for in real phishing
- Company security resources link
- Contact info for questions

**Why mandatory:**
Prevents employee panic, provides closure, reinforces learning.

#### 7. **High Click Rate Alerts**
**What it does:**
- If 50%+ employees click phishing link
- Automatically emails manager
- Suggests additional training

**Alert contains:**
- Campaign name
- Current click rate
- Number of employees who clicked
- Recommendation: schedule follow-up training

**Purpose:**
Creates feedback loop for continuous improvement.

#### 8. **Rate Limiting**
**What it does:**
- Max 100 requests per minute per IP
- Prevents abuse
- Protects against brute force

**Why it matters:**
Prevents malicious actors from overwhelming the system.

#### 9. **IP Address Hashing**
**What it does:**
- All tracking events store hashed IPs
- SHA-256 hashing for privacy
- Cannot reverse to identify individual

**Privacy guarantee:**
> Employee privacy protected while maintaining analytics

#### 10. **Audit Logging**
**What it does:**
- Every action logged with user, timestamp, IP
- Immutable audit trail
- Compliance documentation

**Logged actions:**
- Campaign creation, approval, sending
- Allowlist modifications
- User management
- Configuration changes

### Legal Safeguards

#### ✅ HR Approval Required
**Before running any campaign:**
- Get written approval from HR leadership
- Document approval in company records
- Share training objectives

#### ✅ Internal Use Only
**Never target:**
- Customers
- Partners
- External contractors
- Personal email addresses

**Always target:**
- Only employees on allowlist
- Only company email addresses
- Only authorized departments

#### ✅ Privacy Compliance
**GDPR/Privacy considerations:**
- No PII collection beyond employment data
- Right to view data
- Right to deletion
- Data retention policies
- Purpose limitation (training only)

#### ✅ Labor Laws
**Respect employee rights:**
- Cannot be used for disciplinary action
- Training purpose only
- No punitive measures for clicking
- Provide education not punishment

#### ✅ Transparency
**Employees should know:**
- Organization conducts phishing simulations
- Purpose is education not punishment
- Results used for training improvements
- Privacy protections in place

### Compliance Checklist

Before launching campaigns:

- [ ] HR written approval obtained
- [ ] Legal department consulted
- [ ] Privacy policy updated
- [ ] Employee notification sent
- [ ] Allowlist verified (internal only)
- [ ] SMTP configured correctly
- [ ] Debrief URL set to training resources
- [ ] Manager notification emails configured
- [ ] Console transport tested first
- [ ] Campaign approval workflow enabled

---

## 4. Screenshots & Visual Overview

### Main Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│  Phish Train Lite                                    [User] │
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│  Dashboard  Campaigns  Allowlist  Groups  Analytics       │
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                              │
│  Overview                                                    │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │ Total        │ Total        │ Draft        │            │
│  │ Employees    │ Campaigns    │ Campaigns    │            │
│  │ 247          │ 12           │ 3            │            │
│  └──────────────┴──────────────┴──────────────┘            │
│                                                              │
│  Employee Distribution by Department                        │
│  Engineering     ████████████████░░░░ 42                    │
│  HR              ████████░░░░░░░░░░░░ 18                    │
│  Finance         ████████████░░░░░░░░ 28                    │
│  Marketing       ██████░░░░░░░░░░░░░░ 15                    │
│                                                              │
│  Aggregate Campaign Metrics                                 │
│  Delivered: 1,247  Opened: 748  Clicked: 374  Submitted: 89│
│  Open Rate: 60%    Click Rate: 30%    Submit Rate: 7%       │
└─────────────────────────────────────────────────────────────┘
```

### Login/Registration Page
```
┌─────────────────────────────────────────┐
│                                         │
│         Phish Train Lite                │
│    Security Awareness Training          │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Username: [___________________]   │ │
│  │ Email:    [___________________]   │ │  (signup only)
│  │ Password: [___________________] 👁️ │ │
│  │ Confirm:  [___________________] 👁️ │ │  (signup only)
│  │                                   │ │
│  │      [    SIGN UP / LOG IN    ]   │ │
│  │                                   │ │
│  │  Already have account? Log in     │ │  (toggle)
│  └───────────────────────────────────┘ │
│                                         │
│  🔒 First user becomes admin           │
└─────────────────────────────────────────┘
```

### Campaign Management
```
┌─────────────────────────────────────────────────────────────┐
│  Campaigns                                [Create Campaign] │
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                              │
│  Name                      Status      Recipients  Actions  │
│  ───────────────────────────────────────────────────────── │
│  Q1 Password Security      Running     42          [Pause]  │
│  HR Policy Update Test     Scheduled   18          [Send]   │
│  Package Scam Simulation   Draft       28          [Approve]│
│                                                              │
│  [✓] Select All   [Bulk Approve]  [Bulk Delete]            │
└─────────────────────────────────────────────────────────────┘
```

### Analytics Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│  Analytics                                                   │
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                              │
│  Campaign: [Q1 Password Security ▼]                         │
│                                                              │
│  Delivered:  42  ████████████████████████████████ 100%     │
│  Opened:     25  ██████████████████░░░░░░░░░░░░░  60%      │
│  Clicked:    13  █████████░░░░░░░░░░░░░░░░░░░░░░  31%      │
│  Submitted:   3  ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░   7%      │
│                                                              │
│  [Download PDF Report]  [Export CSV]                        │
│                                                              │
│  Department Risk Scoring                                     │
│  Engineering  Risk: 45  Click Rate: 35%  🟡 Medium         │
│  Finance      Risk: 67  Click Rate: 52%  🔴 High           │
│  HR           Risk: 23  Click Rate: 18%  🟢 Low            │
└─────────────────────────────────────────────────────────────┘
```

### Email Templates (15 Available)
```
┌─────────────────────────────────────────┐
│  Choose Template:                       │
│  ┌──────────────────────────────────┐  │
│  │ 1. Login Verification Notice      │  │
│  │ 2. Security Policy Update         │  │
│  │ 3. Package Delivery               │  │
│  │ 4. Password Expiration ⭐NEW      │  │
│  │ 5. Payroll Update ⭐NEW           │  │
│  │ 6. IT Support Ticket ⭐NEW        │  │
│  │ 7. Document Sharing ⭐NEW         │  │
│  │ 8. Account Suspension ⭐NEW       │  │
│  │ 9. Benefits Enrollment ⭐NEW      │  │
│  │ 10. Invoice Payment ⭐NEW         │  │
│  │ 11. Software Update ⭐NEW         │  │
│  │ 12. Meeting Invitation ⭐NEW      │  │
│  │ 13. Employee Award ⭐NEW          │  │
│  │ 14. VPN Access Renewal ⭐NEW      │  │
│  │ 15. Compliance Training ⭐NEW     │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Landing Page (What Employees See)
```
┌─────────────────────────────────────────┐
│                                         │
│  🔒 Secure Verification Portal          │
│                                         │
│  Please verify your identity:           │
│                                         │
│  Username: [____________________]       │
│  Password: [____________________]       │
│                                         │
│         [    Verify Now    ]            │
│                                         │
└─────────────────────────────────────────┘
       ↓ (After clicking submit)
┌─────────────────────────────────────────┐
│  ⚠️ This Was A Phishing Simulation      │
│                                         │
│  This was a training exercise.          │
│  No credentials were captured.          │
│                                         │
│  What to watch for:                     │
│  • Urgent language                      │
│  • Requests for passwords               │
│  • Suspicious sender addresses          │
│  • Unexpected attachments               │
│                                         │
│  📚 Security Training Resources         │
│  [Learn More About Phishing]            │
└─────────────────────────────────────────┘
```

---

## 5. System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         USER LAYER                           │
├──────────────────────┬──────────────────────────────────────┤
│  Admin Dashboard     │  Email Recipients (Employees)        │
│  (React Frontend)    │  - Receive phishing emails           │
│  - Login/Register    │  - Click tracking links              │
│  - Create campaigns  │  - Visit landing pages               │
│  - View analytics    │  - Submit forms (simulated)          │
│  - Manage allowlist  │  - Receive debrief emails            │
│  - Generate reports  │                                      │
└──────────┬───────────┴──────────────┬───────────────────────┘
           │                          │
           │ HTTP/HTTPS               │ Email links
           │ JWT Auth                 │ Tracking pixels
           │                          │
┌──────────▼──────────────────────────▼───────────────────────┐
│                    APPLICATION LAYER                         │
├──────────────────────────────────────────────────────────────┤
│  FRONTEND (Vite + React)    │  BACKEND (Express.js)          │
│  Port: 5173 (dev)           │  Port: 5000 (default)          │
│  ─────────────────────      │  ──────────────────────        │
│  • React 18.2.0             │  • Node.js 18+                 │
│  • Context API State        │  • Express 4.18.2              │
│  • JWT Token Management     │  • RESTful API (65+ endpoints) │
│  • Toast Notifications      │  • JWT Authentication          │
│  • CSV Import/Export        │  • RBAC (3 roles)              │
│  • Analytics Visualization  │  • Automated Scheduler         │
│  • Form Validation          │  • Email Tracking              │
│  • 13+ Components           │  • PDF Generation              │
│                             │  • Encryption (AES-256-GCM)    │
└─────────────────────────────┴────────────┬───────────────────┘
                                           │
┌──────────────────────────────────────────▼───────────────────┐
│                        DATA LAYER                             │
├──────────────────────────────────────────────────────────────┤
│  SQLite Database (phish-train-lite.sqlite)                   │
│  ──────────────────────────────────────────────────          │
│  • 16 tables with foreign keys                               │
│  • Normalized schema                                         │
│  • Automatic migrations                                      │
│  • Audit logging                                             │
│  • Campaign data, tracking events, users, training           │
└──────────────────────────────────────────┬───────────────────┘
                                           │
┌──────────────────────────────────────────▼───────────────────┐
│                   EXTERNAL SERVICES                           │
├──────────────────────────────────────────────────────────────┤
│  • SMTP Email Server (optional, per-campaign config)         │
│  • Slack Webhooks (notifications)                            │
│  • Custom Webhook Integrations                               │
│  • Console Transport (default safe mode)                     │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow: Campaign Lifecycle

```
1. CREATION
Admin → Dashboard → POST /api/campaigns → SQLite
        Campaign created with status='draft'

2. APPROVAL
Admin → Click "Approve" → POST /api/campaigns/:id/approve
        Campaign status='scheduled', approval=1

3. SCHEDULING
Scheduler (60s loop) → Checks scheduled_time
        If time reached → Send emails → status='running'

4. TRACKING
Employee opens email → GET /track/open/:token.gif
        Log 'opened' event → Update analytics

Employee clicks link → GET /track/click/:token
        Log 'clicked' event → Redirect to landing

Employee submits form → POST /landing/:token/submit
        Log 'submitted' event → Show debrief

5. COMPLETION
Scheduler → Checks end_time
        If time reached → Send debriefs → status='completed'

6. NOTIFICATION
If click_rate > 50% → Email manager
        Include metrics + training recommendation

7. ANALYTICS
Admin → Dashboard → GET /api/campaigns/:id/analytics
        Real-time metrics displayed
```

### Request Flow (Example: Creating Campaign)

```
┌─────────┐      1. Fill Form       ┌──────────┐
│ Admin   ├─────────────────────────▶ React    │
│ Browser │                          │ Frontend │
└─────────┘                          └────┬─────┘
                                          │
                                          │ 2. POST /api/campaigns
                                          │    + JWT Token
                                          │    + CSRF Token
                                          │
                                     ┌────▼────────┐
                                     │  Express    │
                                     │  Middleware │
                                     ├─────────────┤
                                     │ • Auth      │──────┐
                                     │ • CSRF      │      │ 3. Verify
                                     │ • Rate Limit│◀─────┘
                                     │ • Role Check│
                                     └─────┬───────┘
                                           │
                                           │ 4. Validated
                                           │
                                     ┌─────▼────────┐
                                     │  Campaign    │
                                     │  Controller  │
                                     ├──────────────┤
                                     │ • Validate   │
                                     │ • Check      │
                                     │   allowlist  │
                                     │ • Generate   │
                                     │   tokens     │
                                     └──────┬───────┘
                                            │
                                            │ 5. Save
                                            │
                                     ┌──────▼───────┐
                                     │   SQLite     │
                                     │   Database   │
                                     ├──────────────┤
                                     │ campaigns    │
                                     │ campaign_    │
                                     │   targets    │
                                     │ audit_logs   │
                                     └──────┬───────┘
                                            │
                                            │ 6. Return ID
                                            │
┌─────────┐    8. Show Success    ┌────────▼─────┐
│ Admin   ◀──────────────────────│  Express     │
│ Browser │    + Campaign Data    │  Response    │
└─────────┘                        └──────────────┘
```

### Component Hierarchy (Frontend)

```
App.jsx (Main Container)
├── AuthProvider (Authentication State)
│   └── ToastProvider (Notifications)
│       ├── Login.jsx (Not authenticated)
│       │   └── [Username/Email/Password Forms]
│       │
│       └── Authenticated App (When logged in)
│           ├── Header (User info, Logout)
│           ├── TabNavigation
│           │   └── [Dashboard|Campaigns|Allowlist|Groups|Analytics]
│           │
│           ├── Dashboard Tab
│           │   ├── Overview Statistics
│           │   ├── Department Distribution
│           │   └── Recent Activity
│           │
│           ├── Campaigns Tab
│           │   ├── CampaignList.jsx
│           │   │   ├── Campaign rows
│           │   │   └── Bulk actions
│           │   └── CampaignForm.jsx
│           │       ├── Basic info
│           │       ├── Template selection
│           │       ├── Recipient selection
│           │       └── Schedule configuration
│           │
│           ├── Allowlist Tab
│           │   └── AllowlistManager.jsx
│           │       ├── Employee table
│           │       ├── Add form
│           │       └── CSV upload
│           │
│           ├── Groups Tab
│           │   ├── Group list
│           │   ├── Create group form
│           │   └── Manage members
│           │
│           └── Analytics Tab
│               ├── EmployeeAnalytics.jsx
│               ├── TrendsAnalytics.jsx
│               ├── CompareAnalytics.jsx
│               ├── DepartmentRiskScoring.jsx
│               └── RepeatOffenders.jsx
│
└── Toast Notification System
    └── [Success|Error|Info|Warning toasts]
```

---

## 6. Backend Breakdown

### Directory Structure

```
backend/
├── server.js              # Main application (2,455 lines)
├── db.js                  # Database initialization (227 lines)
├── auth.js                # Authentication utilities (88 lines)
├── middleware.js          # Express middleware (147 lines)
├── mailer.js              # Email transport factory (35 lines)
├── safety.js              # Domain blacklist (13 lines)
├── templates.js           # Email templates (100 lines)
├── encryption.js          # AES-256-GCM encryption (53 lines)
├── reports.js             # PDF generation (258 lines)
├── setup-admin.js         # CLI admin setup tool (123 lines)
├── package.json           # Dependencies
├── .env                   # Environment variables
└── data/
    └── phish-train-lite.sqlite  # Database file (auto-created)
```

### Core Backend Files

#### **server.js** - Main Application Server (2,455 lines)

**Purpose:** Heart of the application containing all API endpoints and business logic.

**Key Responsibilities:**
- HTTP server setup and configuration
- 65+ RESTful API endpoints
- Automated campaign scheduler (60-second interval)
- Email composition and sending
- Landing page generation
- Tracking endpoint handling
- Analytics calculation
- PDF report generation
- Webhook triggering

**Main Sections:**

1. **Initialization (Lines 1-100)**
   ```javascript
   const express = require('express');
   const db = require('./db');
   const { createTransport } = require('./mailer');
   // ... middleware imports

   const app = express();
   app.use(cors());
   app.use(express.json());
   app.use(cookieParser());
   app.use(rateLimit({ windowMs: 60000, max: 100 }));
   ```

2. **Authentication Routes (Lines 117-370)**
   - POST /api/auth/register
   - POST /api/auth/login
   - POST /api/auth/refresh
   - POST /api/auth/logout
   - GET /api/auth/me
   - GET /api/auth/csrf

3. **Campaign Routes (Lines 880-1250)**
   - GET/POST /api/campaigns
   - PUT /api/campaigns/:id
   - POST /api/campaigns/:id/approve
   - POST /api/campaigns/:id/send
   - POST /api/campaigns/:id/clone
   - POST /api/campaigns/:id/pause/resume
   - Bulk operations

4. **Tracking Routes (Lines 1358-1412)**
   - GET /track/open/:token.gif
   - GET /track/click/:token
   - GET /landing/:token
   - POST /landing/:token/submit

5. **Analytics Routes (Lines 1413-2090)**
   - Campaign analytics
   - Employee analytics
   - Trends, comparison
   - Department risk
   - Repeat offenders

6. **Automated Scheduler (Lines 2400-2450)**
   ```javascript
   setInterval(async () => {
     // Check campaigns to send
     // Check campaigns to complete
     // Send emails/debriefs
     // Update statuses
   }, 60000); // Every 60 seconds
   ```

**Technologies Used:**
- Express.js for routing
- Promise-based async/await
- JWT for authentication
- bcryptjs for password hashing

---

#### **db.js** - Database Initialization (227 lines)

**Purpose:** Creates and manages SQLite database with automatic migrations.

**Key Features:**
- Creates 16 tables on first run
- Automatic schema migrations
- Foreign key relationships
- Default values and constraints

**Tables Created:**

1. **employees** - Allowlist
2. **campaigns** - Campaign definitions
3. **campaign_targets** - Individual recipients
4. **campaign_events** - Tracking data
5. **system_settings** - Key-value config
6. **users** - Admin accounts
7. **refresh_tokens** - JWT refresh storage
8. **audit_logs** - Action trail
9. **employee_groups** - Groups
10. **employee_group_members** - Memberships
11. **training_modules** - Training content
12. **employee_training_progress** - Progress tracking
13. **learning_resources** - Educational materials
14. **certificates** - Completion certificates
15. **webhooks** - Integrations
16. **scheduled_reports** - Report automation

**Auto-Migration Example:**
```javascript
// Checks if column exists before adding
db.all(`PRAGMA table_info(campaigns)`, (err, columns) => {
  if (!columns.some(col => col.name === 'paused')) {
    db.run(`ALTER TABLE campaigns ADD COLUMN paused INTEGER DEFAULT 0`);
  }
});
```

---

#### **auth.js** - Authentication Utilities (88 lines)

**Purpose:** Handles all authentication and token operations.

**Functions:**

1. **hashPassword(password)**
   - Uses bcryptjs with 12 salt rounds
   - Returns: hashed password string

2. **verifyPassword(password, hash)**
   - Compares plain text with hash
   - Returns: boolean

3. **generateAccessToken(user)**
   - Creates JWT with 24-hour expiry
   - Payload: { id, username, email, role }
   - Returns: signed token

4. **generateRefreshToken(user)**
   - Creates JWT with 7-day expiry
   - Payload: { id, username, type: 'refresh' }
   - Returns: signed token

5. **verifyAccessToken(token)**
   - Validates JWT signature
   - Returns: payload or null

6. **generateCSRFToken()**
   - Creates 64-byte random hex
   - Returns: CSRF token string

**Security:**
- JWT_SECRET from environment (fallback: random)
- Separate secrets for access/refresh
- Token expiry enforced
- CSRF protection

---

#### **middleware.js** - Express Middleware (147 lines)

**Purpose:** Request validation, authentication, authorization, and auditing.

**Key Middleware:**

1. **authenticateToken(req, res, next)**
   - Extracts JWT from Authorization header
   - Verifies token validity
   - Checks user is active
   - Attaches req.user
   - Used on all protected routes

2. **requireRole(...allowedRoles)**
   - Checks req.user.role
   - Allows: admin, manager, viewer
   - Returns 403 if insufficient permissions

3. **optionalAuth(req, res, next)**
   - Attempts authentication
   - Continues even if no token
   - Used on public tracking endpoints

4. **verifyCSRF(req, res, next)**
   - Validates CSRF token on mutations
   - Skips GET/HEAD/OPTIONS
   - Compares header token with cookie

5. **auditLog(action, resourceType)**
   - Decorator for route handlers
   - Automatically logs successful actions
   - Captures: user, IP, user agent, details

**Helper Functions:**
```javascript
function runGet(sql, params) { /* Promise wrapper */ }
function runExecute(sql, params) { /* Promise wrapper */ }
async function logAuditEvent(...) { /* Insert audit log */ }
```

---

#### **templates.js** - Email Templates (100 lines)

**Purpose:** Defines 15 phishing email templates with placeholders.

**Template Structure:**
```javascript
{
  key: 'password-expiration',
  name: 'Password Expiration Warning',
  subject: 'Your Password Expires in 24 Hours',
  body: `Dear {{name}},\n\nYour account password for {{department}} systems will expire...`
}
```

**Available Templates:**

**Original (3):**
1. login-mimic - Login Verification Notice
2. urgent-policy - Security Policy Acknowledgement
3. package-delivery - Package Delivery Confirmation

**New (12):**
4. password-expiration - Password Expiration Warning
5. payroll-update - Payroll Direct Deposit Update
6. it-support - IT Support Ticket Response
7. document-share - Shared Document Notification
8. account-suspension - Account Suspension Warning
9. benefits-enrollment - Benefits Enrollment Deadline
10. invoice-payment - Outstanding Invoice Payment
11. software-update - Critical Software Update
12. meeting-invite - Urgent Meeting Invitation
13. prize-notification - Employee Recognition Award
14. vpn-access - VPN Access Renewal
15. survey-request - Employee Survey Response
16. compliance-training - Mandatory Compliance Training

**Placeholders:**
- `{{name}}` - Replaced with employee name
- `{{department}}` - Replaced with department

---

#### **mailer.js** - Email Transport Factory (35 lines)

**Purpose:** Creates email transport (console or SMTP).

**Function: createTransport(campaign)**

**Console Transport (Default):**
```javascript
if (!campaign.enable_sending) {
  return {
    sendMail: async (options) => {
      console.log('Simulated email send:');
      console.log(options);
      return { messageId: 'console-transport' };
    }
  };
}
```

**SMTP Transport (When Enabled):**
```javascript
return nodemailer.createTransport({
  host: campaign.smtp_host,
  port: campaign.smtp_port,
  secure: campaign.smtp_port === 465,
  auth: {
    user: campaign.smtp_user,
    pass: campaign.smtp_pass
  }
});
```

**Safety:**
- Defaults to console (safe)
- Requires explicit enable_sending flag
- Per-campaign SMTP configuration

---

#### **safety.js** - Domain Blacklist (13 lines)

**Purpose:** Prevents sending to public email domains.

```javascript
const DO_NOT_SEND_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com'
];

function isDomainAllowed(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  return !DO_NOT_SEND_DOMAINS.includes(domain);
}
```

**Usage:**
- Called on allowlist add/update
- Called before campaign send
- Returns: boolean (true = allowed)

---

#### **encryption.js** - Data Encryption (53 lines)

**Purpose:** AES-256-GCM encryption for sensitive data (SMTP passwords).

**encrypt(text)**
```javascript
// Generates random IV (16 bytes)
// Encrypts with AES-256-GCM
// Returns: "iv:authTag:encryptedData"
```

**decrypt(encryptedText)**
```javascript
// Parses "iv:authTag:encryptedData"
// Decrypts with AES-256-GCM
// Returns: original text
```

**Security:**
- Encryption key from environment
- Random IV per encryption
- Authentication tag for tamper detection
- Cannot decrypt without key

---

#### **reports.js** - PDF Generation (258 lines)

**Purpose:** Generates professional PDF reports using pdfkit.

**Functions:**

1. **generateCampaignReport(campaignData, analytics)**
   - Campaign summary
   - Metrics (delivered, opened, clicked, submitted)
   - Rates and percentages
   - Simulated vs real data

2. **generateEmployeeReport(employeeData)**
   - Total employees analyzed
   - Risk categorization (high/medium/low)
   - Top 10 riskiest employees
   - Click rates per employee

3. **generateDepartmentReport(departmentData)**
   - Organization summary
   - Department rankings by risk
   - Repeat offenders per department
   - Metrics comparison

4. **generateRepeatOffendersReport(offendersData)**
   - Total repeat offenders
   - Risk categorization
   - Days since last offense
   - Credential submission tracking

**Styling:**
- Earth-tone color palette
- Headers and footers
- Page numbers
- Professional formatting

---

#### **setup-admin.js** - CLI Admin Setup (123 lines)

**Purpose:** Interactive command-line tool to create admin users.

**Usage:**
```bash
node setup-admin.js
```

**Prompts:**
1. Username (min 3 chars)
2. Email (valid format)
3. Password (min 8 chars)

**Validations:**
- Duplicate username/email check
- Password strength
- Email format

**Process:**
1. Check if admin exists
2. Prompt for details
3. Validate inputs
4. Hash password
5. Insert into database
6. Display success message

**Environment Variable Support:**
```bash
ADMIN_USERNAME=admin ADMIN_EMAIL=admin@company.com ADMIN_PASSWORD=secure123 node setup-admin.js
```

---

### API Endpoints (65+ total)

**Authentication (6)**
```
POST   /api/auth/register        - Register new user
POST   /api/auth/login           - Login
POST   /api/auth/refresh         - Refresh access token
POST   /api/auth/logout          - Logout
GET    /api/auth/me              - Get current user
GET    /api/auth/csrf            - Get CSRF token
```

**Templates (2)**
```
GET    /api/templates            - List templates
POST   /api/preview-email        - Preview email
```

**Allowlist (6)**
```
GET    /api/allowlist            - List employees
POST   /api/allowlist            - Add employees
PUT    /api/allowlist/:email     - Update employee
POST   /api/allowlist/upload     - CSV upload
POST   /api/allowlist/validate-csv - Validate CSV
POST   /api/allowlist/bulk-delete - Delete multiple
```

**Groups (6)**
```
GET    /api/groups               - List groups
POST   /api/groups               - Create group
PUT    /api/groups/:id           - Update group
DELETE /api/groups/:id           - Delete group
POST   /api/groups/:id/members   - Add members
DELETE /api/groups/:id/members/:email - Remove member
```

**Campaigns (13)**
```
GET    /api/campaigns            - List campaigns
POST   /api/campaigns            - Create campaign
PUT    /api/campaigns/:id        - Update campaign
POST   /api/campaigns/:id/approve - Approve
POST   /api/campaigns/:id/send   - Send now
POST   /api/campaigns/:id/send-test - Test email
POST   /api/campaigns/:id/clone  - Clone campaign
POST   /api/campaigns/:id/pause  - Pause
POST   /api/campaigns/:id/resume - Resume
POST   /api/campaigns/:id/simulate - Generate data
DELETE /api/campaigns/:id/simulate - Clear data
POST   /api/campaigns/bulk-approve - Bulk approve
POST   /api/campaigns/bulk-delete - Bulk delete
```

**Tracking (4 - Public)**
```
GET    /track/open/:token.gif    - Open tracking
GET    /track/click/:token       - Click tracking
GET    /landing/:token           - Landing page
POST   /landing/:token/submit    - Form submit
```

**Analytics (7)**
```
GET    /api/campaigns/:id/analytics - Campaign metrics
GET    /api/analytics/employees  - All employees
GET    /api/analytics/employees/:email - Individual
GET    /api/analytics/trends     - Trends over time
GET    /api/analytics/compare    - Compare campaigns
GET    /api/analytics/departments - Department risk
GET    /api/analytics/repeat-offenders - Repeat offenders
```

**Reports (5 - PDF)**
```
GET    /api/reports/campaign/:id - Campaign PDF
GET    /api/reports/employees    - Employee PDF
GET    /api/reports/departments  - Department PDF
GET    /api/reports/repeat-offenders - Offenders PDF
GET    /api/campaigns/:id/export - CSV export
```

**Training (5)**
```
GET    /api/training/modules     - List modules
POST   /api/training/modules     - Create module
GET    /api/training/progress/:email - Progress
POST   /api/training/progress    - Update progress
GET    /api/certificates/:email  - Certificates
```

**Resources (2)**
```
GET    /api/resources            - List resources
POST   /api/resources            - Create resource
```

**Integrations (5)**
```
GET    /api/webhooks             - List webhooks
POST   /api/webhooks             - Create webhook
POST   /api/notifications/slack  - Slack notify
GET    /api/reports/scheduled    - List reports
POST   /api/reports/scheduled    - Schedule report
```

**System (1)**
```
GET    /healthz                  - Health check
```

---

## 7. Frontend Breakdown

### Directory Structure

```
frontend/
├── src/
│   ├── main.jsx                    # React entry point
│   ├── App.jsx                     # Main application (434 lines)
│   ├── styles.css                  # Global styles (777 lines)
│   ├── components/
│   │   ├── Login.jsx               # Auth form (180 lines)
│   │   ├── AllowlistManager.jsx    # Employee management
│   │   ├── CampaignForm.jsx        # Campaign creation
│   │   ├── CampaignList.jsx        # Campaign management
│   │   ├── EmployeeAnalytics.jsx   # Employee metrics
│   │   ├── TrendsAnalytics.jsx     # Trend analysis
│   │   ├── CompareAnalytics.jsx    # Campaign comparison
│   │   ├── DepartmentRiskScoring.jsx - Department risk
│   │   ├── RepeatOffenders.jsx     # High-risk employees
│   │   └── EmailPreview.jsx        # Template preview
│   └── contexts/
│       ├── AuthContext.jsx         # Auth state (265 lines)
│       └── ToastContext.jsx        # Notifications
├── index.html                      # HTML entry point
├── vite.config.js                  # Vite configuration
├── package.json                    # Dependencies
└── .env                            # Environment variables
```

### Key Frontend Components

#### **App.jsx** - Main Application (434 lines)

**Purpose:** Central container managing all UI state and views.

**State Variables:**
```javascript
const [activeTab, setActiveTab] = useState('dashboard');
const [allowlist, setAllowlist] = useState({ employees: [] });
const [campaigns, setCampaigns] = useState([]);
const [selectedCampaign, setSelectedCampaign] = useState(null);
const [showForm, setShowForm] = useState(false);
// ... more state
```

**Main Sections:**

1. **Dashboard Tab**
   - Overview statistics (employees, campaigns)
   - Department distribution chart
   - Aggregate metrics (open%, click%, submit%)
   - Recent activity timeline

2. **Campaigns Tab**
   - Campaign list with filtering
   - Bulk actions (approve, delete)
   - Campaign creation form
   - Status management
   - Analytics per campaign

3. **Allowlist Tab**
   - Employee table
   - CSV upload with validation
   - Manual entry form
   - Inline editing
   - Bulk delete

4. **Groups Tab**
   - Group management
   - Member addition/removal
   - Search employees

5. **Analytics Tab**
   - Employee analytics
   - Trends over time
   - Campaign comparison
   - Department risk
   - Repeat offenders

**Features:**
- Real-time data fetching
- Optimistic UI updates
- Toast notifications
- Confirmation dialogs
- CSV export
- PDF downloads

---

#### **Login.jsx** - Authentication UI (180 lines)

**Purpose:** Dual-mode login/registration form.

**Features:**
- Toggle between login and signup
- Password visibility (2-second peek)
- Form validation
- Error display with animation
- Loading states
- Auto-login after registration

**State:**
```javascript
const [isSignup, setIsSignup] = useState(false);
const [username, setUsername] = useState('');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
```

**Password Visibility:**
```javascript
function togglePasswordVisibility(field) {
  if (field === 'password') {
    setShowPassword(true);
    setTimeout(() => setShowPassword(false), 2000); // 2-second peek
  }
}
```

**Styling:**
- Earth-tone gradient background
- Professional card design
- Eye icons (👁️/🙈)
- Shake animation on error

---

#### **AuthContext.jsx** - Authentication State (265 lines)

**Purpose:** Global authentication state management.

**Context Value:**
```javascript
{
  user,               // Current user object
  loading,            // Auth loading state
  login,              // Login function
  register,           // Register function
  logout,             // Logout function
  apiCall,            // Authenticated API wrapper
  isAuthenticated,    // Boolean
  isAdmin,            // Boolean
  isManager,          // Boolean
  isViewer            // Boolean
}
```

**Key Functions:**

**apiCall(path, options)**
- Wraps fetch with authentication
- Auto-injects JWT token
- Auto-injects CSRF token on mutations
- Auto-refreshes token on 401
- Retries failed request after refresh

**login(username, password)**
- Calls POST /api/auth/login
- Stores tokens in localStorage
- Sets user state

**register(username, email, password)**
- Calls POST /api/auth/register
- Auto-login after success
- First user becomes admin

**logout()**
- Calls POST /api/auth/logout
- Clears localStorage
- Resets state

---

#### **Analytics Components**

**EmployeeAnalytics.jsx**
- Individual employee risk scoring
- Click rate calculation
- Campaign participation history
- Color-coded risk levels (🟢🟡🔴)

**TrendsAnalytics.jsx**
- Campaign metrics over time
- Line charts
- Rate comparisons
- Trend indicators (↗️↘️)

**CompareAnalytics.jsx**
- Multi-select campaigns
- Side-by-side metrics
- Percentage differences
- Best/worst identification

**DepartmentRiskScoring.jsx**
- Department aggregation
- Risk formula: `(clickRate × 0.7 + submitRate × 0.3)`
- Sortable columns
- PDF report generation

**RepeatOffenders.jsx**
- Configurable thresholds
- Event type filtering
- Risk categorization
- Days since last offense
- Credential submission flagging

---

### State Management Pattern

**Global State (Context):**
```javascript
AuthContext
  ├── user (current user object)
  ├── accessToken (JWT)
  ├── refreshToken (JWT)
  ├── csrfToken (CSRF protection)
  └── methods (login, register, logout, apiCall)

ToastContext
  ├── toasts (array of notifications)
  ├── showToast(message, type)
  └── removeToast(id)
```

**Component State (useState):**
- Form inputs
- UI toggles
- Filtered data
- Pagination

**Server State (useEffect):**
- Fetched on mount
- Re-fetched on dependency change
- Campaigns, allowlist, analytics

---

### Styling System

**Color Palette (Earth Tones):**
```css
:root {
  --taupe: #D2CECB;        /* Main background */
  --coffee-pot: #836B69;   /* Secondary */
  --mimosa: #C99E39;       /* Accent/buttons */
  --jet-black: #3D000F;    /* Text/header */
}
```

**Key CSS Classes:**
```css
.card                  /* Container cards */
.stat-card             /* Dashboard statistics */
.login-container       /* Login page wrapper */
.form-group            /* Form field groups */
.login-button          /* Primary action buttons */
.tab / .tab.active     /* Tab navigation */
.badge                 /* Status badges */
.chart-bar             /* Progress bars */
.error-message         /* Error alerts */
.password-input-container /* Password field wrapper */
.password-toggle-button /* Eye icon button */
```

**Responsive Design:**
```css
@media (max-width: 768px) {
  /* Mobile-friendly adjustments */
  .stat-grid { grid-template-columns: 1fr; }
  .login-box { padding: 2rem 1.5rem; }
}
```

---

## 8. Database Schema

### Complete Schema Diagram

```
┌─────────────────────┐
│     employees       │
├─────────────────────┤
│ email (PK)          │────┐
│ name                │    │
│ department          │    │
│ created_at          │    │
└─────────────────────┘    │
                           │
┌─────────────────────┐    │
│    campaigns        │    │
├─────────────────────┤    │
│ id (PK)             │────┼─────┐
│ name                │    │     │
│ subject             │    │     │
│ template_key        │    │     │
│ scheduled_time      │    │     │
│ end_time            │    │     │
│ approval            │    │     │
│ enable_sending      │    │     │
│ smtp_host           │    │     │
│ smtp_port           │    │     │
│ smtp_user           │    │     │
│ smtp_pass (encrypted)    │     │
│ from_email          │    │     │
│ manager_email       │    │     │
│ status              │    │     │
│ created_by (FK)─────┼────┼────┐│
│ paused              │    │    ││
│ recipient_count     │    │    ││
└─────────────────────┘    │    ││
                           │    ││
┌─────────────────────┐    │    ││
│  campaign_targets   │    │    ││
├─────────────────────┤    │    ││
│ id (PK)             │    │    ││
│ campaign_id (FK)────┼────┘    ││
│ email (FK)──────────┼─────────┘│
│ name                │          │
│ department          │          │
│ token (UK)          │          │
│ delivered           │          │
└─────────────────────┘          │
          │                      │
          └──────────┐           │
                     │           │
┌─────────────────────┐          │
│  campaign_events    │          │
├─────────────────────┤          │
│ id (PK)             │          │
│ campaign_id (FK)────┼──────────┘
│ email               │
│ event_type          │ (opened/clicked/submitted)
│ timestamp           │
│ ip_hash             │
│ simulated_entry     │
│ is_simulated        │
└─────────────────────┘

┌─────────────────────┐
│       users         │
├─────────────────────┤
│ id (PK)             │───┐
│ username (UK)       │   │
│ email (UK)          │   │
│ password_hash       │   │
│ role                │   │ (admin/manager/viewer)
│ is_active           │   │
│ last_login          │   │
└─────────────────────┘   │
          │               │
          └───────┐       │
                  │       │
┌─────────────────────┐   │
│  refresh_tokens     │   │
├─────────────────────┤   │
│ id (PK)             │   │
│ user_id (FK)────────┼───┘
│ token (UK)          │
│ expires_at          │
└─────────────────────┘

┌─────────────────────┐   ┌─────────────────────┐
│  employee_groups    │   │  audit_logs         │
├─────────────────────┤   ├─────────────────────┤
│ id (PK)             │   │ id (PK)             │
│ name (UK)           │   │ user_id (FK)────────┼───┐
│ description         │   │ username            │   │
│ created_at          │   │ action              │   │
└─────────────────────┘   │ resource_type       │   │
          │               │ resource_id         │   │
          │               │ details (JSON)      │   │
┌─────────────────────┐   │ ip_address          │   │
│ employee_group_     │   │ user_agent          │   │
│     members         │   └─────────────────────┘   │
├─────────────────────┤                             │
│ id (PK)             │                             │
│ group_id (FK)───────┼──┘                          │
│ email (FK)──────────┼─────────────────────────────┘
│ added_at            │
└─────────────────────┘

┌─────────────────────┐
│  training_modules   │
├─────────────────────┤
│ id (PK)             │───┐
│ title               │   │
│ description         │   │
│ content             │   │
│ duration_minutes    │   │
│ category            │   │
│ is_active           │   │
└─────────────────────┘   │
                          │
┌─────────────────────────┼──┐
│ employee_training_      │  │
│     progress            │  │
├─────────────────────────┤  │
│ id (PK)                 │  │
│ email (FK)──────────────┼──┼──┐
│ module_id (FK)──────────┼──┘  │
│ status                  │     │
│ started_at              │     │
│ completed_at            │     │
│ score                   │     │
└─────────────────────────┘     │
                                │
┌─────────────────────┐         │
│  certificates       │         │
├─────────────────────┤         │
│ id (PK)             │         │
│ email (FK)──────────┼─────────┘
│ module_id (FK)      │
│ certificate_code(UK)│
│ issued_at           │
└─────────────────────┘

┌─────────────────────┐   ┌─────────────────────┐
│ learning_resources  │   │  webhooks           │
├─────────────────────┤   ├─────────────────────┤
│ id (PK)             │   │ id (PK)             │
│ title               │   │ name                │
│ description         │   │ url                 │
│ resource_type       │   │ events              │
│ url                 │   │ is_active           │
│ content             │   │ secret              │
│ category            │   └─────────────────────┘
│ is_active           │
└─────────────────────┘   ┌─────────────────────┐
                          │ scheduled_reports   │
┌─────────────────────┐   ├─────────────────────┤
│  system_settings    │   │ id (PK)             │
├─────────────────────┤   │ name                │
│ key (PK)            │   │ report_type         │
│ value               │   │ schedule_cron       │
└─────────────────────┘   │ recipients          │
                          │ is_active           │
                          │ last_run            │
                          │ next_run            │
                          └─────────────────────┘
```

### Table Details

**Key Constraints:**
- PK = Primary Key
- FK = Foreign Key
- UK = Unique Key

**Relationships:**
- employees ← campaign_targets (one-to-many)
- campaigns ← campaign_targets (one-to-many)
- campaigns ← campaign_events (one-to-many)
- users ← campaigns (created_by/updated_by)
- users ← refresh_tokens (one-to-many)
- users ← audit_logs (one-to-many)
- employee_groups ← employee_group_members (one-to-many)
- employees ← employee_group_members (one-to-many)
- training_modules ← employee_training_progress (one-to-many)
- employees ← employee_training_progress (one-to-many)
- employees ← certificates (one-to-many)

**Cascade Deletes:**
- Deleting group → deletes group members
- Deleting employee → deletes group memberships, training progress, certificates
- Deleting training module → deletes progress records

---

## 9. Step-by-Step Usage Guide

### STEP 1: Start the Application

#### A. Start Backend Server

```bash
# Navigate to backend directory
cd backend

# Install dependencies (first time only)
npm install

# Start the server
npm run start
# or
node server.js
```

**Expected output:**
```
[dotenv@17.2.3] injecting env (9) from .env
Phishing awareness training API running on port 5000
Ensure campaigns are approved before enabling delivery.
```

**What's happening:**
- Express server starts on port 5000
- SQLite database created (if first run)
- 16 tables initialized
- Automated scheduler starts (60-second loop)

#### B. Start Frontend Dashboard

```bash
# Open new terminal
# Navigate to frontend directory
cd frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

**Expected output:**
```
VITE v4.5.0  ready in 523 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h to show help
```

**What's happening:**
- Vite dev server starts on port 5173
- React app compiled
- Hot module replacement enabled
- API proxy configured to port 5000

#### C. Open Dashboard

```
Open browser:
http://localhost:5173
```

**You will see:**
Login/Registration page

---

### STEP 2: Create Admin Account

#### First-Time Setup

**Using the Web Interface:**

1. **Open** http://localhost:5173
2. **Click** "Don't have an account? Sign up"
3. **Fill** registration form:
   - Username: `admin` (or your choice)
   - Email: `admin@company.com`
   - Password: `SecurePass123` (min 8 chars)
   - Confirm Password: `SecurePass123`
4. **Click** "Sign Up"

**Result:**
```
✅ Account created successfully!
✅ Auto-logged in
✅ First user = admin role automatically
✅ Redirected to dashboard
```

**Using CLI (Alternative):**

```bash
cd backend
node setup-admin.js

# Follow prompts:
Enter admin username: admin
Enter admin email: admin@company.com
Enter admin password: SecurePass123

✓ Admin user created successfully!
```

**Important:**
- First user gets admin role automatically
- Subsequent users default to viewer role
- Only admins can approve campaigns

---

### STEP 3: Understanding the Dashboard

#### Dashboard Layout

```
┌─────────────────────────────────────────────────────┐
│  Phish Train Lite                        [admin ▼] │
│─────────────────────────────────────────────────────│
│  [Dashboard] [Campaigns] [Allowlist] [Groups] [...] │
│─────────────────────────────────────────────────────│
│                                                      │
│  Overview                                            │
│  ┌─────────┬─────────┬─────────┬─────────┐         │
│  │ Employees│Campaigns│  Draft  │Complete │         │
│  │    0    │    0    │    0    │    0    │         │
│  └─────────┴─────────┴─────────┴─────────┘         │
│                                                      │
│  Employee Distribution by Department                 │
│  (Empty - no employees yet)                          │
│                                                      │
│  Aggregate Campaign Metrics                          │
│  (No campaign data available yet)                    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**What you see:**
- Empty dashboard (no data yet)
- 5 tabs at top
- Overview statistics (all zeros)
- No employees or campaigns yet

**Next:** Add employees to allowlist

---

### STEP 4: Add Employees to Allowlist

#### Why Allowlist Matters

**Safety guarantee:**
> Only employees explicitly on the allowlist can receive phishing simulations.

**Benefits:**
- Prevents accidental external sends
- Legal protection
- Compliance requirement
- Controlled environment

#### Method 1: Manual Entry (Small Lists)

**Navigate:**
1. Click **"Allowlist"** tab

**You see:**
```
┌──────────────────────────────────────────────┐
│  Employee Allowlist                          │
│                                              │
│  Email            Name         Department    │
│  ──────────────────────────────────────────  │
│  (empty table)                               │
│                                              │
│  Add Employee Manually:                      │
│  Email:      [_____________________]         │
│  Name:       [_____________________]         │
│  Department: [_____________________]         │
│                                              │
│         [Add Employee]                       │
└──────────────────────────────────────────────┘
```

**Fill form:**
```
Email:      john.doe@company.com
Name:       John Doe
Department: Engineering
```

**Click** "Add Employee"

**Result:**
```
✅ Employee added successfully

Table updates:
Email                    Name       Department
john.doe@company.com    John Doe   Engineering
```

**Repeat** for more employees:
```
alice.smith@company.com   Alice Smith    HR
bob.jones@company.com     Bob Jones      Finance
charlie.brown@company.com Charlie Brown  Marketing
```

**Domain Validation:**
❌ If you try `john@gmail.com`:
```
Error: Domain gmail.com is not allowed
Blocked domains: gmail.com, yahoo.com, outlook.com, hotmail.com
```

#### Method 2: CSV Upload (Bulk Import)

**Prepare CSV file:**

Create file: `employees.csv`

```csv
email,name,department
john.doe@company.com,John Doe,Engineering
alice.smith@company.com,Alice Smith,HR
bob.jones@company.com,Bob Jones,Finance
charlie.brown@company.com,Charlie Brown,Marketing
diana.wilson@company.com,Diana Wilson,Sales
emma.davis@company.com,Emma Davis,IT
frank.miller@company.com,Frank Miller,Operations
grace.taylor@company.com,Grace Taylor,Legal
henry.anderson@company.com,Henry Anderson,Security
iris.thompson@company.com,Iris Thompson,Support
```

**Upload:**
1. Scroll to "CSV Upload" section
2. **Click** "Choose File"
3. **Select** `employees.csv`
4. **Click** "Upload CSV"

**Validation Preview:**
```
┌──────────────────────────────────────────────┐
│  CSV Validation Results                      │
│                                              │
│  ✅ Valid Employees (10):                    │
│  - john.doe@company.com                      │
│  - alice.smith@company.com                   │
│  - bob.jones@company.com                     │
│  ... (7 more)                                │
│                                              │
│  ❌ Invalid Emails (0):                      │
│  (none)                                      │
│                                              │
│  ⚠️ Rejected Domains (0):                    │
│  (none)                                      │
│                                              │
│     [Cancel]  [Confirm Import]               │
└──────────────────────────────────────────────┘
```

**Click** "Confirm Import"

**Result:**
```
✅ Imported 10 employees successfully

Table now shows all 10 employees
```

**If CSV has issues:**
```
┌──────────────────────────────────────────────┐
│  CSV Validation Results                      │
│                                              │
│  ✅ Valid Employees (8):                     │
│  - john.doe@company.com                      │
│  ... (7 more)                                │
│                                              │
│  ❌ Invalid Emails (1):                      │
│  - invalidemail (not an email format)        │
│                                              │
│  ⚠️ Rejected Domains (1):                    │
│  - external@gmail.com (blocked domain)       │
│                                              │
│     [Cancel]  [Import Valid Only]            │
└──────────────────────────────────────────────┘
```

**Choose:**
- "Import Valid Only" - imports 8 good employees, skips 2 bad ones
- "Cancel" - fix CSV and try again

---

### STEP 5: Create Your First Campaign

#### Navigate to Campaigns Tab

**Click** "Campaigns" tab

**You see:**
```
┌──────────────────────────────────────────────┐
│  Campaigns                [Create Campaign]  │
│                                              │
│  No campaigns yet                            │
│  Create your first campaign to begin.        │
│                                              │
└──────────────────────────────────────────────┘
```

**Click** "Create Campaign"

#### Fill Campaign Form

**Campaign Name:**
```
Example: "Q1 2025 - Password Security Awareness"
```
**Why:** Descriptive names help track multiple campaigns

**Choose Template:**
```
Dropdown shows 15 options:
┌──────────────────────────────────────┐
│ 1. Login Verification Notice         │
│ 2. Security Policy Update            │
│ 3. Package Delivery                  │
│ 4. Password Expiration Warning ⭐    │
│ 5. Payroll Update ⭐                 │
│ 6. IT Support Ticket ⭐              │
│ 7. Document Sharing ⭐               │
│ 8. Account Suspension ⭐             │
│ 9. Benefits Enrollment ⭐            │
│ 10. Invoice Payment ⭐               │
│ 11. Software Update ⭐               │
│ 12. Meeting Invitation ⭐            │
│ 13. Employee Award ⭐                │
│ 14. VPN Access Renewal ⭐            │
│ 15. Compliance Training ⭐           │
└──────────────────────────────────────┘
```

**Select:** "Password Expiration Warning"

**Preview shows:**
```
Subject: Your Password Expires in 24 Hours

Body:
Dear {{name}},

Your account password for {{department}} systems
will expire in 24 hours. To prevent service
interruption, please reset your password immediately.

Click the link below to update your credentials
before the deadline.

Failure to update will result in account lockout.

IT Security Team
```

**Subject Line:**
```
(Auto-filled from template)
Your Password Expires in 24 Hours

(You can customize if needed)
```

**Schedule Send Time:**
```
┌───────────────────────────────┐
│ Date: [2025-11-21]            │
│ Time: [10:00 AM]              │
└───────────────────────────────┘

Example: Schedule for tomorrow at 10 AM
```

**Campaign End Time:**
```
┌───────────────────────────────┐
│ Date: [2025-11-24]            │
│ Time: [05:00 PM]              │
└───────────────────────────────┘

Example: 3 days later at 5 PM
(Debriefs sent after this time)
```

**From Email:**
```
Example: security@company.com
        or it-support@company.com
        or training@company.com

Makes simulation realistic
```

**Manager Notification Email:**
```
Example: security-manager@company.com

Receives alert if click rate > 50%
```

**Select Recipients:**
```
┌──────────────────────────────────────────┐
│ Select from Allowlist:                   │
│                                          │
│ ☑ john.doe@company.com (Engineering)    │
│ ☑ alice.smith@company.com (HR)          │
│ ☑ bob.jones@company.com (Finance)       │
│ ☑ charlie.brown@company.com (Marketing) │
│ ☐ diana.wilson@company.com (Sales)      │
│ ☐ emma.davis@company.com (IT)           │
│ ... (more employees)                     │
│                                          │
│ [Select All] [Select None]              │
└──────────────────────────────────────────┘

Check boxes for employees to target
Or click "Select All" for everyone
```

**Example:** Select first 4 employees

**SMTP Settings (Advanced):**
```
┌──────────────────────────────────────┐
│ Enable Sending: [OFF] 🔴             │
│                                      │
│ SMTP Host:     (optional)            │
│ SMTP Port:     (optional)            │
│ SMTP User:     (optional)            │
│ SMTP Password: (optional)            │
└──────────────────────────────────────┘

⚠️ Leave OFF for testing (safe mode)
Emails will log to console only
```

**Review:**
```
Campaign: Q1 2025 - Password Security Awareness
Template: Password Expiration Warning
Recipients: 4 employees
Schedule: Tomorrow 10:00 AM
End: 3 days later 05:00 PM
Sending: DISABLED (console mode)
```

**Click** "Create Campaign"

**Result:**
```
✅ Campaign created successfully!

Status: draft
Approval: ❌ Not approved yet
Sending: 🔴 Disabled
```

---

### STEP 6: Approve and Activate Campaign

#### Why Approval Required?

**Safety mechanism:**
- Prevents accidental sends
- Admin review required
- Two-step process (create → approve)
- Best practice for compliance

#### Approve Campaign

**Navigate** to Campaigns tab

**You see:**
```
┌─────────────────────────────────────────────────────┐
│ Name                        Status   Approval  Actions│
│─────────────────────────────────────────────────────│
│ Q1 2025 - Password Security draft    ❌       [Actions▼]│
└─────────────────────────────────────────────────────┘
```

**Click** Actions dropdown → "Approve"

**Confirmation dialog:**
```
⚠️ Approve this campaign?

Campaign: Q1 2025 - Password Security Awareness
Recipients: 4 employees
Scheduled: 2025-11-21 10:00 AM

Once approved, campaign will send at scheduled time
(if enable_sending is ON)

[Cancel] [Confirm Approval]
```

**Click** "Confirm Approval"

**Result:**
```
✅ Campaign approved!

Status: scheduled ✅
Approval: ✅ Approved
Next action: Will send at 2025-11-21 10:00 AM
```

**What happens now:**
- Scheduler checks every 60 seconds
- At 10:00 AM tomorrow:
  - Status changes to "running"
  - Emails sent (or logged to console)
  - Tracking begins

---

### STEP 7: Testing with Console Mode

#### What is Console Mode?

**Safe testing mode:**
- No actual emails sent
- Output logged to backend terminal
- Perfect for demos and testing
- Default behavior (`enable_sending = 0`)

#### Trigger Campaign Now (Testing)

**Option 1: Wait for Schedule**
- Scheduler runs every 60 seconds
- At scheduled time, campaign activates
- Check backend terminal for output

**Option 2: Send Test Email**
1. Click Actions → "Send Test"
2. Enter test email: `test@company.com`
3. Click "Send"

**Backend terminal shows:**
```
Simulated email send (console transport):
{
  to: 'test@company.com',
  subject: 'Your Password Expires in 24 Hours',
  from: 'security@company.com',
  html: '<html>
    <body>
      <p>Dear Test User,</p>
      <p>Your account password for Test Department systems...</p>
      <img src="http://localhost:5000/track/open/abc123.gif" width="1" height="1">
      <p><a href="http://localhost:5000/track/click/abc123">Reset Password</a></p>
    </body>
  </html>',
  text: 'Dear Test User...'
}

✅ Email logged (not actually sent)
```

**What you see:**
- Complete email HTML
- Tracking pixel URL
- Click tracking URL
- All personalization applied

**No actual email sent:**
- Safe for testing
- No risk of accidental sends
- Review before enabling SMTP

---

### STEP 8: Understanding Tracking

#### How Tracking Works

**3 Tracking Methods:**

**1. Email Opens (Pixel Tracking)**
```
<img src="http://localhost:5000/track/open/TOKEN.gif"
     width="1" height="1">
```

**When email client loads images:**
- GET request to `/track/open/TOKEN.gif`
- Backend logs "opened" event
- Returns 1x1 transparent GIF
- Timestamp and IP hash recorded

**2. Link Clicks (Redirect)**
```
<a href="http://localhost:5000/track/click/TOKEN">
  Click here to reset password
</a>
```

**When employee clicks:**
- GET request to `/track/click/TOKEN`
- Backend logs "clicked" event
- Redirects to landing page
- Timestamp and IP hash recorded

**3. Form Submissions (Landing Page)**
```html
Landing page shows:
┌────────────────────────────────┐
│ 🔒 Secure Verification Portal  │
│                                │
│ Username: [_______________]    │
│ Password: [_______________]    │
│                                │
│      [Verify Now]              │
└────────────────────────────────┘
```

**When employee submits:**
- POST request to `/landing/TOKEN/submit`
- Backend logs "submitted" event
- **No actual data captured**
- `simulated_entry = 1` flag set
- Redirects to debrief page

**Debrief Page:**
```
┌────────────────────────────────┐
│ ⚠️ This Was A Training Exercise│
│                                │
│ This was a phishing simulation.│
│ No credentials were captured.  │
│                                │
│ What to watch for:             │
│ • Urgent language              │
│ • Password requests            │
│ • Suspicious links             │
│ • Unknown senders              │
│                                │
│ 📚 Learn More                  │
│ [Security Training Resources]  │
└────────────────────────────────┘
```

**Privacy Protection:**
- IP addresses hashed (SHA-256)
- Cannot reverse to identify individual
- Only aggregate metrics stored
- GDPR/privacy compliant

---

### STEP 9: View Analytics

#### Campaign Analytics

**Navigate:** Campaigns tab → Select campaign → "Analytics"

**You see:**
```
┌──────────────────────────────────────────────┐
│ Campaign Analytics                           │
│ Q1 2025 - Password Security Awareness        │
│                                              │
│ Delivered:  4   ████████████████████ 100%   │
│ Opened:     3   ███████████████░░░░░  75%   │
│ Clicked:    1   █████░░░░░░░░░░░░░░░  25%   │
│ Submitted:  0   ░░░░░░░░░░░░░░░░░░░░   0%   │
│                                              │
│ Open Rate:   75%                             │
│ Click Rate:  25%                             │
│ Submit Rate: 0%                              │
│                                              │
│ Event Log:                                   │
│ john.doe@company.com     opened    10:02 AM  │
│ alice.smith@company.com  opened    10:15 AM  │
│ john.doe@company.com     clicked   10:03 AM  │
│ bob.jones@company.com    opened    11:30 AM  │
│                                              │
│ [Download PDF Report] [Export CSV]           │
└──────────────────────────────────────────────┘
```

**Metrics Explained:**

**Delivered:** 4/4 (100%)
- All emails sent successfully
- (Or logged in console mode)

**Opened:** 3/4 (75%)
- 3 employees opened the email
- Pixel loaded in email client
- Good engagement rate

**Clicked:** 1/4 (25%)
- 1 employee clicked the link
- Moderate risk level
- Needs training

**Submitted:** 0/4 (0%)
- No employees submitted credentials
- Excellent result!
- Training is working

#### Employee Analytics

**Navigate:** Analytics tab → Employee Analytics

```
┌──────────────────────────────────────────────┐
│ Employee Security Analytics                  │
│                                              │
│ Employee              Risk Score  Click Rate │
│──────────────────────────────────────────────│
│ john.doe@company.com   65 🔴      100% (1/1) │
│ alice.smith@company.com 30 🟢       0% (0/2) │
│ bob.jones@company.com   45 🟡      50% (1/2) │
│ charlie.brown@co.com    15 🟢       0% (0/1) │
└──────────────────────────────────────────────┘

Risk Levels:
🔴 High (>60%)   - Needs immediate training
🟡 Medium (40-60%) - Monitor closely
🟢 Low (<40%)    - Good security awareness
```

**Insights:**
- John Doe: High risk (clicked every simulation)
- Alice Smith: Low risk (never clicked)
- Bob Jones: Medium risk (inconsistent)
- Charlie Brown: Low risk (new, good start)

**Action Items:**
- Schedule training for John Doe
- Monitor Bob Jones
- Recognize Alice and Charlie

#### Department Risk Scoring

**Navigate:** Analytics tab → Department Risk

```
┌──────────────────────────────────────────────┐
│ Department Risk Scoring                      │
│                                              │
│ Dept         Risk  Employees  Click%  Repeat │
│──────────────────────────────────────────────│
│ Finance       67🔴    12        52%     3     │
│ Engineering   45🟡    42        35%     5     │
│ HR            23🟢    18        18%     1     │
│ Marketing     38🟢    15        28%     2     │
└──────────────────────────────────────────────┘

Formula: Risk = (Click Rate × 0.7) + (Submit Rate × 0.3)
```

**Insights:**
- Finance: High risk department, needs department-wide training
- Engineering: Medium risk, some individuals need help
- HR: Low risk, good security culture
- Marketing: Low risk, maintain current training

**Actions:**
- Schedule Finance department training session
- Create targeted campaigns for Engineering
- Recognize HR for good performance
- Continue standard training for Marketing

#### Repeat Offenders

**Navigate:** Analytics tab → Repeat Offenders

```
┌──────────────────────────────────────────────┐
│ Repeat Offenders Analysis                   │
│                                              │
│ Threshold: Clicked in 2+ campaigns           │
│                                              │
│ Employee          Campaigns  Last    Submit  │
│──────────────────────────────────────────────│
│ john.doe@co.com      5       2 days    Yes   │
│ bob.jones@co.com     3      14 days    No    │
│ sarah.lee@co.com     2      30 days    Yes   │
└──────────────────────────────────────────────┘

Risk Categories:
• Critical (>75%): 1 employee
• High (>60%): 1 employee
• Medium (>40%): 1 employee

Action Required:
- Schedule mandatory training for john.doe
- Follow up with individuals
- Consider additional campaigns
```

---

### STEP 10: Enable Real Email Sending (Production)

⚠️ **WARNING: Only do this after:**
- Testing thoroughly in console mode
- Getting HR/legal approval
- Verifying allowlist is correct
- Configuring SMTP properly

#### Configure SMTP

**Edit campaign:**
1. Go to Campaigns tab
2. Click Actions → "Edit"
3. Scroll to SMTP Settings

**SMTP Configuration:**
```
┌──────────────────────────────────────┐
│ Enable Sending: [ON] 🟢              │
│                                      │
│ SMTP Host:     smtp.gmail.com        │
│ SMTP Port:     587                   │
│ SMTP User:     training@company.com  │
│ SMTP Password: *****************     │
└──────────────────────────────────────┘
```

**Common SMTP Settings:**

**Gmail (with App Password):**
```
Host: smtp.gmail.com
Port: 587 (TLS) or 465 (SSL)
User: your-email@gmail.com
Password: App-specific password (not regular password)
```

**Microsoft 365:**
```
Host: smtp.office365.com
Port: 587
User: your-email@company.com
Password: Your password
```

**Custom Mail Server:**
```
Host: mail.company.com
Port: 587 or 465
User: training@company.com
Password: Your SMTP password
```

**Click** "Save Changes"

**Result:**
```
✅ Campaign updated
⚠️ Email sending ENABLED
📧 Real emails will be sent at scheduled time
```

#### Final Safety Checklist

Before sending:

- [ ] HR approval obtained
- [ ] Allowlist verified (no external addresses)
- [ ] SMTP tested with test email
- [ ] Campaign approved by admin
- [ ] Debrief URL configured
- [ ] Manager notification email set
- [ ] Schedule time appropriate
- [ ] Team notified (optional: awareness that simulations occur)

**When ready:**
- Campaign will send at scheduled time
- Real emails delivered to recipients
- Tracking active
- Analytics populate in real-time

---

### STEP 11: Automatic Debriefing

#### What Happens at End Time

**When campaign end_time reached:**

1. **Scheduler detects end time passed**
2. **Sends debrief emails to all recipients**
3. **Updates campaign status to "completed"**
4. **Records debrief sent in logs**

#### Debrief Email Content

```
From: security@company.com
To: john.doe@company.com
Subject: Training Exercise Debrief

Dear John Doe,

This is to confirm that the recent email regarding
"Password Expiration" was a SIMULATED phishing
exercise conducted by our security team.

PURPOSE:
This was a training exercise designed to help you
recognize phishing attempts and improve your security
awareness.

WHAT WE LEARNED:
The email used common phishing tactics:
• Urgent language (24-hour deadline)
• Request for password action
• Official-looking sender
• Realistic formatting

WHAT TO WATCH FOR IN REAL ATTACKS:
1. Unexpected urgency or threats
2. Requests for passwords or credentials
3. Suspicious sender addresses
4. Unexpected attachments
5. Grammatical errors or odd formatting

YOUR PERFORMANCE:
[Opened: Yes / Clicked: No / Submitted: No]

NEXT STEPS:
Please review our security training resources:
https://intranet/security-awareness

If you have questions about this exercise or need
additional training, contact:
security-team@company.com

Thank you for participating in our security awareness
program.

Security Team
```

**No one is left confused:**
- All recipients get debrief
- Confirms it was a simulation
- Provides education
- Links to resources
- Contact for questions

---

### STEP 12: Manager Notifications

#### High Click Rate Alert

**Automatic trigger:**
```
IF click_rate >= 50%
AND manager_email configured
AND not already notified
THEN send manager alert
```

**Manager receives:**
```
From: security@company.com
To: security-manager@company.com
Subject: High Click Rate Alert - Q1 Password Security

Dear Security Manager,

A phishing simulation campaign has exceeded the
50% click rate threshold and requires your attention.

CAMPAIGN DETAILS:
Name: Q1 2025 - Password Security Awareness
Status: Running
Recipients: 42 employees
Department: Engineering

CURRENT METRICS:
Delivered: 42 (100%)
Opened: 28 (67%)
Clicked: 23 (55%) ⚠️ HIGH
Submitted: 5 (12%)

RECOMMENDATION:
The high click rate indicates a need for additional
security awareness training for the Engineering
department.

Suggested Actions:
1. Schedule department-wide phishing awareness training
2. Review campaign results with team leads
3. Identify repeat offenders for individual training
4. Consider follow-up simulations

View detailed analytics:
http://localhost:5173/analytics

Please contact the security team if you have questions.

Security Team
```

**Purpose:**
- Early warning system
- Enables quick response
- Department-level intervention
- Continuous improvement

---

## 10. Advanced Features

### Groups Management

**Purpose:** Organize employees for targeted campaigns.

**Use Cases:**
- Department-specific training
- Role-based simulations
- Geographic targeting
- Custom segmentation

**Create Group:**
```
1. Go to Groups tab
2. Click "Create Group"
3. Fill form:
   Name: "Engineering Team"
   Description: "All engineering employees"
4. Click "Create"
5. Add members:
   - Search: "engineering"
   - Select employees
   - Click "Add to Group"
```

**Use in Campaign:**
```
When creating campaign:
- Recipient selection shows groups
- Click group name to select all members
- Save time vs individual selection
```

### Training Modules

**Purpose:** Provide educational content beyond simulations.

**Features:**
- Create custom training modules
- Track employee progress
- Quiz scoring
- Certificate generation

**Create Module:**
```
1. Go to Training tab (future UI)
2. Click "Create Module"
3. Fill form:
   Title: "Phishing Recognition 101"
   Description: "Learn to spot phishing emails"
   Content: [Training material]
   Duration: 30 minutes
   Category: "Email Security"
4. Click "Create"
```

**Track Progress:**
```
Employees complete modules
System tracks:
- Started date
- Completion date
- Quiz score
- Certificate issued
```

**Generate Certificate:**
```
On module completion:
- Automatic certificate generation
- Unique certificate code
- PDF download available
- Stored in employee record
```

### Webhooks Integration

**Purpose:** Integrate with external systems.

**Use Cases:**
- Notify Slack on campaign completion
- Trigger SIEM alerts on high click rates
- Update ticketing systems
- Custom integrations

**Create Webhook:**
```
1. Go to Integrations (admin only)
2. Click "Create Webhook"
3. Fill form:
   Name: "Slack Notification"
   URL: "https://hooks.slack.com/services/..."
   Events: "campaign_completed, high_click_rate"
   Secret: "webhook-secret-key"
4. Click "Create"
```

**Webhook Payload:**
```json
{
  "event": "campaign_completed",
  "campaign": {
    "id": 1,
    "name": "Q1 Password Security",
    "status": "completed",
    "metrics": {
      "delivered": 42,
      "opened": 28,
      "clicked": 12,
      "submitted": 3
    }
  },
  "timestamp": "2025-11-21T17:00:00Z"
}
```

### Scheduled Reports

**Purpose:** Automate report generation and delivery.

**Features:**
- Cron-based scheduling
- Multiple report types
- Email to multiple recipients
- PDF attachment

**Create Scheduled Report:**
```
1. Go to Reports → Scheduled
2. Click "Create Schedule"
3. Fill form:
   Name: "Weekly Security Summary"
   Type: "Department Risk"
   Schedule: "0 9 * * 1" (Every Monday 9 AM)
   Recipients: "manager@company.com, hr@company.com"
4. Click "Create"
```

**Report Types:**
- Campaign summary
- Employee analytics
- Department risk
- Repeat offenders
- Trends over time

### Simulated Data Generation

**Purpose:** Test analytics without real campaigns.

**Use Cases:**
- Demo for stakeholders
- UI testing
- Training new admins
- Performance testing

**Generate Data:**
```
1. Create campaign (don't send)
2. Click Actions → "Generate Simulated Data"
3. Configure rates:
   Delivery Rate: 95%
   Open Rate: 60%
   Click Rate: 30%
   Submit Rate: 10%
4. Click "Generate"
```

**Result:**
```
✅ Generated 38 simulated events
   - 40 delivered (95%)
   - 24 opened (60%)
   - 12 clicked (30%)
   - 3 submitted (10%)

Analytics now show realistic data
All events marked: is_simulated = 1
```

**Clear Simulated Data:**
```
1. Click Actions → "Clear Simulated Data"
2. Confirm
3. Only simulated events removed
4. Real events preserved
```

---

## 11. Security & Privacy

### Authentication Security

**Password Requirements:**
- Minimum 8 characters
- bcrypt hashing (12 rounds)
- Cannot reuse old passwords (if configured)

**Token Management:**
- Access tokens: 24-hour expiry
- Refresh tokens: 7-day expiry
- Automatic refresh on 401
- Tokens stored in localStorage

**Session Security:**
- CSRF tokens on all mutations
- HTTP-only cookies
- Same-site cookie policy
- Secure flag in production

### Authorization (RBAC)

**Role Hierarchy:**
```
Admin (Full Access)
  ├── Create/edit/delete campaigns
  ├── Approve campaigns
  ├── Manage users
  ├── View all analytics
  └── Configure system settings

Manager (Limited Admin)
  ├── Create/edit campaigns
  ├── Cannot approve
  ├── Manage allowlist/groups
  ├── View analytics
  └── Generate reports

Viewer (Read-Only)
  ├── View campaigns
  ├── View analytics
  ├── View reports
  └── Cannot modify anything
```

**Enforcement:**
- Every endpoint checks role
- 403 Forbidden if insufficient
- UI hides unavailable actions
- Cannot bypass via API

### Data Privacy

**Personal Data Minimization:**
- Only collect: email, name, department
- No sensitive personal data
- Purpose-limited to training
- Retention policies configurable

**IP Address Protection:**
- SHA-256 hashing before storage
- Cannot reverse to individual
- Aggregate analytics only
- GDPR compliant

**Credential Protection:**
- Landing pages accept forms
- Immediately flag as simulated
- Never store actual passwords
- Show debrief instead

**Audit Logging:**
- Who did what, when
- IP address, user agent
- Full request details
- Immutable trail

### Network Security

**Rate Limiting:**
```
Global: 100 requests/minute per IP
Login: 5 attempts/15 minutes per IP
Password reset: 3 attempts/hour per email
```

**CORS Policy:**
```
Allowed origins: http://localhost:5173 (dev)
                 https://yourdomain.com (prod)
Credentials: true
Methods: GET, POST, PUT, DELETE
Headers: Content-Type, Authorization, X-CSRF-Token
```

**HTTPS Enforcement:**
```
Production:
- Force HTTPS
- Secure cookies
- HSTS headers
- TLS 1.2+ only
```

### Database Security

**SQL Injection Prevention:**
- Parameterized queries only
- No string concatenation
- Input validation
- Prepared statements

**Encryption at Rest:**
- SMTP passwords: AES-256-GCM
- Sensitive config: Encrypted
- Database file: OS-level encryption optional
- Backup encryption recommended

**Access Control:**
- Database file permissions
- Read/write restricted to app user
- No direct database access
- API-only interface

---

## 12. Ethical & Legal Reminder

### Legal Requirements

**ALWAYS:**
✅ Get HR written approval
✅ Get legal department clearance
✅ Internal employees only
✅ Document all approvals
✅ Respect labor laws
✅ Comply with privacy regulations

**NEVER:**
❌ Target external parties
❌ Use for disciplinary action
❌ Collect real credentials
❌ Send to personal emails
❌ Skip approval process
❌ Punish employees for clicking

### Ethical Guidelines

**Transparency:**
- Inform organization simulations occur
- Purpose is education not entrapment
- Results used for training
- Privacy protections in place

**Fair Use:**
- Educational purpose only
- No gotcha tactics
- Immediate debrief provided
- Resources for improvement

**Respect:**
- Voluntary participation (where legally allowed)
- No public shaming
- Confidential results
- Support for struggling employees

**Accountability:**
- Document all campaigns
- Review analytics responsibly
- Use data ethically
- Continuous improvement focus

### Compliance

**GDPR (Europe):**
- Legal basis: Legitimate interest (training)
- Purpose limitation
- Data minimization
- Right to access/deletion
- Privacy by design

**CCPA (California):**
- Employee data disclosure
- Right to know
- Right to deletion
- Security measures

**Industry Standards:**
- ISO 27001 alignment
- NIST cybersecurity framework
- CIS controls
- SOC 2 compliance

---

## 13. Troubleshooting

### Common Issues

**Issue:** "Cannot POST /api/auth/register"
**Cause:** Backend not running or wrong port
**Solution:**
```bash
# Check backend is running
cd backend
node server.js

# Check port in frontend/.env
VITE_API_BASE=http://localhost:5000
```

**Issue:** "Invalid or expired token"
**Cause:** Access token expired, refresh failed
**Solution:**
```
1. Logout
2. Login again
3. Check localStorage has tokens
4. Check backend JWT_SECRET unchanged
```

**Issue:** "Only 3 templates showing instead of 15"
**Cause:** Backend not restarted after template update
**Solution:**
```bash
# Restart backend
cd backend
# Kill old process (Ctrl+C or kill PID)
node server.js

# Refresh browser
F5 or Ctrl+R
```

**Issue:** "Emails not sending"
**Cause:** Console mode enabled or SMTP misconfigured
**Solution:**
```
1. Check enable_sending flag = 1
2. Verify SMTP settings
3. Check backend logs for errors
4. Test with send-test endpoint
```

**Issue:** "CSV upload rejected"
**Cause:** Wrong format or blocked domains
**Solution:**
```
1. Verify format: email,name,department
2. Check for blocked domains (gmail, yahoo, etc.)
3. Look at validation preview
4. Fix issues and re-upload
```

**Issue:** "Campaign stuck in scheduled"
**Cause:** Approval missing or schedule time in past
**Solution:**
```
1. Check approval = 1
2. Verify scheduled_time in future
3. Check backend scheduler running
4. Look at backend logs
```

**Issue:** "Analytics showing zero"
**Cause:** No tracking events or simulated data
**Solution:**
```
1. Check if emails actually sent
2. Verify tracking URLs working
3. Check campaign_events table
4. Try generating simulated data for testing
```

**Issue:** "Permission denied on action"
**Cause:** Insufficient role (viewer trying to create)
**Solution:**
```
1. Check user role (GET /api/auth/me)
2. Ensure admin for approvals
3. Manager minimum for creation
4. Contact admin to upgrade role
```

---

## 14. Conclusion

### What You've Learned

✅ **Complete phishing simulation platform**
- 95+ features from foundation to advanced
- 15 realistic email templates
- Comprehensive analytics suite
- Training and certification system

✅ **Safety-first design**
- Allowlist enforcement
- Domain blacklist
- Approval workflow
- Simulated credential capture
- Automatic debriefing

✅ **Enterprise capabilities**
- Role-based access control
- JWT authentication
- Audit logging
- PDF reports
- Webhook integrations

✅ **Privacy protection**
- IP hashing
- Data minimization
- GDPR compliance
- Transparent operations

### Key Takeaways

**For Security Teams:**
- Realistic simulations improve awareness
- Data-driven training decisions
- Measure ROI of security programs
- Continuous improvement cycles

**For Organizations:**
- Reduce phishing risk
- Build security culture
- Compliance documentation
- Employee education

**For Employees:**
- Safe learning environment
- Immediate feedback
- Practical skills
- Ongoing training

### Next Steps

**1. Start Testing:**
```bash
# Run in console mode
Create campaigns
Test with simulated data
Review analytics
Generate reports
```

**2. Prepare for Production:**
```
Get approvals
Configure SMTP
Build allowlist
Plan campaign schedule
Set up training resources
```

**3. Launch Program:**
```
Start with small group
Monitor results
Iterate and improve
Expand gradually
Track metrics
```

**4. Continuous Improvement:**
```
Review analytics monthly
Update templates regularly
Track trends over time
Adjust training programs
Recognize good performance
```

### Success Metrics

**Track these KPIs:**
- Click rate trend (should decrease)
- Submit rate (should approach 0%)
- Repeat offender reduction
- Training completion rate
- Time to report (how fast employees report)
- Overall security incidents

**Quarterly Review:**
- Compare campaign results
- Identify high-risk departments
- Adjust training accordingly
- Update templates
- Refresh content

### Final Reminder

> **This platform is a tool for education, not punishment.**
>
> Use it responsibly, transparently, and ethically.
> Focus on improvement, not blame.
> Celebrate progress, support struggling employees.
> Build a culture of security awareness.

---

## Appendix

### Quick Reference Card

**Start Application:**
```bash
# Backend
cd backend && node server.js

# Frontend
cd frontend && npm run dev

# Open browser
http://localhost:5173
```

**Create Admin:**
```bash
node backend/setup-admin.js
```

**Common Workflows:**
```
1. Add employees → Allowlist tab
2. Create campaign → Campaigns tab
3. Approve campaign → Admin only
4. View analytics → Analytics tab
5. Generate report → Download PDF
```

**API Base URL:**
```
http://localhost:5000
```

**Default Ports:**
```
Backend:  5000
Frontend: 5173
```

**Key Files:**
```
Backend:  backend/server.js
Frontend: frontend/src/App.jsx
Database: backend/data/phish-train-lite.sqlite
Config:   frontend/.env, backend/.env
```

**Support:**
```
Documentation: README.md, ARCHITECTURE.md
Tracking:      TRACK-APPLICATION.md
Issues:        GitHub repository
```

---

**Last Updated:** 2025-11-20
**Version:** 1.3.0
**Status:** Production Ready

**For questions or contributions:**
See project documentation or contact maintainers.

---

**🎯 Happy Phishing Awareness Training!**
