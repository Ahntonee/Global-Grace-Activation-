const axios = require("axios");

const BASE_URL = "https://api.resend.com";

function client() {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
  });
}

async function send({ to, subject, html, text }) {
  const res = await client().post("/emails", {
    from: process.env.MAIL_FROM,
    to,
    subject,
    html,
    text,
  });

  return { id: res.data.id };
}

module.exports = { send };
