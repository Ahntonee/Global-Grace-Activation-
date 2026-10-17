/*
 * Spreadsheet exports (Excel .xlsx and CSV) for admin records and reports.
 *
 * Each "kind" describes the model to read, its columns, and an optional
 * summary (totals) sheet. The same definitions power:
 *   - the Download buttons on the admin list pages (xlsx / csv), and
 *   - the live CSV feed that Excel / Google Sheets can connect to.
 */
const ExcelJS = require("exceljs");

const Donation = require("../models/Donation");
const Order = require("../models/Order");
const EventRegistration = require("../models/EventRegistration");
const Contact = require("../models/Contact");
const Prayer = require("../models/Prayer");
const Volunteer = require("../models/Volunteer");
const Newsletter = require("../models/Newsletter");

const GUESTS_MIN = { "Just me": 1, "2 people": 2, "3 people": 3, "4+ people": 4 };

const kinds = {
  donations: {
    title: "Donations",
    model: Donation,
    columns: [
      { header: "Date", type: "date", width: 18, value: (d) => d.createdAt },
      { header: "Reference", width: 30, value: (d) => d.paymentReference },
      { header: "Donor", width: 24, value: (d) => d.donor.fullName || "" },
      { header: "Anonymous", width: 11, value: (d) => (d.donor.isAnonymous ? "Yes" : "No") },
      { header: "Email", width: 28, value: (d) => d.donor.email },
      { header: "Phone", width: 16, value: (d) => d.donor.phone || "" },
      { header: "Fund", width: 18, value: (d) => d.fund },
      { header: "Frequency", width: 12, value: (d) => d.frequency },
      { header: "Currency", width: 10, value: (d) => d.currency || "NGN" },
      { header: "Amount", type: "number", width: 14, value: (d) => d.amount },
      { header: "Status", width: 12, value: (d) => d.status },
      { header: "Gateway", width: 13, value: (d) => d.paymentProvider },
      { header: "Transaction ID", width: 22, value: (d) => d.providerTransactionId || "" },
      { header: "Message", width: 40, value: (d) => d.message || "" },
    ],
    summary(rows) {
      const byCurrency = {};
      rows.forEach((d) => {
        const cur = d.currency || "NGN";
        const bucket = (byCurrency[cur] = byCurrency[cur] || { successful: 0, successfulTotal: 0, pending: 0, failed: 0 });
        if (d.status === "Successful") {
          bucket.successful += 1;
          bucket.successfulTotal += d.amount;
        } else if (d.status === "Failed") {
          bucket.failed += 1;
        } else {
          bucket.pending += 1;
        }
      });
      return {
        headers: ["Currency", "Successful gifts", "Total received", "Pending", "Failed"],
        numericCols: [1, 2, 3, 4],
        rows: Object.keys(byCurrency)
          .sort()
          .map((cur) => [cur, byCurrency[cur].successful, byCurrency[cur].successfulTotal, byCurrency[cur].pending, byCurrency[cur].failed]),
      };
    },
  },

  orders: {
    title: "Orders",
    model: Order,
    columns: [
      { header: "Date", type: "date", width: 18, value: (o) => o.createdAt },
      { header: "Order #", width: 30, value: (o) => o.orderNumber },
      { header: "Customer", width: 24, value: (o) => o.customer.fullName },
      { header: "Email", width: 28, value: (o) => o.customer.email },
      { header: "Phone", width: 16, value: (o) => o.customer.phone || "" },
      { header: "Items", width: 44, value: (o) => (o.items || []).map((i) => `${i.name} x${i.quantity}`).join("; ") },
      { header: "Currency", width: 10, value: (o) => o.currency || "NGN" },
      { header: "Subtotal", type: "number", width: 13, value: (o) => o.subtotal },
      { header: "Shipping", type: "number", width: 12, value: (o) => o.shippingFee },
      { header: "Total", type: "number", width: 13, value: (o) => o.total },
      { header: "Payment", width: 12, value: (o) => o.paymentStatus },
      { header: "Fulfillment", width: 14, value: (o) => o.fulfillmentStatus },
      { header: "Gateway", width: 13, value: (o) => o.paymentProvider || "" },
    ],
    summary(rows) {
      const byCurrency = {};
      rows.forEach((o) => {
        const cur = o.currency || "NGN";
        const bucket = (byCurrency[cur] = byCurrency[cur] || { paid: 0, paidTotal: 0, other: 0 });
        if (o.paymentStatus === "Paid") {
          bucket.paid += 1;
          bucket.paidTotal += o.total;
        } else {
          bucket.other += 1;
        }
      });
      return {
        headers: ["Currency", "Paid orders", "Total paid", "Unpaid / failed"],
        numericCols: [1, 2, 3],
        rows: Object.keys(byCurrency)
          .sort()
          .map((cur) => [cur, byCurrency[cur].paid, byCurrency[cur].paidTotal, byCurrency[cur].other]),
      };
    },
  },

  eventRegistrations: {
    title: "Event Registrations",
    model: EventRegistration,
    columns: [
      { header: "Date", type: "date", width: 18, value: (r) => r.createdAt },
      { header: "Event", width: 32, value: (r) => r.eventTitle },
      { header: "Name", width: 24, value: (r) => r.fullName },
      { header: "Email", width: 28, value: (r) => r.email },
      { header: "Phone", width: 16, value: (r) => r.phone },
      { header: "Country", width: 16, value: (r) => r.country },
      { header: "Guests", width: 12, value: (r) => r.guests },
      { header: "Status", width: 12, value: (r) => r.status },
    ],
    summary(rows) {
      const byEvent = {};
      rows.forEach((r) => {
        const bucket = (byEvent[r.eventTitle] = byEvent[r.eventTitle] || { registrations: 0, attendees: 0, cancelled: 0 });
        if (r.status === "Cancelled") {
          bucket.cancelled += 1;
        } else {
          bucket.registrations += 1;
          bucket.attendees += GUESTS_MIN[r.guests] || 1;
        }
      });
      return {
        headers: ["Event", "Registrations", "Expected attendees (minimum)", "Cancelled"],
        numericCols: [1, 2, 3],
        rows: Object.keys(byEvent)
          .sort()
          .map((title) => [title, byEvent[title].registrations, byEvent[title].attendees, byEvent[title].cancelled]),
      };
    },
  },

  contacts: {
    title: "Contact Messages",
    model: Contact,
    columns: [
      { header: "Date", type: "date", width: 18, value: (c) => c.createdAt },
      { header: "Name", width: 24, value: (c) => c.fullName },
      { header: "Email", width: 28, value: (c) => c.email },
      { header: "Phone", width: 16, value: (c) => c.phone || "" },
      { header: "Subject", width: 30, value: (c) => c.subject },
      { header: "Category", width: 14, value: (c) => c.category },
      { header: "Message", width: 60, value: (c) => c.message },
      { header: "Status", width: 13, value: (c) => c.status },
      { header: "Internal notes", width: 30, value: (c) => c.adminNotes || "" },
    ],
  },

  prayers: {
    title: "Prayer Requests",
    model: Prayer,
    columns: [
      { header: "Date", type: "date", width: 18, value: (p) => p.createdAt },
      { header: "Name", width: 24, value: (p) => (p.isAnonymous ? "Anonymous" : p.fullName || "") },
      { header: "Email", width: 28, value: (p) => p.email || "" },
      { header: "Phone", width: 16, value: (p) => p.phone || "" },
      { header: "Category", width: 14, value: (p) => p.category },
      { header: "Request", width: 60, value: (p) => p.request },
      { header: "Confidential", width: 12, value: (p) => (p.isConfidential ? "Yes" : "No") },
      { header: "Status", width: 13, value: (p) => p.status },
      { header: "Internal notes", width: 30, value: (p) => p.adminNotes || "" },
    ],
  },

  volunteers: {
    title: "Volunteer Applications",
    model: Volunteer,
    columns: [
      { header: "Date", type: "date", width: 18, value: (v) => v.createdAt },
      { header: "Name", width: 24, value: (v) => v.fullName },
      { header: "Email", width: 28, value: (v) => v.email },
      { header: "Phone", width: 16, value: (v) => v.phone },
      { header: "Department", width: 24, value: (v) => v.department || "" },
      { header: "Availability", width: 13, value: (v) => v.availability || "" },
      { header: "Prior experience", width: 30, value: (v) => v.occupation || "" },
      { header: "Status", width: 12, value: (v) => v.status },
      { header: "Internal notes", width: 30, value: (v) => v.notes || "" },
    ],
  },

  newsletter: {
    title: "Newsletter Subscribers",
    model: Newsletter,
    columns: [
      { header: "Date", type: "date", width: 18, value: (n) => n.createdAt },
      { header: "Email", width: 32, value: (n) => n.email },
      { header: "Name", width: 24, value: (n) => n.fullName || "" },
      { header: "Status", width: 14, value: (n) => n.status },
    ],
  },
};

function isKind(name) {
  return Object.prototype.hasOwnProperty.call(kinds, name);
}

// "from"/"to" arrive as YYYY-MM-DD in the admin's local calendar, with "tz"
// = Date#getTimezoneOffset() (minutes, UTC minus local). "to" covers the
// whole day.
function dateFilter({ from, to, tz }) {
  const offset = Number.isFinite(Number(tz)) ? Number(tz) : 0;
  const parse = (value, endOfDay) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    if (!m) return null;
    const base = endOfDay ? Date.UTC(+m[1], +m[2] - 1, +m[3], 23, 59, 59, 999) : Date.UTC(+m[1], +m[2] - 1, +m[3]);
    return new Date(base + offset * 60000);
  };

  const range = {};
  const start = parse(from, false);
  const end = parse(to, true);
  if (start) range.$gte = start;
  if (end) range.$lte = end;
  return Object.keys(range).length ? { createdAt: range } : {};
}

async function fetchRows(kindName, { from, to, tz, status } = {}) {
  const kind = kinds[kindName];
  const filter = dateFilter({ from, to, tz });
  if (status) filter[kindName === "donations" ? "status" : kindName === "orders" ? "paymentStatus" : "status"] = status;
  return kind.model.find(filter).sort({ createdAt: -1 }).lean();
}

// Spreadsheet apps run cells that start with = + - @ as formulas, so text
// that came from public forms is prefixed to keep it inert. Phone-style
// values like "+2348012345678" are left alone.
function neutralise(text) {
  if (/^[=@\t\r]/.test(text)) return "'" + text;
  if (/^[+-]/.test(text) && !/^[+-][0-9\s().-]*$/.test(text)) return "'" + text;
  return text;
}

function csvCell(value) {
  if (value === null || value === undefined) return "";
  const text = value instanceof Date ? value.toISOString().replace("T", " ").slice(0, 19) : String(value);
  const safe = neutralise(text);
  return /[",\r\n]/.test(safe) ? '"' + safe.replace(/"/g, '""') + '"' : safe;
}

async function buildCsv(kindName, query) {
  const kind = kinds[kindName];
  const rows = await fetchRows(kindName, query);
  const lines = [kind.columns.map((c) => csvCell(c.header)).join(",")];
  rows.forEach((row) => lines.push(kind.columns.map((c) => csvCell(c.value(row))).join(",")));
  // BOM so Excel opens UTF-8 (₦, accents) correctly.
  return { body: "\uFEFF" + lines.join("\r\n") + "\r\n", count: rows.length };
}

async function buildWorkbook(kindName, query) {
  const kind = kinds[kindName];
  const rows = await fetchRows(kindName, query);

  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(kind.title.slice(0, 31), { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = kind.columns.map((c) => ({ header: c.header, width: c.width || 16 }));

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF064E3B" } };
  header.alignment = { vertical: "middle" };

  rows.forEach((row) => {
    const added = sheet.addRow(
      kind.columns.map((c) => {
        const v = c.value(row);
        // Same formula-injection guard as the CSV path, for text cells.
        return typeof v === "string" && /^[=+\-@]/.test(v) ? `'${v}` : v;
      })
    );
    kind.columns.forEach((c, i) => {
      const cell = added.getCell(i + 1);
      if (c.type === "date") cell.numFmt = "yyyy-mm-dd hh:mm";
      if (c.type === "number") cell.numFmt = "#,##0.00";
    });
  });

  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: kind.columns.length } };

  if (kind.summary) {
    const summary = kind.summary(rows);
    const s = workbook.addWorksheet("Summary");
    s.addRow([`${kind.title} report`]).font = { bold: true, size: 14 };
    const range = [query && query.from, query && query.to].filter(Boolean);
    s.addRow([range.length ? `Period: ${query.from || "start"} to ${query.to || "today"}` : "Period: all records"]);
    s.addRow([`Generated: ${new Date().toISOString().replace("T", " ").slice(0, 16)} UTC`]);
    s.addRow([]);
    const head = s.addRow(summary.headers);
    head.font = { bold: true, color: { argb: "FFFFFFFF" } };
    head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF064E3B" } };
    summary.rows.forEach((r) => {
      const added = s.addRow(r);
      summary.numericCols.forEach((i) => (added.getCell(i + 1).numFmt = "#,##0.00"));
    });
    s.columns.forEach((col, i) => (col.width = i === 0 ? 34 : 24));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return { buffer, count: rows.length };
}

module.exports = { kinds, isKind, buildCsv, buildWorkbook };
