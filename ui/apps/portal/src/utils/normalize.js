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
    _reference: row.phonenumber || null,
    _detail: row.product_name || null,
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
