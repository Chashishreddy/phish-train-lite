# 🎣 Phish Train Lite - Enhanced Edition

**A Production-Ready Phishing Awareness Training Platform**

[![Security](https://img.shields.io/badge/Security-Enterprise%20Grade-green)](IMPLEMENTATION_STATUS.md)
[![Analytics](https://img.shields.io/badge/Analytics-Advanced-blue)](IMPLEMENTATION_STATUS.md)
[![Progress](https://img.shields.io/badge/Progress-48%25%20Complete-yellow)](IMPLEMENTATION_STATUS.md)

---

## 🚀 What's New

This enhanced version transforms Phish Train Lite from a basic simulation tool into a **comprehensive security awareness platform** with:

### ✅ Completed Features (20/42 - 48%)

#### 🔐 Enterprise Security (Phase 1 - Complete)
- **JWT Authentication** with automatic token refresh
- **Role-Based Access Control** (Admin, Manager, Viewer)
- **CSRF Protection** for all state-changing operations
- **AES-256-GCM Encryption** for SMTP passwords
- **Comprehensive Audit Logging** with IP tracking
- **SQL Injection Prevention** via prepared statements
- **Professional Login UI** with error handling

#### 📊 Advanced Analytics (Phase 2 - Complete)
- **Individual Employee Tracking** - Risk scores, campaign history, performance metrics
- **Historical Trends** - 7-365 day analysis with aggregate metrics
- **Campaign Comparison** - Side-by-side analysis of up to 5 campaigns
- **Department Risk Scoring** - Organization-wide security posture
- **Repeat Offender Tracking** - Identify employees needing extra training
- **PDF Report Generation** - Professional reports for all analytics views
- **Interactive Visualizations** - Charts, graphs, and risk indicators

#### 📧 Email & Campaign Features (Phase 3 - 4/6 Complete)
- **Email Preview** - Live preview with customizable sample data
- **Send Test Email** - Test campaigns before deployment with sample personalization
- **Campaign Cloning** - Duplicate campaigns with all settings
- **Campaign Pause/Resume** - Control campaign execution on the fly

#### 🎨 UX Improvements (Phase 4 - 4/6 Complete)
- **Toast Notifications** - Professional success/error messages replacing alerts
- **Search & Filters** - Real-time campaign search with status filtering
- **Pagination** - 10 items per page for campaigns, 50 for employees
- **Sortable Tables** - Click column headers to sort (all major fields)

---

## 📋 Quick Start

### Prerequisites
- Node.js 14+ and npm
- SQLite3

### Installation

```bash
# 1. Install backend dependencies
cd backend
npm install
npm install pdfkit  # Required for PDF reports

# 2. Install frontend dependencies
cd ../frontend
npm install

# 3. Configure environment
cd ../backend
cp .env.example .env
# Edit .env and set:
# - JWT_SECRET (random string, 32+ chars)
# - JWT_REFRESH_SECRET (different random string)
# - ENCRYPTION_KEY (32-byte hex string)
# - ADMIN credentials

# 4. Create admin user
node setup-admin.js
# Follow prompts or use env variables

# 5. Start development servers

# Terminal 1 - Backend
npm start  # Port 4000

# Terminal 2 - Frontend
cd ../frontend
npm run dev  # Port 5173
```

### First Login

1. Open http://localhost:5173
2. Login with admin credentials
3. Navigate to **Analytics** tab to explore new features:
   - Campaign Analytics
   - **Employee Analytics** ⭐
   - **Trends** ⭐
   - **Compare Campaigns** ⭐
   - **Department Risk** ⭐
   - **Repeat Offenders** ⭐

---

## 🎯 Feature Highlights

### 1. Multi-Dimensional Analytics Dashboard

Access comprehensive analytics through 6 specialized views:

**Employee Analytics** 🧑‍💼
- Individual risk scoring (0-100 scale)
- Campaign participation history
- Click/submit rates
- Sortable by any metric
- Drill down into individual profiles

**Trends Analysis** 📈
- Time-based performance tracking
- Configurable periods (7-365 days)
- Aggregate organization metrics
- Visual progress indicators

**Campaign Comparison** ⚖️
- Compare up to 5 campaigns side-by-side
- Department breakdown per campaign
- Average rate calculations
- Export-ready data tables

**Department Risk Scoring** 🏢
- Organization-wide summary
- Department rankings
- Repeat offender counts per department
- Targeted training recommendations

**Repeat Offenders** 🎯
- Configurable thresholds
- Risk score with recency weighting
- Detailed offense history
- Export for training coordination

### 2. PDF Report Generation

Generate professional PDF reports for:
- Individual campaigns
- All employees (risk rankings)
- Department security posture
- Repeat offenders list

**Features:**
- Professional formatting
- Earth-tone color scheme
- Page numbers and branding
- Auto-generated summaries
- Export via simple API calls

### 3. Comprehensive Security

**Authentication Flow:**
```
Login → Access Token (24h) + Refresh Token (7d)
  ↓
API Request → Verify Access Token
  ↓
401? → Auto-refresh → Retry Request
  ↓
Success → Audit Log Entry
```

**Authorization Matrix:**

| Feature | Admin | Manager | Viewer |
|---------|-------|---------|--------|
| View Analytics | ✅ | ✅ | ✅ |
| Create Campaigns | ✅ | ✅ | ❌ |
| Approve Campaigns | ✅ | ❌ | ❌ |
| Send Campaigns | ✅ | ❌ | ❌ |
| Manage Allowlist | ✅ | ✅ | ❌ |
| View Audit Logs | ✅ | ❌ | ❌ |
| Generate Reports | ✅ | ✅ | ❌ |

---

## 📁 Project Structure

```
Phish Train Lite/
├── backend/
│   ├── auth.js                 # JWT & password utilities ⭐
│   ├── middleware.js           # Auth & audit middleware ⭐
│   ├── encryption.js           # AES-256-GCM encryption ⭐
│   ├── reports.js              # PDF generation ⭐
│   ├── setup-admin.js          # Admin user setup ⭐
│   ├── db.js                   # Database + auth tables ⭐
│   ├── server.js               # API endpoints (extensively enhanced) ⭐
│   ├── .env.example            # Environment template ⭐
│   └── package.json
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Login.jsx                    # Login form ⭐
│       │   ├── EmployeeAnalytics.jsx        # Employee tracking ⭐
│       │   ├── TrendsAnalytics.jsx          # Historical trends ⭐
│       │   ├── CompareAnalytics.jsx         # Campaign comparison ⭐
│       │   ├── DepartmentRiskScoring.jsx    # Dept analytics ⭐
│       │   ├── RepeatOffenders.jsx          # Repeat tracking ⭐
│       │   └── EmailPreview.jsx             # Email preview ⭐
│       ├── contexts/
│       │   └── AuthContext.jsx              # Auth state management ⭐
│       ├── App.jsx                          # Main app (enhanced) ⭐
│       └── styles.css                       # Complete styling ⭐
├── IMPLEMENTATION_STATUS.md    # Detailed progress tracking ⭐
├── PDF_REPORTS.md             # PDF feature documentation ⭐
├── SETUP.md                   # Setup instructions ⭐
└── README_ENHANCED.md         # This file ⭐

⭐ = New or significantly enhanced
```

---

## 🔧 Configuration

### Environment Variables (.env)

```bash
# Server
PORT=4000
BASE_URL=http://localhost:4000
ADMIN_ORIGIN=http://localhost:5173
NODE_ENV=development

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
ENCRYPTION_KEY=your-32-byte-encryption-key-as-hex

# Admin Setup
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@company.com
ADMIN_PASSWORD=changeme123
```

### Generate Secure Keys

```bash
# JWT Secrets (use any 32+ char random string)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Encryption Key (exactly 32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📊 API Reference

### New Analytics Endpoints

```
GET  /api/analytics/employees              # All employee stats
GET  /api/analytics/employees/:email       # Individual employee
GET  /api/analytics/trends?period=30       # Historical trends
GET  /api/analytics/compare?ids=1,2,3      # Compare campaigns
GET  /api/analytics/departments            # Department risk scores
GET  /api/analytics/repeat-offenders       # Repeat offender list
     ?minCampaigns=2&eventType=clicked
```

### PDF Report Endpoints

```
GET  /api/reports/campaign/:id             # Campaign PDF
GET  /api/reports/employees                # Employee analytics PDF
GET  /api/reports/departments              # Department risk PDF
GET  /api/reports/repeat-offenders         # Repeat offenders PDF
     ?minCampaigns=2&eventType=clicked
```

### Authentication Endpoints

```
POST /api/auth/login                       # Login (get tokens)
POST /api/auth/refresh                     # Refresh access token
POST /api/auth/logout                      # Invalidate refresh token
GET  /api/auth/me                          # Get current user
GET  /api/auth/csrf                        # Get CSRF token
```

### Email Preview

```
POST /api/preview-email                    # Preview email rendering
     Body: { templateKey, customSubject, customBody, sampleName, sampleDepartment }
```

---

## 🎨 UI/UX Enhancements

### Color Palette (Earth Tones)
- **Taupe** (#D2CECB) - Main background
- **Coffee Pot** (#836B69) - Secondary elements
- **Mimosa** (#C99E39) - Primary accent
- **Jet Black** (#3D000F) - Text & headers

### Interactive Elements
- **Risk Badges** - Color-coded (Green/Orange/Red)
- **Sortable Tables** - Click headers to sort
- **Stat Cards** - Gradient backgrounds with hover effects
- **Loading States** - Spinners and skeleton screens
- **Error Messages** - Shake animation on validation errors

### Responsive Design
- Mobile breakpoints at 768px and 480px
- Collapsible navigation
- Touch-friendly buttons
- Partial implementation (full mobile in Phase 4)

---

## 🔒 Security Features

### Implemented Protections

1. **Password Security**
   - bcrypt hashing (12 salt rounds)
   - No plaintext storage
   - Secure admin setup script

2. **Token Management**
   - Short-lived access tokens (24h)
   - Longer refresh tokens (7d)
   - Automatic rotation
   - Secure HTTP-only cookies for CSRF

3. **Database Security**
   - All queries use prepared statements
   - Whitelisted dynamic field names
   - Foreign key constraints
   - Encrypted sensitive data (SMTP passwords)

4. **Audit Trail**
   - All actions logged with:
     - User ID & username
     - Action type & resource
     - IP address & user agent
     - Timestamp
   - Immutable log table

5. **Access Control**
   - JWT verification on all protected routes
   - Role-based authorization middleware
   - CSRF validation on mutations
   - Rate limiting (100 req/min)

---

## 📈 Remaining Features (22/42)

See **IMPLEMENTATION_STATUS.md** for complete breakdown.

### Priority Recommendations:

**Phase 3** (2 remaining) - Email & Campaign
- Custom template editor (rich text)
- Email attachment support

**Phase 4** (2 remaining) - UX
- Bulk actions (multi-select, bulk approve/delete)
- Mobile responsiveness testing/refinement

**Phase 5** (4 features) - Allowlist
- Bulk operations
- CSV validation preview
- Inline editing

**Phases 6-8** (14 features) - Advanced
- Employee portal
- Integrations (Slack, webhooks)
- Infrastructure (Docker, tests, monitoring)

---

## 🧪 Testing

### Current Status
⚠️ **No automated tests yet** (Phase 8)

### Manual Testing Checklist

**Authentication:**
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Token refresh on 401
- [ ] Logout clears tokens
- [ ] Protected routes require auth

**Analytics:**
- [ ] Employee list loads
- [ ] Individual employee details display
- [ ] Trends chart updates with period selection
- [ ] Campaign comparison works with multiple selections
- [ ] Department rankings display correctly
- [ ] Repeat offenders filter by criteria

**PDF Reports:**
- [ ] Campaign report generates
- [ ] Employee report generates
- [ ] Department report generates
- [ ] Repeat offenders report generates
- [ ] PDFs download correctly

---

## 🐛 Troubleshooting

### Common Issues

**"Cannot find module 'pdfkit'"**
```bash
cd backend
npm install pdfkit
```

**"JWT verification failed"**
- Check JWT_SECRET in .env matches
- Ensure .env is loaded (require('dotenv').config())
- Verify token hasn't expired

**"CSRF validation failed"**
- Ensure CSRF token in request header
- Check cookies are enabled
- Verify same-origin policy

**Database errors**
- Delete `backend/data/phish-train-lite.sqlite` and restart
- Run setup-admin.js again
- Check file permissions

**Analytics show no data**
- Run at least one campaign first
- Ensure campaign has been sent
- Check is_simulated flag in database

---

## 📚 Documentation

- **IMPLEMENTATION_STATUS.md** - Detailed feature breakdown & progress
- **PDF_REPORTS.md** - PDF report generation guide
- **SETUP.md** - Full setup and configuration guide
- **IMPLEMENTATION_LOG.md** - Original Phase 1 implementation notes

---

## 🤝 Contributing

### Adding New Features

1. **Backend**: Add endpoint in `server.js` with auth middleware
2. **Frontend**: Create component in `src/components/`
3. **Styling**: Add CSS to `src/styles.css` using color palette
4. **Documentation**: Update IMPLEMENTATION_STATUS.md
5. **Testing**: Add tests (when framework is in place)

### Code Style
- ES6+ JavaScript
- Functional React components with hooks
- Express.js RESTful API
- Prepared statements for all SQL
- Comprehensive error handling

---

## 📞 Support

For issues or questions:
1. Check **IMPLEMENTATION_STATUS.md** for feature status
2. Review **Troubleshooting** section above
3. Check console logs for errors
4. Review audit_logs table for debugging

---

## 📄 License

[Original License]

---

## 🎯 Project Milestones

- ✅ **Milestone 1**: Core Security (Phase 1) - **COMPLETE** (7/7)
- ✅ **Milestone 2**: Advanced Analytics (Phase 2) - **COMPLETE** (6/6)
- 🔄 **Milestone 3**: Email Features (Phase 3) - **IN PROGRESS** (4/6)
- 🔄 **Milestone 4**: UX Polish (Phase 4) - **IN PROGRESS** (4/6)
- ⏳ **Milestone 5**: Allowlist Enhancement (Phase 5) - Pending (0/4)
- ⏳ **Milestone 6**: Employee Portal (Phase 6) - Pending (0/4)
- ⏳ **Milestone 7**: Integrations (Phase 7) - Pending (0/4)
- ⏳ **Milestone 8**: Infrastructure (Phase 8) - Pending (0/5)

---

**Built with security and usability in mind. Transform your organization's security awareness training today!** 🎣🔒

*Last Updated: 2025-01-19*
*Version: 2.0 (Enhanced Edition)*
