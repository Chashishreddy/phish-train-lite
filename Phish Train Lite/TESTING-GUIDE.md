# Phish Train Lite - Complete Testing Guide

**Version:** 1.3.0
**Last Updated:** 2025-11-21

This guide will help you systematically test every feature across all 9 phases of the Phish Train Lite application.

---

## Table of Contents

1. [Initial Setup & Verification](#1-initial-setup--verification)
2. [Testing Authentication Features](#2-testing-authentication-features)
3. [Testing Allowlist Management](#3-testing-allowlist-management)
4. [Testing Group Management](#4-testing-group-management)
5. [Testing Email Templates](#5-testing-email-templates)
6. [Testing Campaign Management](#6-testing-campaign-management)
7. [Testing Email Tracking](#7-testing-email-tracking)
8. [Testing Analytics](#8-testing-analytics)
9. [Testing Reports](#9-testing-reports)
10. [Testing Training System](#10-testing-training-system)
11. [Testing Integrations](#11-testing-integrations)
12. [Testing Security Features](#12-testing-security-features)
13. [Testing UI/UX Improvements](#13-testing-uiux-improvements)
14. [Testing Docker Deployment](#14-testing-docker-deployment)

---

## 1. Initial Setup & Verification

### Step 1.1: Start Backend Server

```bash
cd backend
npm install
node server.js
```

**Expected Output:**
```
✅ Database initialized
✅ Server running on port 5000
✅ Health check available at http://localhost:5000/healthz
```

**Test:**
- Open browser to `http://localhost:5000/healthz`
- Should return: `{"status":"ok","timestamp":"..."}`

### Step 1.2: Start Frontend Server

```bash
cd frontend
npm install
npm run dev
```

**Expected Output:**
```
✅ VITE v4.5.0  ready in 500 ms
➜  Local:   http://localhost:5173/
```

**Test:**
- Open browser to `http://localhost:5173`
- Should see login page

### Step 1.3: Verify Environment Configuration

**Check frontend/.env exists:**
```
VITE_API_BASE=http://localhost:5000
```

**Check backend/.env exists:**
```
PORT=5000
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
NODE_ENV=development
ADMIN_ORIGIN=http://localhost:5173
DEBRIEF_URL=https://your-company.com/security-training
```

---

## 2. Testing Authentication Features

### ✅ Feature 1: User Registration (v1.3.0)

**Test 2.1: First User Registration (Auto-Admin)**

1. Navigate to `http://localhost:5173`
2. Click **"Need an account? Sign up"**
3. Fill registration form:
   - Username: `admin`
   - Email: `admin@company.com`
   - Password: `Admin123!` (min 8 chars)
   - Confirm Password: `Admin123!`
4. Click **"Sign Up"**

**Expected Result:**
- ✅ Auto-login after registration
- ✅ Redirected to dashboard
- ✅ User role should be "admin" (first user)
- ✅ Toast notification: "Registration successful"

**Database Verification:**
```sql
SELECT id, username, email, role, created_at FROM users;
```
Should show: `admin | admin@company.com | admin | 2025-11-21...`

---

**Test 2.2: Second User Registration (Default Viewer)**

1. Logout (if logged in)
2. Click **"Need an account? Sign up"**
3. Register as:
   - Username: `manager1`
   - Email: `manager@company.com`
   - Password: `Manager123!`
4. Click **"Sign Up"**

**Expected Result:**
- ✅ User role should be "viewer" (not admin)
- ✅ First user auto-admin logic only applies once

---

**Test 2.3: Duplicate Username Validation**

1. Try to register with username `admin` again
2. Use different email: `admin2@company.com`

**Expected Result:**
- ❌ Error: "Username already exists"
- ⚠️ Form should not submit

---

**Test 2.4: Duplicate Email Validation**

1. Try to register with email `admin@company.com` again
2. Use different username: `admin2`

**Expected Result:**
- ❌ Error: "Email already exists"

---

**Test 2.5: Password Strength Validation**

1. Try to register with password `123` (less than 8 chars)

**Expected Result:**
- ❌ Error: "Password must be at least 8 characters long"

---

**Test 2.6: Email Format Validation**

1. Try to register with email `notanemail`

**Expected Result:**
- ❌ Error: "Invalid email format"

---

### ✅ Feature 2: User Login

**Test 2.7: Successful Login**

1. Navigate to login page
2. Toggle to **"Log In"** mode
3. Enter:
   - Username: `admin`
   - Password: `Admin123!`
4. Click **"Log In"**

**Expected Result:**
- ✅ Redirected to dashboard
- ✅ Access token stored in localStorage
- ✅ Refresh token stored in localStorage
- ✅ CSRF token stored as cookie

---

**Test 2.8: Invalid Credentials**

1. Login with:
   - Username: `admin`
   - Password: `wrongpassword`

**Expected Result:**
- ❌ Error: "Invalid credentials"

---

### ✅ Feature 3: Password Visibility Toggle (v1.3.0)

**Test 2.9: Password Peek Feature**

1. Go to login page (or signup page)
2. Enter password: `TestPassword123`
3. Click the **eye icon (👁️)** next to password field

**Expected Result:**
- ✅ Password becomes visible in plain text
- ✅ Eye icon changes to 🙈
- ✅ After exactly 2 seconds, password becomes hidden again
- ✅ Icon changes back to 👁️

**Repeat for confirm password field on signup page**

---

**Test 2.10: Password Visibility During Loading**

1. Start signup process
2. Click submit
3. Try to click eye icon while loading

**Expected Result:**
- ✅ Button should be disabled during loading
- ✅ No action should occur

---

### ✅ Feature 4: Token Refresh Mechanism

**Test 2.11: Automatic Token Refresh**

1. Login successfully
2. Wait 24 hours OR manually expire access token in database
3. Make any API request

**Expected Result:**
- ✅ Access token automatically refreshed
- ✅ Request succeeds without re-login

**Manual Test:**
```bash
# Expire token manually in database
sqlite3 backend/phish-train.db
UPDATE refresh_tokens SET expires_at = '2000-01-01' WHERE user_id = 1;
```

Then refresh page - should prompt for login.

---

### ✅ Feature 5: Logout

**Test 2.12: User Logout**

1. Click logout button in dashboard
2. Check localStorage

**Expected Result:**
- ✅ Redirected to login page
- ✅ Access token removed from localStorage
- ✅ Refresh token removed from localStorage
- ✅ User state cleared

---

## 3. Testing Allowlist Management

### ✅ Feature 6: Manual Employee Entry

**Test 3.1: Add Employee Manually**

1. Login as admin
2. Navigate to **"Allowlist"** tab
3. Fill form:
   - Email: `alice@company.com`
   - Name: `Alice Carter`
   - Department: `Marketing`
4. Click **"Save allowlist"**

**Expected Result:**
- ✅ Employee appears in table
- ✅ Toast: "Allowlist saved"

**Repeat for more employees:**
- `bob@company.com | Bob Singh | Security`
- `charlie@company.com | Charlie Lee | Engineering`
- `diana@company.com | Diana Patel | Finance`
- `eve@company.com | Eve Johnson | HR`

---

**Test 3.2: Domain Validation (Reject Public Domains)**

1. Try to add: `test@gmail.com`

**Expected Result:**
- ⚠️ Email silently rejected OR warning shown
- ⚠️ Only company domains allowed

**Blocked domains:**
- gmail.com
- yahoo.com
- outlook.com
- hotmail.com

---

### ✅ Feature 7: CSV Upload

**Test 3.3: Bulk CSV Upload**

1. Create file `employees.csv`:
```csv
alice@company.com,Alice Carter,Marketing
bob@company.com,Bob Singh,Security
charlie@company.com,Charlie Lee,Engineering
diana@company.com,Diana Patel,Finance
eve@company.com,Eve Johnson,HR
frank@company.com,Frank Wilson,Operations
grace@company.com,Grace Taylor,Legal
henry@company.com,Henry Brown,IT Support
iris@company.com,Iris Davis,Customer Success
jack@company.com,Jack Miller,Sales
```

2. Paste into CSV upload textarea
3. Click **"Upload CSV"**

**Expected Result:**
- ✅ All 10 employees added
- ✅ Toast: "Uploaded X employees"
- ✅ Table shows all employees

---

**Test 3.4: CSV Validation Preview**

1. Upload CSV with invalid entries:
```csv
alice@gmail.com,Alice,Marketing
bob@,Bob,Security
,Charlie Lee,Engineering
```

**Expected Result:**
- ⚠️ Validation errors shown
- ⚠️ Invalid rows highlighted or rejected

---

### ✅ Feature 8: Inline Editing

**Test 3.5: Edit Employee Details**

1. Find `alice@company.com` in table
2. Click **"Edit"** button
3. Change name to `Alice M. Carter`
4. Change department to `Digital Marketing`
5. Save

**Expected Result:**
- ✅ Changes reflected immediately
- ✅ Database updated

---

### ✅ Feature 9: Search and Filter

**Test 3.6: Search Employees**

1. Use search box
2. Type `alice`

**Expected Result:**
- ✅ Only matching employees shown
- ✅ Search works for email, name, department

---

### ✅ Feature 10: Bulk Deletion

**Test 3.7: Delete Multiple Employees**

1. Select checkboxes for 2-3 employees
2. Click **"Bulk Delete"**
3. Confirm deletion

**Expected Result:**
- ✅ Selected employees removed
- ✅ Confirmation dialog shown first

---

## 4. Testing Group Management

### ✅ Feature 11: Group Creation

**Test 4.1: Create Employee Group**

1. Navigate to **"Groups"** tab
2. Click **"Create Group"**
3. Fill form:
   - Group Name: `Marketing Team`
   - Description: `All marketing department employees`
4. Click **"Save"**

**Expected Result:**
- ✅ Group appears in list
- ✅ Member count: 0

---

**Test 4.2: Create Multiple Groups**

Create these groups:
- `Engineering Team`
- `Finance Team`
- `High Risk Users`
- `Executive Team`

---

### ✅ Feature 12: Add Members to Group

**Test 4.3: Add Group Members**

1. Select **"Marketing Team"** group
2. Click **"Add Members"**
3. Search and select:
   - `alice@company.com`
   - `frank@company.com`
4. Click **"Add"**

**Expected Result:**
- ✅ Members appear in group
- ✅ Member count updates

---

### ✅ Feature 13: Remove Members from Group

**Test 4.4: Remove Member**

1. In **"Marketing Team"** group
2. Click **"Remove"** next to `frank@company.com`

**Expected Result:**
- ✅ Member removed
- ✅ Count decremented

---

### ✅ Feature 14: Group-Based Targeting

**Test 4.5: Target Group in Campaign**

1. Create campaign (covered later)
2. In recipient selection, select **"Marketing Team"** group
3. Verify all group members selected

**Expected Result:**
- ✅ All group members auto-selected
- ✅ Saves time vs individual selection

---

### ✅ Feature 15: Delete Group with Cascade

**Test 4.6: Delete Group**

1. Select `High Risk Users` group
2. Click **"Delete Group"**
3. Confirm

**Expected Result:**
- ✅ Group deleted
- ✅ Group members removed from group (but not from allowlist)

---

## 5. Testing Email Templates

### ✅ Feature 16: View All Templates

**Test 5.1: List All 15 Templates**

1. Navigate to campaign creation form
2. View template dropdown

**Expected Result:**
- ✅ 15 templates shown:
  1. Login Verification Notice
  2. Security Policy Update
  3. Package Delivery Confirmation
  4. Password Expiration Warning ⭐
  5. Payroll Direct Deposit Update ⭐
  6. IT Support Ticket Response ⭐
  7. Shared Document Notification ⭐
  8. Account Suspension Warning ⭐
  9. Benefits Enrollment Deadline ⭐
  10. Outstanding Invoice Payment ⭐
  11. Critical Software Update ⭐
  12. Urgent Meeting Invitation ⭐
  13. Employee Recognition Award ⭐
  14. VPN Access Renewal ⭐
  15. Mandatory Compliance Training ⭐

(⭐ = new in v1.3.0)

---

### ✅ Feature 17: Template Preview

**Test 5.2: Preview Template with Placeholders**

1. Select template: **"Password Expiration Warning"**
2. View preview section

**Expected Result:**
- ✅ Subject auto-fills
- ✅ Body shows with placeholders:
  - `{{name}}` → "Colleague"
  - `{{department}}` → "your team"

---

**Test 5.3: Preview All Templates**

Cycle through all 15 templates and verify:
- ✅ Each has unique subject
- ✅ Each has unique body
- ✅ Placeholders present

---

## 6. Testing Campaign Management

### ✅ Feature 18: Create Campaign

**Test 6.1: Create Basic Campaign**

1. Navigate to **"Campaigns"** tab
2. Click **"Create Campaign"**
3. Fill form:
   - **Name:** `Q4 Security Awareness Test`
   - **Template:** `Login Verification Notice`
   - **Subject:** (auto-filled, can edit)
   - **Schedule Start:** Tomorrow at 10:00 AM
   - **Campaign End:** Tomorrow at 5:00 PM
   - **From Email:** `security@company.com`
   - **Manager Notification:** `manager@company.com`
   - **Recipients:** Select 3-5 employees
4. Click **"Create Campaign"**

**Expected Result:**
- ✅ Campaign created with status "draft"
- ✅ Appears in campaign list
- ✅ Toast: "Campaign created"

---

### ✅ Feature 19: Campaign Approval Workflow

**Test 6.2: Approve Campaign**

1. Find `Q4 Security Awareness Test` in list
2. Status should be **"draft"**
3. Click **"Approve"** button

**Expected Result:**
- ✅ Status changes to "approved"
- ✅ Only admin can approve
- ✅ Audit log entry created

**Test as non-admin:**
1. Logout
2. Login as `manager@company.com` (viewer role)
3. Approve button should be hidden or disabled

---

### ✅ Feature 20: Manual Campaign Send

**Test 6.3: Send Campaign Manually**

1. Approve campaign first
2. Click **"Queue Send"** or **"Send Now"**
3. Confirm action

**Expected Result:**
- ✅ Status changes to "scheduled" or "running"
- ✅ Console shows simulated emails (console transport mode)

**Console Output:**
```
Simulated email send (console transport):
{
  to: 'alice@company.com',
  from: 'security@company.com',
  subject: 'Action Required: Verify Your Account Access',
  html: '<html>...',
  trackingToken: 'abc123...'
}
```

---

### ✅ Feature 21: Test Email Sending

**Test 6.4: Send Test Email**

1. Before sending campaign, click **"Send Test"**
2. Enter test email: `your-email@company.com`
3. Send

**Expected Result:**
- ✅ Test email logged to console
- ✅ Does NOT count toward campaign metrics
- ✅ Allows preview before real send

---

### ✅ Feature 22: Campaign Cloning

**Test 6.5: Clone Existing Campaign**

1. Find successful campaign
2. Click **"Clone"** button
3. Edit name to `Q4 Security Awareness Test - COPY`

**Expected Result:**
- ✅ New campaign created with identical settings
- ✅ Status: draft
- ✅ Saves time recreating campaigns

---

### ✅ Feature 23: Pause/Resume Campaign

**Test 6.6: Pause Running Campaign**

1. Start a campaign
2. Click **"Pause"** button

**Expected Result:**
- ✅ Status changes to "paused"
- ✅ No more emails sent
- ✅ Can resume later

**Test 6.7: Resume Paused Campaign**

1. Click **"Resume"** button

**Expected Result:**
- ✅ Status changes back to "running"
- ✅ Sending resumes

---

### ✅ Feature 24: Bulk Operations

**Test 6.8: Bulk Approve Campaigns**

1. Create 3 draft campaigns
2. Select all checkboxes
3. Click **"Bulk Approve"**

**Expected Result:**
- ✅ All selected campaigns approved
- ✅ Toast: "3 campaigns approved"

**Test 6.9: Bulk Delete Campaigns**

1. Select 2 old campaigns
2. Click **"Bulk Delete"**
3. Confirm

**Expected Result:**
- ✅ Campaigns deleted
- ✅ Cascade deletes targets and events

---

### ✅ Feature 25: Campaign Filters

**Test 6.10: Filter by Status**

1. Use status dropdown
2. Select **"Running"**

**Expected Result:**
- ✅ Only running campaigns shown

**Test all statuses:**
- Draft
- Approved
- Scheduled
- Running
- Paused
- Completed

---

### ✅ Feature 26: Campaign Editing

**Test 6.11: Edit Draft Campaign**

1. Select draft campaign
2. Click **"Edit"**
3. Change name, template, recipients
4. Save

**Expected Result:**
- ✅ Changes saved
- ✅ Can only edit drafts (not running campaigns)

---

## 7. Testing Email Tracking

### ✅ Feature 27: Email Open Tracking

**Test 7.1: Simulate Email Open**

1. Send campaign to test recipient
2. Copy tracking pixel URL from console:
   ```
   http://localhost:5000/track/open/abc123xyz.gif
   ```
3. Open in browser

**Expected Result:**
- ✅ Returns 1x1 transparent GIF
- ✅ Event recorded in database:
   ```sql
   SELECT * FROM campaign_events WHERE event_type = 'opened';
   ```
- ✅ Analytics dashboard shows +1 open

---

### ✅ Feature 28: Link Click Tracking

**Test 7.2: Simulate Link Click**

1. Copy click tracking URL from email:
   ```
   http://localhost:5000/track/click/abc123xyz
   ```
2. Open in browser

**Expected Result:**
- ✅ Redirects to landing page
- ✅ Event recorded in database:
   ```sql
   SELECT * FROM campaign_events WHERE event_type = 'clicked';
   ```
- ✅ Analytics shows +1 click

---

### ✅ Feature 29: Landing Page Generation

**Test 7.3: View Landing Page**

1. Click tracking link (from 7.2)
2. Should redirect to:
   ```
   http://localhost:5000/landing/abc123xyz
   ```

**Expected Result:**
- ✅ Shows fake login form
- ✅ Looks realistic
- ✅ Has "Secure Verification" branding

---

### ✅ Feature 30: Form Submission Tracking

**Test 7.4: Submit Fake Credentials**

1. On landing page, enter:
   - Username: `testuser`
   - Password: `fakepassword123`
2. Click **"Verify Now"**

**Expected Result:**
- ✅ Event recorded with `simulated_entry = 1`
- ✅ NO real credentials stored
- ✅ Redirects to debrief page immediately

---

### ✅ Feature 31: Immediate Debrief

**Test 7.5: View Debrief Page**

After submitting form (7.4):

**Expected Result:**
- ✅ Page shows:
  - ⚠️ "This was a phishing simulation"
  - ✅ "No credentials were captured"
  - 📚 "What to watch for"
  - 🔗 Link to security resources (DEBRIEF_URL)

---

### ✅ Feature 32: IP Address Hashing

**Test 7.6: Verify IP Privacy**

1. Check campaign_events table:
   ```sql
   SELECT ip_hash FROM campaign_events LIMIT 5;
   ```

**Expected Result:**
- ✅ IP addresses are SHA-256 hashed
- ✅ Format: `abc123def456...` (64 hex chars)
- ✅ Cannot reverse to identify individual

---

### ✅ Feature 33: Unique Tokens Per Recipient

**Test 7.7: Verify Token Uniqueness**

1. Check campaign_targets table:
   ```sql
   SELECT tracking_token FROM campaign_targets;
   ```

**Expected Result:**
- ✅ Every recipient has unique token
- ✅ Tokens are cryptographically random
- ✅ Format: SHA-256 hash (64 chars)

---

## 8. Testing Analytics

### ✅ Feature 34: Campaign Analytics View

**Test 8.1: View Campaign Metrics**

1. Navigate to **"Analytics"** tab
2. Select campaign from dropdown
3. View metrics

**Expected Result:**
- ✅ Delivered count (total recipients)
- ✅ Opened count + percentage
- ✅ Clicked count + percentage
- ✅ Submitted count + percentage
- ✅ Visual progress bars (blue bars)

---

**Test 8.2: Real-Time Analytics Update**

1. Keep analytics page open
2. In another tab, simulate click event
3. Refresh analytics

**Expected Result:**
- ✅ Metrics update immediately
- ✅ Percentages recalculated

---

### ✅ Feature 35: Employee Analytics

**Test 8.3: View Individual Employee Risk**

1. Navigate to **"Employee Analytics"** tab
2. View table

**Expected Result:**
- ✅ Shows all employees
- ✅ Columns:
  - Email
  - Name
  - Department
  - Campaigns Received
  - Emails Opened
  - Links Clicked
  - Forms Submitted
  - Click Rate (%)
  - Risk Score

---

**Test 8.4: Employee Risk Scoring**

1. Find employee with high click rate
2. Check risk score

**Risk Score Formula:**
```
Risk Score = (Clicked / Delivered) * 100
```

**Expected Ranges:**
- 🟢 Low Risk: 0-20%
- 🟡 Medium Risk: 21-50%
- 🔴 High Risk: 51-100%

---

**Test 8.5: Employee Detail Drill-Down**

1. Click on employee email
2. View detailed history

**Expected Result:**
- ✅ All campaigns received
- ✅ Actions taken (opened, clicked, submitted)
- ✅ Timestamps for each action

---

### ✅ Feature 36: Trends Analytics

**Test 8.6: View Trends Over Time**

1. Navigate to **"Trends"** tab
2. Select date range
3. View chart

**Expected Result:**
- ✅ Line chart showing:
  - Open rate over time
  - Click rate over time
  - Submit rate over time
- ✅ X-axis: Time
- ✅ Y-axis: Percentage

---

### ✅ Feature 37: Campaign Comparison

**Test 8.7: Compare Multiple Campaigns**

1. Navigate to **"Compare"** tab
2. Select 2-3 campaigns
3. View side-by-side comparison

**Expected Result:**
- ✅ Bar chart comparing:
  - Open rates
  - Click rates
  - Submit rates
- ✅ Shows which templates perform better

---

### ✅ Feature 38: Department Risk Scoring

**Test 8.8: View Department Analytics**

1. Navigate to **"Departments"** tab
2. View table

**Expected Result:**
- ✅ Shows all departments
- ✅ Columns:
  - Department Name
  - Employee Count
  - Campaigns Sent
  - Average Open Rate
  - Average Click Rate
  - Risk Score
  - Risk Level (Low/Medium/High)

---

**Test 8.9: Department Comparison**

1. Compare Marketing vs Engineering
2. Identify highest risk department

**Expected Result:**
- ✅ Clear visualization
- ✅ Actionable insights for training

---

### ✅ Feature 39: Repeat Offenders Analysis

**Test 8.10: Identify Repeat Offenders**

1. Navigate to **"Repeat Offenders"** tab
2. View list

**Expected Result:**
- ✅ Shows employees who:
  - Clicked in 3+ campaigns
  - High click rate (>50%)
- ✅ Sorted by risk score (highest first)
- ✅ Recommendation: "Needs additional training"

---

## 9. Testing Reports

### ✅ Feature 40: PDF Campaign Report

**Test 9.1: Generate Campaign Report**

1. In campaign analytics view
2. Click **"Download PDF Report"**

**Expected Result:**
- ✅ PDF file downloads
- ✅ Contains:
  - Campaign name, dates
  - Metrics (delivered, opened, clicked, submitted)
  - Charts/graphs
  - Recipient list with actions
  - Generated timestamp

**Open PDF and verify formatting**

---

### ✅ Feature 41: PDF Employee Report

**Test 9.2: Generate Employee Report**

1. Navigate to employee analytics
2. Click **"Generate Employee Report"**

**Expected Result:**
- ✅ PDF with all employee risk scores
- ✅ Includes:
  - Employee name, email, department
  - Participation stats
  - Risk level
  - Recommendations

---

### ✅ Feature 42: PDF Department Report

**Test 9.3: Generate Department Report**

1. Navigate to department analytics
2. Click **"Download Department Report"**

**Expected Result:**
- ✅ PDF showing department-level analysis
- ✅ Risk scoring by department
- ✅ Charts comparing departments

---

### ✅ Feature 43: PDF Repeat Offenders Report

**Test 9.4: Generate Repeat Offenders Report**

1. Navigate to repeat offenders view
2. Click **"Generate Report"**

**Expected Result:**
- ✅ PDF listing high-risk employees
- ✅ Training recommendations
- ✅ Historical click patterns

---

### ✅ Feature 44: CSV Export

**Test 9.5: Export Campaign Data to CSV**

1. In campaign view
2. Click **"Export CSV"**

**Expected Result:**
- ✅ CSV file downloads
- ✅ Columns:
  ```
  email,name,department,delivered,opened,clicked,submitted,tracking_token
  ```
- ✅ One row per recipient

**Open in Excel/Google Sheets to verify**

---

## 10. Testing Training System

### ✅ Feature 45: Training Module Creation

**Test 10.1: Create Training Module**

1. Navigate to **"Training"** tab (if available in UI)
2. Click **"Create Module"**
3. Fill form:
   - **Title:** `Phishing Awareness 101`
   - **Description:** `Learn to recognize phishing attempts`
   - **Content:** `[Training content here]`
   - **Duration:** `30` minutes
   - **Status:** `Active`
4. Save

**Expected Result:**
- ✅ Module created
- ✅ Appears in module list

**API Test (if no UI):**
```bash
curl -X POST http://localhost:5000/api/training/modules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Phishing Awareness 101",
    "description": "Learn to recognize phishing",
    "content": "Module content...",
    "duration_minutes": 30,
    "is_active": 1
  }'
```

---

**Test 10.2: Create Multiple Modules**

Create these modules:
- `Password Security Best Practices`
- `Social Engineering Defense`
- `Email Safety Guidelines`
- `Incident Reporting Procedures`

---

### ✅ Feature 46: Training Progress Tracking

**Test 10.3: Track Employee Progress**

1. Assign module to employee (API)
2. Update progress status

**API Test:**
```bash
# Start training
curl -X POST http://localhost:5000/api/training/progress \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "alice@company.com",
    "module_id": 1,
    "status": "in_progress",
    "progress_percent": 50
  }'

# Complete training
curl -X POST http://localhost:5000/api/training/progress \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@company.com",
    "module_id": 1,
    "status": "completed",
    "progress_percent": 100,
    "quiz_score": 85
  }'
```

**Expected Result:**
- ✅ Progress saved
- ✅ Status: not_started → in_progress → completed
- ✅ Timestamps recorded

---

### ✅ Feature 47: Quiz Score Storage

**Test 10.4: Record Quiz Scores**

1. Complete training module (10.3)
2. Check database:
   ```sql
   SELECT * FROM employee_training_progress
   WHERE email = 'alice@company.com';
   ```

**Expected Result:**
- ✅ `quiz_score` column populated
- ✅ `completed_at` timestamp set

---

### ✅ Feature 48: Certificate Generation

**Test 10.5: Generate Completion Certificate**

1. After completing module, generate certificate

**API Test:**
```bash
curl -X POST http://localhost:5000/api/certificates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "alice@company.com",
    "module_id": 1
  }'
```

**Expected Result:**
- ✅ Certificate record created
- ✅ Unique certificate code generated (e.g., `CERT-1234567890`)
- ✅ Issue date recorded

---

**Test 10.6: Retrieve Employee Certificates**

1. Fetch certificates for employee

**API Test:**
```bash
curl http://localhost:5000/api/certificates/alice@company.com \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- ✅ Returns JSON array of certificates
- ✅ Contains:
  - Module name
  - Issue date
  - Certificate code
  - Quiz score

---

### ✅ Feature 49: Learning Resources Library

**Test 10.7: Add Learning Resource**

1. Add security resource

**API Test:**
```bash
curl -X POST http://localhost:5000/api/resources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "NIST Cybersecurity Framework",
    "description": "Official NIST guidelines",
    "url": "https://www.nist.gov/cyberframework",
    "category": "guidelines",
    "is_active": 1
  }'
```

---

**Test 10.8: Retrieve Resources**

```bash
curl http://localhost:5000/api/resources \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- ✅ Returns all active resources
- ✅ Categorized (guidelines, videos, articles, tools)

---

## 11. Testing Integrations

### ✅ Feature 50: Webhook System

**Test 11.1: Create Webhook**

1. Register webhook endpoint

**API Test:**
```bash
curl -X POST http://localhost:5000/api/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "event": "campaign_completed",
    "url": "https://your-app.com/webhook",
    "is_active": 1
  }'
```

**Expected Result:**
- ✅ Webhook registered
- ✅ Stored in database

---

**Test 11.2: Trigger Webhook**

1. Complete a campaign
2. Check webhook endpoint received POST request

**Expected Payload:**
```json
{
  "event": "campaign_completed",
  "campaign_id": 1,
  "campaign_name": "Q4 Test",
  "metrics": {
    "delivered": 10,
    "opened": 6,
    "clicked": 3,
    "submitted": 1
  },
  "timestamp": "2025-11-21T12:00:00Z"
}
```

---

**Test 11.3: Test Multiple Webhook Events**

Create webhooks for:
- `campaign_created`
- `campaign_approved`
- `campaign_completed`
- `high_click_rate` (>50%)
- `employee_clicked`

---

### ✅ Feature 51: Slack Notifications

**Test 11.4: Send Slack Notification**

1. Configure Slack webhook URL in environment
2. Trigger notification

**API Test:**
```bash
curl -X POST http://localhost:5000/api/notifications/slack \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "text": "Campaign completed: Q4 Test - Click rate: 30%"
  }'
```

**Expected Result:**
- ✅ Message appears in Slack channel
- ✅ Formatted properly

---

### ✅ Feature 52: Scheduled Reports

**Test 11.5: Schedule Daily Report**

1. Create scheduled report

**API Test:**
```bash
curl -X POST http://localhost:5000/api/reports/scheduled \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "report_type": "campaign_summary",
    "frequency": "daily",
    "recipients": "manager@company.com",
    "time": "09:00"
  }'
```

**Expected Result:**
- ✅ Report scheduled in database
- ✅ Cron job will send at 9:00 AM daily

---

**Test 11.6: Schedule Weekly Report**

Create weekly reports for:
- Department risk scoring (Mondays 10:00)
- Employee analytics (Fridays 16:00)
- Repeat offenders (Wednesdays 14:00)

---

## 12. Testing Security Features

### ✅ Feature 53: Rate Limiting

**Test 12.1: Trigger Rate Limit**

1. Make 101+ requests in 1 minute

**Script:**
```bash
for i in {1..105}; do
  curl http://localhost:5000/api/templates
  echo "Request $i"
done
```

**Expected Result:**
- ✅ First 100 requests succeed
- ✅ Requests 101+ return 429 error:
  ```json
  {"error": "Too many requests. Slow down to keep campaigns safe."}
  ```

---

### ✅ Feature 54: CSRF Protection

**Test 12.2: Verify CSRF Token Requirement**

1. Make POST request WITHOUT CSRF token

**Test:**
```bash
curl -X POST http://localhost:5000/api/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "Test"}'
```

**Expected Result:**
- ❌ 403 Forbidden: "Invalid CSRF token"

---

**Test 12.3: Make Request WITH CSRF Token**

1. Get CSRF token from cookie
2. Include in header

```bash
curl -X POST http://localhost:5000/api/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{"name": "Test"}'
```

**Expected Result:**
- ✅ Request succeeds

---

### ✅ Feature 55: Role-Based Access Control

**Test 12.4: Admin-Only Actions**

1. Login as viewer user
2. Try to approve campaign

**Expected Result:**
- ❌ 403 Forbidden: "Insufficient permissions"

---

**Test 12.5: Role Permissions Matrix**

Test all roles:

| Action | Admin | Manager | Viewer |
|--------|-------|---------|--------|
| View campaigns | ✅ | ✅ | ✅ |
| Create campaign | ✅ | ✅ | ❌ |
| Approve campaign | ✅ | ❌ | ❌ |
| Delete campaign | ✅ | ❌ | ❌ |
| View analytics | ✅ | ✅ | ✅ |
| Manage allowlist | ✅ | ✅ | ❌ |

---

### ✅ Feature 56: Audit Logging

**Test 12.6: Verify Audit Logs**

1. Perform actions (create campaign, approve, etc.)
2. Check audit_logs table:

```sql
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
```

**Expected Result:**
- ✅ All actions logged
- ✅ Columns populated:
  - user_id
  - username
  - action (LOGIN, CAMPAIGN_CREATE, APPROVE, etc.)
  - resource_type
  - resource_id
  - details (JSON)
  - ip_address (hashed)
  - user_agent
  - created_at

---

### ✅ Feature 57: AES-256-GCM Encryption

**Test 12.7: Encrypt SMTP Password**

1. Create campaign with SMTP config
2. Check database:

```sql
SELECT smtp_pass FROM campaigns WHERE id = 1;
```

**Expected Result:**
- ✅ Password is encrypted (not plain text)
- ✅ Format: `iv:encrypted_data:auth_tag` (all hex)

---

**Test 12.8: Decrypt SMTP Password**

1. Fetch campaign via API
2. Verify password is decrypted for use

**Expected Result:**
- ✅ Application can decrypt
- ✅ Database never stores plain text

---

### ✅ Feature 58: Password Hashing (bcryptjs)

**Test 12.9: Verify Password Hashing**

1. Check users table:

```sql
SELECT password_hash FROM users LIMIT 1;
```

**Expected Result:**
- ✅ Hash format: `$2a$12$...` (bcrypt with 12 rounds)
- ✅ Never plain text

---

## 13. Testing UI/UX Improvements

### ✅ Feature 59: Earth-Tone Color Palette (v1.3.0)

**Test 13.1: Visual Inspection**

1. Open dashboard
2. Verify colors:
   - Primary: Burgundy (#8B0000, #660000)
   - Secondary: Gold (#C99E39)
   - Tertiary: Cream (#F6F4EE)
   - Text: Dark Brown (#3D000F)
   - Borders: Warm Gray (#D2CECB)

**Expected Result:**
- ✅ Professional, cohesive color scheme
- ✅ Good contrast for readability

---

### ✅ Feature 60: Responsive Design

**Test 13.2: Mobile Responsiveness**

1. Open DevTools (F12)
2. Toggle device toolbar
3. Test on:
   - iPhone 12 (390x844)
   - iPad (768x1024)
   - Desktop (1920x1080)

**Expected Result:**
- ✅ Layout adapts to screen size
- ✅ No horizontal scrolling
- ✅ Buttons/forms usable on mobile

---

### ✅ Feature 61: Toast Notifications

**Test 13.3: Toast Messages**

1. Perform actions:
   - Save allowlist → "Allowlist saved"
   - Create campaign → "Campaign created"
   - Approve campaign → "Campaign approved"
   - Error → "Error: [message]"

**Expected Result:**
- ✅ Toast appears at top/corner
- ✅ Auto-dismisses after 3-5 seconds
- ✅ Success (green), Error (red), Info (blue)

---

### ✅ Feature 62: Loading States

**Test 13.4: Loading Indicators**

1. Click actions that make API calls
2. Observe loading states

**Expected Result:**
- ✅ Buttons show "Loading..." or spinner
- ✅ Buttons disabled during loading
- ✅ Prevents double-submission

---

### ✅ Feature 63: Confirmation Dialogs

**Test 13.5: Delete Confirmations**

1. Click delete on campaign
2. Check for confirmation dialog

**Expected Result:**
- ✅ Modal/dialog appears
- ✅ "Are you sure?" message
- ✅ Confirm + Cancel buttons
- ✅ Destructive action prevented if canceled

---

### ✅ Feature 64: Form Alignment (v1.3.0)

**Test 13.6: Login Form Alignment**

1. Navigate to login page
2. Inspect spacing and alignment

**Expected Result:**
- ✅ Consistent spacing (1.5rem between fields)
- ✅ Labels aligned properly
- ✅ Password field doesn't overflow
- ✅ Eye icon positioned correctly

---

### ✅ Feature 65: Card-Based Layout

**Test 13.7: Dashboard Cards**

1. View dashboard
2. Observe card components

**Expected Result:**
- ✅ Clean card containers
- ✅ Rounded corners
- ✅ Subtle shadows
- ✅ Organized sections

---

## 14. Testing Docker Deployment

### ✅ Feature 66: Docker Multi-Stage Build

**Test 14.1: Build Docker Image**

```bash
cd "Phish Train Lite"
docker build -t phish-train-lite .
```

**Expected Result:**
- ✅ Build succeeds
- ✅ Multi-stage build reduces image size
- ✅ Final image based on node:18-alpine

---

### ✅ Feature 67: Docker Compose Orchestration

**Test 14.2: Start with Docker Compose**

```bash
docker-compose up -d
```

**Expected Result:**
- ✅ Two containers start:
  - phish-train-backend (port 5000)
  - phish-train-frontend (port 5173)
- ✅ Backend connects to frontend
- ✅ Database volume persists data

---

**Test 14.3: Verify Health Check**

```bash
docker ps
```

**Expected Result:**
- ✅ Containers show "healthy" status
- ✅ Health check endpoint responding

---

**Test 14.4: Volume Persistence**

1. Create test data (campaigns, employees)
2. Stop containers:
   ```bash
   docker-compose down
   ```
3. Restart:
   ```bash
   docker-compose up -d
   ```
4. Verify data still exists

**Expected Result:**
- ✅ Database file persisted in volume
- ✅ Data retained after restart

---

**Test 14.5: Automatic Restart**

1. Crash backend (kill process inside container)
2. Wait 10 seconds

**Expected Result:**
- ✅ Container automatically restarts
- ✅ No manual intervention needed

---

## 15. Testing Advanced Features

### ✅ Feature 68: Automated Scheduler (60-second interval)

**Test 15.1: Verify Scheduler Running**

1. Start backend
2. Check logs for:
   ```
   Campaign scheduler running every 60 seconds
   ```

**Expected Result:**
- ✅ Scheduler active
- ✅ Runs every minute

---

**Test 15.2: Scheduled Campaign Execution**

1. Create campaign with start time in 2 minutes
2. Approve campaign
3. Queue for send
4. Wait and observe

**Expected Result:**
- ✅ At scheduled time, emails sent automatically
- ✅ Status changes to "running"
- ✅ Console shows email logs

---

### ✅ Feature 69: Automatic Debrief Emails

**Test 15.3: Trigger Auto-Debrief**

1. Create campaign with end time in 5 minutes
2. Send campaign
3. Wait for end time

**Expected Result:**
- ✅ At end time, debrief emails sent automatically
- ✅ All recipients receive debrief
- ✅ Console shows debrief email logs

**Debrief Email Contains:**
- "This was a training exercise"
- "No credentials captured"
- Security tips
- Link to resources (DEBRIEF_URL)

---

### ✅ Feature 70: Manager High Click Rate Alert

**Test 15.4: Trigger Manager Alert**

1. Create campaign with 10 recipients
2. Simulate 6+ employees clicking (>50%)
3. Check manager email

**Expected Result:**
- ✅ Manager receives alert email
- ✅ Contains:
  - Campaign name
  - Click rate
  - Number clicked
  - Recommendation for training

---

### ✅ Feature 71: Simulated Data Generation

**Test 15.5: Generate Test Data**

1. Use simulate endpoint:

```bash
curl -X POST http://localhost:5000/api/campaigns/1/simulate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- ✅ Random opens, clicks, submits generated
- ✅ Analytics populated with test data
- ✅ Useful for demos without real emails

---

**Test 15.6: Clear Simulated Data**

```bash
curl -X DELETE http://localhost:5000/api/campaigns/1/simulate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- ✅ Simulated data removed
- ✅ Real data retained

---

### ✅ Feature 72: Email Preview Functionality

**Test 15.7: Preview Email Before Sending**

1. In campaign creation, select template
2. View preview section
3. Verify placeholders replaced

**Expected Result:**
- ✅ Subject shown
- ✅ Body shown with real data:
  - `{{name}}` → "Alice Carter"
  - `{{department}}` → "Marketing"

---

## 16. API Endpoint Testing (Full Coverage)

### Authentication Endpoints (6)

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@company.com","password":"Test123!"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}'

# Refresh token
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'

# Get current user
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get CSRF token
curl http://localhost:5000/api/auth/csrf

# Logout
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Template Endpoints (2)

```bash
# Get all templates
curl http://localhost:5000/api/templates

# Preview email
curl -X POST http://localhost:5000/api/preview-email \
  -H "Content-Type: application/json" \
  -d '{"template":"login-mimic","name":"Alice","department":"Marketing"}'
```

---

### Allowlist Endpoints (6)

```bash
# Get allowlist
curl http://localhost:5000/api/allowlist \
  -H "Authorization: Bearer YOUR_TOKEN"

# Add employee
curl -X POST http://localhost:5000/api/allowlist \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"email":"new@company.com","name":"New Employee","department":"IT"}'

# Update employee
curl -X PUT http://localhost:5000/api/allowlist/alice@company.com \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Alice M. Carter","department":"Digital Marketing"}'

# Upload CSV
curl -X POST http://localhost:5000/api/allowlist/upload \
  -H "Content-Type: text/csv" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --data-binary @employees.csv

# Validate CSV
curl -X POST http://localhost:5000/api/allowlist/validate-csv \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"csv":"email,name,department\nalice@company.com,Alice,Marketing"}'

# Bulk delete
curl -X POST http://localhost:5000/api/allowlist/bulk-delete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"emails":["old1@company.com","old2@company.com"]}'
```

---

### Campaign Endpoints (13)

```bash
# Get all campaigns
curl http://localhost:5000/api/campaigns \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create campaign
curl -X POST http://localhost:5000/api/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{...campaign data...}'

# Update campaign
curl -X PUT http://localhost:5000/api/campaigns/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{...updated data...}'

# Approve campaign
curl -X POST http://localhost:5000/api/campaigns/1/approve \
  -H "Authorization: Bearer YOUR_TOKEN"

# Send campaign
curl -X POST http://localhost:5000/api/campaigns/1/send \
  -H "Authorization: Bearer YOUR_TOKEN"

# Send test email
curl -X POST http://localhost:5000/api/campaigns/1/send-test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"testEmail":"test@company.com"}'

# Clone campaign
curl -X POST http://localhost:5000/api/campaigns/1/clone \
  -H "Authorization: Bearer YOUR_TOKEN"

# Pause campaign
curl -X POST http://localhost:5000/api/campaigns/1/pause \
  -H "Authorization: Bearer YOUR_TOKEN"

# Resume campaign
curl -X POST http://localhost:5000/api/campaigns/1/resume \
  -H "Authorization: Bearer YOUR_TOKEN"

# Generate simulated data
curl -X POST http://localhost:5000/api/campaigns/1/simulate \
  -H "Authorization: Bearer YOUR_TOKEN"

# Clear simulated data
curl -X DELETE http://localhost:5000/api/campaigns/1/simulate \
  -H "Authorization: Bearer YOUR_TOKEN"

# Bulk approve
curl -X POST http://localhost:5000/api/campaigns/bulk-approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"ids":[1,2,3]}'

# Bulk delete
curl -X POST http://localhost:5000/api/campaigns/bulk-delete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"ids":[4,5,6]}'
```

---

### Tracking Endpoints (4 - Public, no auth)

```bash
# Simulate email open
curl http://localhost:5000/track/open/YOUR_TOKEN.gif

# Simulate link click
curl http://localhost:5000/track/click/YOUR_TOKEN

# View landing page
curl http://localhost:5000/landing/YOUR_TOKEN

# Submit landing page form
curl -X POST http://localhost:5000/landing/YOUR_TOKEN/submit \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"fake"}'
```

---

### Analytics Endpoints (7)

```bash
# Campaign analytics
curl http://localhost:5000/api/campaigns/1/analytics \
  -H "Authorization: Bearer YOUR_TOKEN"

# Employee analytics (all)
curl http://localhost:5000/api/analytics/employees \
  -H "Authorization: Bearer YOUR_TOKEN"

# Employee analytics (individual)
curl http://localhost:5000/api/analytics/employees/alice@company.com \
  -H "Authorization: Bearer YOUR_TOKEN"

# Trends analytics
curl http://localhost:5000/api/analytics/trends \
  -H "Authorization: Bearer YOUR_TOKEN"

# Compare campaigns
curl http://localhost:5000/api/analytics/compare?ids=1,2,3 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Department risk scoring
curl http://localhost:5000/api/analytics/departments \
  -H "Authorization: Bearer YOUR_TOKEN"

# Repeat offenders
curl http://localhost:5000/api/analytics/repeat-offenders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 17. Database Testing

### Verify All 16 Tables Exist

```bash
sqlite3 backend/phish-train.db ".tables"
```

**Expected Output:**
```
audit_logs
campaign_events
campaign_targets
campaigns
certificates
employee_group_members
employee_groups
employee_training_progress
employees
learning_resources
refresh_tokens
scheduled_reports
system_settings
training_modules
users
webhooks
```

---

### Test Foreign Key Constraints

```sql
-- Try to add campaign target for non-existent employee
INSERT INTO campaign_targets (campaign_id, email, tracking_token, created_at)
VALUES (1, 'nonexistent@company.com', 'abc123', datetime('now'));
```

**Expected Result:**
- ❌ Foreign key constraint violation
- ✅ Data integrity maintained

---

### Test Cascade Deletes

```sql
-- Delete campaign
DELETE FROM campaigns WHERE id = 1;

-- Check targets deleted
SELECT COUNT(*) FROM campaign_targets WHERE campaign_id = 1;
-- Should return 0
```

**Expected Result:**
- ✅ Related targets deleted automatically
- ✅ Related events deleted automatically

---

## 18. Testing Summary Checklist

Print this checklist and check off each feature as tested:

### Infrastructure & Core (6)
- [ ] Backend server starts
- [ ] Frontend server starts
- [ ] Database initializes
- [ ] Environment variables loaded
- [ ] Docker build succeeds
- [ ] Health check endpoint works

### Authentication (14)
- [ ] User registration (first user admin)
- [ ] User registration (second user viewer)
- [ ] Duplicate username rejected
- [ ] Duplicate email rejected
- [ ] Password strength validation
- [ ] Email format validation
- [ ] User login
- [ ] Invalid credentials rejected
- [ ] Password visibility toggle (2 seconds)
- [ ] Token refresh
- [ ] Logout
- [ ] CSRF protection
- [ ] Role-based access control
- [ ] Audit logging

### Allowlist Management (7)
- [ ] Manual employee entry
- [ ] Domain validation
- [ ] CSV upload
- [ ] CSV validation
- [ ] Inline editing
- [ ] Search/filter
- [ ] Bulk deletion

### Group Management (6)
- [ ] Group creation
- [ ] Add members
- [ ] Remove members
- [ ] Group-based targeting
- [ ] Delete group (cascade)
- [ ] Member count tracking

### Email Templates (15)
- [ ] View all 15 templates
- [ ] Template preview
- [ ] Placeholder replacement ({{name}}, {{department}})

### Campaign Management (17)
- [ ] Create campaign
- [ ] Campaign approval
- [ ] Manual send
- [ ] Test email
- [ ] Campaign cloning
- [ ] Pause/resume
- [ ] Bulk approve
- [ ] Bulk delete
- [ ] Campaign filters
- [ ] Campaign editing
- [ ] SMTP configuration
- [ ] Schedule start/end
- [ ] Recipient selection
- [ ] Manager notifications
- [ ] Status workflow
- [ ] Campaign analytics
- [ ] Export CSV

### Email Tracking (11)
- [ ] Email open tracking (pixel)
- [ ] Link click tracking
- [ ] Landing page generation
- [ ] Form submission tracking
- [ ] Unique tokens
- [ ] IP address hashing
- [ ] Event logging
- [ ] Timestamp recording
- [ ] Simulated credential capture
- [ ] Immediate debrief
- [ ] Privacy protection

### Analytics (10)
- [ ] Campaign metrics (delivered, opened, clicked, submitted)
- [ ] Rate calculations
- [ ] Employee analytics
- [ ] Individual risk scoring
- [ ] Trends over time
- [ ] Campaign comparison
- [ ] Department risk scoring
- [ ] Repeat offenders analysis
- [ ] Real-time updates
- [ ] Visual charts/graphs

### Reports (5)
- [ ] PDF campaign report
- [ ] PDF employee report
- [ ] PDF department report
- [ ] PDF repeat offenders report
- [ ] CSV export

### Training System (9)
- [ ] Training module creation
- [ ] Progress tracking
- [ ] Quiz score storage
- [ ] Certificate generation
- [ ] Unique certificate codes
- [ ] Learning resources library
- [ ] Resource categorization
- [ ] Active/inactive control
- [ ] Duration tracking

### Integrations (5)
- [ ] Webhook system
- [ ] Webhook triggers
- [ ] Slack notifications
- [ ] Scheduled reports (daily)
- [ ] Scheduled reports (weekly)

### Automation (4)
- [ ] Automated scheduler (60s)
- [ ] Automatic campaign sending
- [ ] Automatic debrief emails
- [ ] Manager notifications (>50% click rate)

### UI/UX (8)
- [ ] Earth-tone color palette
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Toast notifications
- [ ] Loading states
- [ ] Confirmation dialogs
- [ ] Form alignment
- [ ] Card-based layout
- [ ] Professional styling

### Docker (6)
- [ ] Docker build
- [ ] docker-compose up
- [ ] Health checks
- [ ] Volume persistence
- [ ] Automatic restart
- [ ] Environment variables

### Security (8)
- [ ] Rate limiting
- [ ] CSRF protection
- [ ] Role-based access
- [ ] Audit logging
- [ ] AES-256-GCM encryption
- [ ] Password hashing (bcryptjs)
- [ ] IP hashing
- [ ] No real credential storage

---

## 19. Performance Testing

### Test 19.1: Large Allowlist (1000+ employees)

1. Generate CSV with 1000 employees
2. Upload
3. Measure time

**Expected Result:**
- ✅ Upload completes in <10 seconds
- ✅ UI remains responsive

---

### Test 19.2: Large Campaign (500+ recipients)

1. Create campaign with 500 recipients
2. Send (console mode)
3. Measure time

**Expected Result:**
- ✅ Emails logged in <5 seconds
- ✅ No server crashes

---

### Test 19.3: Concurrent Users

1. Login with 5 different users simultaneously
2. Perform actions in parallel

**Expected Result:**
- ✅ No conflicts
- ✅ All requests succeed

---

## 20. Browser Compatibility Testing

Test in these browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Expected Result:**
- ✅ All features work in all browsers
- ✅ UI renders correctly

---

## 21. Final Verification

After completing all tests above:

1. **Review Database**
   ```bash
   sqlite3 backend/phish-train.db
   .schema
   SELECT COUNT(*) FROM campaigns;
   SELECT COUNT(*) FROM employees;
   SELECT COUNT(*) FROM campaign_events;
   ```

2. **Check Logs**
   - Review backend console logs
   - Verify no errors
   - Confirm all operations logged

3. **Export Test Data**
   - Generate PDF reports
   - Export CSV files
   - Verify all data included

4. **Document Issues**
   - Create issue for each bug found
   - Prioritize by severity
   - Track in GitHub or issue tracker

---

## 22. Testing Best Practices

**Do:**
- ✅ Test in order (infrastructure → auth → features)
- ✅ Use real-world data
- ✅ Document all issues
- ✅ Re-test after bug fixes
- ✅ Keep test data organized

**Don't:**
- ❌ Skip foundational tests
- ❌ Test with production data
- ❌ Ignore warnings
- ❌ Test only happy paths
- ❌ Forget to test error cases

---

## 23. Reporting Test Results

Create test report with:

```markdown
# Test Report - Phish Train Lite v1.3.0
**Date:** 2025-11-21
**Tester:** [Your Name]

## Summary
- Total Features Tested: 95
- Passed: X
- Failed: Y
- Blocked: Z

## Failed Tests
1. [Feature Name] - [Issue Description]
2. ...

## Notes
[Any additional observations]
```

---

## 24. Next Steps After Testing

1. **File Bugs**
   - Create detailed issue for each failure
   - Include steps to reproduce
   - Attach screenshots if applicable

2. **Regression Testing**
   - After bug fixes, re-run affected tests
   - Verify no new issues introduced

3. **User Acceptance Testing**
   - Have actual users test the platform
   - Gather feedback
   - Iterate based on feedback

4. **Performance Optimization**
   - Profile slow operations
   - Optimize database queries
   - Add caching where needed

5. **Security Audit**
   - Penetration testing
   - Code review
   - Third-party security assessment

---

## Contact & Support

**Questions?**
- Refer to README.md
- Check COMPLETE-APPLICATION-GUIDE.md
- Review TRACK-APPLICATION.md

**Found a bug?**
- Create GitHub issue
- Include reproduction steps
- Attach relevant logs

---

**End of Testing Guide**

*Last Updated: 2025-11-21*
*Version: 1.3.0*
