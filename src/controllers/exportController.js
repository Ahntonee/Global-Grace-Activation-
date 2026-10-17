const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const { isKind, kinds, buildCsv, buildWorkbook } = require("../services/exports");
const { verifyFeedToken } = require("../utils/feedToken");

function stamp() {
  return new Date().toISOString().slice(0, 10);
}

function filtersFrom(req) {
  const { from, to, status, tz } = req.query;
  return {
    tz: typeof tz === "string" ? tz : undefined,
    from: typeof from === "string" ? from : undefined,
    to: typeof to === "string" ? to : undefined,
    status: typeof status === "string" && status ? status : undefined,
  };
}

// Admin download — Excel (.xlsx, with a Summary sheet for money/headcount
// reports) or CSV. Honours the same date range the admin list is filtered to.
exports.download = asyncHandler(async (req, res) => {
  const kindName = req.params.kind;
  if (!isKind(kindName)) throw new ApiError(404, "Unknown report");

  const filters = filtersFrom(req);
  const slug = kinds[kindName].title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  if (req.query.format === "csv") {
    const { body } = await buildCsv(kindName, filters);
    res.set({
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gga-${slug}-${stamp()}.csv"`,
      "Cache-Control": "no-store",
    });
    return res.send(body);
  }

  const { buffer } = await buildWorkbook(kindName, filters);
  res.set({
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="gga-${slug}-${stamp()}.xlsx"`,
    "Cache-Control": "no-store",
  });
  res.send(Buffer.from(buffer));
});

// Live CSV feed for Excel (Data > From Web) and Google Sheets (IMPORTDATA).
// Authenticated by the secret token in the URL instead of a login cookie.
exports.feed = asyncHandler(async (req, res) => {
  if (!verifyFeedToken(req.query.token)) {
    throw new ApiError(403, "Invalid or missing feed token");
  }

  const kindName = req.params.kind.replace(/\.csv$/, "");
  if (!isKind(kindName)) throw new ApiError(404, "Unknown report");

  const { body } = await buildCsv(kindName, {});
  res.set({
    "Content-Type": "text/csv; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.send(body);
});
