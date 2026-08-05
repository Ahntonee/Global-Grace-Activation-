const paystackService = require("./paystackService");
const flutterwaveService = require("./flutterwaveService");

const isMock = () => process.env.PAYMENT_MODE === "mock";

/*
 * Initiates a payment and returns a checkout URL to redirect the browser
 * to. In mock mode (no real gateway keys needed — this is the default
 * until real Paystack/Flutterwave keys are supplied), the "checkout URL"
 * points at our own internal mock checkout page instead of a real
 * gateway, so the entire order/donation flow is fully testable end to
 * end without any external account. Switching PAYMENT_MODE away from
 * "mock" requires zero controller changes — this function is the only
 * fork point.
 */
async function initiate({ provider, amount, email, reference, callbackUrl, metadata }) {
  if (isMock()) {
    return {
      checkoutUrl: `/checkout/mock?reference=${encodeURIComponent(reference)}&provider=${provider}`,
      providerReference: reference,
    };
  }

  if (provider === "paystack") {
    return paystackService.initiate({ amount, email, reference, callbackUrl, metadata });
  }
  if (provider === "flutterwave") {
    return flutterwaveService.initiate({ amount, email, reference, callbackUrl, metadata });
  }
  throw new Error(`Unknown payment provider: ${provider}`);
}

module.exports = { initiate, isMock, paystackService, flutterwaveService };
