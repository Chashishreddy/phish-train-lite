# Phish Train Lite - Architecture Diagrams

## 1. System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend (Port 5173)"
        UI[React Admin Dashboard]
        Vite[Vite Dev Server]
        UI --> Vite
    end

    subgraph "Backend (Port 4000)"
        API[Express API Server<br/>server.js]
        Scheduler[Campaign Scheduler<br/>60s interval]

        subgraph "Core Modules"
            DB[Database Module<br/>db.js]
            Mailer[Email Transport<br/>mailer.js]
            Safety[Domain Validator<br/>safety.js]
            Templates[Email Templates<br/>templates.js]
        end

        API --> DB
        API --> Mailer
        API --> Safety
        API --> Templates
        Scheduler --> DB
        Scheduler --> Mailer
    end

    subgraph "Data Layer"
        SQLite[(SQLite Database<br/>phish-train-lite.sqlite)]
    end

    subgraph "External Services"
        SMTP[SMTP Server<br/>Configurable]
        Email[Employee Email Clients]
    end

    Vite -->|Proxy /api requests| API
    DB --> SQLite
    Mailer -->|Send emails via| SMTP
    SMTP -->|Deliver to| Email
    Email -->|Click tracking links| API
    Email -->|Open tracking pixel| API
    Email -->|Submit landing page| API

    style UI fill:#61dafb,stroke:#333,stroke-width:2px
    style API fill:#68a063,stroke:#333,stroke-width:2px
    style SQLite fill:#003b57,stroke:#333,stroke-width:2px,color:#fff
    style Scheduler fill:#ff6b6b,stroke:#333,stroke-width:2px
```

## 2. Database Schema (ER Diagram)

```mermaid
erDiagram
    employees ||--o{ campaign_targets : "targeted by"
    campaigns ||--o{ campaign_targets : "has"
    campaign_targets ||--o{ campaign_events : "tracks"

    employees {
        int id PK
        string email UK
        string name
        string department
        datetime created_at
    }

    campaigns {
        int id PK
        string name
        string template_key
        datetime start_time
        datetime end_time
        int approved
        int enable_sending
        string smtp_config
        string status
        datetime created_at
        datetime updated_at
    }

    campaign_targets {
        int id PK
        int campaign_id FK
        string recipient_email
        string recipient_name
        string token UK
        datetime created_at
    }

    campaign_events {
        int id PK
        int campaign_id FK
        string token FK
        string event_type
        string ip_hash
        int simulated_entry
        datetime created_at
    }

    system_settings {
        int id PK
        string key UK
        string value
        datetime updated_at
    }
```

## 3. Campaign Lifecycle Flow

```mermaid
stateDiagram-v2
    [*] --> Draft: Create Campaign

    Draft --> Scheduled: Admin Approves +<br/>enable_sending=1
    Draft --> Draft: Edit Campaign

    Scheduled --> Running: Scheduler detects<br/>start_time reached
    Scheduled --> Draft: Admin disables

    Running --> Running: Send emails<br/>Track events
    Running --> Completed: Scheduler detects<br/>end_time reached

    Completed --> Debriefed: Send debrief emails<br/>to participants

    Debriefed --> [*]

    note right of Scheduled
        Campaign waits for
        scheduler tick
    end note

    note right of Running
        - Send to allowlist only
        - Track opens/clicks
        - Collect submissions
        - Notify managers if
          click rate > 50%
    end note

    note right of Completed
        Campaign ended but
        debrief not sent yet
    end note
```

## 4. Email Tracking Flow

```mermaid
sequenceDiagram
    participant Admin
    participant Backend
    participant Scheduler
    participant SMTP
    participant Employee
    participant EmailClient

    Admin->>Backend: Create Campaign
    Admin->>Backend: Approve Campaign

    loop Every 60 seconds
        Scheduler->>Backend: Check for campaigns to send
        Backend->>Backend: Validate allowlist
        Backend->>Backend: Generate unique tokens
        Backend->>SMTP: Send phishing emails
        SMTP->>EmailClient: Deliver email
    end

    EmailClient->>Employee: Display email
    Employee->>EmailClient: Open email
    EmailClient->>Backend: GET /track/{token}/pixel.gif
    Backend->>Backend: Log "opened" event

    Employee->>EmailClient: Click link
    EmailClient->>Backend: GET /track/{token}/click
    Backend->>Backend: Log "clicked" event
    Backend->>EmailClient: Redirect to landing page

    Employee->>Backend: GET /landing/{token}
    Backend->>Employee: Show fake login form
    Employee->>Backend: POST /landing/{token}/submit
    Backend->>Backend: Log "submitted" event
    Backend->>Employee: Show debrief message

    alt Click rate > 50%
        Backend->>Admin: Send manager notification
    end
```

## 5. Request Flow Architecture

```mermaid
graph LR
    subgraph "Client Layer"
        Browser[Web Browser]
        EmailClient[Email Client]
    end

    subgraph "Middleware Layer"
        RateLimit[Rate Limiter<br/>100 req/min]
        CORS[CORS Handler]
        JSON[JSON Parser]
    end

    subgraph "API Routes"
        Allowlist["/api/allowlist"]
        Campaigns["/api/campaigns"]
        Analytics["/api/campaigns/:id/analytics"]
        Track["/track/:token/*"]
        Landing["/landing/:token"]
    end

    subgraph "Business Logic"
        Validation[Domain Validation<br/>safety.js]
        TokenGen[Token Generator<br/>SHA-256]
        TemplateEngine[Template Engine<br/>templates.js]
    end

    subgraph "Data Access"
        Query[Database Queries<br/>runQuery, runGet]
    end

    Browser --> RateLimit
    EmailClient --> RateLimit

    RateLimit --> CORS
    CORS --> JSON

    JSON --> Allowlist
    JSON --> Campaigns
    JSON --> Analytics
    JSON --> Track
    JSON --> Landing

    Allowlist --> Validation
    Campaigns --> Validation
    Campaigns --> TokenGen
    Campaigns --> TemplateEngine

    Validation --> Query
    TokenGen --> Query
    TemplateEngine --> Query
    Track --> Query
    Landing --> Query
    Analytics --> Query

    Query --> SQLite[(SQLite DB)]

    style Browser fill:#e1f5ff,stroke:#333,stroke-width:2px
    style EmailClient fill:#e1f5ff,stroke:#333,stroke-width:2px
    style RateLimit fill:#ffe1e1,stroke:#333,stroke-width:2px
    style SQLite fill:#003b57,stroke:#333,stroke-width:2px,color:#fff
```

## 6. Component Architecture (Frontend)

```mermaid
graph TD
    subgraph "App.jsx (Main Component)"
        App[App Component<br/>State: campaigns, employees, activeTab]

        subgraph "Child Components"
            AllowlistMgr[AllowlistManager<br/>Manage employees]
            CampaignForm[CampaignForm<br/>Create campaigns]
            CampaignList[CampaignList<br/>Manage campaigns]
            Analytics[CampaignAnalytics<br/>View metrics]
        end
    end

    subgraph "API Communication"
        FetchAPI[Fetch API Calls]
    end

    subgraph "Backend API"
        API[Express Server]
    end

    App --> AllowlistMgr
    App --> CampaignForm
    App --> CampaignList
    App --> Analytics

    AllowlistMgr --> FetchAPI
    CampaignForm --> FetchAPI
    CampaignList --> FetchAPI
    Analytics --> FetchAPI

    FetchAPI -->|HTTP Requests| API
    API -->|JSON Responses| FetchAPI

    style App fill:#61dafb,stroke:#333,stroke-width:3px
    style API fill:#68a063,stroke:#333,stroke-width:2px
```

## 7. Security & Safety Architecture

```mermaid
graph TB
    subgraph "Input Validation Layer"
        EmailInput[Email Input]
        DomainCheck{Domain Blacklist Check<br/>safety.js}
        EmailInput --> DomainCheck
    end

    subgraph "Approval Workflow"
        CampaignCreate[Campaign Created]
        ApprovalCheck{Approved?}
        SendingCheck{enable_sending?}

        CampaignCreate --> ApprovalCheck
        ApprovalCheck -->|No| Draft[Status: Draft]
        ApprovalCheck -->|Yes| SendingCheck
        SendingCheck -->|No| Draft
        SendingCheck -->|Yes| Scheduled[Status: Scheduled]
    end

    subgraph "Runtime Safety"
        AllowlistFilter[Allowlist Filter]
        RateLimit[Rate Limiting<br/>100 req/min]
        IPHash[IP Hashing<br/>Privacy Protection]
    end

    subgraph "Email Transport Safety"
        TransportMode{Transport Mode}
        Console[Console Logger<br/>Default/Safe]
        SMTP[SMTP Transport<br/>Requires Config]

        TransportMode -->|No config| Console
        TransportMode -->|Config provided| SMTP
    end

    DomainCheck -->|Blocked| Reject[❌ Reject]
    DomainCheck -->|Allowed| AllowlistFilter

    Scheduled --> AllowlistFilter
    AllowlistFilter --> RateLimit
    RateLimit --> TransportMode

    SMTP --> IPHash
    Console --> IPHash

    IPHash --> EventLog[(Log Events)]

    style Reject fill:#ff6b6b,stroke:#333,stroke-width:2px
    style Console fill:#90ee90,stroke:#333,stroke-width:2px
    style AllowlistFilter fill:#ffd700,stroke:#333,stroke-width:2px
```

## 8. Scheduler Architecture

```mermaid
flowchart TD
    Start([Scheduler Starts<br/>60s Interval]) --> Query1[Query: Find campaigns<br/>approved=1 AND enable_sending=1<br/>AND status='scheduled'<br/>AND start_time <= NOW]

    Query1 --> HasCampaigns1{Campaigns<br/>found?}

    HasCampaigns1 -->|Yes| ProcessCampaign[For each campaign]
    HasCampaigns1 -->|No| Query2

    ProcessCampaign --> GetTargets[Get campaign_targets]
    GetTargets --> SendEmails[Send emails to each target]
    SendEmails --> LogEvent1[Log 'delivered' events]
    LogEvent1 --> UpdateStatus1[Update status to 'running']
    UpdateStatus1 --> Query2

    Query2[Query: Find campaigns<br/>status='running'<br/>AND end_time <= NOW] --> HasCampaigns2{Campaigns<br/>found?}

    HasCampaigns2 -->|Yes| ProcessDebrief[For each campaign]
    HasCampaigns2 -->|No| Wait

    ProcessDebrief --> GetParticipants[Get participants who<br/>opened/clicked/submitted]
    GetParticipants --> SendDebrief[Send debrief emails]
    SendDebrief --> UpdateStatus2[Update status to 'completed']
    UpdateStatus2 --> Wait

    Wait([Wait 60 seconds]) --> Start

    style Start fill:#90ee90,stroke:#333,stroke-width:2px
    style SendEmails fill:#ffd700,stroke:#333,stroke-width:2px
    style SendDebrief fill:#87ceeb,stroke:#333,stroke-width:2px
    style Wait fill:#ddd,stroke:#333,stroke-width:2px
```

## 9. Data Flow: Campaign Creation to Completion

```mermaid
flowchart LR
    subgraph "1. Campaign Setup"
        A1[Admin creates campaign] --> A2[Select template]
        A2 --> A3[Set schedule]
        A3 --> A4[Configure SMTP]
        A4 --> A5[Save as Draft]
    end

    subgraph "2. Approval"
        A5 --> B1{Admin approves?}
        B1 -->|No| A5
        B1 -->|Yes| B2[Set approved=1<br/>enable_sending=1]
        B2 --> B3[Status: Scheduled]
    end

    subgraph "3. Execution"
        B3 --> C1[Scheduler detects<br/>start_time reached]
        C1 --> C2[Generate tokens<br/>for each target]
        C2 --> C3[Send emails]
        C3 --> C4[Status: Running]
    end

    subgraph "4. Tracking"
        C4 --> D1[Track opens<br/>pixel.gif]
        C4 --> D2[Track clicks<br/>redirect]
        C4 --> D3[Track submissions<br/>landing page]
        D1 --> D4[(Store events)]
        D2 --> D4
        D3 --> D4
    end

    subgraph "5. Analytics"
        D4 --> E1[Calculate metrics]
        E1 --> E2[Display dashboard]
        E2 --> E3{Click rate > 50%?}
        E3 -->|Yes| E4[Notify manager]
        E3 -->|No| E5[Continue tracking]
    end

    subgraph "6. Completion"
        E4 --> F1[end_time reached]
        E5 --> F1
        F1 --> F2[Send debriefs]
        F2 --> F3[Status: Completed]
    end

    style A1 fill:#e1f5ff,stroke:#333,stroke-width:2px
    style C3 fill:#ffd700,stroke:#333,stroke-width:2px
    style D4 fill:#90ee90,stroke:#333,stroke-width:2px
    style F3 fill:#ddd,stroke:#333,stroke-width:2px
```

## Key Architectural Decisions

### 1. **Separation of Concerns**
- Frontend handles only UI/UX and user interactions
- Backend handles all business logic, data access, and email operations
- Database module encapsulates all SQL operations

### 2. **Security-First Design**
- Multiple validation layers (domain blacklist, allowlist, approval workflow)
- Rate limiting to prevent abuse
- Privacy-conscious (IP hashing, no credential storage)
- Default-safe configuration (console transport)

### 3. **Stateless Tracking**
- Token-based tracking eliminates need for session management
- Each recipient gets a unique SHA-256 token per campaign
- Tokens embedded in URLs for opens, clicks, and landing pages

### 4. **Automated Campaign Management**
- Scheduler runs independently of API requests
- Campaigns automatically transition through lifecycle stages
- Automatic debrief sending ensures educational closure

### 5. **Modular Architecture**
- Each backend module has a single responsibility
- Frontend components are self-contained
- Easy to extend with new templates, tracking types, or features

### 6. **Database Design**
- Normalized schema prevents data duplication
- Event sourcing pattern for campaign analytics
- Foreign key relationships maintain data integrity

### 7. **Development Experience**
- Vite provides fast hot-reload for frontend development
- Proxy configuration simplifies local development
- SQLite requires no separate database server setup

## Technology Choices Rationale

| Technology | Reason |
|------------|--------|
| **Express** | Lightweight, flexible, widely-adopted Node.js framework |
| **React** | Component-based UI, declarative, large ecosystem |
| **SQLite** | Zero-configuration, embedded, perfect for single-tenant deployment |
| **Vite** | Fast development server, optimized builds, modern tooling |
| **Nodemailer** | Comprehensive email library with transport abstraction |
| **SHA-256** | Secure token generation, collision-resistant |
| **Rate Limiting** | Prevents abuse without complex authentication |

## Scalability Considerations

### Current Architecture Supports:
- **Users**: Small to medium organizations (< 1000 employees)
- **Campaigns**: Dozens of concurrent campaigns
- **Events**: Millions of tracking events (SQLite limit: 281 TB)

### To Scale Further:
1. Migrate from SQLite to PostgreSQL/MySQL
2. Add Redis for session management and caching
3. Implement job queue (Bull, BullMQ) for email sending
4. Add load balancer for multiple backend instances
5. Move scheduler to separate service/worker process
6. Implement CDN for tracking pixel/static assets
