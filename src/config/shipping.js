/*
 * Nigeria-only shipping. Flat fee for now — if per-state rates or
 * international shipping become a real requirement later, this is the
 * one place to promote into a proper Mongoose model without touching
 * order logic elsewhere.
 */
const FLAT_SHIPPING_FEE_NGN = 2500;

function calculateShippingFee(/* shippingAddress */) {
  return FLAT_SHIPPING_FEE_NGN;
}

module.exports = { calculateShippingFee };
