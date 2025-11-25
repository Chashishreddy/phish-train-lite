// PDF Report Generation Utility
// This module provides functions to generate PDF reports for various analytics

const PDFDocument = require('pdfkit');

// Helper to format dates
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function formatDateShort(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

// Add header to PDF
function addHeader(doc, title, subtitle) {
  doc.fontSize(24).fillColor('#3D000F').text(title, { align: 'center' });
  doc.moveDown(0.5);
  if (subtitle) {
    doc.fontSize(12).fillColor('#836B69').text(subtitle, { align: 'center' });
  }
  doc.moveDown(1);
  doc.strokeColor('#C99E39').lineWidth(2).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(1);
}

// Add footer with page numbers
function addFooter(doc, pageNum, totalPages) {
  doc.fontSize(10).fillColor('#836B69')
    .text(
      `Generated with Phish Train Lite | Page ${pageNum} of ${totalPages} | ${formatDateShort(new Date())}`,
      50,
      doc.page.height - 50,
      { align: 'center', width: 500 }
    );
}

// Generate Campaign Analytics Report
function generateCampaignReport(campaignData, analytics) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      addHeader(doc, 'Campaign Analytics Report', `Campaign: ${campaignData.name}`);

      // Campaign Details
      doc.fontSize(16).fillColor('#3D000F').text('Campaign Details', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#000')
        .text(`Subject: ${campaignData.subject}`)
        .text(`Template: ${campaignData.template_key}`)
        .text(`Scheduled: ${formatDate(campaignData.scheduled_time)}`)
        .text(`Status: ${campaignData.status}`)
        .text(`Approval: ${campaignData.approval ? 'Approved' : 'Pending'}`)
        .text(`Sending Enabled: ${campaignData.enable_sending ? 'Yes' : 'No'}`);
      doc.moveDown(1);

      // Analytics Summary
      doc.fontSize(16).fillColor('#3D000F').text('Analytics Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#000')
        .text(`Delivered: ${analytics.delivered}`)
        .text(`Opened: ${analytics.opened} (${analytics.openRate}%)`)
        .text(`Clicked: ${analytics.clicked} (${analytics.clickRate}%)`)
        .text(`Submitted: ${analytics.submitted} (${analytics.submitRate}%)`);
      doc.moveDown(1);

      if (analytics.hasSimulated) {
        doc.fontSize(14).fillColor('#3D000F').text('Simulated Data', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor('#836B69')
          .text(`Simulated Delivered: ${analytics.simDelivered}`)
          .text(`Simulated Opened: ${analytics.simOpened} (${analytics.simOpenRate}%)`)
          .text(`Simulated Clicked: ${analytics.simClicked} (${analytics.simClickRate}%)`)
          .text(`Simulated Submitted: ${analytics.simSubmitted} (${analytics.simSubmitRate}%)`);
      }

      // Footer
      addFooter(doc, 1, 1);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Generate Employee Analytics Report
function generateEmployeeReport(employeeData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      addHeader(doc, 'Employee Security Analytics Report', `Generated: ${formatDateShort(new Date())}`);

      // Summary
      doc.fontSize(16).fillColor('#3D000F').text('Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#000')
        .text(`Total Employees Analyzed: ${employeeData.length}`)
        .text(`High Risk Employees: ${employeeData.filter(e => e.riskScore >= 60).length}`)
        .text(`Medium Risk Employees: ${employeeData.filter(e => e.riskScore >= 40 && e.riskScore < 60).length}`)
        .text(`Low Risk Employees: ${employeeData.filter(e => e.riskScore < 40).length}`);
      doc.moveDown(1);

      // Top 10 Riskiest Employees
      doc.fontSize(16).fillColor('#3D000F').text('Top 10 Highest Risk Employees', { underline: true });
      doc.moveDown(0.5);

      const topRisk = [...employeeData].sort((a, b) => b.riskScore - a.riskScore).slice(0, 10);
      topRisk.forEach((emp, idx) => {
        doc.fontSize(11).fillColor('#000')
          .text(`${idx + 1}. ${emp.name} (${emp.email})`)
          .fontSize(10).fillColor('#836B69')
          .text(`   Department: ${emp.department} | Risk Score: ${emp.riskScore} | Click Rate: ${emp.clickRate}%`)
          .moveDown(0.3);
      });

      // Footer
      addFooter(doc, 1, 1);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Generate Department Risk Report
function generateDepartmentReport(departmentData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      addHeader(doc, 'Department Risk Scoring Report', `Generated: ${formatDateShort(new Date())}`);

      // Summary
      doc.fontSize(16).fillColor('#3D000F').text('Organization Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#000')
        .text(`Total Departments: ${departmentData.summary.totalDepartments}`)
        .text(`Total Employees: ${departmentData.summary.totalEmployees}`)
        .text(`Average Risk Score: ${departmentData.summary.avgRiskScore}`)
        .text(`High Risk Departments: ${departmentData.summary.highRiskDepartments}`)
        .text(`Highest Risk: ${departmentData.summary.highestRiskDept || 'N/A'}`)
        .text(`Lowest Risk: ${departmentData.summary.lowestRiskDept || 'N/A'}`);
      doc.moveDown(1);

      // Department Rankings
      doc.fontSize(16).fillColor('#3D000F').text('Department Risk Rankings', { underline: true });
      doc.moveDown(0.5);

      departmentData.departments.forEach((dept, idx) => {
        doc.fontSize(11).fillColor('#000')
          .text(`${idx + 1}. ${dept.department}`)
          .fontSize(10).fillColor('#836B69')
          .text(`   Employees: ${dept.totalEmployees} | Risk Score: ${dept.riskScore} | Click Rate: ${dept.clickRate}% | Repeat Offenders: ${dept.repeatOffenders}`)
          .moveDown(0.3);

        // Add page break if needed
        if (doc.y > 700) {
          doc.addPage();
        }
      });

      // Footer
      addFooter(doc, 1, 1);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Generate Repeat Offenders Report
function generateRepeatOffendersReport(offendersData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      addHeader(doc, 'Repeat Offenders Report', `Generated: ${formatDateShort(new Date())}`);

      // Summary
      doc.fontSize(16).fillColor('#3D000F').text('Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#000')
        .text(`Total Repeat Offenders: ${offendersData.summary.totalOffenders}`)
        .text(`Average Campaigns Per Person: ${offendersData.summary.avgCampaignCount}`)
        .text(`Critical Risk Count: ${offendersData.summary.highRiskCount}`)
        .text(`Submitted Credentials: ${offendersData.summary.submittedCredentials}`)
        .text(`Criteria: ${offendersData.summary.eventType} in ${offendersData.summary.threshold}+ campaigns`);
      doc.moveDown(1);

      // Offenders List
      doc.fontSize(16).fillColor('#3D000F').text('Repeat Offenders List', { underline: true });
      doc.moveDown(0.5);

      offendersData.offenders.forEach((offender, idx) => {
        doc.fontSize(11).fillColor('#000')
          .text(`${idx + 1}. ${offender.name} (${offender.email})`)
          .fontSize(10).fillColor('#836B69')
          .text(`   Department: ${offender.department} | Campaigns: ${offender.campaignCount} | Risk: ${offender.riskScore}`)
          .text(`   Last Offense: ${formatDateShort(offender.lastOffense)} (${offender.daysSinceLast} days ago)`)
          .text(`   Submitted Credentials: ${offender.hasSubmitted ? 'Yes' : 'No'}`)
          .moveDown(0.5);

        // Add page break if needed
        if (doc.y > 700) {
          doc.addPage();
        }
      });

      // Footer
      addFooter(doc, 1, 1);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateCampaignReport,
  generateEmployeeReport,
  generateDepartmentReport,
  generateRepeatOffendersReport
};
