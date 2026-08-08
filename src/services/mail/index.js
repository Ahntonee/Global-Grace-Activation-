const ejs = require("ejs");
const path = require("path");
const resendService = require("./resendService");

const isMock = () => process.env.MAIL_MODE === "mock";

const TEMPLATES_DIR = path.join(__dirname, "..", "..", "views", "emails");

function renderTemplate(templateName, data) {
  return ejs.renderFile(path.join(TEMPLATES_DIR, `${templateName}.ejs`), data);
}

/*
 * Renders an EJS email template and sends it. In mock mode (the default
 * until a real Resend API key is supplied), the email is logged instead of
 * sent — same shape as PAYMENT_MODE=mock — so every flow that sends mail
 * (contact/prayer/volunteer confirmations, newsletter welcome, order and
 * donation receipts) is fully exercisable without a real provider account.
 *
 * Never throws — a broken email must not break the form submission or
 * payment flow it's attached to. Callers can inspect the resolved
 * { sent, error } if they care, but aren't required to.
 */
async function sendTemplate({ to, subject, template, data }) {
  try {
    const html = await renderTemplate(template, data || {});

    if (isMock()) {
      console.log(`\n[MAIL:mock] To: ${to}\n[MAIL:mock] Subject: ${subject}\n[MAIL:mock] Template: ${template}\n`);
      return { sent: false, mocked: true };
    }

    await resendService.send({ to, subject, html });
    return { sent: true };
  } catch (err) {
    console.error(`[MAIL] Failed to send "${template}" to ${to}:`, err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = { sendTemplate, isMock };
