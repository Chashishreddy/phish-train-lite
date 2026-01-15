# PDF Report Generation

Phish Train Lite now supports generating PDF reports for various analytics views.

## Installation

To enable PDF report generation, you need to install the `pdfkit` package:

```bash
cd backend
npm install pdfkit
```

## Available PDF Reports

### 1. Campaign Report
**Endpoint:** `GET /api/reports/campaign/:id`

Generates a detailed PDF report for a specific campaign including:
- Campaign details (subject, template, schedule, status)
- Analytics summary (delivered, opened, clicked, submitted)
- Simulated data (if available)

**Access:** Admin, Manager roles only

**Example:**
```javascript
// Frontend usage
const response = await apiCall(`/api/reports/campaign/${campaignId}`);
// Returns PDF file for download
```

### 2. Employee Analytics Report
**Endpoint:** `GET /api/reports/employees`

Generates a PDF report of all employees' security analytics including:
- Summary statistics (total employees, risk distribution)
- Top 10 highest risk employees
- Individual employee risk scores and click rates

**Access:** Admin, Manager roles only

### 3. Department Risk Report
**Endpoint:** `GET /api/reports/departments`

Generates a PDF report analyzing department-level risk scores:
- Organization summary
- Department risk rankings
- Employee counts and risk metrics per department
- Repeat offender counts

**Access:** Admin, Manager roles only

### 4. Repeat Offenders Report
**Endpoint:** `GET /api/reports/repeat-offenders`

Generates a PDF report of employees who repeatedly fall for phishing attempts:
- Summary statistics
- List of repeat offenders with risk scores
- Last offense dates and frequency

**Query Parameters:**
- `minCampaigns` (default: 2) - Minimum number of campaigns to qualify
- `eventType` (default: 'clicked') - Event type to filter by (clicked, submitted, opened)

**Access:** Admin, Manager roles only

## Report Features

All PDF reports include:
- Professional formatting with earth-tone color scheme
- Header with report title and generation date
- Footer with page numbers and branding
- Organized sections with clear headings
- Risk score color coding (High/Medium/Low)

## Security

- All PDF report endpoints require authentication (JWT token)
- Role-based access control enforced (Admin/Manager only)
- Audit logging tracks report generation
- CSRF protection on state-changing operations

## Frontend Integration Example

To add a "Download PDF" button in the frontend:

```javascript
async function downloadCampaignPDF(campaignId) {
  try {
    const response = await apiCall(`/api/reports/campaign/${campaignId}`);

    // Create a blob from the response
    const blob = new Blob([response], { type: 'application/pdf' });

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-${campaignId}-report.pdf`;
    a.click();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download PDF:', error);
    alert('Failed to generate PDF report');
  }
}
```

## Troubleshooting

### "Cannot find module 'pdfkit'"
Make sure you've installed pdfkit in the backend directory:
```bash
cd backend
npm install pdfkit
```

### PDF generation fails
Check the server logs for specific error messages. Common issues:
- Missing employee or campaign data
- Database connection errors
- Insufficient permissions

### Blank or incomplete PDFs
Ensure all required data is present in the database. The reports use aggregate queries that may return empty results if campaigns haven't been run yet.
