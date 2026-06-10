import { Clock3, Mail, Save, Send, X } from "lucide-react";
import { Button, Field, Section, StatusBadge } from "@blueprint/ui";

export default function EmailReportsView({
  settings,
  recipientDraft,
  loading,
  onChange,
  onRecipientDraft,
  onAddRecipient,
  onRemoveRecipient,
  onSave,
  onSendTest
}) {
  const recipients = settings.recipients || [];
  const enabled = Boolean(settings.enabled);

  return (
    <div className="view-stack">
      <section className="email-hero">
        <div>
          <p className="eyebrow">Automatic emails</p>
          <h2>Daily report at 2:00 AM</h2>
          <p>Smart Plan Blueprint will send yesterday&apos;s real transaction report every morning.</p>
        </div>
        <div className="email-status-card">
          <StatusBadge status={enabled ? "READY" : "DISABLED"} />
          <strong>{enabled ? "Daily email is on" : "Daily email is off"}</strong>
          <span>{recipients.length} recipient{recipients.length === 1 ? "" : "s"} selected</span>
        </div>
      </section>

      <div className="email-settings-grid">
        <Section title="Schedule" icon={Clock3}>
          <div className="schedule-card">
            <label className="switch-row">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(event) => onChange((current) => ({ ...current, enabled: event.target.checked }))}
              />
              <span>
                <strong>Send daily report emails</strong>
                <em>When this is on, Laravel sends the report automatically.</em>
              </span>
            </label>
            <dl className="schedule-list">
              <div><dt>Send time</dt><dd>2:00 AM</dd></div>
              <div><dt>Timezone</dt><dd>Africa/Gaborone</dd></div>
              <div><dt>Report range</dt><dd>Yesterday, midnight to 11:59 PM</dd></div>
            </dl>
          </div>
        </Section>

        <Section title="Recipients" icon={Mail}>
          <form className="recipient-form" onSubmit={onAddRecipient}>
            <Field
              label="Email address"
              type="email"
              value={recipientDraft}
              onChange={(event) => onRecipientDraft(event.target.value)}
              placeholder="name@company.com"
            />
            <Button icon={Mail}>Add</Button>
          </form>
          <div className="recipient-list" aria-label="Report recipients">
            {recipients.length ? recipients.map((email) => (
              <span className="recipient-chip" key={email}>
                {email}
                <button type="button" onClick={() => onRemoveRecipient(email)} aria-label={`Remove ${email}`}>
                  <X size={13} />
                </button>
              </span>
            )) : <div className="empty-state">Add at least one email address before enabling daily sends.</div>}
          </div>
        </Section>
      </div>

      <Section title="Send and save" icon={Send}>
        <div className="email-actions-panel">
          <div>
            <strong>Ready to use</strong>
            <span>The email includes a summary and an Excel workbook with Transactions, Successful, Failed, and Summary sheets.</span>
          </div>
          <div className="section-actions">
            <Button icon={Send} loading={loading === "send-test-report"} disabled={!recipients.length} onClick={onSendTest}>Send test</Button>
            <Button icon={Save} loading={loading === "save-report-settings"} onClick={onSave}>Save settings</Button>
          </div>
        </div>
      </Section>
    </div>
  );
}
