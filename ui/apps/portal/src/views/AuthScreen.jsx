import { Building2, LockKeyhole, PlugZap, ShieldCheck } from "lucide-react";
import { Button, Field } from "@blueprint/ui";

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
    <main className="auth-layout-single">
      <section className="auth-card auth-card-single">
        <div className="brand-lockup auth-brand">
          <div className="brand-mark"><PlugZap size={24} /></div>
          <div>
            <strong>Smart Plan Blueprint</strong>
            <span>{isMerchant ? "Merchant portal" : "Reporting platform"}</span>
          </div>
        </div>

        <div className="auth-mode-toggle">
          <button type="button" className={!isMerchant ? "active" : ""} onClick={() => setMode("admin")}>
            Reporting access
          </button>
          <button type="button" className={isMerchant ? "active" : ""} onClick={() => setMode("merchant")}>
            Merchant login
          </button>
        </div>

        <div>
          <h2>{isMerchant ? "Sign in to your account" : "Sign in to reporting"}</h2>
          <p className="auth-sub">
            {isMerchant
              ? "See your sales, transactions, and wallet balance."
              : "Electricity and airtime transactions, payments, and meter activity in one place."}
          </p>
        </div>

        {isMerchant ? (
          <>
            <form className="form-stack" onSubmit={onMerchantLogin}>
              <Field
                label="Email"
                type="email"
                name="email"
                autoComplete="email"
                value={merchantEmail}
                onChange={(event) => setMerchantEmail(event.target.value)}
                placeholder="you@business.bw"
                required
              />
              <Field
                label="Password"
                type="password"
                name="password"
                autoComplete="current-password"
                value={merchantPassword}
                onChange={(event) => setMerchantPassword(event.target.value)}
                placeholder="Your password"
                required
              />
              <Button icon={Building2} loading={loading === "merchant-login"}>Sign in</Button>
            </form>
            {merchantError ? <div className="error-banner" role="alert">{merchantError}</div> : null}
          </>
        ) : (
          <>
            <form className="form-stack" onSubmit={onAdminLogin}>
              <Field
                label="Email"
                type="email"
                name="email"
                autoComplete="email"
                value={adminEmail}
                onChange={(event) => setAdminEmail(event.target.value)}
                placeholder="you@smartplanblueprint.net"
                required
              />
              <Field
                label="Password"
                type="password"
                name="password"
                autoComplete="current-password"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                placeholder="Your password"
                required
              />
              <Button icon={LockKeyhole} loading={loading === "login"}>Open dashboard</Button>
            </form>
            {loginError ? <div className="error-banner" role="alert">{loginError}</div> : null}
          </>
        )}

        <p className="auth-secure-note">
          <ShieldCheck size={14} />
          Authorized users only. Connection is encrypted and sign-ins are logged.
        </p>
      </section>
    </main>
  );
}
