const axios = require("axios");
const crypto = require("crypto");

const BASE_URL = "https://api.paystack.co";

function client() {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });
}

// amount is in the major unit (e.g. Naira) — Paystack wants kobo (minor unit)
async function initiate({ amount, email, reference, callbackUrl, metadata }) {
  const res = await client().post("/transaction/initialize", {
    email,
    amount: Math.round(amount * 100),
    reference,
    callback_url: callbackUrl,
    metadata,
  });

  return {
    checkoutUrl: res.data.data.authorization_url,
    providerReference: res.data.data.reference,
  };
}

async function verify({ reference }) {
  const res = await client().get(`/transaction/verify/${encodeURIComponent(reference)}`);
  const data = res.data.data;

  return {
    success: data.status === "success",
    providerTransactionId: String(data.id),
    amount: data.amount / 100,
    raw: data,
  };
}

function verifyWebhookSignature(rawBody, signatureHeader) {
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY || "")
    .update(rawBody)
    .digest("hex");
  return hash === signatureHeader;
}

module.exports = { initiate, verify, verifyWebhookSignature };
