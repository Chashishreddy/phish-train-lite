const templates = [
  {
    key: 'login-mimic',
    name: 'Login Verification Notice',
    subject: 'Action Required: Verify Your Account Access',
    body: `Hello {{name}},\n\nWe noticed a login attempt to your {{department}} tools from a new device. Please confirm your identity by visiting the secure verification page.\n\nIf you did not make this request, confirm immediately to avoid access interruption.\n\nThank you,\nSecurity Team`
  },
  {
    key: 'urgent-policy',
    name: 'Updated Security Policy Acknowledgement',
    subject: 'Immediate Acknowledgement Required: Updated Security Policy',
    body: `Hi {{name}},\n\nWe have refreshed our company-wide security policy. To maintain compliance for the {{department}} team, review and acknowledge the update by the end of the day.\n\nClick the link below to review the summary and confirm your acknowledgement.\n\nRegards,\nCorporate Security`
  },
  {
    key: 'package-delivery',
    name: 'Package Delivery Confirmation',
    subject: 'Package Arrival Confirmation Needed',
    body: `Hello {{name}},\n\nA package addressed to the {{department}} department requires your confirmation before it can be delivered.\n\nProvide confirmation using the secure link below.\n\nThanks,\nMail Services`
  },
  {
    key: 'password-expiration',
    name: 'Password Expiration Warning',
    subject: 'Your Password Expires in 24 Hours',
    body: `Dear {{name}},\n\nYour account password for {{department}} systems will expire in 24 hours. To prevent service interruption, please reset your password immediately.\n\nClick the link below to update your credentials before the deadline.\n\nFailure to update will result in account lockout.\n\nIT Security Team`
  },
  {
    key: 'payroll-update',
    name: 'Payroll Direct Deposit Update',
    subject: 'Action Required: Verify Direct Deposit Information',
    body: `Hi {{name}},\n\nOur payroll system has been upgraded and we need to verify your direct deposit information for the {{department}} department.\n\nPlease confirm your banking details by clicking the secure link below to avoid delays in your next paycheck.\n\nThis must be completed by end of business today.\n\nBest regards,\nHR & Payroll Department`
  },
  {
    key: 'it-support',
    name: 'IT Support Ticket Response',
    subject: 'Re: Your IT Support Request #{{name}}',
    body: `Hello {{name}},\n\nWe have received your support request regarding {{department}} access issues. Our technician has prepared a fix that requires your immediate action.\n\nPlease click the link below to download the patch and resolve your connectivity problems.\n\nIf you did not submit a support ticket, please verify your account security immediately.\n\nIT Help Desk`
  },
  {
    key: 'document-share',
    name: 'Shared Document Notification',
    subject: 'Document Shared With You: Q4 {{department}} Report',
    body: `Hi {{name}},\n\nA document has been shared with you: "Q4 {{department}} Financial Report - Confidential"\n\nClick the link below to view the document. Access expires in 48 hours.\n\nShared by: Executive Team\n\nView Document Now\n\nDocument Sharing Service`
  },
  {
    key: 'account-suspension',
    name: 'Account Suspension Warning',
    subject: 'URGENT: Your Account Has Been Flagged for Suspension',
    body: `Dear {{name}},\n\nOur automated security system has detected unusual activity on your {{department}} account. Your access will be suspended in 2 hours unless you verify your identity.\n\nImmediate action required:\n1. Click the verification link below\n2. Confirm your account details\n3. Review recent activity\n\nFailure to respond will result in permanent account lockout.\n\nSecurity Operations Center`
  },
  {
    key: 'benefits-enrollment',
    name: 'Benefits Enrollment Deadline',
    subject: 'Last Chance: Benefits Enrollment Ends Today',
    body: `Hello {{name}},\n\nThis is your final reminder that benefits enrollment for {{department}} employees closes today at 5 PM.\n\nYou must complete your enrollment to maintain coverage. Click the link below to access your personalized enrollment portal.\n\nDon't miss this deadline - late enrollments cannot be accepted.\n\nEmployee Benefits Team`
  },
  {
    key: 'invoice-payment',
    name: 'Outstanding Invoice Payment',
    subject: 'Payment Required: Invoice #INV-{{name}}-2024',
    body: `Dear {{name}},\n\nWe have an outstanding invoice for services provided to the {{department}} department.\n\nInvoice Amount: $2,847.50\nDue Date: OVERDUE\n\nPlease review and process payment immediately by clicking the link below to avoid late fees and service interruption.\n\nAccounts Receivable\nFinance Department`
  },
  {
    key: 'software-update',
    name: 'Critical Software Update Required',
    subject: 'Critical Security Update - Action Required by {{name}}',
    body: `Hi {{name}},\n\nA critical security update is available for all {{department}} workstations. This update patches several high-severity vulnerabilities.\n\nYou must install this update within 24 hours. Click the link below to download and install.\n\nSystem will be automatically rebooted after installation.\n\nIT Systems Management`
  },
  {
    key: 'meeting-invite',
    name: 'Urgent Meeting Invitation',
    subject: 'Meeting Invitation: Emergency {{department}} Team Discussion',
    body: `Hello {{name}},\n\nYou have been invited to an urgent meeting regarding recent changes affecting the {{department}} department.\n\nDate: Tomorrow\nTime: 9:00 AM\nLocation: Conference Room B / Virtual\n\nPlease confirm your attendance by clicking the link below. Attendance is mandatory.\n\nAgenda will be shared upon confirmation.\n\nExecutive Office`
  },
  {
    key: 'prize-notification',
    name: 'Employee Recognition Award',
    subject: 'Congratulations! You Have Been Selected',
    body: `Dear {{name}},\n\nCongratulations! You have been selected as {{department}} Employee of the Quarter.\n\nAs part of your recognition, you have been awarded:\n- $500 Gift Card\n- Reserved Parking Spot\n- Executive Lunch\n\nClick the link below to claim your rewards and schedule your recognition ceremony.\n\nHuman Resources - Employee Recognition Program`
  },
  {
    key: 'vpn-access',
    name: 'VPN Access Renewal',
    subject: 'Your VPN Access Expires Today',
    body: `Hi {{name}},\n\nYour remote VPN access for {{department}} resources expires today. To continue working remotely, you must renew your credentials.\n\nClick the link below to renew your VPN certificate and avoid connectivity issues.\n\nRenewal takes less than 2 minutes.\n\nNetwork Operations Team`
  },
  {
    key: 'survey-request',
    name: 'Employee Survey Response',
    subject: 'Final Reminder: Complete Your {{department}} Survey',
    body: `Hello {{name}},\n\nWe still need your input! The annual {{department}} employee satisfaction survey closes in 24 hours.\n\nYour feedback is critical for improving our workplace. The survey takes only 5 minutes.\n\nClick the link below to access your personalized survey link.\n\nAll responses are confidential.\n\nEmployee Engagement Team`
  },
  {
    key: 'compliance-training',
    name: 'Mandatory Compliance Training',
    subject: 'OVERDUE: Mandatory Compliance Training for {{name}}',
    body: `Dear {{name}},\n\nOur records show you have not completed the mandatory annual compliance training required for all {{department}} employees.\n\nCompletion deadline: OVERDUE\nConsequences: Access restrictions may be applied\n\nClick the link below to complete your training immediately.\n\nCompliance & Training Department`
  }
];

module.exports = templates;
