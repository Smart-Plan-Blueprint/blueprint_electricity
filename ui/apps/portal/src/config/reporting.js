export const defaultBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
export const demoMode = import.meta.env.VITE_DEMO_MODE === "true";
export const defaultApiToken = demoMode ? "smart-plan-blueprint-demo" : import.meta.env.VITE_API_TOKEN || "";
export const sessionKey = "blueprint-electricity-session";
export const transactionPageSize = 10;

export const initialFilters = {
  status: "",
  transaction_id: "",
  meter_number: "",
  search: "",
  from: "",
  to: "",
  per_page: String(transactionPageSize),
  page: "1"
};

export const filtersKey = "blueprint-electricity-filters";
export const autoRefreshMs = 30000;

export const defaultReportSettings = {
  enabled: false,
  recipients: [],
  timezone: "Africa/Gaborone",
  send_time: "02:00"
};
