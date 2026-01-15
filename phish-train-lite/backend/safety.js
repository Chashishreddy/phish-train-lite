const DO_NOT_SEND_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];

function isDomainAllowed(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return !DO_NOT_SEND_DOMAINS.includes(domain);
}

module.exports = {
  DO_NOT_SEND_DOMAINS,
  isDomainAllowed
};
