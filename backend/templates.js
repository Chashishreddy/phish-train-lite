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
  }
];

module.exports = templates;
