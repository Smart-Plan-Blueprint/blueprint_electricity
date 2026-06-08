# Smart Plan Blueprint UI

JavaScript monorepo for the Smart Plan Blueprint reporting and operations portal.

## Workspaces

- `apps/portal` - Vite React dashboard for token access, reporting, and transaction lookup.
- `packages/api-client` - Shared browser API client for the production reporting endpoint.
- `packages/ui` - Shared React UI primitives and styles.

## Portal Features

- API-token access with validation through the protected transaction log endpoint.
- Dashboard KPIs for transaction count, successful transactions, failed transactions, value, success rate, receipts, and unique meters.
- Reporting filters for date range, status, transaction ID, meter number, and result size.
- CSV export for the current report data.
- Demo mode that funnels exactly 100 generated transactions through the same dashboard, filters, pagination, charts, and export flow.

## Commands

```bash
npm install
npm run dev
npm run build
```

The dev server runs at `http://127.0.0.1:5174`.

The dev server proxies `/api` to `VITE_API_PROXY_TARGET`.

For real production reporting:

```env
VITE_API_PROXY_TARGET=http://66.29.134.153/motakase/api
VITE_API_TOKEN=replace-with-reporting-api-token
VITE_DEMO_MODE=false
```

Set `VITE_API_TOKEN` to a reporting token that can access `/transaction-logs`. The local `.env` file is ignored so the token does not get committed.

To run the portal with generated demo data instead of the live API, set:

```env
VITE_DEMO_MODE=true
```
