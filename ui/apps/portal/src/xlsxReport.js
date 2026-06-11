const transactionHeaders = ["Transaction ID", "Amount", "Meter Number", "Merchant Name", "Status", "Date/Time"];
const airtimeHeaders = ["Transaction ID", "Amount", "Phone Number", "Product", "Merchant", "Status", "Date/Time"];
const outletId = "3928-01";
const outletName = "SCBBB";
const electricityUser = "Smart Plan Blueprint-01";
const electricityProvider = "Botswana Power Corporation";

export function createTransactionReportWorkbook(reportInput, filters = {}) {
  const electricityRows = Array.isArray(reportInput) ? reportInput : reportInput?.electricityRows || [];
  const airtimeRows = Array.isArray(reportInput) ? [] : reportInput?.airtimeRows || [];
  const sourceRows = [...electricityRows, ...airtimeRows];
  const generatedAt = new Date();
  const dateRange = reportDateRange(sourceRows, filters);
  const transactionRows = electricityRows.map(reportRow);
  const airtimeTransactionRows = airtimeRows.map(reportAirtimeRow);
  const successfulRows = transactionRows.filter((row) => row.status === "SUCCESS");
  const failedRows = transactionRows.filter((row) => row.status === "FAILED");
  const summaryRows = buildSummary(electricityRows);
  const salesRows = buildSalesRows(transactionRows, airtimeTransactionRows);

  const sheets = [
    { name: "Transactions", xml: transactionSheetXml("Transaction Report", dateRange, generatedAt, transactionRows) },
    { name: "Successful", xml: transactionSheetXml("Successful Transactions", dateRange, generatedAt, successfulRows) },
    { name: "Failed", xml: transactionSheetXml("Failed Transactions", dateRange, generatedAt, failedRows) },
    { name: "Summary", xml: summarySheetXml(dateRange, generatedAt, summaryRows) },
    { name: "Airtime", xml: airtimeSheetXml(dateRange, generatedAt, airtimeTransactionRows) },
    { name: "Sales By Date", xml: salesByDateSheetXml(dateRange, generatedAt, salesRows) },
    { name: "Sales By Outlet", xml: salesByOutletSheetXml(dateRange, generatedAt, salesRows) },
    { name: "Sales By User", xml: salesByUserSheetXml(dateRange, generatedAt, salesRows) },
    { name: "Sales By Provider", xml: salesByProviderSheetXml(dateRange, generatedAt, salesRows) },
    { name: "Itemised Sales", xml: itemisedSalesSheetXml(dateRange, generatedAt, salesRows) },
    { name: "Merchant Statement", xml: merchantStatementSheetXml(dateRange, generatedAt, salesRows) }
  ];

  const files = {
    "[Content_Types].xml": contentTypesXml(sheets),
    "_rels/.rels": rootRelsXml(),
    "docProps/app.xml": appXml(),
    "docProps/core.xml": coreXml(generatedAt),
    "xl/workbook.xml": workbookXml(sheets),
    "xl/_rels/workbook.xml.rels": workbookRelsXml(sheets),
    "xl/styles.xml": stylesXml()
  };

  sheets.forEach((sheet, index) => {
    files[`xl/worksheets/sheet${index + 1}.xml`] = sheet.xml;
  });

  return zipFiles(files);
}

export function reportWorkbookFileName(filters = {}) {
  const from = filters.from || "all";
  const to = filters.to || filters.from || "all";
  return `transaction-report-daily-${from}-${to}.xlsx`;
}

function transactionSheetXml(title, dateRange, generatedAt, rows) {
  const bodyRows = rows.map((row, index) => rowXml(index + 7, [
    textCell("A", index + 7, row.transactionId, 5),
    numberCell("B", index + 7, row.amount, 6),
    textCell("C", index + 7, row.meterNumber, 5),
    textCell("D", index + 7, row.merchantName, 5),
    textCell("E", index + 7, row.status, statusStyle(row.status)),
    textCell("F", index + 7, row.dateTime, 5)
  ])).join("");

  return worksheetXml({
    cols: [34.83203125, 15.83203125, 18.83203125, 26.83203125, 14.83203125, 24.83203125],
    merges: ["A1:F1", "A2:F2", "A3:F3", "A4:F4"],
    rows: [
      rowXml(1, [textCell("A", 1, "Smart Plan Blueprint", 1)]),
      rowXml(2, [textCell("A", 2, title, 2)]),
      rowXml(3, [textCell("A", 3, `Daily Transaction Report | ${dateRange}`, 3)]),
      rowXml(4, [textCell("A", 4, `Generated: ${formatGeneratedAt(generatedAt)}`, 3)]),
      rowXml(6, transactionHeaders.map((header, index) => textCell(columnLetter(index), 6, header, 4))),
      bodyRows
    ].join("")
  });
}

function summarySheetXml(dateRange, generatedAt, rows) {
  const headers = ["Period", "Transactions", "Successful", "Failed", "Pending", "Other", "Successful Amount"];
  const bodyRows = rows.map((row, index) => rowXml(index + 8, [
    textCell("A", index + 8, row.period, 5),
    numberCell("B", index + 8, row.transactions, 5),
    numberCell("C", index + 8, row.successful, 5),
    numberCell("D", index + 8, row.failed, 5),
    numberCell("E", index + 8, row.pending, 5),
    numberCell("F", index + 8, row.other, 5),
    numberCell("G", index + 8, row.successfulAmount, 6)
  ])).join("");

  return worksheetXml({
    cols: [26.83203125, 15.83203125, 14.83203125, 12.83203125, 12.83203125, 12.83203125, 18.83203125],
    merges: ["A1:G1", "A2:G2", "A3:G3", "A4:G4", "A6:G6"],
    rows: [
      rowXml(1, [textCell("A", 1, "Smart Plan Blueprint", 1)]),
      rowXml(2, [textCell("A", 2, "Daily Transaction Report", 2)]),
      rowXml(3, [textCell("A", 3, `Date Range: ${dateRange}`, 3)]),
      rowXml(4, [textCell("A", 4, `Generated: ${formatGeneratedAt(generatedAt)}`, 3)]),
      rowXml(6, [textCell("A", 6, "Summary Overview", 2)]),
      rowXml(7, headers.map((header, index) => textCell(columnLetter(index), 7, header, 4))),
      bodyRows
    ].join("")
  });
}

function airtimeSheetXml(dateRange, generatedAt, rows) {
  const bodyRows = rows.map((row, index) => rowXml(index + 7, [
    textCell("A", index + 7, row.transactionId, 5),
    numberCell("B", index + 7, row.amount, 6),
    textCell("C", index + 7, row.phoneNumber, 5),
    textCell("D", index + 7, row.productName, 5),
    textCell("E", index + 7, row.merchantName, 5),
    textCell("F", index + 7, row.status, statusStyle(row.status)),
    textCell("G", index + 7, row.dateTime, 5)
  ])).join("");

  return worksheetXml({
    cols: [34.83, 15.83, 18.83, 24.83, 22.83, 14.83, 24.83],
    merges: ["A1:G1", "A2:G2", "A3:G3", "A4:G4"],
    rows: [
      rowXml(1, [textCell("A", 1, "Smart Plan Blueprint", 1)]),
      rowXml(2, [textCell("A", 2, "Airtime Transactions", 2)]),
      rowXml(3, [textCell("A", 3, `Daily Report | ${dateRange}`, 3)]),
      rowXml(4, [textCell("A", 4, `Generated: ${formatGeneratedAt(generatedAt)}`, 3)]),
      rowXml(6, airtimeHeaders.map((header, index) => textCell(columnLetter(index), 6, header, 4))),
      bodyRows
    ].join("")
  });
}

function salesByDateSheetXml(dateRange, generatedAt, salesRows) {
  const rows = groupSales(salesRows, ["date"]).map((row) => [row.date, row.amount]);
  rows.push(["Sales Totals", sumSales(salesRows)]);

  return tableSheetXml("Sales By Date", dateRange, generatedAt, ["Date", "Amount"], rows, [24.83, 15.83], [1]);
}

function salesByOutletSheetXml(dateRange, generatedAt, salesRows) {
  const rows = groupSales(salesRows, ["outletId", "outletName"]).map((row) => [row.outletId, row.outletName, row.amount]);
  rows.push(["Sales Totals", "", sumSales(salesRows)]);

  return tableSheetXml("Sales By Outlet", dateRange, generatedAt, ["Outlet Id", "Outlet Name", "Amount"], rows, [18.83, 28.83, 15.83], [2]);
}

function salesByUserSheetXml(dateRange, generatedAt, salesRows) {
  const rows = groupSales(salesRows, ["userId", "userName"]).map((row) => [row.userId, row.userName, row.amount]);
  rows.push(["Sales Totals", "", sumSales(salesRows)]);

  return tableSheetXml("Sales By User", dateRange, generatedAt, ["User Id", "Name", "Amount"], rows, [30.83, 22.83, 15.83], [2]);
}

function salesByProviderSheetXml(dateRange, generatedAt, salesRows) {
  const rows = groupSales(salesRows, ["saleType", "provider"]).map((row) => [row.saleType, row.provider, row.amount]);
  rows.push(["Sales Totals", "", sumSales(salesRows)]);

  return tableSheetXml("Sales By Provider", dateRange, generatedAt, ["Sale Type", "Provider", "Amount"], rows, [18.83, 34.83, 15.83], [2]);
}

function itemisedSalesSheetXml(dateRange, generatedAt, salesRows) {
  const rows = [...salesRows]
    .sort((left, right) => String(left.dateTime).localeCompare(String(right.dateTime)))
    .map((row) => [
      row.dateTime,
      `${row.userId} - ${row.userName}`.replace(/ - $/, ""),
      row.saleType,
      row.provider,
      row.reference,
      row.amount
    ]);
  rows.push(["Sales Totals", "", "", "", "", sumSales(salesRows)]);

  return tableSheetXml(
    "Itemised Sales",
    dateRange,
    generatedAt,
    ["Date Time", "User", "Sale Type", "Provider", "Meter Number", "Amount"],
    rows,
    [24.83, 34.83, 18.83, 32.83, 20.83, 15.83],
    [5]
  );
}

function merchantStatementSheetXml(dateRange, generatedAt, salesRows) {
  const totalSales = sumSales(salesRows);
  const providerRows = groupSales(salesRows, ["saleType", "provider"]);
  let commissionTotal = 0;

  const rows = [
    rowXml(1, [textCell("A", 1, "Smart Plan Blueprint", 1)]),
    rowXml(2, [textCell("A", 2, "Merchant Statement", 2)]),
    rowXml(3, [textCell("A", 3, `Date Range: ${dateRange}`, 3)]),
    rowXml(4, [textCell("A", 4, `Generated: ${formatGeneratedAt(generatedAt)}`, 3)]),
    rowXml(6, [textCell("A", 6, "Merchant Summary Statement", 2)]),
    rowXml(7, [textCell("A", 7, "Item", 4), textCell("B", 7, "Amount", 4)]),
    rowXml(8, [textCell("A", 8, "Total Sales", 5), numberCell("B", 8, totalSales, 6)]),
    rowXml(9, [textCell("A", 9, "Deposits", 5), textCell("B", 9, "Not tracked in portal", 5)]),
    rowXml(10, [textCell("A", 10, "Closing Balance", 5), textCell("B", 10, "Not tracked in portal", 5)]),
    rowXml(12, [textCell("A", 12, "Outlet Sales", 2)]),
    rowXml(13, [
      textCell("A", 13, "Outlet Id", 4),
      textCell("B", 13, "Outlet Name", 4),
      textCell("C", 13, "Sales", 4)
    ]),
    rowXml(14, [
      textCell("A", 14, outletId, 5),
      textCell("B", 14, outletName, 5),
      numberCell("C", 14, totalSales, 6)
    ]),
    rowXml(16, [textCell("A", 16, "Merchant Commission Earned", 2)]),
    rowXml(17, [
      textCell("A", 17, "Product Type", 4),
      textCell("B", 17, "Sales", 4),
      textCell("C", 17, "Commission Rate", 4),
      textCell("D", 17, "Commission Amount", 4)
    ])
  ];

  providerRows.forEach((row, index) => {
    const sheetRow = index + 18;
    const rate = commissionRate(row.saleType);
    const commission = row.amount * rate;
    commissionTotal += commission;
    rows.push(rowXml(sheetRow, [
      textCell("A", sheetRow, `${row.saleType} - ${row.provider}`, 5),
      numberCell("B", sheetRow, row.amount, 6),
      textCell("C", sheetRow, rate ? `${rate * 100}%` : "", 5),
      numberCell("D", sheetRow, commission, 6)
    ]));
  });

  const totalRow = providerRows.length + 18;
  rows.push(rowXml(totalRow, [
    textCell("A", totalRow, "Total Commission", 4),
    numberCell("B", totalRow, totalSales, 6),
    textCell("C", totalRow, "", 4),
    numberCell("D", totalRow, commissionTotal, 6)
  ]));

  return worksheetXml({
    cols: [34.83, 18.83, 18.83, 20.83],
    merges: ["A1:D1", "A2:D2", "A3:D3", "A4:D4", "A6:D6", "A12:D12", "A16:D16"],
    rows: rows.join("")
  });
}

function tableSheetXml(title, dateRange, generatedAt, headers, rows, cols, amountColumns = []) {
  const lastColumn = columnLetter(headers.length - 1);
  const bodyRows = rows.map((row, rowIndex) => rowXml(rowIndex + 7, row.map((value, columnIndex) => {
    const column = columnLetter(columnIndex);
    if (typeof value === "number") {
      return numberCell(column, rowIndex + 7, value, amountColumns.includes(columnIndex) ? 6 : 5);
    }
    return textCell(column, rowIndex + 7, value, 5);
  }))).join("");

  return worksheetXml({
    cols,
    merges: [`A1:${lastColumn}1`, `A2:${lastColumn}2`, `A3:${lastColumn}3`, `A4:${lastColumn}4`],
    rows: [
      rowXml(1, [textCell("A", 1, "Smart Plan Blueprint", 1)]),
      rowXml(2, [textCell("A", 2, title, 2)]),
      rowXml(3, [textCell("A", 3, `Date Range: ${dateRange}`, 3)]),
      rowXml(4, [textCell("A", 4, `Generated: ${formatGeneratedAt(generatedAt)}`, 3)]),
      rowXml(6, headers.map((header, index) => textCell(columnLetter(index), 6, header, 4))),
      bodyRows
    ].join("")
  });
}

function worksheetXml({ cols, merges, rows }) {
  const colXml = cols.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join("");
  const mergeXml = merges.map((ref) => `<mergeCell ref="${ref}"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <cols>${colXml}</cols>
  <sheetData>${rows}</sheetData>
  <mergeCells count="${merges.length}">${mergeXml}</mergeCells>
</worksheet>`;
}

function reportRow(row) {
  return {
    transactionId: row.transaction_id || "",
    amount: Number(row.amount) || 0,
    meterNumber: row.meter_number || "",
    merchantName: row.merchant_name || row.merchant?.name || "Smart Plan Blueprint",
    status: String(row.status || "UNKNOWN").toUpperCase(),
    dateTime: row.created_at || ""
  };
}

function reportAirtimeRow(row) {
  return {
    transactionId: row.transaction_id || row.id || "",
    amount: Number(row.amount) || 0,
    phoneNumber: row.phonenumber || row.phone_number || row.cellphone || "",
    productName: row.product_name || row.product || row.network || "",
    merchantName: row.merchant_name || row.user || electricityUser,
    status: String(row.status || "UNKNOWN").toUpperCase(),
    dateTime: row.created_at || ""
  };
}

function buildSalesRows(electricityRows, airtimeRows) {
  const electricitySales = electricityRows.map((row) => ({
    dateTime: row.dateTime,
    date: datePart(row.dateTime),
    outletId,
    outletName,
    userId: electricityUser,
    userName: "Not Set",
    saleType: "Electricity",
    provider: electricityProvider,
    reference: row.meterNumber,
    amount: row.amount,
    status: row.status
  }));

  const airtimeSales = airtimeRows.map((row) => ({
    dateTime: row.dateTime,
    date: datePart(row.dateTime),
    outletId,
    outletName,
    userId: row.merchantName || electricityUser,
    userName: "Not Set",
    saleType: "Airtime",
    provider: row.productName || "Airtime",
    reference: row.phoneNumber,
    amount: row.amount,
    status: row.status
  }));

  return [...electricitySales, ...airtimeSales].filter((row) => isSuccessful(row.status));
}

function groupSales(rows, keys) {
  const groups = rows.reduce((current, row) => {
    const key = keys.map((name) => row[name] || "").join("|");
    const existing = current.get(key) || keys.reduce((item, name) => ({ ...item, [name]: row[name] || "" }), { amount: 0 });
    existing.amount += Number(row.amount) || 0;
    current.set(key, existing);
    return current;
  }, new Map());

  return Array.from(groups.values()).sort((left, right) => {
    const leftKey = keys.map((key) => left[key]).join("|");
    const rightKey = keys.map((key) => right[key]).join("|");
    return leftKey.localeCompare(rightKey);
  });
}

function sumSales(rows) {
  return rows.reduce((total, row) => total + (Number(row.amount) || 0), 0);
}

function datePart(value) {
  const date = String(value || "").slice(0, 10);
  return date || "Undated";
}

function isSuccessful(status) {
  const value = String(status || "").toUpperCase();
  return value === "SUCCESS" || value === "SUCCESSFUL";
}

function commissionRate(saleType) {
  const value = String(saleType || "").toLowerCase();
  if (value === "airtime") return 0.09;
  if (value === "electricity") return 0.035;
  return 0;
}

function buildSummary(rows) {
  const map = rows.reduce((current, row) => {
    const period = String(row.created_at || "Undated").slice(0, 10);
    const status = String(row.status || "OTHER").toUpperCase();
    const item = current.get(period) || { period, transactions: 0, successful: 0, failed: 0, pending: 0, other: 0, successfulAmount: 0 };
    item.transactions += 1;
    if (status === "SUCCESS" || status === "SUCCESSFUL") {
      item.successful += 1;
      item.successfulAmount += Number(row.amount) || 0;
    } else if (status === "FAILED") {
      item.failed += 1;
    } else if (status === "PENDING") {
      item.pending += 1;
    } else {
      item.other += 1;
    }
    current.set(period, item);
    return current;
  }, new Map());

  return Array.from(map.values()).sort((left, right) => left.period.localeCompare(right.period));
}

function reportDateRange(rows, filters) {
  if (filters.from || filters.to) {
    return `${filters.from || "Start"} to ${filters.to || filters.from || "End"}`;
  }

  const dates = rows.map((row) => String(row.created_at || "").slice(0, 10)).filter(Boolean).sort();
  if (!dates.length) {
    return "All dates";
  }
  return `${dates[0]} to ${dates[dates.length - 1]}`;
}

function rowXml(index, cells) {
  return `<row r="${index}">${cells.join("")}</row>`;
}

function textCell(column, row, value, style) {
  return `<c r="${column}${row}" s="${style}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
}

function numberCell(column, row, value, style) {
  return `<c r="${column}${row}" s="${style}"><v>${Number(value) || 0}</v></c>`;
}

function statusStyle(status) {
  if (status === "SUCCESS" || status === "SUCCESSFUL") return 7;
  if (status === "FAILED") return 8;
  if (status === "PENDING") return 9;
  return 5;
}

function columnLetter(index) {
  return String.fromCharCode(65 + index);
}

function formatGeneratedAt(date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(date).replace(",", "");
}

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function workbookXml(sheets) {
  const sheetXml = sheets.map((sheet, index) => {
    const sheetId = index + 1;
    return `    <sheet name="${escapeXml(sheet.name)}" sheetId="${sheetId}" r:id="rId${sheetId}"/>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
${sheetXml}
  </sheets>
</workbook>`;
}

function workbookRelsXml(sheets) {
  const worksheetRels = sheets.map((sheet, index) => {
    const sheetId = index + 1;
    return `  <Relationship Id="rId${sheetId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${sheetId}.xml"/>`;
  }).join("\n");
  const styleId = sheets.length + 1;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${worksheetRels}
  <Relationship Id="rId${styleId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function rootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
}

function contentTypesXml(sheets) {
  const worksheetOverrides = sheets.map((sheet, index) => {
    const sheetId = index + 1;
    return `  <Override PartName="/xl/worksheets/sheet${sheetId}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${worksheetOverrides}
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="5">
    <font><sz val="11"/><color rgb="FF071A33"/><name val="Calibri"/></font>
    <font><b/><sz val="18"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="14"/><color rgb="FF071A33"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FF071A33"/><name val="Calibri"/></font>
  </fonts>
  <fills count="8">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF071A33"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEAF3FF"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1D5FD1"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFFFFF"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFDCEAFF"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFE8E8"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color rgb="FFD7E2F3"/></left><right style="thin"><color rgb="FFD7E2F3"/></right><top style="thin"><color rgb="FFD7E2F3"/></top><bottom style="thin"><color rgb="FFD7E2F3"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="10">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyFill="1" applyFont="1"><alignment horizontal="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="0" applyFill="1" applyFont="1"><alignment horizontal="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="3" borderId="0" applyFill="1"><alignment horizontal="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="4" borderId="1" applyFill="1" applyFont="1"><alignment horizontal="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="5" borderId="1" applyBorder="1"/>
    <xf numFmtId="2" fontId="0" fillId="5" borderId="1" applyBorder="1" applyNumberFormat="1"/>
    <xf numFmtId="0" fontId="4" fillId="6" borderId="1" applyFill="1" applyFont="1"><alignment horizontal="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="7" borderId="1" applyFill="1" applyFont="1"><alignment horizontal="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="3" borderId="1" applyFill="1" applyFont="1"><alignment horizontal="center"/></xf>
  </cellXfs>
</styleSheet>`;
}

function coreXml(date) {
  const iso = date.toISOString();
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>Smart Plan Blueprint</dc:creator>
  <cp:lastModifiedBy>Smart Plan Blueprint</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${iso}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${iso}</dcterms:modified>
</cp:coreProperties>`;
}

function appXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Smart Plan Blueprint Portal</Application>
</Properties>`;
}

function zipFiles(files) {
  const encoder = new TextEncoder();
  const fileRecords = Object.entries(files).map(([name, content]) => {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(content);
    return { name, nameBytes, data, crc: crc32(data) };
  });
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const file of fileRecords) {
    const local = concatBytes(
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(file.crc), u32(file.data.length), u32(file.data.length),
      u16(file.nameBytes.length), u16(0), file.nameBytes, file.data
    );
    chunks.push(local);
    central.push({ file, offset });
    offset += local.length;
  }

  const centralStart = offset;
  for (const item of central) {
    const file = item.file;
    const directory = concatBytes(
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(file.crc), u32(file.data.length), u32(file.data.length),
      u16(file.nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(item.offset),
      file.nameBytes
    );
    chunks.push(directory);
    offset += directory.length;
  }

  const centralSize = offset - centralStart;
  chunks.push(concatBytes(
    u32(0x06054b50), u16(0), u16(0), u16(fileRecords.length), u16(fileRecords.length),
    u32(centralSize), u32(centralStart), u16(0)
  ));

  return new Blob(chunks, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

function concatBytes(...parts) {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function u16(value) {
  const out = new Uint8Array(2);
  new DataView(out.buffer).setUint16(0, value, true);
  return out;
}

function u32(value) {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value >>> 0, true);
  return out;
}

function crc32(data) {
  let crc = -1;
  for (let i = 0; i < data.length; i += 1) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});
