import { BarChart3, Building2, LockKeyhole, PlugZap, ShieldCheck } from "lucide-react";
import { Button, Field, MetricCard } from "@blueprint/ui";

export default function AuthScreen({
  loginError,
  loading,
  adminEmail,
  adminPassword,
  setAdminEmail,
  setAdminPassword,
  onAdminLogin,
  mode,
  setMode,
  merchantEmail,
  merchantPassword,
  setMerchantEmail,
  setMerchantPassword,
  merchantError,
  onMerchantLogin
}) {
  const isMerchant = mode === "merchant";

  return (
    <main className="auth-layout">
      <section className="auth-panel">
        <div className="brand-lockup auth-brand">
          <div className="brand-mark"><PlugZap size={24} /></div>
          <div>
            <strong>Smart Plan Blueprint</strong>
            <span>{isMerchant ? "Merchant portal" : "Reporting platform"}</span>
          </div>
        </div>
        <h1>{isMerchant ? "Your merchant account" : "Open your reports"}</h1>
        <p>
          {isMerchant
            ? "Sign in to see your sales, transactions, and wallet balance."
            : "See electricity transactions, successful payments, problem payments, and meter activity in one place."}
        </p>

        <div className="auth-metrics">
          <MetricCard icon={ShieldCheck} label="Access" value="Email + password" />
          <MetricCard icon={BarChart3} label={isMerchant ? "Account" : "Reports"} value={isMerchant ? "Your data only" : "Transaction data"} />
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-mode-toggle">
          <button type="button" className={!isMerchant ? "active" : ""} onClick={() => setMode("admin")}>
            Reporting access
          </button>
          <button type="button" className={isMerchant ? "active" : ""} onClick={() => setMode("merchant")}>
            Merchant login
          </button>
        </div>

        {isMerchant ? (
          <>
            <div>
              <p className="eyebrow">Merchant sign in</p>
              <h2>Enter your details</h2>
            </div>
            <form className="form-stack" onSubmit={onMerchantLogin}>
              <Field
                label="Email"
                type="email"
                value={merchantEmail}
                onChange={(event) => setMerchantEmail(event.target.value)}
                placeholder="you@business.bw"
                required
              />
              <Field
                label="Password"
                type="password"
                value={merchantPassword}
                onChange={(event) => setMerchantPassword(event.target.value)}
                placeholder="Your password"
                required
              />
              <Button icon={Building2} loading={loading === "merchant-login"}>Sign in</Button>
            </form>
            {merchantError ? <div className="error-banner">{merchantError}</div> : null}
          </>
        ) : (
          <>
            <div>
              <p className="eyebrow">Secure access</p>
              <h2>Sign in to reporting</h2>
            </div>
            <form className="form-stack" onSubmit={onAdminLogin}>
              <Field
                label="Email"
                type="email"
                value={adminEmail}
                onChange={(event) => setAdminEmail(event.target.value)}
                placeholder="you@smartplanblueprint.net"
                required
              />
              <Field
                label="Password"
                type="password"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                placeholder="Your password"
                required
              />
              <Button icon={LockKeyhole} loading={loading === "login"}>Open dashboard</Button>
            </form>
            {loginError ? <div className="error-banner">{loginError}</div> : null}
          </>
        )}
      </section>
    </main>
  );
}
