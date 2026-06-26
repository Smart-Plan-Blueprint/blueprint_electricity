export function normalizeElectricityRow(row) {
  return {
    ...row,
    _type: "electricity",
    _reference: row.meter_number || null,
    _detail: null
  };
}

export function normalizeAirtimeRow(row) {
  return {
    ...row,
    _type: "airtime",
    _reference: row.phonenumber || row.phone_number || row.cellphone || null,
    _detail: row.product_name || row.product || row.network || null,
    meter_number: null
  };
}

export function mergeAndSort(electricityRows, airtimeRows) {
  const elec = (electricityRows || []).map(normalizeElectricityRow);
  const air = (airtimeRows || []).map(normalizeAirtimeRow);
  return [...elec, ...air].sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tb - ta;
  });
}

export function filterRows(rows, filters = {}) {
  const service = String(filters._type || "").trim();
  const status = String(filters.status || "").trim().toUpperCase();
  const transactionId = String(filters.transaction_id || "").trim().toLowerCase();
  const reference = String(filters.meter_number || "").trim().toLowerCase();
  const search = String(filters.search || "").trim().toLowerCase();
  const from = filters.from ? new Date(`${filters.from}T00:00:00`) : null;
  const to = filters.to ? new Date(`${filters.to}T23:59:59`) : null;

  return (rows || []).filter((row) => {
    const rowStatus = String(row.status || "").toUpperCase();
    const rowReference = String(
      row._reference ||
      row.meter_number ||
      row.phonenumber ||
      row.phone_number ||
      row.cellphone ||
      ""
    ).toLowerCase();
    const created = parseRowDate(row.created_at);
    const haystack = [
      row.transaction_id,
      row._reference,
      row.meter_number,
      row.phonenumber,
      row.phone_number,
      row.customer_name,
      row.merchant_name,
      row.merchant?.name,
      row.receipt_no,
      row.product_name,
      row.product,
      row.network,
      row._detail
    ].join(" ").toLowerCase();

    return (!service || row._type === service)
      && (!status || matchesStatus(rowStatus, status))
      && (!transactionId || String(row.transaction_id || "").toLowerCase().includes(transactionId))
      && (!reference || rowReference.includes(reference))
      && (!search || haystack.includes(search))
      && (!from || (created && created >= from))
      && (!to || (created && created <= to));
  });
}

export function splitRowsByService(rows = []) {
  return rows.reduce(
    (groups, row) => {
      if (row._type === "airtime") {
        groups.airtimeRows.push(row);
      } else {
        groups.electricityRows.push(row);
      }

      return groups;
    },
    { electricityRows: [], airtimeRows: [] }
  );
}

function matchesStatus(rowStatus, filterStatus) {
  if (filterStatus === "SUCCESS") {
    return rowStatus === "SUCCESS" || rowStatus === "SUCCESSFUL";
  }

  return rowStatus === filterStatus;
}

function parseRowDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? null : date;
}
