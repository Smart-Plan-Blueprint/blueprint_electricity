import {
  Building2,
  LockKeyhole,
  PlugZap,
  ShieldCheck,
  BarChart3,
  ReceiptText,
  Zap,
} from "lucide-react";
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
  onMerchantLogin,
}) {
  const isMerchant = mode === "merchant";

  const activeLogin = isMerchant
    ? {
        email: merchantEmail,
        password: merchantPassword,
        setEmail: setMerchantEmail,
        setPassword: setMerchantPassword,
        error: merchantError,
        onSubmit: onMerchantLogin,
        loadingKey: "merchant-login",
        title: "Merchant login",
        description:
          "Access your airtime and electricity sales, wallet balance, and transaction history.",
        label: "Merchant portal",
        placeholder: "you@business.bw",
        icon: Building2,
        submitLabel: "Sign in",
      }
    : {
        email: adminEmail,
        password: adminPassword,
        setEmail: setAdminEmail,
        setPassword: setAdminPassword,
        error: loginError,
        onSubmit: onAdminLogin,
        loadingKey: "login",
        title: "Reporting access",
        description:
          "Monitor airtime and electricity sales, revenue movement, transaction status, and meter activity.",
        label: "Reporting platform",
        placeholder: "you@smartplanblueprint.net",
        icon: LockKeyhole,
        submitLabel: "Open dashboard",
      };

  const isLoading = loading === activeLogin.loadingKey;

  return (
    <main className="sp-auth">
      <section className="sp-auth__shell" aria-labelledby="auth-title">
        <aside className="sp-auth__summary">
          <header className="sp-auth__brand">
            <div className="sp-auth__mark" aria-hidden="true">
              <PlugZap size={21} />
            </div>

            <div>
              <strong>Smart Plan Blueprint</strong>
              <span>Airtime & electricity sales reporting</span>
            </div>
          </header>

          <div className="sp-auth__summary-copy">
            <p>Sales overview</p>
            <h2>Track daily sales without digging through raw transactions.</h2>
            <span>
              A focused reporting portal for airtime sales, electricity sales,
              merchant activity, and transaction performance.
            </span>
          </div>

          <div className="sp-auth__mini-report" aria-label="Reporting features">
            <div className="sp-auth__mini-row">
              <span>
                <BarChart3 size={16} />
                Sales reports
              </span>
              <strong>Daily</strong>
            </div>

            <div className="sp-auth__mini-row">
              <span>
                <Zap size={16} />
                Electricity
              </span>
              <strong>Meter activity</strong>
            </div>

            <div className="sp-auth__mini-row">
              <span>
                <ReceiptText size={16} />
                Transactions
              </span>
              <strong>Status tracking</strong>
            </div>
          </div>
        </aside>

        <div className="sp-auth__panel">
          <div className="sp-auth__mode-toggle" aria-label="Choose login type">
            <button
              type="button"
              className={!isMerchant ? "active" : ""}
              aria-pressed={!isMerchant}
              onClick={() => setMode("admin")}
            >
              Reporting access
            </button>

            <button
              type="button"
              className={isMerchant ? "active" : ""}
              aria-pressed={isMerchant}
              onClick={() => setMode("merchant")}
            >
              Merchant login
            </button>
          </div>

          <div className="sp-auth__intro">
            <p>{activeLogin.label}</p>
            <h1 id="auth-title">{activeLogin.title}</h1>
            <span>{activeLogin.description}</span>
          </div>

          <form
            className="sp-auth__form"
            onSubmit={activeLogin.onSubmit}
            aria-busy={isLoading}
          >
            <Field
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              value={activeLogin.email}
              onChange={(event) => activeLogin.setEmail(event.target.value)}
              placeholder={activeLogin.placeholder}
              required
            />

            <Field
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={activeLogin.password}
              onChange={(event) => activeLogin.setPassword(event.target.value)}
              placeholder="Your password"
              required
            />

            <Button
              type="submit"
              className="sp-auth__submit"
              icon={activeLogin.icon}
              loading={isLoading}
            >
              {activeLogin.submitLabel}
            </Button>
          </form>

          {activeLogin.error ? (
            <div className="sp-auth__error" role="alert">
              {activeLogin.error}
            </div>
          ) : null}

          <footer className="sp-auth__secure-note">
            <ShieldCheck size={14} />
            <span>
              Authorized users only. Connection is encrypted and sign-ins are
              logged.
            </span>
          </footer>
        </div>
      </section>
    </main>
  );
}