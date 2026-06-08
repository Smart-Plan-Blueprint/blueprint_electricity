const transactionHeaders = ["Transaction ID", "Amount", "Meter Number", "Merchant Name", "Status", "Date/Time"];

export function createTransactionReportWorkbook(rows, filters = {}) {
  const generatedAt = new Date();
  const dateRange = reportDateRange(rows, filters);
  const transactionRows = rows.map(reportRow);
  const successfulRows = transactionRows.filter((row) => row.status === "SUCCESS");
  const failedRows = transactionRows.filter((row) => row.status === "FAILED");
  const summaryRows = buildSummary(rows);

  const files = {
    "[Content_Types].xml": contentTypesXml(),
    "_rels/.rels": rootRelsXml(),
    "docProps/app.xml": appXml(),
    "docProps/core.xml": coreXml(generatedAt),
    "xl/workbook.xml": workbookXml(),
    "xl/_rels/workbook.xml.rels": workbookRelsXml(),
    "xl/styles.xml": stylesXml(),
    "xl/worksheets/sheet1.xml": transactionSheetXml("Transaction Report", dateRange, generatedAt, transactionRows),
    "xl/worksheets/sheet2.xml": transactionSheetXml("Successful Transactions", dateRange, generatedAt, successfulRows),
    "xl/worksheets/sheet3.xml": transactionSheetXml("Failed Transactions", dateRange, generatedAt, failedRows),
    "xl/worksheets/sheet4.xml": summarySheetXml(dateRange, generatedAt, summaryRows)
  };

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

function workbookXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Transactions" sheetId="1" r:id="rId1"/>
    <sheet name="Successful" sheetId="2" r:id="rId2"/>
    <sheet name="Failed" sheetId="3" r:id="rId3"/>
    <sheet name="Summary" sheetId="4" r:id="rId4"/>
  </sheets>
</workbook>`;
}

function workbookRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet4.xml"/>
  <Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
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

function contentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet4.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
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
