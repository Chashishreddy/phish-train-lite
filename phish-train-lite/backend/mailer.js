const nodemailer = require('nodemailer');

function createTransport(campaign) {
  if (!campaign.enable_sending) {
    // Console transport logs emails for local development. Replace with SMTP once policies are met.
    return {
      sendMail: async (options) => {
        console.log('Simulated email send (console transport):');
        console.log({
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html
        });
        return { messageId: 'console-transport' };
      }
    };
  }

  // When enabling real sending, ensure SMTP credentials are approved and limited to the allowlist.
  return nodemailer.createTransport({
    host: campaign.smtp_host,
    port: campaign.smtp_port,
    secure: campaign.smtp_port === 465,
    auth: campaign.smtp_user && campaign.smtp_pass ? {
      user: campaign.smtp_user,
      pass: campaign.smtp_pass
    } : undefined
  });
}

module.exports = {
  createTransport
};
