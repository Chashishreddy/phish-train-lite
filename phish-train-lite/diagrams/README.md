# Phish Train Lite - Mermaid Diagrams

This directory contains individual Mermaid diagram files (.mmd) that can be imported into Mermaid visualization tools.

## Available Diagrams

### 01-system-architecture.mmd
**Type:** Graph TB (Top-to-Bottom Graph)

Comprehensive system architecture showing:
- Frontend layer (React/Vite on port 5173)
- Backend layer (Express API on port 4000)
- Core modules (DB, Mailer, Safety, Templates)
- Data layer (SQLite database)
- External services (SMTP, Email clients)
- Data flow between all components

**Best for:** Understanding overall system design and component relationships

---

### 02-database-schema.mmd
**Type:** ER Diagram (Entity-Relationship)

Database schema with all 5 tables:
- employees (email, name, department)
- campaigns (configuration, scheduling, approval)
- campaign_targets (recipients with unique tokens)
- campaign_events (tracking data)
- system_settings (key-value store)

Shows primary keys, foreign keys, and relationships.

**Best for:** Understanding data model and table relationships

---

### 03-campaign-lifecycle.mmd
**Type:** State Diagram

Campaign state machine showing:
- States: Draft → Scheduled → Running → Completed → Debriefed
- Transitions and triggers
- Business rules for each state
- Annotated with key behaviors

**Best for:** Understanding campaign workflow and automation

---

### 04-email-tracking-flow.mmd
**Type:** Sequence Diagram

End-to-end email tracking flow:
- Admin creates and approves campaign
- Scheduler sends emails
- Employee interactions (open, click, submit)
- Event logging at each step
- Manager notification triggers

**Best for:** Understanding user interactions and event tracking

---

### 05-request-flow.mmd
**Type:** Graph LR (Left-to-Right Graph)

HTTP request flow through the system:
- Client layer (Browser, Email client)
- Middleware layer (Rate limiting, CORS, JSON parsing)
- API routes
- Business logic layer
- Data access layer

**Best for:** Understanding request processing pipeline

---

### 06-component-architecture.mmd
**Type:** Graph TD (Top-Down Graph)

Frontend React component hierarchy:
- App component (main state container)
- Child components (AllowlistManager, CampaignForm, CampaignList, Analytics)
- API communication layer
- Backend integration

**Best for:** Understanding frontend architecture and data flow

---

### 07-security-architecture.mmd
**Type:** Graph TB (Top-to-Bottom Graph)

Security and safety layers:
- Input validation (domain blacklist)
- Approval workflow (multi-gate approval)
- Runtime safety (allowlist, rate limiting, IP hashing)
- Email transport safety (console vs SMTP)

**Best for:** Understanding security mechanisms and safety guardrails

---

### 08-scheduler-architecture.mmd
**Type:** Flowchart TD (Top-Down Flowchart)

Automated scheduler logic (60-second interval):
- Campaign sending logic
- Debrief sending logic
- Status transitions
- Query patterns

**Best for:** Understanding automated campaign management

---

### 09-complete-data-flow.mmd
**Type:** Flowchart LR (Left-to-Right Flowchart)

Complete campaign lifecycle from creation to completion:
1. Campaign Setup
2. Approval
3. Execution
4. Tracking
5. Analytics
6. Completion

**Best for:** Understanding end-to-end user journey and data flow

---

## How to Use These Diagrams

### Option 1: Mermaid Live Editor (Recommended)
1. Visit https://mermaid.live
2. Click "Open" or paste the diagram code
3. View, edit, and export as PNG/SVG/PDF

### Option 2: VS Code
1. Install "Markdown Preview Mermaid Support" extension
2. Open any .mmd file
3. Use preview pane to visualize

### Option 3: GitHub
1. Push to GitHub repository
2. View directly in GitHub (native Mermaid support)
3. Renders automatically in README files

### Option 4: Mermaid CLI
```bash
npm install -g @mermaid-js/mermaid-cli
mmdc -i 01-system-architecture.mmd -o system-architecture.png
```

### Option 5: Online Markdown Editors
- HackMD (https://hackmd.io)
- StackEdit (https://stackedit.io)
- Notion (supports Mermaid code blocks)

---

## Diagram Syntax Quick Reference

| Diagram Type | File Extension | Primary Use |
|--------------|----------------|-------------|
| Graph TB/TD | .mmd | Top-down hierarchies |
| Graph LR | .mmd | Left-right flows |
| Flowchart | .mmd | Process flows |
| Sequence | .mmd | Interaction timelines |
| State | .mmd | State machines |
| ER Diagram | .mmd | Database schemas |

---

## Editing Diagrams

All diagrams use Mermaid syntax. Basic editing guide:

### Adding Nodes
```mermaid
NodeID[Display Text]
```

### Adding Relationships
```mermaid
NodeA --> NodeB
NodeA -->|Label| NodeB
```

### Styling
```mermaid
style NodeID fill:#color,stroke:#color,stroke-width:2px
```

### Subgraphs
```mermaid
subgraph "Title"
    NodeA
    NodeB
end
```

---

## Export Formats

From Mermaid Live Editor, you can export as:
- **PNG** - Raster image (good for presentations)
- **SVG** - Vector image (scalable, best for documentation)
- **PDF** - Document format
- **Markdown** - Embed in documentation

---

## Tips for Best Results

1. **Use Mermaid Live Editor** for quick viewing and editing
2. **Export as SVG** for documentation (scalable, crisp)
3. **Export as PNG** for presentations (universal compatibility)
4. **Version control** - .mmd files are plain text, perfect for Git
5. **Keep it simple** - If diagram is too complex, split into multiple diagrams
6. **Use colors** - Color-code by layer or concern for clarity
7. **Add notes** - Use annotations to explain complex flows

---

## Integration with Documentation

These diagrams are referenced in:
- `../ARCHITECTURE.md` - Full technical documentation
- `../CLAUDE.md` - Codebase overview for AI assistants
- `../README.md` - Project documentation

---

## Diagram Maintenance

When updating the codebase:

1. **System changes** → Update `01-system-architecture.mmd`
2. **Database changes** → Update `02-database-schema.mmd`
3. **Workflow changes** → Update `03-campaign-lifecycle.mmd`
4. **New features** → Update relevant flow diagrams
5. **Security changes** → Update `07-security-architecture.mmd`

Keep diagrams in sync with code for accurate documentation!

---

## Additional Resources

- [Mermaid Documentation](https://mermaid.js.org/)
- [Mermaid Live Editor](https://mermaid.live)
- [Mermaid Cheat Sheet](https://jojozhuang.github.io/tutorial/mermaid-cheat-sheet/)
- [GitHub Mermaid Support](https://github.blog/2022-02-14-include-diagrams-markdown-files-mermaid/)

---

## License

These diagrams are part of the Phish Train Lite project and follow the same licensing as the main codebase.
