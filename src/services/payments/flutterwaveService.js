const axios = require("axios");

const BASE_URL = "https://api.flutterwave.com/v3";

function client() {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });
}

// amount is in the major unit (Naira, Dollars, ...) — Flutterwave takes it as-is, no minor-unit conversion
async function initiate({ amount, currency = "NGN", email, reference, callbackUrl, metadata }) {
  const res = await client().post("/payments", {
    tx_ref: reference,
    amount,
    currency,
    redirect_url: callbackUrl,
    customer: { email },
    meta: metadata,
  });

  return {
    checkoutUrl: res.data.data.link,
    providerReference: reference,
  };
}

async function verifyByTransactionId(transactionId) {
  const res = await client().get(`/transactions/${transactionId}/verify`);
  const data = res.data.data;

  return {
    success: data.status === "successful",
    providerTransactionId: String(data.id),
    amount: data.amount,
    raw: data,
  };
}

// Flutterwave webhooks send a static shared secret in the "verif-hash"
// header (not an HMAC signature) — it just has to match what's configured
// in the Flutterwave dashboard.
function verifyWebhookSignature(verifHashHeader) {
  const expected = process.env.FLUTTERWAVE_SECRET_HASH || "";
  return !!expected && verifHashHeader === expected;
}

module.exports = { initiate, verifyByTransactionId, verifyWebhookSignature };
