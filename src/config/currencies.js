/*
 * Currencies donors can pick on the Giving page. Flutterwave only settles
 * in currencies that are enabled on the merchant account, so trim this list
 * to match the Flutterwave dashboard (Settings > Currencies) if one of these
 * isn't enabled there.
 */
const CURRENCIES = [
  { code: "NGN", symbol: "₦", label: "Nigerian Naira", presets: [10000, 20000, 50000, 100000] },
  { code: "USD", symbol: "$", label: "US Dollar", presets: [10, 25, 50, 100] },
  { code: "GBP", symbol: "£", label: "British Pound", presets: [10, 25, 50, 100] },
  { code: "EUR", symbol: "€", label: "Euro", presets: [10, 25, 50, 100] },
  { code: "GHS", symbol: "GH₵", label: "Ghanaian Cedi", presets: [100, 250, 500, 1000] },
  { code: "KES", symbol: "KSh", label: "Kenyan Shilling", presets: [1000, 2500, 5000, 10000] },
  { code: "ZAR", symbol: "R", label: "South African Rand", presets: [200, 500, 1000, 2000] },
  { code: "CAD", symbol: "CA$", label: "Canadian Dollar", presets: [10, 25, 50, 100] },
];

const CODES = CURRENCIES.map((c) => c.code);

module.exports = { CURRENCIES, CODES, DEFAULT_CURRENCY: "NGN" };
