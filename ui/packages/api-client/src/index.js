const AIRTIME_BASE = "http://66.29.134.153/pinless/api";

export function createAirtimeClient() {
  return {
    transactionLogs(filters = {}) {
      return request(`${AIRTIME_BASE}/airtimetrans-logs${toQuery(filters)}`, { method: "GET" });
    }
  };
}

export function createElectricityClient({ baseUrl = "", apiToken = "" } = {}) {
  const normalizedBase = normalizeBaseUrl(baseUrl);

  return {
    transactionLogs(filters = {}) {
      return request(`${normalizedBase}/api/transaction-logs${toQuery(filters)}`, {
        method: "GET",
        apiToken
      });
    },
    reportSettings() {
      return request(`${normalizedBase}/api/report-settings`, {
        method: "GET",
        apiToken
      });
    },
    updateReportSettings(payload) {
      return request(`${normalizedBase}/api/report-settings`, {
        method: "PUT",
        body: payload,
        apiToken
      });
    },
    sendTestReport() {
      return request(`${normalizedBase}/api/report-settings/send-test`, {
        method: "POST",
        apiToken
      });
    }
  };
}

function toQuery(filters = {}) {
  const query = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  return query.toString() ? `?${query}` : "";
}

async function request(url, { method, body, apiToken } = {}) {
  const headers = {
    Accept: "application/json"
  };

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  if (apiToken) {
    headers.Authorization = `Bearer ${apiToken}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : { results: response.ok ? "SUCCESS" : "FAILED", message: await response.text() };

  if (!response.ok) {
    throw new Error(payload.message || `Request failed with status ${response.status}`);
  }

  return payload;
}

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || "").replace(/\/+$/, "");
}
